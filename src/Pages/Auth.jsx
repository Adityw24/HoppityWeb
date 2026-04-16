import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo1.png'

export default function AuthPage() {
  const [tab, setTab] = useState('signin')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // If already signed in, redirect to profile
  useEffect(() => {
    if (user) navigate('/profile', { replace: true })
  }, [user])

  // Read ?next= param to redirect after auth
  const next = new URLSearchParams(location.search).get('next') || '/profile'
  const onSuccess = () => navigate(next, { replace: true })

  return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <img src={logo} alt="Hoppity" className="h-10 w-10" />
          <span className="text-2xl font-bold text-slate-900">Hoppity</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-violet-100 overflow-hidden">

          {/* Google — most prominent, top of card */}
          <div className="p-6 pb-4">
            <GoogleButton onSuccess={onSuccess} />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-6 pb-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Email / Phone tabs */}
          <div className="flex border-b border-slate-100 px-6 gap-1">
            {[
              { id: 'signin', label: 'Sign In' },
              { id: 'signup', label: 'Sign Up' },
              { id: 'phone',  label: '📱 Phone' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 pb-3 text-sm font-semibold transition cursor-pointer border-b-2 -mb-px ${
                  tab === t.id
                    ? 'text-violet-700 border-violet-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'signin' && <SignInForm onSuccess={onSuccess} />}
            {tab === 'signup' && <SignUpForm onSuccess={onSuccess} />}
            {tab === 'phone'  && <PhoneForm  onSuccess={onSuccess} />}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          By continuing you agree to our{' '}
          <a href="/privacy" className="text-violet-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

// ── Google ────────────────────────────────────────────────────────────
function GoogleButton({ onSuccess }) {
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) { console.error(error); setLoading(false) }
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50/30 px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md transition cursor-pointer disabled:opacity-50"
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Redirecting to Google…' : 'Continue with Google'}
    </button>
  )
}

// ── Sign In ────────────────────────────────────────────────────────────
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
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Try again or use Google.'
        : error.message)
      return
    }
    onSuccess()
  }

  const sendReset = async () => {
    if (!email) { setError('Enter your email address first'); return }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    })
    setResetSent(true); setError('')
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          placeholder="you@example.com" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
          placeholder="••••••••" />
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
      {resetSent && <p className="text-xs text-green-700 bg-green-50 rounded-xl px-4 py-2.5">Reset link sent — check your inbox.</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-violet-700 text-white py-3.5 text-sm font-bold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer">
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <button type="button" onClick={sendReset}
        className="w-full text-xs text-slate-500 hover:text-violet-600 transition cursor-pointer">
        Forgot password?
      </button>
    </form>
  )
}

// ── Sign Up ────────────────────────────────────────────────────────────
function SignUpForm({ onSuccess }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false); return
    }
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
      <p className="text-slate-500 mt-2 text-sm">
        Confirmation link sent to <strong>{form.email}</strong>
      </p>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      {[
        { label: 'Full Name', name: 'fullName', type: 'text',     placeholder: 'Your name' },
        { label: 'Email',     name: 'email',    type: 'email',    placeholder: 'you@example.com' },
        { label: 'Password',  name: 'password', type: 'password', placeholder: 'Min. 8 characters' },
      ].map(f => (
        <div key={f.name}>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">{f.label}</label>
          <input type={f.type} required value={form[f.name]}
            onChange={e => setForm({ ...form, [f.name]: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            placeholder={f.placeholder} />
        </div>
      ))}
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-violet-700 text-white py-3.5 text-sm font-bold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer">
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}

// ── Phone OTP ─────────────────────────────────────────────────────────
function PhoneForm({ onSuccess }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const fullPhone = phone.startsWith('+') ? phone : `+91${phone}`
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone })
    setLoading(false)
    if (error) {
      // Give user a friendlier message than raw Twilio errors
      if (error.message?.includes('sms_send_failed') || error.message?.includes('Invalid From')) {
        setError('SMS delivery is temporarily unavailable. Please use Google or email sign-in instead.')
      } else {
        setError(error.message)
      }
      return
    }
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
    <div className="space-y-4">
      {/* Temporary note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2.5">
        <span className="text-amber-500 mt-0.5 text-sm flex-shrink-0">⚠️</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          SMS OTP is temporarily unavailable. Use <strong>Google</strong> or <strong>email sign-in</strong> above for now.
        </p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
            <div className="flex gap-2">
              <span className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 whitespace-nowrap">
                🇮🇳 +91
              </span>
              <input type="tel" required value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                placeholder="9876543210" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-violet-700 text-white py-3.5 text-sm font-bold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer">
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-xs text-slate-500 text-center">Code sent to +91{phone}</p>
          <input type="text" required inputMode="numeric" value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            className="w-full text-center text-2xl font-bold tracking-[0.5em] rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            placeholder="• • • • • •" />
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-violet-700 text-white py-3.5 text-sm font-bold shadow-md hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer">
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            className="w-full text-xs text-slate-500 hover:text-violet-600 cursor-pointer">
            ← Change number
          </button>
        </form>
      )}
    </div>
  )
}
