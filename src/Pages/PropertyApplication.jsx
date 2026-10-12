import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Loader2, AlertTriangle, Lock, Globe, AtSign, Link2, MapPin, Phone, BedDouble,
} from 'lucide-react'
import {
  SAMPLE_MIN, SAMPLE_MAX, HANDLE_RE, PAN_RE, GSTIN_RE,
  uploadSample, removeSample, loadSamples, submitApplications, resubmitApplication, friendlyError,
} from '../lib/partner'
import {
  inputCls, StepTitle, Field, FieldError, IconInput, ReviewBlock, Stepper, Chips, SampleGrid,
} from './ui'

// Property partner application — journey 3.1 for signature stays and retreats.
// Different from the creator / curator form: it is about the property
// (type, rooms, location, on-site contact) and what it will sell on Hoppity
// (fixed-date retreats, recurring experiences, demand-led stay packages — 3.3).
// Saves through the same apply_partner_role RPC with role = 'property';
// property details travel in form_data.property and are validated server-side.

export const PROPERTY_TYPES = [
  { id: 'homestay',       label: 'Homestay',        emoji: '🏡' },
  { id: 'boutique_hotel', label: 'Boutique hotel',  emoji: '🏨' },
  { id: 'resort',         label: 'Resort',          emoji: '🌴' },
  { id: 'eco_lodge',      label: 'Eco lodge',       emoji: '🌿' },
  { id: 'camp',           label: 'Camp / tents',    emoji: '⛺' },
  { id: 'farmstay',       label: 'Farmstay',        emoji: '🌾' },
  { id: 'heritage',       label: 'Heritage stay',   emoji: '🏰' },
  { id: 'villa',          label: 'Villa',           emoji: '🏠' },
  { id: 'retreat_centre', label: 'Retreat centre',  emoji: '🧘' },
  { id: 'other',          label: 'Other',           emoji: '✨' },
]

export const OFFER_TYPES = [
  { id: 'retreat',      title: 'Retreats & multi-day packages',
    sub: 'Fixed dates with set seats, e.g. a 3N/4D wellness retreat.' },
  { id: 'experience',   title: 'Short experiences',
    sub: 'Recurring time slots, e.g. a 6:30 am wildlife walk, 8 seats, daily except Tuesday.' },
  { id: 'stay_package', title: 'Demand-led stay packages',
    sub: 'A new batch opens once enough travellers register interest or pay deposits.' },
]

export const CATEGORIES = [
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
  { id: 'wildlife', label: 'Wildlife', emoji: '🐅' },
  { id: 'tribal',   label: 'Tribal',   emoji: '🪶' },
  { id: 'food',     label: 'Food',     emoji: '🍲' },
  { id: 'trek',     label: 'Trek',     emoji: '🥾' },
  { id: 'heritage', label: 'Heritage', emoji: '🏛️' },
  { id: 'adventure', label: 'Adventure', emoji: '🧗' },
  { id: 'birding',  label: 'Birding',  emoji: '🦜' },
  { id: 'farm',     label: 'Farm life', emoji: '🐄' },
  { id: 'spiritual', label: 'Spiritual', emoji: '🕉️' },
]

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]

const PHONE_RE = /^(?:\+?91)?[6-9]\d{9}$/
const PIN_RE = /^[1-9]\d{5}$/
const typeLabel = (id) => PROPERTY_TYPES.find(t => t.id === id)?.label || id

// Server error codes specific to this form; everything else falls back to friendlyError.
const PROPERTY_ERRORS = {
  invalid_property_type: 'Pick the type of property.',
  property_address_required: 'Add the property address.',
  property_city_required: 'Add the town or city the property is in.',
  property_state_required: 'Pick the state.',
  invalid_pincode: 'PIN code should be 6 digits.',
  invalid_units: 'Enter how many rooms, cottages or tents you have.',
  invalid_max_guests: 'Max guests should be a number.',
  contact_name_required: 'Add an on-site contact person.',
  invalid_contact_phone: 'Contact phone should be a 10-digit Indian mobile number.',
  offer_types_required: 'Pick at least one thing you would like to offer on Hoppity.',
  property_details_required: 'Property details are missing. Go back and fill them in.',
}
const propError = (e) => {
  const m = e?.message || String(e || '')
  const k = Object.keys(PROPERTY_ERRORS).find(x => m.includes(x))
  return k ? PROPERTY_ERRORS[k] : friendlyError(e)
}

const EMPTY = {
  // the property
  property_name: '', handle: '', property_type: '', description: '', units: '', max_guests: '',
  // location & contact
  address: '', city: '', state: '', pincode: '', maps_url: '',
  contact_name: '', contact_role: '', contact_phone: '',
  website: '', instagram: '', booking_link: '', hoppity_stay: '',
  // on Hoppity
  offer_types: [], categories: [], offerings: '', season: '', price_range: '',
  // business
  legal_name: '', pan: '', gstin: '', reg_same: true, reg_address: '', tourism_reg_no: '',
  agreed_terms: false,
}

const STEPS = ['Your property', 'Location & contact', 'Photos', 'On Hoppity', 'Business', 'Review']

function fromApplication(app, profile) {
  if (!app) return { ...EMPTY, contact_name: profile?.full_name || '', contact_phone: profile?.phone || '' }
  const f = app.form_data || {}
  const p = f.property || {}
  const sl = f.social_links || {}
  return {
    ...EMPTY,
    property_name: f.display_name || '', handle: f.handle || '', property_type: p.property_type || '',
    description: f.bio || '', units: p.units ? String(p.units) : '', max_guests: p.max_guests ? String(p.max_guests) : '',
    address: p.address || '', city: p.city || f.city || '', state: p.state || '', pincode: p.pincode || '', maps_url: p.maps_url || '',
    contact_name: p.contact_name || '', contact_role: p.contact_role || '', contact_phone: p.contact_phone || '',
    website: sl.website || f.portfolio || '', instagram: sl.instagram || '', booking_link: p.booking_link || '', hoppity_stay: p.hoppity_stay || '',
    offer_types: p.offer_types || [], categories: p.categories || [], offerings: f.offerings || '',
    season: p.season || '', price_range: p.price_range || '',
    legal_name: f.legal_name || '', pan: '', gstin: f.gstin || '',
    reg_same: !f.address || f.address === p.address, reg_address: f.address && f.address !== p.address ? f.address : '',
    tourism_reg_no: p.tourism_reg_no || '',
    agreed_terms: true,
  }
}

export default function PropertyApplication({ user, profile, editingApp, onCancel, onDone }) {
  const isEdit = !!editingApp
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(() => fromApplication(editingApp, profile))
  const [samples, setSamples] = useState([])
  const [uploading, setUploading] = useState(0)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const fileRef = useRef(null)
  const panOnFile = isEdit ? editingApp.form_data?.pan_last4 : null

  // existing samples when resubmitting after "On hold"
  useEffect(() => {
    if (!isEdit) return
    let live = true
    loadSamples(editingApp.sample_media_ids).then(s => live && setSamples(s)).catch(() => live && setSamples([]))
    return () => { live = false }
  }, [isEdit, editingApp])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }
  const stepName = STEPS[step]

  // ── validation (mirrors validate_partner_form on the server) ──────────────
  const validate = (name) => {
    const e = {}
    const f = form
    if (name === 'Your property') {
      if (!f.property_name.trim()) e.property_name = 'Required'
      if (!HANDLE_RE.test(f.handle.trim().toLowerCase())) e.handle = '3–30 characters: a–z, 0–9, dot or underscore'
      if (!f.property_type) e.property_type = 'Pick one'
      if (!f.description.trim()) e.description = 'Tell travellers what makes it special'
      else if (f.description.length > 500) e.description = 'Keep it under 500 characters'
      if (!/^\d{1,4}$/.test(f.units) || Number(f.units) < 1) e.units = 'A number, e.g. 6'
      if (f.max_guests && !/^\d{1,5}$/.test(f.max_guests)) e.max_guests = 'A number'
    }
    if (name === 'Location & contact') {
      if (!f.address.trim()) e.address = 'Required'
      if (!f.city.trim()) e.city = 'Required'
      if (!f.state) e.state = 'Required'
      if (f.pincode && !PIN_RE.test(f.pincode)) e.pincode = '6 digits'
      if (!f.contact_name.trim()) e.contact_name = 'Required'
      if (!PHONE_RE.test(f.contact_phone.replace(/[\s-]/g, ''))) e.contact_phone = '10-digit mobile number'
    }
    if (name === 'Photos') {
      if (samples.length < SAMPLE_MIN) e.samples = `Upload at least ${SAMPLE_MIN}`
      if (uploading > 0) e.samples = 'Wait for uploads to finish'
    }
    if (name === 'On Hoppity') {
      if (f.offer_types.length === 0) e.offer_types = 'Pick at least one'
      if (!f.offerings.trim()) e.offerings = 'Describe at least one package or experience'
    }
    if (name === 'Business') {
      if (!f.legal_name.trim()) e.legal_name = 'Required'
      const pan = f.pan.replace(/\s/g, '').toUpperCase()
      if (!(panOnFile && !pan) && !PAN_RE.test(pan)) e.pan = 'Format: ABCDE1234F'
      if (f.gstin.trim() && !GSTIN_RE.test(f.gstin.trim().toUpperCase())) e.gstin = '15 characters, e.g. 23ABCDE1234F1Z5'
      if (!f.reg_same && !f.reg_address.trim()) e.reg_address = 'Required'
    }
    if (name === 'Review' && !f.agreed_terms) e.agreed_terms = 'Please accept to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate(stepName)) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => (step === 0 ? onCancel() : setStep(s => s - 1))
  const jump = (name) => setStep(STEPS.indexOf(name))

  // ── uploads ───────────────────────────────────────────────────────────────
  const onFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, SAMPLE_MAX - samples.length)
    if (!files.length) return
    setErrors(e => ({ ...e, samples: undefined }))
    setUploading(n => n + files.length)
    for (const file of files) {
      try {
        const s = await uploadSample(user.id, form.property_name, file)
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
  const buildPayload = () => {
    const f = form
    const social = Object.fromEntries(
      [['website', f.website], ['instagram', f.instagram], ['other', f.booking_link]]
        .filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]))
    return {
      display_name: f.property_name.trim(),
      handle: f.handle.trim().toLowerCase(),
      bio: f.description.trim(),
      city: f.city.trim(),
      social_links: social,
      portfolio: f.website.trim(),
      agreed_terms: f.agreed_terms,
      legal_name: f.legal_name.trim(),
      pan: f.pan.replace(/\s/g, '').toUpperCase(),
      gstin: f.gstin.trim().toUpperCase(),
      address: (f.reg_same ? f.address : f.reg_address).trim(),
      offerings: f.offerings.trim(),
      property: {
        property_type: f.property_type,
        units: f.units, max_guests: f.max_guests,
        address: f.address.trim(), city: f.city.trim(), state: f.state, pincode: f.pincode.trim(), maps_url: f.maps_url.trim(),
        contact_name: f.contact_name.trim(), contact_role: f.contact_role.trim(), contact_phone: f.contact_phone.trim(),
        booking_link: f.booking_link.trim(), hoppity_stay: f.hoppity_stay.trim(),
        offer_types: f.offer_types, categories: f.categories,
        season: f.season.trim(), price_range: f.price_range.trim(),
        tourism_reg_no: f.tourism_reg_no.trim(),
      },
    }
  }

  const submit = async () => {
    if (!validate('Review')) return
    setSubmitting(true); setSubmitError(null)
    const payload = buildPayload()
    const ids = samples.map(s => s.id)
    try {
      if (isEdit) {
        await resubmitApplication(editingApp.id, payload, ids)
        onDone([{ role: 'property', error: null }])
      } else {
        const r = await submitApplications(['property'], payload, ids)
        if (r[0]?.error) {
          // submitApplications already ran the message through friendlyError; map ours too
          setSubmitError(PROPERTY_ERRORS[Object.keys(PROPERTY_ERRORS).find(k => r[0].error.includes(k))] || r[0].error)
          return
        }
        onDone(r)
      }
    } catch (e) {
      setSubmitError(propError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-7 pt-5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          🏡 Property partner application
        </span>
      </div>
      <Stepper steps={STEPS} current={step} />
      <div className="p-5 sm:p-7">
        {isEdit && editingApp?.admin_notes && (
          <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <p className="font-bold mb-0.5">What the Hoppity team asked for</p>
            <p className="leading-relaxed">{editingApp.admin_notes}</p>
          </div>
        )}

        {stepName === 'Your property' && <StepProperty form={form} set={set} errors={errors} />}
        {stepName === 'Location & contact' && <StepLocation form={form} set={set} errors={errors} />}
        {stepName === 'Photos' && (
          <>
            <StepTitle title="Show us your property"
              sub={`Upload ${SAMPLE_MIN} to ${SAMPLE_MAX} photos or short videos: the rooms, common spaces, the surroundings and an experience you run. These help us review, and can be reused for your first listing.`} />
            <SampleGrid samples={samples} uploading={uploading} max={SAMPLE_MAX} addLabel="Add photos or videos"
              fileRef={fileRef} onFiles={onFiles} onRemove={dropSample} />
            <p className="text-[11px] text-slate-400 mt-3">Photos up to 15 MB, videos up to 50 MB. Only share media you own the rights to.</p>
            {errors.samples && <FieldError msg={errors.samples} />}
          </>
        )}
        {stepName === 'On Hoppity' && <StepOffer form={form} set={set} errors={errors} />}
        {stepName === 'Business' && <StepBusiness form={form} set={set} errors={errors} panOnFile={panOnFile} />}
        {stepName === 'Review' && <StepReview form={form} set={set} errors={errors} samples={samples} onJump={jump} panOnFile={panOnFile} />}

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
              {isEdit ? 'Resubmit application' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── steps ───────────────────────────────────────────────────────────────────
function StepProperty({ form, set, errors }) {
  return (
    <>
      <StepTitle title="Tell us about your property"
        sub="This becomes your property's public partner profile once you're approved." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Property name" error={errors.property_name}>
          <input value={form.property_name} onChange={e => set('property_name', e.target.value)}
            placeholder="e.g. Jungle Aashiyana" className={inputCls(errors.property_name)} />
        </Field>
        <Field label="Handle" error={errors.handle} hint="hoppity.in/@your-handle">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
            <input value={form.handle}
              onChange={e => set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30))}
              placeholder="jungleaashiyana" className={`${inputCls(errors.handle)} pl-7`} />
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold text-slate-700 mb-2">Type of property</p>
        <Chips multi={false} options={PROPERTY_TYPES} value={form.property_type} onChange={v => set('property_type', v)} error={errors.property_type} />
        {errors.property_type && <FieldError msg={errors.property_type} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-5">
        <Field label="Rooms / cottages / tents" error={errors.units}>
          <div className="relative">
            <BedDouble className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input inputMode="numeric" value={form.units} onChange={e => set('units', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="6" className={`${inputCls(errors.units)} pl-9`} />
          </div>
        </Field>
        <Field label="Max guests at a time" error={errors.max_guests} hint="Optional">
          <input inputMode="numeric" value={form.max_guests} onChange={e => set('max_guests', e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="14" className={inputCls(errors.max_guests)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="About the property" error={errors.description} hint={`${form.description.length}/500`}>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} maxLength={500}
              placeholder="What it's like to stay, the setting, the food, what guests do — e.g. six mud-and-stone cottages on the edge of Satpura, home-cooked Gond food, guided forest walks at dawn."
              className={`${inputCls(errors.description)} resize-none`} />
          </Field>
        </div>
      </div>
    </>
  )
}

function StepLocation({ form, set, errors }) {
  return (
    <>
      <StepTitle title="Where is it, and who do we talk to?"
        sub="The on-site contact is who our team and travellers' trip leads will coordinate with." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Property address" error={errors.address}>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
              placeholder="Village / road, landmark" className={`${inputCls(errors.address)} resize-none`} />
          </Field>
        </div>
        <Field label="Town or nearest city" error={errors.city}>
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pachmarhi" className={inputCls(errors.city)} />
        </Field>
        <Field label="State" error={errors.state}>
          <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls(errors.state)}>
            <option value="">Select state</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="PIN code" error={errors.pincode} hint="Optional">
          <input inputMode="numeric" value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="461990" className={inputCls(errors.pincode)} />
        </Field>
        <Field label="Google Maps link" hint="Optional">
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={form.maps_url} onChange={e => set('maps_url', e.target.value)} placeholder="https://maps.app.goo.gl/…" className={`${inputCls()} pl-9`} />
          </div>
        </Field>
      </div>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2">On-site contact</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" error={errors.contact_name}>
          <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className={inputCls(errors.contact_name)} />
        </Field>
        <Field label="Role" hint="Optional">
          <input value={form.contact_role} onChange={e => set('contact_role', e.target.value)} placeholder="Owner, manager…" className={inputCls()} />
        </Field>
        <Field label="Mobile (WhatsApp)" error={errors.contact_phone}>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="tel" inputMode="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 16))}
              placeholder="98765 43210" className={`${inputCls(errors.contact_phone)} pl-9`} />
          </div>
        </Field>
      </div>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2">Online presence <span className="normal-case font-medium text-slate-400">· optional</span></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <IconInput Icon={Globe} value={form.website} onChange={v => set('website', v)} placeholder="Website" />
        <IconInput Icon={AtSign} value={form.instagram} onChange={v => set('instagram', v)} placeholder="Instagram @handle or URL" />
        <IconInput Icon={Link2} value={form.booking_link} onChange={v => set('booking_link', v)} placeholder="Airbnb / Booking.com / Google listing" />
        <IconInput Icon={BedDouble} value={form.hoppity_stay} onChange={v => set('hoppity_stay', v)} placeholder="Already on Hoppity? Stay link or code" />
      </div>
    </>
  )
}

function StepOffer({ form, set, errors }) {
  const toggleOffer = (id) => set('offer_types', form.offer_types.includes(id) ? form.offer_types.filter(x => x !== id) : [...form.offer_types, id])
  return (
    <>
      <StepTitle title="What would you like to offer on Hoppity?"
        sub="Pick all that apply. After approval you'll set these up as listings in Studio, with your own B2B price and dates." />
      <div className="space-y-2.5">
        {OFFER_TYPES.map(o => {
          const on = form.offer_types.includes(o.id)
          return (
            <button key={o.id} type="button" onClick={() => toggleOffer(o.id)}
              className={`w-full text-left flex gap-3 rounded-2xl border p-4 transition cursor-pointer ${
                on ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' : 'border-slate-200 hover:border-violet-300'}`}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900">{o.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{o.sub}</p>
              </div>
              <span className={`w-5 h-5 rounded-md border-2 grid place-items-center flex-shrink-0 mt-0.5 ${on ? 'bg-violet-700 border-violet-700' : 'border-slate-300'}`}>
                {on && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
            </button>
          )
        })}
      </div>
      {errors.offer_types && <FieldError msg={errors.offer_types} />}

      <div className="mt-5">
        <p className="text-xs font-bold text-slate-700 mb-2">Categories <span className="font-medium text-slate-400">· optional</span></p>
        <Chips options={CATEGORIES} value={form.categories} onChange={v => set('categories', v)} />
      </div>

      <div className="grid gap-4 mt-5">
        <Field label="Packages and experiences you'd like to list" error={errors.offerings}>
          <textarea value={form.offerings} onChange={e => set('offerings', e.target.value)} rows={4}
            placeholder="e.g. 3N/4D Satpura wellness retreat, monthly, 10 guests · Daily 6:30 am wildlife walk, 8 seats, closed Tuesdays · Monsoon farm stay package"
            className={`${inputCls(errors.offerings)} resize-none`} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Open season" hint="Optional">
            <input value={form.season} onChange={e => set('season', e.target.value)} placeholder="e.g. Oct – Jun, closed in monsoon" className={inputCls()} />
          </Field>
          <Field label="Typical price per person / night" hint="Optional · indicative only">
            <input value={form.price_range} onChange={e => set('price_range', e.target.value)} placeholder="e.g. ₹2,500 – ₹4,000" className={inputCls()} />
          </Field>
        </div>
      </div>
    </>
  )
}

function StepBusiness({ form, set, errors, panOnFile }) {
  return (
    <>
      <StepTitle title="Business details" sub="So we can bill and pay you correctly." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Legal entity name" error={errors.legal_name} hint="As on your PAN / GST registration">
            <input value={form.legal_name} onChange={e => set('legal_name', e.target.value)}
              placeholder="e.g. JA Retreats LLP" className={inputCls(errors.legal_name)} />
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
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.reg_same} onChange={e => set('reg_same', e.target.checked)} className="w-4 h-4 accent-violet-700" />
            <span className="text-sm text-slate-700">Registered address is the same as the property address</span>
          </label>
          {!form.reg_same && (
            <div className="mt-3">
              <Field label="Registered address" error={errors.reg_address}>
                <textarea value={form.reg_address} onChange={e => set('reg_address', e.target.value)} rows={2}
                  className={`${inputCls(errors.reg_address)} resize-none`} />
              </Field>
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          <Field label="Tourism / homestay registration number" hint="Optional">
            <input value={form.tourism_reg_no} onChange={e => set('tourism_reg_no', e.target.value)} placeholder="State tourism or homestay scheme registration" className={inputCls()} />
          </Field>
        </div>
      </div>
      <div className="mt-5 flex gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-600 leading-relaxed">
        <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <span>Bank details are never collected here. After approval, payouts are set up through Razorpay's secure
          onboarding, and a partner agreement is signed before your packages can go live.</span>
      </div>
    </>
  )
}

function StepReview({ form, set, errors, samples, onJump, panOnFile }) {
  const offerTitles = OFFER_TYPES.filter(o => form.offer_types.includes(o.id)).map(o => o.title)
  const cats = CATEGORIES.filter(c => form.categories.includes(c.id)).map(c => `${c.emoji} ${c.label}`)
  return (
    <>
      <StepTitle title="Review and submit" sub="Check everything once. You can update it later if we put it on hold." />
      <ReviewBlock title="Property" onEdit={() => onJump('Your property')}>
        <p className="text-sm font-bold text-slate-900">{form.property_name} <span className="font-normal text-slate-400">@{form.handle}</span></p>
        <p className="text-xs text-slate-500">{typeLabel(form.property_type)} · {form.units} unit{form.units === '1' ? '' : 's'}{form.max_guests ? ` · up to ${form.max_guests} guests` : ''}</p>
        {form.description && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{form.description}</p>}
      </ReviewBlock>
      <ReviewBlock title="Location & contact" onEdit={() => onJump('Location & contact')}>
        <p className="text-sm text-slate-800">{form.address}</p>
        <p className="text-xs text-slate-500">{form.city}, {form.state}{form.pincode ? ` ${form.pincode}` : ''}</p>
        <p className="text-xs text-slate-500 mt-1">Contact: {form.contact_name}{form.contact_role ? ` (${form.contact_role})` : ''} · {form.contact_phone}</p>
      </ReviewBlock>
      <ReviewBlock title={`Photos (${samples.length})`} onEdit={() => onJump('Photos')}>
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
      <ReviewBlock title="On Hoppity" onEdit={() => onJump('On Hoppity')}>
        <p className="text-sm text-slate-800">{offerTitles.join(' · ')}</p>
        {cats.length > 0 && <p className="text-xs text-slate-500 mt-1">{cats.join('  ')}</p>}
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">{form.offerings}</p>
      </ReviewBlock>
      <ReviewBlock title="Business" onEdit={() => onJump('Business')}>
        <p className="text-sm text-slate-800">{form.legal_name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          PAN {form.pan ? `•••••${form.pan.slice(-4)}` : panOnFile ? `•••••${panOnFile}` : '—'}{form.gstin ? ` · GSTIN ${form.gstin}` : ''}
        </p>
      </ReviewBlock>

      <label className="mt-5 flex gap-3 items-start cursor-pointer">
        <input type="checkbox" checked={form.agreed_terms} onChange={e => set('agreed_terms', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-violet-700" />
        <span className="text-sm text-slate-600 leading-relaxed">
          I agree to the <Link to="/partner-terms" className="font-semibold text-violet-700 underline">Hoppity partner terms</Link>,
          confirm I'm authorised to list this property, that the photos are of this property and that anyone identifiable in them agreed to appear.
        </span>
      </label>
      {errors.agreed_terms && <FieldError msg={errors.agreed_terms} />}
    </>
  )
}