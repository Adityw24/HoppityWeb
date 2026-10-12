import { useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck, Clock, AlertTriangle, BadgeCheck, X, Check, Loader2, Film,
  ChevronRight, MapPin, Link2, FileText, RefreshCw, Inbox,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ROLES, publicUrl } from '../lib/partner'
import { PROPERTY_TYPES, OFFER_TYPES, CATEGORIES } from '../Pages/PropertyApplication'

// Admin review queue for partner applications (creator / curator / property).
// Shown on the profile page instead of the "Become a partner" card for anyone in public.admins.
// Reads via admin_list_partner_applications(), decides via review_application().

const FILTERS = [
  { id: 'pending',  label: 'Pending' },
  { id: 'on_hold',  label: 'On hold' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

const STATUS = {
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  on_hold:  { label: 'On hold',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
}

const REVIEW_ERRORS = {
  admin_only: 'Only admins can review applications.',
  note_required: 'Add a note for the applicant — it is shown to them.',
  agreement_not_signed: 'Tick "Partner agreement signed" before approving a curator or property partner.',
  application_closed: 'This application was already reviewed. Refresh the list.',
  application_not_found: 'Application not found. Refresh the list.',
}
const reviewError = (e) => {
  const m = e?.message || ''
  const k = Object.keys(REVIEW_ERRORS).find(x => m.includes(x))
  return k ? REVIEW_ERRORS[k] : (m || 'Something went wrong. Try again.')
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function AdminApplications({ isFounder, onToast }) {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [openId, setOpenId] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase.rpc('admin_list_partner_applications')
    if (error) { console.error('admin_list_partner_applications:', error); setError(error.message || 'Could not load applications') }
    setApps(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => {
    const c = { pending: 0, on_hold: 0, approved: 0, rejected: 0 }
    apps.forEach(a => { c[a.status] = (c[a.status] || 0) + 1 })
    return c
  }, [apps])

  const visible = apps.filter(a => a.status === filter)
  const open = apps.find(a => a.id === openId) || null

  const onReviewed = (updated, decision) => {
    setApps(list => list.map(a => (a.id === updated.id ? { ...a, ...updated } : a)))
    setOpenId(null)
    onToast?.(decision === 'approve' ? 'Approved ✓ — applicant is being emailed'
      : decision === 'reject' ? 'Rejected — applicant is being emailed'
      : 'Put on hold — applicant is being emailed')
  }

  return (
    <div className="bg-white rounded-3xl border border-violet-100 shadow-sm mb-5 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900">Partner applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {counts.pending > 0
                ? <><b className="text-amber-700">{counts.pending}</b> waiting for review{counts.on_hold ? ` · ${counts.on_hold} on hold` : ''}</>
                : 'Nothing waiting — you\'re all caught up.'}
              {isFounder && <span className="ml-1.5 text-slate-400">· Founder</span>}
            </p>
          </div>
        </div>
        <button onClick={load} disabled={loading} aria-label="Refresh"
          className="w-9 h-9 grid place-items-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-violet-700 hover:border-violet-300 transition cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 flex gap-1.5 overflow-x-auto pb-3">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filter === f.id ? 'bg-violet-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            {f.label}
            <span className={`px-1.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-white border border-slate-200'}`}>{counts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-50">
        {error && (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
            <span>Couldn't load applications: {error}</span>
            <button onClick={load} className="text-xs font-bold underline cursor-pointer">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="p-4 space-y-2">{[0, 1].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-50 animate-pulse" />)}</div>
        ) : visible.length === 0 ? (
          <div className="py-10 text-center">
            <Inbox className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500 mt-2">No {FILTERS.find(f => f.id === filter).label.toLowerCase()} applications</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {visible.map(a => (
              <li key={a.id}>
                <button onClick={() => setOpenId(a.id)}
                  className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-violet-50/50 transition cursor-pointer">
                  <Avatar name={a.applicant_name || a.applicant_email} pic={a.applicant_pic} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {a.form_data?.display_name || a.applicant_name || a.applicant_email}
                      <span className="font-normal text-slate-400"> @{a.form_data?.handle}</span>
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {ROLES[a.role]?.emoji} {ROLES[a.role]?.title} · {a.form_data?.city || '—'} · applied {fmtDate(a.created_at)}
                    </p>
                  </div>
                  <span className={`hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <ReviewDrawer app={open} onClose={() => setOpenId(null)} onReviewed={onReviewed} />}
    </div>
  )
}

// ── Detail + decision ───────────────────────────────────────────────────────
function ReviewDrawer({ app, onClose, onReviewed }) {
  const f = app.form_data || {}
  const needsAgreement = app.role === 'curator' || app.role === 'property'
  const closed = app.status === 'approved' || app.status === 'rejected'

  const [note, setNote] = useState('')
  const [agreement, setAgreement] = useState(!!app.agreement_signed_at)
  const [busy, setBusy] = useState(null)       // decision in flight
  const [err, setErr] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') (preview ? setPreview(null) : onClose()) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [preview, onClose])

  const decide = async (decision) => {
    setErr(null)
    if (decision !== 'approve' && !note.trim()) { setErr(REVIEW_ERRORS.note_required); return }
    if (decision === 'approve' && needsAgreement && !agreement) { setErr(REVIEW_ERRORS.agreement_not_signed); return }
    setBusy(decision)
    const { data, error } = await supabase.rpc('review_application', {
      p_application_id: app.id,
      p_decision: decision,
      p_note: note.trim() || null,
      p_agreement_signed: needsAgreement ? agreement : null,
    })
    setBusy(null)
    if (error) { console.error('review_application:', error); setErr(reviewError(error)); return }
    onReviewed({ ...(Array.isArray(data) ? data[0] : data), id: app.id }, decision)
  }

  const socials = Object.entries(f.social_links || {}).filter(([, v]) => v)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <Avatar name={app.applicant_name || app.applicant_email} pic={app.applicant_pic} />
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 truncate">{f.display_name || app.applicant_name}</p>
            <p className="text-xs text-slate-500 truncate">@{f.handle} · {app.applicant_email}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 grid place-items-center rounded-xl hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200 px-2.5 py-1 rounded-full">
              {ROLES[app.role]?.emoji} {ROLES[app.role]?.title}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS[app.status].cls}`}>{STATUS[app.status].label}</span>
            <span className="text-xs text-slate-400">Applied {fmtDate(app.created_at)}</span>
          </div>

          {app.admin_notes && (
            <Block title={closed ? `Decision note${app.reviewer_name ? ` · ${app.reviewer_name}` : ''}` : 'Previous note to applicant'}>
              <p className="text-sm text-slate-700 leading-relaxed">{app.admin_notes}</p>
              {app.reviewed_at && <p className="text-[11px] text-slate-400 mt-1">{fmtDate(app.reviewed_at)}</p>}
            </Block>
          )}

          <Block title="Profile">
            {f.city && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{f.city}</p>}
            {f.bio && <p className="text-sm text-slate-700 mt-1.5 leading-relaxed whitespace-pre-line">{f.bio}</p>}
            {socials.length > 0 && (
              <div className="mt-2 space-y-1">
                {socials.map(([k, v]) => <ExtLink key={k} label={k} value={v} />)}
              </div>
            )}
            {f.portfolio && <div className="mt-1"><ExtLink label="portfolio" value={f.portfolio} /></div>}
            {f.past_trips && (
              <div className="mt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Past trips</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{f.past_trips}</p>
              </div>
            )}
          </Block>

          <Block title={`Samples (${app.samples?.length || 0})`}>
            <div className="grid grid-cols-3 gap-2">
              {(app.samples || []).map(s => {
                const url = publicUrl(s.storage_path)
                return (
                  <button key={s.id} onClick={() => setPreview({ ...s, url })}
                    className="relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 cursor-pointer">
                    {s.kind === 'video'
                      ? <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      : <img src={url} alt="" className="w-full h-full object-cover" />}
                    {s.kind === 'video' && (
                      <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        <Film className="w-3 h-3" /> Video
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Block>

          {app.role === 'property' && f.property && <PropertyBlock p={f.property} />}

          {needsAgreement && (
            <Block title="Business details">
              <Row k="Legal name" v={f.legal_name} />
              <Row k="PAN" v={f.pan_last4 ? `•••••${f.pan_last4}` : '—'} />
              <Row k="GSTIN" v={f.gstin || 'Not registered'} />
              <Row k="Address" v={f.address} />
              {f.offerings && (
                <div className="mt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {app.role === 'property' ? 'Property & packages' : 'Itineraries they run'}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{f.offerings}</p>
                </div>
              )}
            </Block>
          )}
        </div>

        {!closed ? (
          <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/60">
            {needsAgreement && (
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreement} onChange={e => setAgreement(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-violet-700" />
                <span className="text-sm text-slate-700">
                  <span className="font-semibold">Partner agreement signed</span>
                  <span className="block text-xs text-slate-500">Required before approving a {ROLES[app.role]?.title.toLowerCase()}.</span>
                </span>
              </label>
            )}
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Note to the applicant — required for On hold and Reject (they will see it)"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-none bg-white" />
            {err && <p className="text-xs text-red-600 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />{err}</p>}
            <div className="grid grid-cols-3 gap-2">
              <DecisionBtn onClick={() => decide('reject')} busy={busy === 'reject'} disabled={!!busy}
                cls="bg-white text-red-600 border border-red-200 hover:bg-red-50" Icon={X} label="Reject" />
              <DecisionBtn onClick={() => decide('on_hold')} busy={busy === 'on_hold'} disabled={!!busy}
                cls="bg-white text-orange-700 border border-orange-200 hover:bg-orange-50" Icon={Clock} label="On hold" />
              <DecisionBtn onClick={() => decide('approve')} busy={busy === 'approve'} disabled={!!busy}
                cls="bg-green-600 text-white hover:bg-green-700" Icon={Check} label="Approve" />
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-100 px-5 py-4 text-sm text-slate-500 flex items-center gap-2">
            {app.status === 'approved'
              ? <><BadgeCheck className="w-4 h-4 text-green-600" /> Approved {fmtDate(app.reviewed_at)}{app.reviewer_name ? ` by ${app.reviewer_name}` : ''}</>
              : <><X className="w-4 h-4 text-red-500" /> Rejected {fmtDate(app.reviewed_at)}{app.reviewer_name ? ` by ${app.reviewer_name}` : ''}</>}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/85 grid place-items-center p-4" onClick={() => setPreview(null)}>
          <button aria-label="Close preview" className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-w-full max-h-full">
            {preview.kind === 'video'
              ? <video src={preview.url} controls autoPlay playsInline className="max-h-[85vh] max-w-full rounded-xl" />
              : <img src={preview.url} alt="" className="max-h-[85vh] max-w-full rounded-xl object-contain" />}
          </div>
        </div>
      )}
    </div>
  )
}

// Property partner details (form_data.property)
function PropertyBlock({ p }) {
  const type = PROPERTY_TYPES.find(t => t.id === p.property_type)
  const offers = OFFER_TYPES.filter(o => (p.offer_types || []).includes(o.id)).map(o => o.title)
  const cats = CATEGORIES.filter(c => (p.categories || []).includes(c.id)).map(c => `${c.emoji} ${c.label}`)
  return (
    <Block title="Property">
      <Row k="Type" v={type ? `${type.emoji} ${type.label}` : p.property_type} />
      <Row k="Size" v={`${p.units} unit${p.units === 1 ? '' : 's'}${p.max_guests ? ` · up to ${p.max_guests} guests` : ''}`} />
      <Row k="Address" v={[p.address, p.city, p.state, p.pincode].filter(Boolean).join(', ')} />
      {p.maps_url && <ExtLink label="maps" value={p.maps_url} />}
      <Row k="Contact" v={`${p.contact_name}${p.contact_role ? ` (${p.contact_role})` : ''}`} />
      <div className="flex gap-3 text-sm py-0.5">
        <span className="w-24 flex-shrink-0 text-slate-400">Phone</span>
        <a href={`https://wa.me/91${p.contact_phone}`} target="_blank" rel="noopener noreferrer" className="text-violet-700 hover:underline">{p.contact_phone}</a>
      </div>
      {p.booking_link && <ExtLink label="listing" value={p.booking_link} />}
      {p.hoppity_stay && <Row k="On Hoppity" v={p.hoppity_stay} />}
      {p.tourism_reg_no && <Row k="Tourism reg." v={p.tourism_reg_no} />}
      <div className="mt-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wants to offer</p>
        <p className="text-sm text-slate-800">{offers.join(' · ') || '—'}</p>
        {cats.length > 0 && <p className="text-xs text-slate-500 mt-0.5">{cats.join('  ')}</p>}
        {(p.season || p.price_range) && (
          <p className="text-xs text-slate-500 mt-0.5">{[p.season && `Season: ${p.season}`, p.price_range && `Price: ${p.price_range}`].filter(Boolean).join(' · ')}</p>
        )}
      </div>
    </Block>
  )
}

// ── bits ────────────────────────────────────────────────────────────────────
function Avatar({ name, pic }) {
  return (
    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center text-white text-sm font-black flex-shrink-0">
      {pic ? <img src={pic} alt="" className="w-full h-full object-cover" /> : (name || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}
function Block({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  )
}
function Row({ k, v }) {
  return (
    <div className="flex gap-3 text-sm py-0.5">
      <span className="w-24 flex-shrink-0 text-slate-400">{k}</span>
      <span className="text-slate-800 break-words min-w-0">{v || '—'}</span>
    </div>
  )
}
function ExtLink({ label, value }) {
  const href = /^https?:\/\//i.test(value) ? value
    : label === 'instagram' ? `https://instagram.com/${value.replace(/^@/, '')}`
    : `https://${value}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs text-violet-700 hover:underline break-all">
      {label === 'portfolio' ? <FileText className="w-3 h-3 flex-shrink-0" /> : <Link2 className="w-3 h-3 flex-shrink-0" />}
      <span className="capitalize text-slate-500">{label}:</span> {value}
    </a>
  )
}
function DecisionBtn({ onClick, busy, disabled, cls, Icon, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-60 ${cls}`}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />} {label}
    </button>
  )
}