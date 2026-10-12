import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, X, Loader2, ShieldCheck, Clock,
  AlertTriangle, BadgeCheck, AtSign, PlayCircle, Globe, Link2, Lock, Home,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import Navbar from '../components/Navbar'
import PropertyApplication from './PropertyApplication'
import {
  ROLES, NEEDS_BUSINESS, SAMPLE_MIN, SAMPLE_MAX, HANDLE_RE, PAN_RE, GSTIN_RE,
  loadPartnerStatus, loadSamples, uploadSample, removeSample,
  buildForm, submitApplications, resubmitApplication, friendlyError,
} from '../lib/partner'

const EMPTY_FORM = {
  display_name: '', handle: '', bio: '', city: '',
  social: { instagram: '', youtube: '', website: '', other: '' },
  portfolio: '', past_trips: '',
  legal_name: '', pan: '', gstin: '', address: '', offerings: '',
  agreed_terms: false,
}

const PERSON_ROLES = ['creator', 'curator']

const STATUS = {
  pending:  { label: 'Under review', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  on_hold:  { label: 'On hold — action needed', cls: 'bg-orange-50 text-orange-700 border-orange-200', Icon: AlertTriangle },
  approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200', Icon: BadgeCheck },
  rejected: { label: 'Not approved', cls: 'bg-red-50 text-red-700 border-red-200', Icon: X },
}

export default function PartnerApplyPage() {
  const { user, loading: authLoading } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [status, setStatus] = useState({ roles: [], applications: [] })
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState(null)

  const [mode, setMode] = useState('overview')   // overview | apply | edit | done
  const [editingApp, setEditingApp] = useState(null)
  const [step, setStep] = useState(0)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [samples, setSamples] = useState([])
  const [uploading, setUploading] = useState(0)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [results, setResults] = useState([])

  // ── load existing roles + applications ────────────────────────────────────
  const refresh = async () => {
    if (!user) { setStatusLoading(false); return }
    setStatusLoading(true); setStatusError(null)
    try { setStatus(await loadPartnerStatus(user.id)) }
    catch (e) { console.error('loadPartnerStatus:', e); setStatusError(friendlyError(e)) }
    finally { setStatusLoading(false) }
  }
  useEffect(() => { if (!authLoading) refresh() }, [user, authLoading])

  // prefill from the traveller profile
  useEffect(() => {
    if (!profile) return
    setForm(f => ({
      ...f,
      display_name: f.display_name || profile.full_name || '',
      handle: f.handle || (profile.username || '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30),
      bio: f.bio || profile.bio || '',
      city: f.city || profile.location || '',
    }))
  }, [profile])

  // which roles can still be applied for
  const roleState = useMemo(() => {
    const out = {}
    for (const r of Object.keys(ROLES)) {
      const granted = status.roles.find(x => x.role === r && !x.suspended_at)
      const open = status.applications.find(a => a.role === r && (a.status === 'pending' || a.status === 'on_hold'))
      out[r] = granted ? 'granted' : open ? open.status : 'available'
    }
    return out
  }, [status])
  const anyAvailable = Object.values(roleState).some(s => s === 'available')
  const personAvailable = PERSON_ROLES.some(r => roleState[r] === 'available')

  const needsBusiness = NEEDS_BUSINESS(mode === 'edit' && editingApp ? [editingApp.role] : roles)
  const STEPS = ['Partner type', 'About you', 'Samples', ...(needsBusiness ? ['Business'] : []), 'Review']
  const stepName = STEPS[step]

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }
  const setSocial = (k, v) => setForm(f => ({ ...f, social: { ...f.social, [k]: v } }))

  // ── start flows ───────────────────────────────────────────────────────────
  const startProperty = (app = null) => {
    if (!user) { navigate('/auth'); return }
    setEditingApp(app)
    setMode('property')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startApply = (preselect) => {
    if (!user) { navigate('/auth'); return }
    // Property partners use their own form; so does "Start" when only that role is left.
    if (preselect === 'property' || (!preselect && !personAvailable && roleState.property === 'available')) {
      return startProperty()
    }
    setRoles(preselect && roleState[preselect] === 'available' ? [preselect] : [])
    setStep(preselect && roleState[preselect] === 'available' ? 1 : 0)
    if (editingApp) {   // don't carry a resubmission into a new application
      setSamples([])
      setForm({ ...EMPTY_FORM, display_name: profile?.full_name || '', bio: profile?.bio || '', city: profile?.location || '' })
    }
    setErrors({}); setSubmitError(null); setEditingApp(null)
    setMode('apply')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = async (app) => {
    if (app.role === 'property') return startProperty(app)
    const fd = app.form_data || {}
    setEditingApp(app)
    setRoles([app.role])
    setForm({
      ...EMPTY_FORM,
      display_name: fd.display_name || '', handle: fd.handle || '', bio: fd.bio || '', city: fd.city || '',
      social: { ...EMPTY_FORM.social, ...(fd.social_links || {}) },
      portfolio: fd.portfolio || '', past_trips: fd.past_trips || '',
      legal_name: fd.legal_name || '', pan: '', gstin: fd.gstin || '', address: fd.address || '',
      offerings: fd.offerings || '', agreed_terms: true,
    })
    try { setSamples(await loadSamples(app.sample_media_ids)) } catch { setSamples([]) }
    setErrors({}); setSubmitError(null)
    setStep(1)
    setMode('edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── validation per step (mirrors the server checks) ───────────────────────
  const validate = (name) => {
    const e = {}
    if (name === 'Partner type' && roles.length === 0) e.roles = 'Pick at least one.'
    if (name === 'About you') {
      if (!form.display_name.trim()) e.display_name = 'Required'
      if (!HANDLE_RE.test(form.handle.trim().toLowerCase())) e.handle = '3–30 characters: a–z, 0–9, dot or underscore'
      if (form.bio.length > 500) e.bio = 'Keep it under 500 characters'
      if (!form.city.trim()) e.city = 'Required'
    }
    if (name === 'Samples') {
      if (samples.length < SAMPLE_MIN) e.samples = `Upload at least ${SAMPLE_MIN}`
      if (uploading > 0) e.samples = 'Wait for uploads to finish'
    }
    if (name === 'Business') {
      if (!form.legal_name.trim()) e.legal_name = 'Required'
      const pan = form.pan.replace(/\s/g, '').toUpperCase()
      const panOnFile = mode === 'edit' && editingApp?.form_data?.pan_last4
      if (!(panOnFile && !pan) && !PAN_RE.test(pan)) e.pan = 'Format: ABCDE1234F'
      if (form.gstin.trim() && !GSTIN_RE.test(form.gstin.trim().toUpperCase())) e.gstin = '15 characters, e.g. 23ABCDE1234F1Z5'
      if (!form.address.trim()) e.address = 'Required'
      if (!form.offerings.trim()) e.offerings = 'Required'
    }
    if (name === 'Review' && !form.agreed_terms) e.agreed_terms = 'Please accept to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate(stepName)) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => {
    const first = mode === 'edit' ? 1 : 0
    if (step <= first) { setMode('overview'); return }
    setStep(s => s - 1)
  }

  // ── uploads ───────────────────────────────────────────────────────────────
  const fileRef = useRef(null)
  const onFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, SAMPLE_MAX - samples.length)
    if (!files.length) return
    setErrors(e => ({ ...e, samples: undefined }))
    setUploading(n => n + files.length)
    for (const file of files) {
      try {
        const s = await uploadSample(user.id, form.display_name, file)
        setSamples(prev => [...prev, s])
      } catch (e) {
        console.error('uploadSample:', e)
        setErrors(er => ({ ...er, samples: `${file.name}: ${friendlyError(e)}` }))
      } finally {
        setUploading(n => n - 1)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }
  const dropSample = async (s) => {
    setSamples(prev => prev.filter(x => x.id !== s.id))
    try { await removeSample(s) } catch (e) { console.error('removeSample:', e) }
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!validate('Review')) return
    setSubmitting(true); setSubmitError(null)
    const payload = buildForm(form)
    const ids = samples.map(s => s.id)
    try {
      if (mode === 'edit') {
        await resubmitApplication(editingApp.id, payload, ids)
        setResults([{ role: editingApp.role, error: null }])
      } else {
        const r = await submitApplications(roles, payload, ids)
        setResults(r)
        if (r.every(x => x.error)) { setSubmitError(r.map(x => `${ROLES[x.role].title}: ${x.error}`).join(' · ')); return }
      }
      setMode('done')
      refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setSubmitError(friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">

        <div className="mb-5 flex items-center justify-between">
          <button type="button" onClick={() => (mode === 'apply' || mode === 'edit') ? back() : mode === 'property' ? setMode('overview') : navigate(-1)}
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white hover:text-violet-700 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </button>
          {(mode === 'apply' || mode === 'edit' || mode === 'property') && (
            <button onClick={() => setMode('overview')} className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
              Cancel
            </button>
          )}
        </div>

        {mode === 'overview' && (
          <Overview
            user={user}
            roleState={roleState}
            status={status}
            statusLoading={statusLoading}
            statusError={statusError}
            anyAvailable={anyAvailable}
            onApply={startApply}
            onEdit={startEdit}
            onRetry={refresh}
          />
        )}

        {(mode === 'apply' || mode === 'edit') && (
          <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">
            <Stepper steps={STEPS} current={step} skipFirst={mode === 'edit'} />
            <div className="p-5 sm:p-7">
              {mode === 'edit' && editingApp?.admin_notes && (
                <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                  <p className="font-bold mb-0.5">What the Hoppity team asked for</p>
                  <p className="leading-relaxed">{editingApp.admin_notes}</p>
                </div>
              )}

              {stepName === 'Partner type' && (
                <StepRoles roles={roles} setRoles={(r) => { setRoles(r); setErrors({}) }} roleState={roleState} error={errors.roles}
                  onProperty={() => startProperty()} />
              )}
              {stepName === 'About you' && (
                <StepAbout form={form} set={set} setSocial={setSocial} errors={errors} />
              )}
              {stepName === 'Samples' && (
                <StepSamples samples={samples} uploading={uploading} error={errors.samples}
                  fileRef={fileRef} onFiles={onFiles} onRemove={dropSample} />
              )}
              {stepName === 'Business' && (
                <StepBusiness form={form} set={set} errors={errors}
                  panOnFile={mode === 'edit' ? editingApp?.form_data?.pan_last4 : null} />
              )}
              {stepName === 'Review' && (
                <StepReview form={form} set={set} errors={errors} samples={samples}
                  roles={mode === 'edit' ? [editingApp.role] : roles} needsBusiness={needsBusiness}
                  canEditRoles={mode !== 'edit'}
                  onJump={(name) => setStep(STEPS.indexOf(name))} />
              )}

              {submitError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{submitError}</span>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between gap-3">
                <button onClick={back}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
                  Back
                </button>
                {stepName !== 'Review' ? (
                  <button onClick={next}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 transition cursor-pointer">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={submit} disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 transition cursor-pointer disabled:opacity-60">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {mode === 'edit' ? 'Resubmit application' : 'Submit application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === 'property' && (
          <PropertyApplication
            key={editingApp?.id || 'new-property'}
            user={user}
            profile={profile}
            editingApp={editingApp}
            onCancel={() => setMode('overview')}
            onDone={(r) => { setResults(r); setMode('done'); refresh(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          />
        )}

        {mode === 'done' && (
          <Done results={results} onBack={() => setMode('overview')} />
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────
function Overview({ user, roleState, status, statusLoading, statusError, anyAvailable, onApply, onEdit, onRetry }) {
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-violet-700 to-purple-600 text-white p-6 sm:p-8 mb-5 shadow-sm">
        <p className="text-violet-200 text-xs font-bold uppercase tracking-wider">Hoppity Partners</p>
        <h1 className="text-2xl sm:text-3xl font-black mt-1 leading-tight">Share the trips you love.<br />Get paid when people book them.</h1>
        <p className="text-violet-100 text-sm mt-3 max-w-lg leading-relaxed">
          Create content, run your own itineraries or list your property's special packages. Every post links to
          something bookable, and every booking that comes from your work is credited to you.
        </p>
        {anyAvailable && (
          <button onClick={() => onApply()}
            className="mt-5 inline-flex items-center gap-2 bg-white text-violet-800 text-sm font-bold px-5 py-3 rounded-xl hover:bg-violet-50 transition cursor-pointer">
            {user ? 'Start your application' : 'Sign in to apply'} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {user && !statusLoading && (status.applications.length > 0 || status.roles.length > 0) && (
        <div className="bg-white rounded-3xl border border-violet-100 p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Your applications</h2>
          <div className="space-y-2.5">
            {status.applications.map(a => {
              const s = STATUS[a.status] || STATUS.pending
              return (
                <div key={a.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{ROLES[a.role].emoji}</span>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{ROLES[a.role].title}</p>
                        <p className="text-[11px] text-slate-400">
                          Applied {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>
                      <s.Icon className="w-3 h-3" /> {s.label}
                    </span>
                  </div>
                  {a.admin_notes && (a.status === 'on_hold' || a.status === 'rejected') && (
                    <p className="mt-3 text-xs text-slate-700 bg-slate-50 rounded-xl px-3 py-2 leading-relaxed">
                      <span className="font-bold">Note from Hoppity: </span>{a.admin_notes}
                    </p>
                  )}
                  {a.status === 'on_hold' && (
                    <button onClick={() => onEdit(a)}
                      className="mt-3 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition cursor-pointer">
                      Update application
                    </button>
                  )}
                  {a.status === 'approved' && (
                    <p className="mt-3 text-xs text-green-700">You're verified. Studio is opening soon — we'll notify you.</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {statusError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>Couldn't load your applications: {statusError}</span>
          <button onClick={onRetry} className="text-xs font-bold underline cursor-pointer">Retry</button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {Object.values(ROLES).map(r => {
          const st = roleState[r.id]
          return (
            <div key={r.id} className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm flex flex-col">
              <div className="text-3xl">{r.emoji}</div>
              <h3 className="font-black text-slate-900 mt-2">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.who}</p>
              <p className="text-xs text-slate-700 mt-3 leading-relaxed"><span className="font-bold">You publish: </span>{r.publish}</p>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed"><span className="font-bold">You earn: </span>{r.earn}</p>
              <div className="mt-auto pt-4">
                {st === 'granted' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700"><BadgeCheck className="w-4 h-4" /> Verified</span>
                ) : st === 'pending' || st === 'on_hold' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700"><Clock className="w-4 h-4" /> {STATUS[st].label}</span>
                ) : (
                  <button onClick={() => onApply(r.id)}
                    className="w-full text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-2 rounded-xl hover:bg-violet-100 transition cursor-pointer">
                    Apply as {r.title.toLowerCase()}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 bg-white rounded-3xl border border-violet-100 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-3">How it works</h2>
        <ol className="space-y-2.5 text-sm text-slate-600">
          {[
            'Pick one or more partner types — you can be a creator and a curator at the same time.',
            'Tell us about yourself and upload 3 to 5 samples of your work.',
            'Curators add business details. Property partners use their own form for the property, its location and the packages they want to run. We sign a partner agreement before approval.',
            'Our team reviews your application, usually within a few working days.',
            'Once approved you get a verified badge, access to Studio, and we set up payouts with you through Razorpay.',
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black grid place-items-center">{i + 1}</span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

function StepRoles({ roles, setRoles, roleState, error, onProperty }) {
  const toggle = (id) => setRoles(roles.includes(id) ? roles.filter(r => r !== id) : [...roles, id])
  const propertyState = roleState.property
  return (
    <>
      <StepTitle title="How do you want to partner with Hoppity?" sub="Pick one or both. Each role is reviewed separately." />
      <div className="space-y-2.5">
        {PERSON_ROLES.map(id => ROLES[id]).map(r => {
          const st = roleState[r.id]
          const disabled = st !== 'available'
          const on = roles.includes(r.id)
          return (
            <button key={r.id} type="button" disabled={disabled} onClick={() => toggle(r.id)}
              className={`w-full text-left flex gap-3 rounded-2xl border p-4 transition ${
                disabled ? 'opacity-50 cursor-not-allowed border-slate-100'
                  : on ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200 cursor-pointer'
                    : 'border-slate-200 hover:border-violet-300 cursor-pointer'}`}>
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900">{r.title}
                  {disabled && <span className="ml-2 text-[11px] font-semibold text-slate-500">
                    {st === 'granted' ? '· already verified' : '· application open'}</span>}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.who}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.earn}</p>
              </div>
              <span className={`w-5 h-5 rounded-md border-2 grid place-items-center flex-shrink-0 mt-0.5 ${on ? 'bg-violet-700 border-violet-700' : 'border-slate-300'}`}>
                {on && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
            </button>
          )
        })}
      </div>
      {error && <FieldError msg={error} />}

      {/* Properties apply with a different form */}
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex items-center gap-3">
        <span className="text-2xl">{ROLES.property.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900">Own or run a property?</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Homestays, lodges and retreats apply with the property partner form.</p>
        </div>
        {propertyState === 'available' ? (
          <button type="button" onClick={onProperty}
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-white border border-amber-300 px-3 py-2 rounded-xl hover:bg-amber-100 transition cursor-pointer">
            <Home className="w-3.5 h-3.5" /> Property form
          </button>
        ) : (
          <span className="flex-shrink-0 text-[11px] font-semibold text-slate-500">
            {propertyState === 'granted' ? 'Already verified' : 'Application open'}
          </span>
        )}
      </div>
    </>
  )
}

function StepAbout({ form, set, setSocial, errors }) {
  return (
    <>
      <StepTitle title="About you" sub="This becomes your public partner profile once you're approved." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" error={errors.display_name}>
          <input value={form.display_name} onChange={e => set('display_name', e.target.value)}
            placeholder="e.g. Riya Sharma or Jungle Aashiyana" className={inputCls(errors.display_name)} />
        </Field>
        <Field label="Handle" error={errors.handle} hint="hoppity.in/@your-handle">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
            <input value={form.handle}
              onChange={e => set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30))}
              placeholder="riya.travels" className={`${inputCls(errors.handle)} pl-7`} />
          </div>
        </Field>
        <Field label="City" error={errors.city}>
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Bhopal" className={inputCls(errors.city)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Bio" error={errors.bio} hint={`${form.bio.length}/500`}>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} maxLength={500}
              placeholder="What kind of travel do you love, and what do you make or run?"
              className={`${inputCls(errors.bio)} resize-none`} />
          </Field>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2">Social links</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <IconInput Icon={AtSign} value={form.social.instagram} onChange={v => setSocial('instagram', v)} placeholder="Instagram profile URL or @handle" />
        <IconInput Icon={PlayCircle} value={form.social.youtube} onChange={v => setSocial('youtube', v)} placeholder="YouTube channel" />
        <IconInput Icon={Globe} value={form.social.website} onChange={v => setSocial('website', v)} placeholder="Website" />
        <IconInput Icon={Link2} value={form.social.other} onChange={v => setSocial('other', v)} placeholder="Anything else (LinkedIn, Behance…)" />
      </div>

      <div className="grid gap-4 mt-6">
        <Field label="Portfolio" hint="Optional — a link to your best work">
          <input value={form.portfolio} onChange={e => set('portfolio', e.target.value)}
            placeholder="https://…" className={inputCls()} />
        </Field>
        <Field label="Past trips" hint="Optional — trips you've made content about, led or hosted">
          <textarea value={form.past_trips} onChange={e => set('past_trips', e.target.value)} rows={3}
            placeholder="e.g. Spiti winter 2025, Hornbill Festival, monsoon treks in Satpura…"
            className={`${inputCls()} resize-none`} />
        </Field>
      </div>
    </>
  )
}

function StepSamples({ samples, uploading, error, fileRef, onFiles, onRemove }) {
  return (
    <>
      <StepTitle title="Show us your work"
        sub={`Upload ${SAMPLE_MIN} to ${SAMPLE_MAX} photos or short videos that show what you make or the trips you run.`} />
      <SampleGrid samples={samples} uploading={uploading} max={SAMPLE_MAX} addLabel="Add photos or videos"
        fileRef={fileRef} onFiles={onFiles} onRemove={onRemove} />
      <p className="text-[11px] text-slate-400 mt-3">Photos up to 15 MB, videos up to 50 MB. Only share media you own the rights to.</p>
      {error && <FieldError msg={error} />}
    </>
  )
}

function StepBusiness({ form, set, errors, panOnFile }) {
  return (
    <>
      <StepTitle title="Business details"
        sub="Needed for curators so we can bill and pay you correctly." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Legal entity name" error={errors.legal_name} hint="As on your PAN / GST registration">
            <input value={form.legal_name} onChange={e => set('legal_name', e.target.value)}
              placeholder="e.g. Northbound Trails Pvt Ltd" className={inputCls(errors.legal_name)} />
          </Field>
        </div>
        <Field label="PAN" error={errors.pan}
          hint={panOnFile ? `On file: •••••${panOnFile}. Leave blank to keep it.` : 'We only store the last 4 characters'}>
          <input value={form.pan} onChange={e => set('pan', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
            placeholder="ABCDE1234F" autoComplete="off" className={`${inputCls(errors.pan)} font-mono tracking-wider`} />
        </Field>
        <Field label="GSTIN" error={errors.gstin} hint="Optional — if you're registered">
          <input value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
            placeholder="23ABCDE1234F1Z5" className={`${inputCls(errors.gstin)} font-mono tracking-wider`} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Registered address" error={errors.address}>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
              className={`${inputCls(errors.address)} resize-none`} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Itineraries and packages you run" error={errors.offerings}>
            <textarea value={form.offerings} onChange={e => set('offerings', e.target.value)} rows={4}
              placeholder="e.g. Spiti winter expedition (8 days, monthly departures, max 12), Ziro Festival trip…"
              className={`${inputCls(errors.offerings)} resize-none`} />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-600 leading-relaxed">
        <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>Bank details are never collected here. After approval, payouts are set up through Razorpay's secure
          onboarding, and a partner agreement is signed before your listings can go live.</span>
      </div>
    </>
  )
}

function StepReview({ form, set, errors, samples, roles, needsBusiness, canEditRoles, onJump }) {
  const socials = Object.entries(form.social).filter(([, v]) => v.trim())
  return (
    <>
      <StepTitle title="Review and submit" sub="Check everything once. You can update it later if we put it on hold." />
      <ReviewBlock title="Applying as" onEdit={canEditRoles ? () => onJump('Partner type') : null}>
        <div className="flex flex-wrap gap-2">
          {roles.map(r => (
            <span key={r} className="text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200 px-2.5 py-1 rounded-full">
              {ROLES[r].emoji} {ROLES[r].title}
            </span>
          ))}
        </div>
      </ReviewBlock>
      <ReviewBlock title="Profile" onEdit={() => onJump('About you')}>
        <p className="text-sm font-bold text-slate-900">{form.display_name} <span className="font-normal text-slate-400">@{form.handle}</span></p>
        <p className="text-xs text-slate-500">{form.city}</p>
        {form.bio && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{form.bio}</p>}
        {socials.length > 0 && <p className="text-xs text-slate-500 mt-1.5">{socials.map(([k, v]) => `${k}: ${v}`).join(' · ')}</p>}
      </ReviewBlock>
      <ReviewBlock title={`Samples (${samples.length})`} onEdit={() => onJump('Samples')}>
        <div className="flex gap-2 overflow-x-auto">
          {samples.map(s => (
            <div key={s.id} className="w-14 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {s.kind === 'video'
                ? <video src={s.url} className="w-full h-full object-cover" muted preload="metadata" />
                : <img src={s.url} alt="" className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      </ReviewBlock>
      {needsBusiness && (
        <ReviewBlock title="Business" onEdit={() => onJump('Business')}>
          <p className="text-sm text-slate-800">{form.legal_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            PAN {form.pan ? `•••••${form.pan.slice(-4)}` : 'on file'}{form.gstin ? ` · GSTIN ${form.gstin}` : ''}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{form.address}</p>
        </ReviewBlock>
      )}

      <label className="mt-5 flex gap-3 items-start cursor-pointer">
        <input type="checkbox" checked={form.agreed_terms} onChange={e => set('agreed_terms', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-violet-700" />
        <span className="text-sm text-slate-600 leading-relaxed">
          I agree to the <Link to="/partner-terms" className="font-semibold text-violet-700 underline">Hoppity partner terms</Link>,
          confirm the samples are my own work, and that everyone identifiable in them agreed to appear.
        </span>
      </label>
      {errors.agreed_terms && <FieldError msg={errors.agreed_terms} />}
    </>
  )
}

function Done({ results, onBack }) {
  const ok = results.filter(r => !r.error)
  const failed = results.filter(r => r.error)
  return (
    <div className="bg-white rounded-3xl border border-violet-100 p-7 shadow-sm text-center">
      <div className="w-14 h-14 rounded-full bg-green-50 grid place-items-center mx-auto">
        <ShieldCheck className="w-7 h-7 text-green-600" />
      </div>
      <h2 className="text-xl font-black text-slate-900 mt-4">Application received</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        {ok.map(r => ROLES[r.role].title).join(' and ')} — our team will review it and notify you by email and push.
        You can check the status anytime from your profile.
      </p>
      {failed.length > 0 && (
        <div className="mt-4 text-left rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {failed.map(r => <p key={r.role}><b>{ROLES[r.role].title}:</b> {r.error}</p>)}
        </div>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={onBack} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer">
          View status
        </button>
        <Link to="/profile" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 transition">
          Back to profile
        </Link>
      </div>
    </div>
  )
}