import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo1.png'

export default function AuthPage() {
  const [tab, setTab] = useState('signin') // 'signin' | 'signup' | 'phone'
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <img src={logo} alt="Hoppity" className="h-10 w-10" />
          <span className="text-2xl font-bold text-slate-900">Hoppity</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-violet-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Sign Up' },
              { id: 'phone',  label: '📱 Phone' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-4 text-sm font-semibold transition cursor-pointer ${
                  tab === t.id
                    ? 'text-violet-700 border-b-2 border-violet-600 -mb-px bg-violet-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {tab === 'signin' && <SignInForm onSuccess={() => navigate('/profile')} />}
            {tab === 'signup' && <SignUpForm onSuccess={() => navigate('/profile')} />}
            {tab === 'phone'  && <PhoneForm  onSuccess={() => navigate('/profile')} />}
          </div>
        </div>

        {/* Google Sign-in */}
        <div className="mt-4">
          <GoogleButton />
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          By continuing you agree to our{' '}
          <a href="/privacy" className="text-violet-700 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

// ── Sign In ─────────────────────────────────────────────────────────
function SignInForm({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    onSuccess()
  }

  const sendReset = async () => {
    if (!email) { setError('Enter your email first'); return }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    })
    setResetSent(true)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
        <input
          type="password" required value={password} onChange={e => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      {resetSent && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">Reset link sent — check your inbox.</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-2xl bg-violet-700 text-white py-3.5 font-semibold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <button type="button" onClick={sendReset} className="w-full text-sm text-violet-600 hover:underline cursor-pointer">
        Forgot password?
      </button>
    </form>
  )
}

// ── Sign Up ─────────────────────────────────────────────────────────
function SignUpForm({ onSuccess }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) return (
    <div className="text-center py-4">
      <div className="text-4xl mb-4">📧</div>
      <h3 className="text-lg font-bold text-slate-900">Check your inbox</h3>
      <p className="text-slate-500 mt-2 text-sm">We sent a confirmation link to <strong>{form.email}</strong></p>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      {[
        { label: 'Full Name',    name: 'fullName',  type: 'text',     placeholder: 'Your name' },
        { label: 'Email',        name: 'email',     type: 'email',    placeholder: 'you@example.com' },
        { label: 'Password',     name: 'password',  type: 'password', placeholder: '8+ characters' },
      ].map(f => (
        <div key={f.name}>
          <label className="block text-sm font-semibold text-slate-700 mb-1">{f.label}</label>
          <input
            type={f.type} required
            value={form[f.name]}
            onChange={e => setForm({...form, [f.name]: e.target.value})}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            placeholder={f.placeholder}
          />
        </div>
      ))}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full rounded-2xl bg-violet-700 text-white py-3.5 font-semibold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}

// ── Phone OTP ────────────────────────────────────────────────────────
function PhoneForm({ onSuccess }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('otp')
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: 'sms' })
    setLoading(false)
    if (error) { setError(error.message); return }
    onSuccess()
  }

  return (
    <div>
      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <p className="text-sm text-slate-500 text-center">Enter your mobile number — we'll send a 6-digit OTP.</p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="flex gap-2">
              <span className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 whitespace-nowrap">
                🇮🇳 +91
              </span>
              <input
                type="tel" required
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                placeholder="9876543210"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-violet-700 text-white py-3.5 font-semibold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer">
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-sm text-slate-500 text-center">Enter the 6-digit code sent to +91{phone}</p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">OTP Code</label>
            <input
              type="text" required inputMode="numeric"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
              placeholder="• • • • • •"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-violet-700 text-white py-3.5 font-semibold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer">
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            className="w-full text-sm text-slate-500 hover:text-violet-600 cursor-pointer">
            ← Change number
          </button>
        </form>
      )}
    </div>
  )
}

// ── Google Button ────────────────────────────────────────────────────
function GoogleButton() {
  const [loading, setLoading] = useState(false)

  const signInWithGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/profile` },
    })
  }

  return (
    <button
      onClick={signInWithGoogle} disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md transition cursor-pointer disabled:opacity-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Redirecting…' : 'Continue with Google'}
    </button>
  )
}
