import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  LogOut, Camera, MapPin, Calendar, Users, Star,
  Bookmark, MessageSquare, Heart, Clock, Edit3,
  Check, X, PenSquare, ArrowRight, Award, AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AVATAR_BUCKET, avatarPath } from '../lib/storage'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import Navbar from '../components/Navbar'

function badgeColors(tier) {
  switch (tier) {
    case 'gold':    return { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' }
    case 'silver':  return { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' }
    case 'special': return { bg: '#F7F1FF', border: '#7C3AED', text: '#5B21B6' }
    default:        return { bg: '#F9FAFB', border: '#D1D5DB', text: '#374151' }
  }
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

// Bookings has two independent state columns:
//   status         → confirmed | cancelled                     (the booking)
//   payment_status → pending | paid | failed | refunded | na    (the money)
// pay_mode (advance | full) decides how much of total_amount was due at checkout.
function bookingMoney(b) {
  const total     = Number(b.total_amount || 0)
  const advance   = Number(b.advance_amount || 0)
  const isAdvance = b.pay_mode === 'advance' && advance > 0
  const expected  = isAdvance ? advance : total                 // due at checkout
  const paid      = b.payment_status === 'paid' ? expected : 0  // actually collected
  return { total, isAdvance, expected, paid }
}

const PAY = {
  paid:     { label: 'Paid',            cls: 'text-green-700 bg-green-50 border-green-200' },
  pending:  { label: 'Payment pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  failed:   { label: 'Payment failed',  cls: 'text-red-700 bg-red-50 border-red-200' },
  refunded: { label: 'Refunded',        cls: 'text-slate-600 bg-slate-50 border-slate-200' },
  na:       { label: 'No payment due',  cls: 'text-slate-600 bg-slate-50 border-slate-200' },
}

// Every column we actually read off a Bookings row. No embeds — the Itineraries
// join is done as a second query and stitched on below, because PostgREST has to
// disambiguate three FKs on this table (Users, Tour_Schedules, Itineraries) and a
// failed inference returns `data: null` with an error nobody was reading.
const BOOKING_COLS = [
  'id',
  'status',
  'payment_status',
  'pay_mode',
  'total_amount',
  'advance_amount',
  'num_persons',
  'booking_date',
  'created_at',
  'razorpay_payment_id',
  'tour_id',
].join(',')

const TOUR_COLS = 'id,title,cover_image_url,category,location,duration_display,slug'

// PostgrestBuilder is a thenable, not a real Promise — `.catch()` on it is not
// dependable. Wrap it so a throwing RPC can never take the whole load down.
const safe = (builder, fallback = { data: null, error: null }) =>
  Promise.resolve(builder).then(
    (res) => res,
    (err) => ({ ...fallback, error: err })
  )

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, setProfile } = useProfile()   // shared with Navbar
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const avatarInputRef = useRef(null)

  const [tab, setTab] = useState(searchParams.get('tab') || 'trips')
  const [bookings, setBookings]     = useState([])
  const [savedTours, setSavedTours] = useState([])
  const [reviews, setReviews]       = useState([])
  const [badges, setBadges]         = useState([])
  const [myPosts, setMyPosts]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [loadErrors, setLoadErrors] = useState([])   // surfaced, not swallowed
  const [editing, setEditing]       = useState(false)
  const [editForm, setEditForm]     = useState({ full_name: '', bio: '', location: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [toast, setToast] = useState(null) // { msg, type: 'ok'|'err' }

  const goBack = () => {
    if (window.history.length > 2) navigate(-1)
    else navigate('/')
  }

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth')
  }, [user, authLoading, navigate])

  useEffect(() => { if (user) loadAll() }, [user])

  const loadAll = async () => {
    setLoading(true)
    setLoadErrors([])
    const uid = user.id
    const errors = []

    const settled = await Promise.allSettled([
      safe(supabase.from('Users').select('*').eq('user_id', uid).single()),

      // Trips — flat fetch keyed on user_id, exactly like the iOS client does it.
      safe(
        supabase.from('Bookings')
          .select(BOOKING_COLS)
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
      ),

      safe(
        supabase.from('Property_Saves')
          .select('tour_id')
          .eq('user_id', uid)
          .not('tour_id', 'is', null)
      ),

      safe(
        supabase.from('Tour_Reviews')
          .select('*, Itineraries(title,cover_image_url,slug)')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
      ),

      safe(supabase.rpc('get_my_badges', { p_user_id: uid }), { data: [] }),

      safe(
        supabase.from('Blog_Posts')
          .select('id,title,slug,status,category,cover_image_url,likes_count,comments_count,views_count,published_at,created_at,admin_notes')
          .eq('author_id', uid)
          .order('created_at', { ascending: false })
      ),
    ])

    // Normalise: allSettled wraps in { status, value }; safe() guarantees a
    // { data, error } shape on the happy path.
    const unwrap = (i, label) => {
      const s = settled[i]
      if (s.status === 'rejected') {
        console.error(`${label} threw:`, s.reason)
        errors.push(`${label}: ${s.reason?.message || 'request failed'}`)
        return null
      }
      const { data, error } = s.value || {}
      if (error) {
        console.error(`${label} failed:`, error)
        errors.push(`${label}: ${error.message || error.code || 'unknown error'}`)
        return null
      }
      return data
    }

    const prof        = unwrap(0, 'Profile')
    const rawBookings = unwrap(1, 'Bookings') || []
    const savedRows   = unwrap(2, 'Saved tours') || []
    const revRows     = unwrap(3, 'Reviews') || []
    const badgeRows   = unwrap(4, 'Badges') || []
    const postRows    = unwrap(5, 'Stories') || []

    // ── Hydrate tours for the bookings, one round-trip ─────────────────────
    // Bookings.tour_id is bigint, Itineraries.id is bigint, Bookings.id is uuid.
    // Key the lookup on String() so nothing rides on JS number coercion.
    let hydratedBookings = rawBookings.map(b => ({ ...b, Itineraries: null }))
    const tourIds = [...new Set(rawBookings.map(b => b.tour_id).filter(v => v !== null && v !== undefined))]

    if (tourIds.length > 0) {
      const { data: tours, error: tourErr } = await supabase
        .from('Itineraries')
        .select(TOUR_COLS)
        .in('id', tourIds)

      if (tourErr) {
        console.error('Itineraries hydrate failed:', tourErr)
        errors.push(`Tour details: ${tourErr.message || tourErr.code}`)
      } else {
        const byId = Object.fromEntries((tours || []).map(t => [String(t.id), t]))
        hydratedBookings = rawBookings.map(b => ({
          ...b,
          Itineraries: byId[String(b.tour_id)] || null,
        }))
      }
    }

    if (prof) {
      setProfile(prof)
      setEditForm({
        full_name: prof.full_name || '',
        bio:       prof.bio || '',
        location:  prof.location || '',
      })
    }
    setBookings(hydratedBookings)
    setReviews(revRows)
    setBadges(badgeRows)
    setMyPosts(postRows)

    // ── Saved tours ───────────────────────────────────────────────────────
    const savedIds = savedRows.map(s => s.tour_id)
    if (savedIds.length > 0) {
      const { data, error } = await supabase.from('Itineraries')
        .select('id,slug,title,location,cover_image_url,category,duration_display,price_per_person')
        .in('id', savedIds).eq('is_active', true)
      if (error) {
        console.error('Saved tours hydrate failed:', error)
        errors.push(`Saved tours: ${error.message || error.code}`)
      }
      setSavedTours(data || [])
    } else {
      setSavedTours([])
    }

    setLoadErrors(errors)
    setLoading(false)
  }

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error } = await supabase.from('Users').update({
        full_name: editForm.full_name.trim() || null,
        bio:       editForm.bio.trim() || null,
        location:  editForm.location.trim() || null,
      }).eq('user_id', user.id)
      if (error) throw error
      setProfile(p => ({ ...p, ...editForm }))
      setEditing(false)
      showToast('Profile updated ✓')
    } catch (e) {
      console.error('saveProfile:', e)
      showToast('Could not save profile. Try again.', 'err')
    } finally {
      setSavingProfile(false)
    }
  }

  const uploadAvatar = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'err'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Image too large. Please pick one under 10 MB.', 'err'); return
    }
    setAvatarUploading(true)
    try {
      const blob = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Could not read file'))
        reader.onload = e => {
          const img = new window.Image()
          img.onerror = () => reject(new Error('Could not decode image'))
          img.onload = () => {
            const srcSize = Math.min(img.width, img.height)
            const sx = (img.width  - srcSize) / 2
            const sy = (img.height - srcSize) / 2
            const out = Math.min(512, srcSize)   // never upscale

            const canvas = document.createElement('canvas')
            canvas.width = out
            canvas.height = out

            const ctx = canvas.getContext('2d')
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, out, out)

            canvas.toBlob(b => {
              if (!b) reject(new Error('Canvas produced empty blob'))
              else resolve(b)
            }, 'image/jpeg', 0.9)
          }
          img.src = e.target.result
        }
        reader.readAsDataURL(file)
      })

      const path = avatarPath(user.id)          // profilepic/<uid>.jpg

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (uploadError) throw uploadError

      const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      const publicUrl = `${pub.publicUrl}?t=${Date.now()}`

      const { error: dbError } = await supabase
        .from('Users')
        .update({ profile_pic: publicUrl })
        .eq('user_id', user.id)
      if (dbError) throw dbError

      setProfile(p => ({ ...p, profile_pic: publicUrl }))   // navbar updates instantly
      showToast('Photo updated ✓')
    } catch (e) {
      console.error('uploadAvatar:', e)
      showToast(e.message || 'Upload failed. Try again.', 'err')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return
    const { error } = await supabase.from('Bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) {
      console.error('cancelBooking:', error)
      showToast('Could not cancel booking. Try again.', 'err')
      return
    }
    // optimistic — no full reload needed
    setBookings(p => p.map(b => (b.id === id ? { ...b, status: 'cancelled' } : b)))
    showToast('Booking cancelled')
  }

  const deleteSaved = async (tourId) => {
    const { error } = await supabase.from('Property_Saves')
      .delete().eq('user_id', user.id).eq('tour_id', tourId)
    if (error) {
      console.error('deleteSaved:', error)
      showToast('Could not remove. Try again.', 'err')
      return
    }
    setSavedTours(p => p.filter(t => t.id !== tourId))
  }

  const deletePost = async (pid) => {
    if (!confirm('Delete this draft permanently?')) return
    const { error } = await supabase.from('Blog_Posts').delete().eq('id', pid)
    if (error) {
      console.error('deletePost:', error)
      showToast('Could not delete draft. Try again.', 'err')
      return
    }
    setMyPosts(p => p.filter(x => x.id !== pid))
  }

  if (authLoading || !user) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
    </div>
  )

  const displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Traveller'
  const initials = displayName.slice(0, 2).toUpperCase()

  // Users may not have a member_since column (or it may be null on older rows).
  // auth.users.created_at is always populated, so this can never come up empty.
  const memberSince = profile?.member_since || profile?.created_at || user?.created_at

  const tripsCount = bookings.length

  const TABS = [
    { id: 'trips',   label: 'Trips',    count: tripsCount },
    { id: 'saved',   label: 'Saved',    count: savedTours.length },
    { id: 'reviews', label: 'Reviews',  count: reviews.length },
    { id: 'stories', label: 'Stories',  count: myPosts.length },
    { id: 'badges',  label: 'Badges',   count: badges.length },
  ]

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-fade-in ${
          toast.type === 'err' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {toast.type === 'err' ? '✗' : '✓'} {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-5 flex justify-start">
          <Link to="/">
          <button
            type="button"
            aria-label="Back to home"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/70 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white hover:text-violet-700 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          </Link>
        </div>

        {/* Load errors — never fail silently again */}
        {loadErrors.length > 0 && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-800">Some data couldn't be loaded</p>
                <ul className="mt-1 space-y-0.5">
                  {loadErrors.map((e, i) => (
                    <li key={i} className="text-xs text-red-700 break-words">• {e}</li>
                  ))}
                </ul>
                <button onClick={loadAll} className="mt-2 text-xs font-bold text-red-800 underline cursor-pointer">
                  Retry
                </button>
              </div>
              <button onClick={() => setLoadErrors([])} className="text-red-400 hover:text-red-600 cursor-pointer flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-violet-100 p-6 mb-5 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                {profile?.profile_pic
                  ? <img src={profile.profile_pic} alt="" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <button onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}
                className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-violet-700 rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-violet-800 active:scale-95 transition shadow-md disabled:opacity-50"
                title="Change profile photo">
                {avatarUploading
                  ? <div className="w-3.5 h-3.5 border border-white/50 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-4 h-4 text-white" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2.5">
                  <input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full text-base font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400" />
                  <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Location (e.g. Mumbai, India)"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400" />
                  <textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Short bio…" rows={3} maxLength={200}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-violet-400 resize-none" />
                  <div className="flex gap-2">
                    <button onClick={saveProfile} disabled={savingProfile}
                      className="flex items-center gap-1.5 bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-violet-800 transition cursor-pointer disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" />{savingProfile ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-200 transition cursor-pointer">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900">{displayName}</h2>
                    {profile?.is_creator && <span className="bg-violet-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">★ CREATOR</span>}
                  </div>
                  {profile?.location && (
                    <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3 h-3" />{profile.location}
                    </p>
                  )}

                  {profile?.bio && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{profile.bio}</p>
                  )}

                  {memberSince && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      Member since {new Date(memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </>
              )}
            </div>
            {!editing && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-700 bg-slate-50 border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-xl transition cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-50">
            {[
              { label: 'Trips',     v: tripsCount },
              { label: 'Reviews',   v: profile?.reviews_count  || reviews.length },
              { label: 'Saved',     v: profile?.wishlist_count || savedTours.length },
              { label: 'Followers', v: profile?.followers_count || 0 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black text-slate-900">{s.v}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Write CTA */}
        <Link to="/write" className="flex items-center gap-3 bg-violet-700 text-white rounded-2xl px-5 py-4 mb-5 hover:bg-violet-800 transition group shadow-sm">
          <PenSquare className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Write a story</p>
            <p className="text-violet-200 text-xs">Share your travel experience with the community</p>
          </div>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition flex-shrink-0" />
        </Link>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-violet-100 p-1 mb-5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                tab === t.id ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white border border-violet-100 animate-pulse" />)}</div>
        ) : (
          <>
            {/* Trips — every booking this user made, newest first */}
            {tab === 'trips' && (bookings.length === 0
              ? <EmptyState icon="📅" title="No trips yet" sub="Book a tour and it shows up here" cta="/itineraries" ctaLabel="Browse tours" />
              : <div className="space-y-3">{bookings.map(b => <BookingCard key={b.id} booking={b} onCancel={cancelBooking} />)}</div>)}

            {tab === 'saved'   && (savedTours.length === 0
              ? <EmptyState icon="🔖" title="No saved tours" sub="Bookmark tours from the listing to save them here" cta="/itineraries" ctaLabel="Browse tours" />
              : <div className="grid gap-3 sm:grid-cols-2">{savedTours.map(t => <SavedCard key={t.id} tour={t} onRemove={() => deleteSaved(t.id)} />)}</div>)}
            {tab === 'reviews' && (reviews.length === 0
              ? <EmptyState icon="⭐" title="No reviews yet" sub="Complete a tour to leave a verified review" cta="/itineraries" ctaLabel="Browse tours" />
              : <div className="space-y-3">{reviews.map(r => <ReviewCard key={r.id} review={r} />)}</div>)}
            {tab === 'stories' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Your Stories</h3>
                  <Link to="/write" className="flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition">
                    <PenSquare className="w-3.5 h-3.5" /> New story
                  </Link>
                </div>
                {myPosts.length === 0
                  ? <EmptyState icon="✍️" title="No stories yet" sub="Write your first travel story" cta="/write" ctaLabel="Write a story" />
                  : <div className="space-y-3">{myPosts.map(p => <StoryCard key={p.id} post={p} onDelete={() => deletePost(p.id)} />)}</div>}
              </>
            )}
            {tab === 'badges' && <BadgesSection badges={badges} />}
          </>
        )}
      </div>
    </div>
  )
}

function BookingCard({ booking: b, onCancel }) {
  const t = b.Itineraries
  const { total, isAdvance, expected, paid } = bookingMoney(b)
  const pay = PAY[b.payment_status] || PAY.pending
  const isCancelled = b.status === 'cancelled'
  const isFailed    = b.payment_status === 'failed'

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isFailed ? 'border-red-200' : 'border-violet-100'} ${isCancelled ? 'opacity-70' : ''}`}>
      <div className="flex gap-3 p-4">
        {t?.cover_image_url
          ? <img src={t.cover_image_url} alt="" className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-20 h-20 rounded-xl bg-violet-50 flex items-center justify-center text-2xl flex-shrink-0">🏔️</div>}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* Tour may be missing if the itinerary was deleted — don't render a dead link */}
            {t?.slug ? (
              <Link to={`/itinerary/${t.slug}`} className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-violet-700">
                {t.title || 'Tour'}
              </Link>
            ) : (
              <span className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                {t?.title || 'Tour'}
              </span>
            )}
            {isCancelled && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-red-600 bg-red-50">cancelled</span>
            )}
          </div>

          {t?.location && (
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />{t.location}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
            {b.booking_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(b.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {t?.duration_display && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.duration_display}</span>}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />{b.num_persons} person{b.num_persons !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Money row */}
      <div className="border-t border-slate-50 px-4 py-3 flex items-center justify-between gap-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${pay.cls}`}>{pay.label}</span>
        <div className="text-right leading-tight">
          <p className={`text-sm font-black ${b.payment_status === 'paid' ? 'text-slate-900' : isFailed ? 'text-red-600' : 'text-slate-500'}`}>
            {inr(b.payment_status === 'paid' ? paid : expected)}
          </p>
          <p className="text-[11px] text-slate-400">
            {b.payment_status === 'paid'
              ? (isAdvance ? `advance of ${inr(total)}` : 'paid in full')
              : (isAdvance ? 'advance due' : 'due')}
          </p>
        </div>
      </div>

    {/*  {!isCancelled && (
        <div className="border-t border-slate-50 px-4 py-2.5 flex justify-end">
          <button onClick={() => onCancel(b.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer">
            Cancel booking
          </button>
        </div>
      )} */}
    </div>
  )
}

function SavedCard({ tour: t, onRemove }) {
  return (
    <div className="relative bg-white rounded-2xl border border-violet-100 overflow-hidden hover:shadow-md transition">
      <button onClick={onRemove} className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shadow-sm">
        <X className="w-3.5 h-3.5" />
      </button>
      <Link to={`/itinerary/${t.slug}`} className="flex gap-3 p-3">
        {t.cover_image_url && <img src={t.cover_image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{t.title}</h4>
          <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><MapPin className="w-2.5 h-2.5" />{t.location}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-400">{t.duration_display}</span>
            <span className="text-xs font-bold text-violet-700">{t.price_per_person ? inr(t.price_per_person) : 'On Request'}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}

function ReviewCard({ review: r }) {
  const t = r.Itineraries
  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-4">
      <div className="flex items-start gap-3">
        {t?.cover_image_url && <img src={t.cover_image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{t?.title||'Tour'}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex text-yellow-400 text-xs">{[...Array(5)].map((_,i)=><span key={i}>{i<r.rating?'★':'☆'}</span>)}</div>
            <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
          </div>
        </div>
      </div>
      {r.review_text && <p className="text-sm text-slate-600 mt-3 leading-relaxed">{r.review_text}</p>}
    </div>
  )
}

function StoryCard({ post: p, onDelete }) {
  const S = { draft:{l:'Draft',c:'bg-slate-100 text-slate-600'}, pending:{l:'⏳ Under review',c:'bg-amber-100 text-amber-700'}, approved:{l:'✓ Published',c:'bg-green-100 text-green-700'}, on_hold:{l:'⚠ On hold',c:'bg-orange-100 text-orange-700'}, rejected:{l:'✗ Not approved',c:'bg-red-100 text-red-700'} }
  const s = S[p.status] || S.draft
  return (
    <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
      <div className="flex gap-3 p-4">
        {p.cover_image_url
          ? <img src={p.cover_image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center text-2xl flex-shrink-0">📝</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug flex-1">{p.title}</h4>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.c}`}>{s.l}</span>
          </div>
          {p.category && <span className="text-xs text-violet-600 font-semibold">{p.category}</span>}
          {p.admin_notes && (p.status==='on_hold'||p.status==='rejected') && (
            <p className="text-xs text-orange-700 mt-1 bg-orange-50 rounded-lg px-2 py-1">Feedback: {p.admin_notes}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            {p.views_count>0 && <span>{p.views_count} views</span>}
            {p.likes_count>0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3"/>{p.likes_count}</span>}
            {p.comments_count>0 && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3"/>{p.comments_count}</span>}
            <span>{new Date(p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-50 px-4 pb-3 pt-2 flex items-center gap-3">
        {(p.status==='draft'||p.status==='on_hold') && <Link to={`/write/${p.id}`} className="flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"><Edit3 className="w-3 h-3"/>Edit</Link>}
        {p.status==='approved' && <Link to={`/blog/${p.slug}`} className="flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900"><ArrowRight className="w-3 h-3"/>Read live</Link>}
        {p.status==='draft' && <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 cursor-pointer ml-auto">Delete</button>}
      </div>
    </div>
  )
}

function BadgesSection({ badges }) {
  if (!badges.length) return (
    <div className="bg-white rounded-2xl border border-violet-100 p-8 text-center">
      <div className="text-5xl mb-4">🏅</div>
      <h3 className="font-bold text-slate-900 mb-2">No badges yet</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">Earn badges by saving tours, completing bookings, writing reviews, publishing stories, and growing your following.</p>
      <Link to="/itineraries" className="inline-block mt-5 text-sm font-semibold text-violet-700 hover:underline">Start exploring →</Link>
    </div>
  )
  const groups = {}
  badges.forEach(b => { if(!groups[b.category]) groups[b.category]=[]; groups[b.category].push(b) })
  const LABELS = { explorer:'🧭 Explorer', traveller:'✈️ Traveller', reviewer:'⭐ Reviewer', storyteller:'📖 Storyteller', social:'💬 Social', creator:'🎬 Creator' }
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">You've earned <strong className="text-violet-700">{badges.length}</strong> badge{badges.length!==1?'s':''}.</p>
      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat} className="bg-white rounded-2xl border border-violet-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{LABELS[cat]||cat}</p>
          <div className="flex flex-wrap gap-2">
            {list.sort((a,b)=>a.sort_order-b.sort_order).map(badge => {
              const {bg,border,text} = badgeColors(badge.tier)
              return (
                <div key={badge.key} title={badge.description}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold cursor-default hover:scale-105 transition"
                  style={{background:bg, border:`1.5px solid ${border}`, color:text}}>
                  <span className="text-base">{badge.emoji}</span>
                  <span>{badge.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, sub, cta, ctaLabel }) {
  return (
    <div className="text-center py-14 bg-white rounded-2xl border border-violet-100">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-bold text-slate-900">{title}</h3>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      {cta && <Link to={cta} className="inline-block mt-5 text-sm font-bold text-violet-700 hover:underline">{ctaLabel} →</Link>}
    </div>
  )
}