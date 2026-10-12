import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PartyPopper, AlertTriangle, Info, X, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { ROLES } from '../lib/partner'

// In-site notice for partner application decisions (approved / on hold / rejected).
// Shows on the page it's mounted on — the homepage — the next time the applicant
// opens the site or logs in, and live if they already have it open (Realtime).
// Dismissing (or tapping the button) calls mark_partner_decision_seen(), so it
// never comes back — until a newer decision is made.

const LOOKBACK_DAYS = 30   // older decisions are never surfaced as "new"

const LOOK = {
  approved: {
    Icon: PartyPopper,
    ring: 'ring-green-200', iconCls: 'bg-green-100 text-green-700', btn: 'bg-green-600 hover:bg-green-700',
    title: (role) => `You're now a verified Hoppity ${role}!`,
    body: (role) => `Your application was approved and your ${role.toLowerCase()} badge is live on your profile.`,
    cta: 'View profile', href: '/profile',
  },
  on_hold: {
    Icon: AlertTriangle,
    ring: 'ring-orange-200', iconCls: 'bg-orange-100 text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700',
    title: (role) => `Action needed on your ${role} application`,
    body: () => 'Our team needs a small update before we can approve it.',
    cta: 'Update application', href: '/partner',
  },
  rejected: {
    Icon: Info,
    ring: 'ring-slate-200', iconCls: 'bg-slate-100 text-slate-600', btn: 'bg-slate-900 hover:bg-slate-800',
    title: (role) => `Update on your ${role} application`,
    body: () => "We weren't able to approve it this time. You're welcome to apply again later.",
    cta: 'View details', href: '/partner',
  },
}

const isUnseen = (a) =>
  a.reviewed_at && (!a.decision_seen_at || new Date(a.decision_seen_at) < new Date(a.reviewed_at))

export default function PartnerDecisionBanner() {
  const { user } = useAuth()
  const [queue, setQueue] = useState([])     // unseen decisions, newest first
  const [leaving, setLeaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) { setQueue([]); return }
    const since = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString()
    const { data, error } = await supabase
      .from('partner_applications')
      .select('id,role,status,admin_notes,reviewed_at,decision_seen_at')
      .eq('user_id', user.id)
      .in('status', ['approved', 'on_hold', 'rejected'])
      .gte('reviewed_at', since)
      .order('reviewed_at', { ascending: false })
    if (error) { console.error('PartnerDecisionBanner:', error); return }
    setQueue((data || []).filter(isUnseen))
  }, [user])

  // On login / page open, and again whenever the tab comes back into focus.
  useEffect(() => {
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  // Live: an admin decides while this user has the site open.
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`partner-decisions-${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'partner_applications', filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, load])

  const current = queue[0]
  if (!current) return null

  const look = LOOK[current.status]
  const role = ROLES[current.role]?.title || 'Partner'
  const note = (current.status !== 'approved' && current.admin_notes) ? current.admin_notes.trim() : ''

  const dismiss = async () => {
    setLeaving(true)
    const { error } = await supabase.rpc('mark_partner_decision_seen', { p_application_id: current.id })
    if (error) console.error('mark_partner_decision_seen:', error)
    setTimeout(() => { setQueue(q => q.slice(1)); setLeaving(false) }, 180)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4 sm:top-24">
      <style>{`
        @keyframes pdbIn { from { opacity: 0; transform: translateY(-14px) scale(.98) } to { opacity: 1; transform: none } }
        .pdb-in { animation: pdbIn 380ms cubic-bezier(.22,.68,.36,1) both }
        @media (prefers-reduced-motion: reduce) { .pdb-in { animation: none } }
      `}</style>
      <div
        key={current.id}
        role="status"
        aria-live="polite"
        className={`pdb-in pointer-events-auto w-full max-w-xl rounded-2xl bg-white/95 p-4 shadow-xl shadow-violet-950/10 ring-1 backdrop-blur transition duration-200 ${look.ring} ${leaving ? 'opacity-0 -translate-y-2' : ''}`}
      >
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${look.iconCls}`}>
            <look.Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black leading-snug text-slate-900">{look.title(role)}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{look.body(role)}</p>
            {note && (
              <p className="mt-2 line-clamp-3 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-relaxed text-slate-700">
                <span className="font-bold">Note: </span>{note}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Link to={look.href} onClick={dismiss}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold text-white transition ${look.btn}`}>
                {look.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              {queue.length > 1 && <span className="text-[11px] text-slate-400">+{queue.length - 1} more update{queue.length > 2 ? 's' : ''}</span>}
            </div>
          </div>
          <button type="button" onClick={dismiss} aria-label="Dismiss"
            className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}