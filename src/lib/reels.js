import { supabase } from './supabase'

export const REEL_BUCKET = 'reels'
export const REEL_MAX_MB = 100
export const REEL_MAX_SECONDS = 90
export const REEL_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

// Columns read off public."Reels". The table predates this feature, so a few
// names differ from what the UI wants — normalizeReel() below maps them.
export const REEL_COLS = [
  'id', 'creator_id', 'user_id', 'video_url', 'video_path',
  'cover_url', 'image_url', 'thumbnail_path',
  'caption', 'location', 'hashtags',
  'tour_id', 'linked_entity_type', 'linked_entity_id',
  'duration_seconds', 'likes_count', 'comments_count', 'views_count',
  'created_at',
].join(',')

// Reels rows are matched to a creator by either FK (older rows may only have user_id).
export const byCreator = (uid) => `creator_id.eq.${uid},user_id.eq.${uid}`

const PUBLIC_MARK = `/storage/v1/object/public/${REEL_BUCKET}/`
const pathFromUrl = (url) => {
  const i = url ? url.indexOf(PUBLIC_MARK) : -1
  return i < 0 ? null : decodeURIComponent(url.slice(i + PUBLIC_MARK.length).split('?')[0])
}

export function normalizeReel(r) {
  return {
    ...r,
    creator_id:     r.creator_id || r.user_id,
    thumbnail_url:  r.cover_url || r.image_url || null,
    video_path:     r.video_path || pathFromUrl(r.video_url),
    thumbnail_path: r.thumbnail_path || pathFromUrl(r.cover_url),
    likes_count:    r.likes_count ?? 0,
    comments_count: r.comments_count ?? 0,
    views_count:    r.views_count ?? 0,
  }
}

export const parseHashtags = (text) =>
  [...new Set((String(text || '').match(/#[\p{L}\p{N}_]+/gu) || []).map(t => t.slice(1).toLowerCase()))].slice(0, 20)

export const reelVideoPath = (uid, reelId, ext) => `${uid}/${reelId}.${ext}`
export const reelThumbPath = (uid, reelId) => `${uid}/${reelId}.jpg`

export const publicUrl = (path) =>
  supabase.storage.from(REEL_BUCKET).getPublicUrl(path).data.publicUrl

export const fmtCount = (n) => {
  n = Number(n || 0)
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function timeAgo(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'now'
  const m = Math.floor(s / 60);  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60);  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24);  if (d < 7)  return `${d}d`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Flat lookups, stitched in JS — same approach as the profile page, so we never
// depend on PostgREST FK inference.
export async function fetchAuthors(ids) {
  const uniq = [...new Set(ids.filter(Boolean))]
  if (!uniq.length) return {}
  const { data } = await supabase
    .from('Users')
    .select('user_id,full_name,username,profile_pic')
    .in('user_id', uniq)
  return Object.fromEntries((data || []).map(u => [u.user_id, u]))
}

export async function hydrateReels(rawRows, uid) {
  if (!rawRows.length) return []
  const rows = rawRows.map(normalizeReel)
  const tourIds = [...new Set(rows.map(r => r.tour_id).filter(v => v != null))]
  const [authors, likes, tours] = await Promise.all([
    fetchAuthors(rows.map(r => r.creator_id)),
    uid
      ? supabase.from('Reel_Likes').select('reel_id').eq('user_id', uid).in('reel_id', rows.map(r => r.id))
      : Promise.resolve({ data: [] }),
    tourIds.length
      ? supabase.from('Itineraries').select('id,title,slug').in('id', tourIds)
      : Promise.resolve({ data: [] }),
  ])
  const liked  = new Set((likes.data || []).map(l => l.reel_id))
  const tourBy = Object.fromEntries((tours.data || []).map(t => [String(t.id), t]))
  return rows.map(r => ({
    ...r,
    creator: authors[r.creator_id] || null,
    tour:    r.tour_id != null ? tourBy[String(r.tour_id)] || null : null,
    liked:   liked.has(r.id),
  }))
}

// Like / unlike. Counters are maintained by DB triggers, so the client only
// writes the join row. Throws on failure so callers can roll back.
export async function setReelLiked(reelId, uid, like) {
  const q = like
    ? supabase.from('Reel_Likes').insert({ reel_id: reelId, user_id: uid })
    : supabase.from('Reel_Likes').delete().eq('reel_id', reelId).eq('user_id', uid)
  const { error } = await q
  // 23505 = already liked (double-tap race) — treat as success
  if (error && error.code !== '23505') throw error
}

export async function fetchCanPostReels(uid) {
  if (!uid) return false
  try {
    const [roles, u, admin] = await Promise.all([
      supabase.from('user_roles').select('role,suspended_at').eq('user_id', uid),
      supabase.from('Users').select('is_creator').eq('user_id', uid).maybeSingle(),
      supabase.from('admins').select('user_id').eq('user_id', uid).maybeSingle(),
    ])
    const verified = (roles.data || []).some(r => r.role === 'creator' && !r.suspended_at)
    return verified || !!u.data?.is_creator || !!admin.data
  } catch {
    return false
  }
}

export async function deleteReel(reel) {
  const { error } = await supabase.from('Reels').delete().eq('id', reel.id)
  if (error) throw error
  const paths = [reel.video_path, reel.thumbnail_path].filter(Boolean)
  if (paths.length) await supabase.storage.from(REEL_BUCKET).remove(paths)
}