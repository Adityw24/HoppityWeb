import { AlertCircle, Loader2, Upload, X } from 'lucide-react'

export const inputCls = (error) => `w-full rounded-xl border px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:ring-2 ${
  error ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 bg-white focus:border-violet-400 focus:ring-violet-100'
}`

export function StepTitle({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
      {sub && <p className="mt-1 text-sm leading-relaxed text-slate-500">{sub}</p>}
    </div>
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-bold text-slate-700">
        <span>{label}</span>
        {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
      {error && <FieldError msg={error} />}
    </label>
  )
}

export function FieldError({ msg }) {
  return (
    <span className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{msg}
    </span>
  )
}

export function IconInput({ Icon, value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`${inputCls()} pl-9`} />
    </div>
  )
}

export function ReviewBlock({ title, onEdit, children }) {
  return (
    <section className="mt-3 rounded-2xl border border-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-violet-700 hover:underline">Edit</button>
      </div>
      {children}
    </section>
  )
}

export function Stepper({ steps, current, skipFirst = false }) {
  const visibleSteps = skipFirst ? steps.slice(1) : steps
  const offset = skipFirst ? 1 : 0
  return (
    <ol className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-5 py-4 sm:px-7">
      {visibleSteps.map((step, index) => {
        const active = index + offset === current
        const complete = index + offset < current
        return (
          <li key={step} className="flex shrink-0 items-center gap-2">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              active ? 'bg-violet-700 text-white' : complete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>{complete ? '\u2713' : index + 1}</span>
            <span className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function Chips({ options, value, onChange, multi = true }) {
  const selected = multi ? value : value ? [value] : []
  const toggle = (id) => onChange(multi
    ? selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]
    : id)
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const active = selected.includes(option.id)
        return (
          <button key={option.id} type="button" onClick={() => toggle(option.id)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              active ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
            }`}>
            {option.emoji && <span className="mr-1.5">{option.emoji}</span>}{option.label}
          </button>
        )
      })}
    </div>
  )
}

export function SampleGrid({ samples, uploading, max, addLabel, fileRef, onFiles, onRemove }) {
  const full = samples.length + uploading >= max
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {samples.map(sample => (
        <div key={sample.id} className="relative aspect-[4/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {sample.kind === 'video'
            ? <video src={sample.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
            : <img src={sample.url} alt="" className="h-full w-full object-cover" />}
          <button type="button" onClick={() => onRemove(sample)} aria-label="Remove sample"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {Array.from({ length: uploading }, (_, index) => (
        <div key={`upload-${index}`} className="grid aspect-[4/5] place-items-center rounded-xl border border-violet-100 bg-violet-50">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
        </div>
      ))}
      {!full && (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="grid aspect-[4/5] place-items-center rounded-xl border-2 border-dashed border-violet-200 transition hover:border-violet-400 hover:bg-violet-50">
          <span className="px-3 text-center">
            <Upload className="mx-auto h-5 w-5 text-violet-600" />
            <span className="mt-1.5 block text-xs font-bold text-violet-700">{addLabel}</span>
            <span className="mt-0.5 block text-[11px] text-slate-400">{samples.length}/{max}</span>
          </span>
        </button>
      )}
      <input ref={fileRef} type="file" multiple className="hidden"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        onChange={e => onFiles(e.target.files)} />
    </div>
  )
}