import { useEffect, useRef, useState } from 'react'
import { X, UploadCloud, Film, Loader2, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  REEL_BUCKET, REEL_MAX_MB, REEL_MAX_SECONDS, REEL_TYPES,
  reelVideoPath, reelThumbPath, publicUrl, parseHashtags,
} from '../lib/reels'

const EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }

// Reads duration + grabs a JPEG frame for the thumbnail. Thumbnail is best-effort:
// some codecs can't be decoded in-browser, in which case we upload without one.
function probeVideo(url) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'; v.muted = true; v.playsInline = true; v.src = url
    v.onerror = () => reject(new Error('This video format can\'t be read. Try an MP4.'))
    v.onloadedmetadata = () => {
      const duration = v.duration
      v.currentTime = Math.min(0.5, duration / 2 || 0)
    }
    v.onseeked = () => {
      const w = v.videoWidth, h = v.videoHeight
      const scale = Math.min(1, 720 / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale)
      try {
        canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(b => resolve({ duration: v.duration, thumb: b }), 'image/jpeg', 0.85)
      } catch { resolve({ duration: v.duration, thumb: null }) }
    }
  })
}

export default function ReelUploadModal({ user, onClose, onUploaded }) {
  const fileRef = useRef(null)
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [meta, setMeta]       = useState(null)   // { duration, thumb }
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [tourId, setTourId]   = useState('')
  const [tours, setTours]     = useState([])
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    supabase.from('Itineraries').select('id,title').eq('is_active', true).order('title').limit(300)
      .then(({ data }) => setTours(data || []), () => {})
  }, [])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const pick = async (f) => {
    setError('')
    if (!f) return
    if (!REEL_TYPES.includes(f.type)) { setError('Please choose an MP4, MOV or WebM video.'); return }
    if (f.size > REEL_MAX_MB * 1024 * 1024) { setError(`Video is too large. Keep it under ${REEL_MAX_MB} MB.`); return }
    const url = URL.createObjectURL(f)
    try {
      const m = await probeVideo(url)
      if (m.duration > REEL_MAX_SECONDS + 0.5) {
        URL.revokeObjectURL(url)
        setError(`Reels can be up to ${REEL_MAX_SECONDS} seconds. This one is ${Math.round(m.duration)}s.`)
        return
      }
      if (preview) URL.revokeObjectURL(preview)
      setFile(f); setPreview(url); setMeta(m)
    } catch (e) {
      URL.revokeObjectURL(url)
      setError(e.message || 'Could not read this video.')
    }
  }

  const submit = async () => {
    if (!file || busy) return
    setBusy(true); setError('')
    const reelId = crypto.randomUUID()
    const vPath  = reelVideoPath(user.id, reelId, EXT[file.type] || 'mp4')
    const tPath  = meta?.thumb ? reelThumbPath(user.id, reelId) : null
    const uploaded = []

    try {
      const up = await supabase.storage.from(REEL_BUCKET)
        .upload(vPath, file, { contentType: file.type, cacheControl: '31536000', upsert: false })
      if (up.error) throw up.error
      uploaded.push(vPath)

      if (tPath) {
        const tu = await supabase.storage.from(REEL_BUCKET)
          .upload(tPath, meta.thumb, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
        if (!tu.error) uploaded.push(tPath)
      }

      // Maps onto the existing public."Reels" columns. Both FKs (creator_id and
      // user_id) are set so the on_reel_change trigger and older clients see the owner.
      const hasThumb = uploaded.includes(tPath)
      const row = {
        id: reelId,
        creator_id: user.id,
        user_id: user.id,
        video_url: publicUrl(vPath),
        video_path: vPath,
        cover_url: hasThumb ? publicUrl(tPath) : null,
        thumbnail_path: hasThumb ? tPath : null,
        caption: caption.trim() || null,
        location: location.trim() || null,
        hashtags: parseHashtags(caption),
        tour_id: tourId ? Number(tourId) : null,
        linked_entity_type: tourId ? 'itinerary' : null,
        linked_entity_id:   tourId ? String(tourId) : null,
        duration_seconds: Math.round(meta.duration * 10) / 10,
      }
      const { error: dbErr } = await supabase.from('Reels').insert(row)
      if (dbErr) throw dbErr

      onUploaded?.({ ...row, likes_count: 0, comments_count: 0, views_count: 0, created_at: new Date().toISOString() })
      onClose()
    } catch (e) {
      console.error('reel upload:', e)
      if (uploaded.length) await supabase.storage.from(REEL_BUCKET).remove(uploaded).catch(() => {})
      const msg = /row-level security|policy/i.test(e.message || '')
        ? 'Only approved creators can post reels.'
        : e.message || 'Upload failed. Try again.'
      setError(msg)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div role="dialog" aria-label="Upload a reel"
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-black text-slate-900">New reel</h2>
          <button onClick={onClose} disabled={busy} aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 sm:grid-cols-[240px_1fr]">
          {/* Picker / preview */}
          <div>
            {preview ? (
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-2xl bg-black">
                <video src={preview} controls playsInline muted loop className="h-full w-full object-cover" />
                {!busy && (
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute left-2 top-2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur cursor-pointer hover:bg-black/75">
                    Change
                  </button>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files?.[0]) }}
                className="mx-auto flex aspect-[9/16] w-full max-w-[240px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 px-4 text-center transition hover:border-violet-400 hover:bg-violet-50 cursor-pointer">
                <UploadCloud className="h-9 w-9 text-violet-500" />
                <span className="text-sm font-bold text-slate-800">Select a video</span>
                <span className="text-xs text-slate-500">Vertical 9:16 works best · MP4, MOV or WebM · up to {REEL_MAX_SECONDS}s / {REEL_MAX_MB} MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden"
              onChange={e => { pick(e.target.files?.[0]); e.target.value = '' }} />
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Caption</label>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} maxLength={500} rows={5}
                placeholder="Tell people where this is and why they should go…"
                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400" />
              <p className="mt-1 text-right text-[11px] text-slate-400">{caption.length}/500</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Location <span className="font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <input value={location} onChange={e => setLocation(e.target.value)} maxLength={80}
                placeholder="e.g. Spiti Valley, Himachal Pradesh"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400" />
              <p className="mt-1 text-[11px] text-slate-400">Add #hashtags in the caption and they're saved as tags.</p>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <MapPin className="h-3 w-3" /> Link a tour <span className="font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <select value={tourId} onChange={e => setTourId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-violet-400">
                <option value="">No linked tour</option>
                {tours.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">Viewers get a tap-through to book it.</p>
            </div>

            {file && (
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <Film className="h-3.5 w-3.5" />
                <span className="truncate">{file.name}</span>
                <span>· {(file.size / 1024 / 1024).toFixed(1)} MB · {Math.round(meta?.duration || 0)}s</span>
              </p>
            )}

            {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} disabled={busy}
            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer">
            Cancel
          </button>
          <button onClick={submit} disabled={!file || busy}
            className="flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-40 cursor-pointer">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Uploading…' : 'Post reel'}
          </button>
        </div>
      </div>
    </div>
  )
}