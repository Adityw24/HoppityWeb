import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  User, Shield, Lock, MapPin, Mail, Calendar, Trash2,
  AlertTriangle, Check, X, LogOut, KeyRound, Loader2, ArrowLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import Navbar from '../components/Navbar'

const TABS = [
  { id: 'personal', label: 'Personal info',    icon: User },
  { id: 'privacy',  label: 'Privacy',          icon: Shield },
  { id: 'security', label: 'Login & security', icon: Lock },
]

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

export default function AccountSettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, setProfile } = useProfile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tab, setTab] = useState(searchParams.get('tab') || 'personal')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth')
  }, [user, authLoading, navigate])

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  if (authLoading || !user) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
          toast.type === 'err' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {toast.type === 'err' ? '✗' : '✓'} {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="w-full flex items-center gap-3 mb-6">
         
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-900 mb-1">Account settings</h1>
            <p className="text-sm text-slate-500">Manage your details, privacy, and how you sign in.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-violet-100 p-1 mb-5 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                  tab === t.id ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            )
          })}
        </div>

        {tab === 'personal' && <PersonalInfo user={user} profile={profile} setProfile={setProfile} showToast={showToast} />}
        {tab === 'privacy'  && <Privacy user={user} profile={profile} showToast={showToast} signOut={signOut} />}
        {tab === 'security' && <Security user={user} showToast={showToast} />}
      </div>
    </div>
  )
}

/* ─────────────────────────── Personal info ─────────────────────────── */

function PersonalInfo({ user, profile, setProfile, showToast }) {
  const [form, setForm] = useState({
    full_name: '', username: '', bio: '', location: '', phone: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name || '',
      username:  profile.username  || '',
      bio:       profile.bio       || '',
      location:  profile.location  || '',
      phone:     profile.phone     || '',
    })
  }, [profile])

  // Same fallback chain the profile header uses — auth.created_at is always set.
  const memberSince = profile?.member_since || profile?.created_at || user?.created_at

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        full_name: form.full_name.trim() || null,
        username:  form.username.trim()  || null,
        bio:       form.bio.trim()       || null,
        location:  form.location.trim()  || null,
        phone:     form.phone.trim()     || null,
      }
      const { error } = await supabase.from('Users').update(payload).eq('user_id', user.id)
      if (error) throw error
      setProfile(p => ({ ...p, ...payload }))
      showToast('Details saved ✓')
    } catch (e) {
      console.error('savePersonalInfo:', e)
      showToast(e.message || 'Could not save. Try again.', 'err')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Your details" sub="This is what other travellers see on your profile.">
        <Field label="Full name">
          <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="Your name" className={inputCls} />
        </Field>
        <Field label="Username">
          <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="username" className={inputCls} />
        </Field>
        <Field label="Location">
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Bhopal, India" className={inputCls} />
        </Field>
        <Field label="Phone">
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="+91…" inputMode="tel" className={inputCls} />
        </Field>
        <Field label="Bio">
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={3} maxLength={200} placeholder="Short bio…" className={`${inputCls} resize-none`} />
          <p className="text-[11px] text-slate-400 mt-1">{form.bio.length}/200</p>
        </Field>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-800 transition cursor-pointer disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </Card>

      <Card title="Account" sub="Read-only.">
        <ReadOnlyRow icon={Mail}     label="Email"        value={user.email} />
        <ReadOnlyRow icon={Calendar} label="Member since" value={fmtDate(memberSince)} />
        
      </Card>
    </div>
  )
}

/* ───────────────────────────── Privacy ─────────────────────────────── */

function Privacy({ user, profile, showToast, signOut }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const deleteAccount = async () => {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      // Deletion MUST happen server-side: removing an auth user needs the service
      // role key, which never belongs in the browser bundle.
      const { data, error } = await supabase.functions.invoke('delete-account')
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      await supabase.auth.signOut()
      // Hard reload so no stale auth/profile state survives.
      window.location.replace('/?deleted=1')
    } catch (e) {
      console.error('deleteAccount:', e)
      showToast(e.message || 'Could not delete account. Please contact support.', 'err')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Your data" sub="What Hoppity stores against your account.">
        <ul className="text-sm text-slate-600 space-y-1.5">
          <li>• Profile details (name, bio, location, photo)</li>
          <li>• Bookings and payment records</li>
          <li>• Saved tours, reviews, and stories you've published</li>
        </ul>
      </Card>

      <Card
        title="Delete my account"
        sub="Permanently removes your profile, saved tours, reviews, and stories. This cannot be undone."
        danger
      >
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 mb-4">
          <p className="flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Paid bookings are kept as anonymised financial records (required for payment
              reconciliation and tax), but they will no longer be linked to you.
            </span>
          </p>
        </div>

        {!confirmOpen ? (
          <button onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 transition cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700 font-semibold">
              Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className={`${inputCls} font-mono`}
            />
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button
                onClick={() => { setConfirmOpen(false); setConfirmText('') }}
                disabled={deleting}
                className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-200 transition cursor-pointer disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ──────────────────────── Login & security ─────────────────────────── */

function Security({ user, showToast }) {
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [email, setEmail] = useState(user.email || '')
  const [savingEmail, setSavingEmail] = useState(false)

  const provider = user.app_metadata?.provider || 'email'
  const isPasswordUser = provider === 'email'

  const changePassword = async () => {
    if (pw.next.length < 8) { showToast('Password must be at least 8 characters.', 'err'); return }
    if (pw.next !== pw.confirm) { showToast('Passwords do not match.', 'err'); return }
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.next })
      if (error) throw error
      setPw({ next: '', confirm: '' })
      showToast('Password updated ✓')
    } catch (e) {
      console.error('changePassword:', e)
      showToast(e.message || 'Could not update password.', 'err')
    } finally {
      setSavingPw(false)
    }
  }

  const changeEmail = async () => {
    if (!email.trim() || email === user.email) return
    setSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() })
      if (error) throw error
      showToast('Confirmation sent to both addresses ✓')
    } catch (e) {
      console.error('changeEmail:', e)
      showToast(e.message || 'Could not update email.', 'err')
    } finally {
      setSavingEmail(false)
    }
  }

  const signOutEverywhere = async () => {
    if (!confirm('Sign out of Hoppity on all devices?')) return
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) { showToast(error.message, 'err'); return }
    window.location.replace('/auth')
  }

  return (
    <div className="space-y-4">
      <Card title="Sign-in method" sub="How you access this account.">
        <ReadOnlyRow icon={KeyRound} label="Provider"      value={provider === 'email' ? 'Email & password' : provider} />
        <ReadOnlyRow icon={Calendar} label="Last signed in" value={fmtDate(user.last_sign_in_at)} />
      </Card>

      <Card title="Email address" sub="Changing this sends a confirmation link to both the old and new address.">
        <Field label="Email">
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} />
        </Field>
        <button onClick={changeEmail} disabled={savingEmail || email === user.email || !email.trim()}
          className="flex items-center gap-1.5 bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          {savingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          {savingEmail ? 'Sending…' : 'Update email'}
        </button>
      </Card>

      {isPasswordUser && (
        <Card title="Change password" sub="Use at least 8 characters.">
          <Field label="New password">
            <input type="password" value={pw.next} autoComplete="new-password"
              onChange={e => setPw(p => ({ ...p, next: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" value={pw.confirm} autoComplete="new-password"
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className={inputCls} />
          </Field>
          <button onClick={changePassword} disabled={savingPw || !pw.next || !pw.confirm}
            className="flex items-center gap-1.5 bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </Card>
      )}

      <Card title="Sessions" sub="Signs you out on every device where you're logged in.">
        <button onClick={signOutEverywhere}
          className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-200 transition cursor-pointer">
          <LogOut className="w-3.5 h-3.5" /> Sign out everywhere
        </button>
      </Card>
    </div>
  )
}

/* ──────────────────────────── Primitives ───────────────────────────── */

const inputCls =
  'w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400 transition'

function Card({ title, sub, danger, children }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${danger ? 'border-red-200' : 'border-violet-100'}`}>
      <h3 className={`font-bold text-sm ${danger ? 'text-red-700' : 'text-slate-900'}`}>{title}</h3>
      {sub && <p className="text-xs text-slate-500 mt-0.5 mb-4 leading-relaxed">{sub}</p>}
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ReadOnlyRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />{label}
      </span>
      <span className={`text-sm text-slate-800 text-right truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}