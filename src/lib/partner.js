import { supabase } from './supabase'

// ── Roles, as described in the Social Travel doc (section 2) ────────────────
export const ROLES = {
  creator: {
    id: 'creator',
    title: 'Creator',
    emoji: '🎬',
    who: 'Travellers, influencers and photographers who make content about trips.',
    publish: 'Reels, carousels, blogs and itinerary stories linked to live Hoppity trips.',
    earn: 'A commission on every booking that comes from your content or referral link.',
  },
  curator: {
    id: 'curator',
    title: 'Curator',
    emoji: '🧭',
    who: 'Trip leaders, DMCs and small operators who design and run their own itineraries.',
    publish: 'Bookable itineraries and packages with fixed departures, plus the content that sells them.',
    earn: 'Paid your B2B price on every confirmed booking.',
  },
  property: {
    id: 'property',
    title: 'Property partner',
    emoji: '🏡',
    who: 'Signature stays and retreats.',
    publish: 'Special packages with dated availability — retreats, forest walks, seasonal programmes.',
    earn: 'Paid your B2B rate (or agreed commission) on every confirmed booking.',
  },
}

export const NEEDS_BUSINESS = (roles) => roles.some(r => r === 'curator' || r === 'property')

export const SAMPLE_MIN = 3
export const SAMPLE_MAX = 5
const IMAGE_MAX_BYTES = 15 * 1024 * 1024
const VIDEO_MAX_BYTES = 50 * 1024 * 1024 // standard upload; big Studio uploads will use resumable (TUS)
const IMAGE_LONG_EDGE = 1440
export const MEDIA_BUCKET = 'partner-media'

export const HANDLE_RE = /^[a-z0-9_.]{3,30}$/
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
export const GSTIN_RE = /^[0-9]{2}[A-Z0-9]{13}$/

// RPC exceptions → words a human can act on
const ERRORS = {
  not_authenticated: 'Please sign in again.',
  invalid_role: 'Pick at least one partner type.',
  role_already_granted: 'You already have this role.',
  application_already_open: 'You already have an application for this role under review.',
  display_name_required: 'Add a display name.',
  invalid_handle: 'Handle must be 3–30 characters: lowercase letters, numbers, dot or underscore.',
  handle_taken: 'That handle is taken — try another.',
  bio_too_long: 'Bio must be under 500 characters.',
  terms_not_accepted: 'Please accept the partner terms.',
  need_3_to_5_samples: `Upload ${SAMPLE_MIN} to ${SAMPLE_MAX} sample photos or videos.`,
  sample_not_owned: 'One of the samples could not be verified. Remove it and upload again.',
  legal_name_required: 'Add the legal entity name.',
  address_required: 'Add the registered address.',
  offerings_required: 'Tell us which itineraries or packages you run.',
  invalid_pan: 'PAN should look like ABCDE1234F.',
  invalid_gstin: 'GSTIN should be 15 characters, e.g. 23ABCDE1234F1Z5.',
  application_not_found: 'Application not found.',
  application_closed: 'This application has already been reviewed.',
}
export function friendlyError(err) {
  const msg = err?.message || String(err || '')
  const key = Object.keys(ERRORS).find(k => msg.includes(k))
  return key ? ERRORS[key] : (msg || 'Something went wrong. Try again.')
}

export const publicUrl = (path) =>
  path ? supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl : null

// ── Load what this user already has ─────────────────────────────────────────
export async function loadPartnerStatus(uid) {
  const [roles, apps] = await Promise.all([
    supabase.from('user_roles').select('role,verified_at,suspended_at').eq('user_id', uid),
    supabase.from('partner_applications')
      .select('id,role,status,admin_notes,form_data,sample_media_ids,created_at,reviewed_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false }),
  ])
  if (roles.error) throw roles.error
  if (apps.error) throw apps.error
  return { roles: roles.data || [], applications: apps.data || [] }
}

export async function loadSamples(ids) {
  if (!ids?.length) return []
  const { data, error } = await supabase.from('media_assets')
    .select('id,kind,storage_path,mime_type').in('id', ids)
  if (error) throw error
  const byId = Object.fromEntries((data || []).map(m => [m.id, m]))
  return ids.map(id => byId[id]).filter(Boolean).map(m => ({
    id: m.id, kind: m.kind, path: m.storage_path, url: publicUrl(m.storage_path),
    name: m.storage_path?.split('/').pop(), fresh: false,
  }))
}

// ── Sample upload: media_assets row first, then the file at {uid}/{id}.{ext} ─
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this image')) }
    img.onload = () => {
      const scale = Math.min(1, IMAGE_LONG_EDGE / Math.max(img.width, img.height)) // never upscale
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(b => (b ? resolve({ blob: b, width: w, height: h }) : reject(new Error('Image conversion failed'))),
        'image/jpeg', 0.88)
    }
    img.src = url
  })
}

function partnerFolderName(displayName) {
  const folder = String(displayName || '')
    .normalize('NFKC')
    .trim()
    .replace(/[\\/]/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
  return folder && folder !== '.' && folder !== '..' ? folder : 'partner'
}

export async function uploadSample(uid, displayName, file) {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  if (!isVideo && !isImage) throw new Error('Only photos or videos can be uploaded.')
  if (isImage && file.size > IMAGE_MAX_BYTES) throw new Error('Photos must be under 15 MB.')
  if (isVideo && file.size > VIDEO_MAX_BYTES) throw new Error('Sample videos must be under 50 MB here. Share a link to longer work in your portfolio.')

  let body = file, contentType = file.type, ext
  if (isImage) {
    const r = await resizeImage(file)
    body = r.blob; contentType = 'image/jpeg'; ext = 'jpg'
  } else {
    ext = (file.name.split('.').pop() || 'mp4').toLowerCase()
    if (!['mp4', 'mov', 'm4v'].includes(ext)) ext = 'mp4'
  }

  const id = crypto.randomUUID()
  const path = `${uid}/${partnerFolderName(displayName)}/${id}.${ext}`

  const { error: rowErr } = await supabase.from('media_assets').insert({
    id, kind: isVideo ? 'video' : 'image', storage_path: path, mime_type: contentType, size_bytes: body.size,
  })
  if (rowErr) throw rowErr

  const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET)
    .upload(path, body, { contentType, upsert: false })
  if (upErr) {
    await supabase.from('media_assets').delete().eq('id', id)   // don't leave an orphan row
    throw upErr
  }
  return { id, kind: isVideo ? 'video' : 'image', path, url: publicUrl(path), name: file.name, fresh: true }
}

// Deletes only samples uploaded in this session; samples already attached to a
// submitted application are just dropped from the list (the old row stays valid).
export async function removeSample(sample) {
  if (!sample.fresh) return
  await supabase.from('media_assets').delete().eq('id', sample.id)
  if (sample.path) await supabase.storage.from(MEDIA_BUCKET).remove([sample.path])
}

// ── Submit: one application per role (each role is approved separately) ────
export function buildForm(f) {
  return {
    display_name: f.display_name.trim(),
    handle: f.handle.trim().toLowerCase(),
    bio: f.bio.trim(),
    city: f.city.trim(),
    social_links: Object.fromEntries(Object.entries(f.social).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()])),
    portfolio: f.portfolio.trim(),
    past_trips: f.past_trips.trim(),
    agreed_terms: f.agreed_terms,
    legal_name: f.legal_name.trim(),
    pan: f.pan.replace(/\s/g, '').toUpperCase(),
    gstin: f.gstin.trim().toUpperCase(),
    address: f.address.trim(),
    offerings: f.offerings.trim(),
  }
}

export async function submitApplications(roles, form, sampleIds) {
  const results = []
  for (const role of roles) {
    const { error } = await supabase.rpc('apply_partner_role', {
      p_role: role, p_form: form, p_sample_media_ids: sampleIds,
    })
    results.push({ role, error: error ? friendlyError(error) : null })
  }
  return results
}

export async function resubmitApplication(applicationId, form, sampleIds) {
  const { error } = await supabase.rpc('update_partner_application', {
    p_application_id: applicationId, p_form: form, p_sample_media_ids: sampleIds,
  })
  if (error) throw new Error(friendlyError(error))
}