import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  LogOut, Camera, MapPin, Calendar, Users, Star,
  Bookmark, MessageSquare, Heart, Clock, Edit3,
  Check, X, PenSquare, ArrowRight, Award
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'

function badgeColors(tier) {
  switch (tier) {
    case 'gold':    return { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' }
    case 'silver':  return { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' }
    case 'special': return { bg: '#F7F1FF', border: '#7C3AED', text: '#5B21B6' }
    default:        return { bg: '#F9FAFB', border: '#D1D5DB', text: '#374151' }
  }
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const avatarInputRef = useRef(null)

  const [tab, setTab] = useState(searchParams.get('tab') || 'trips')
  const [profile, setProfile]       = useState(null)
  const [bookings, setBookings]     = useState([])
  const [savedTours, setSavedTours] = useState([])
  const [reviews, setReviews]       = useState([])
  const [badges, setBadges]         = useState([])
  const [myPosts, setMyPosts]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(false)
  const [editForm, setEditForm]     = useState({ full_name: '', bio: '', location: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth')
  }, [user, authLoading, navigate])

  useEffect(() => { if (user) loadAll() }, [user])

  const loadAll = async () => {
    setLoading(true)
    const uid = user.id
    const [profRes, bookRes, savedRes, revRes, badgeRes, postsRes] = await Promise.all([
      supabase.from('Users').select('*').eq('user_id', uid).single(),
      supabase.from('Bookings')
        .select('*, Itineraries(id,title,cover_image_url,category,location,duration_display,slug)')
        .eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('Property_Saves').select('tour_id').eq('user_id', uid).not('tour_id', 'is', null),
      supabase.from('Tour_Reviews')
        .select('*, Itineraries(title,cover_image_url,slug)')
        .eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.rpc('get_my_badges', { p_user_id: uid }).catch(() => ({ data: [] })),
      supabase.from('Blog_Posts')
        .select('id,title,slug,status,category,cover_image_url,likes_count,comments_count,views_count,published_at,created_at,admin_notes')
        .eq('author_id', uid).order('created_at', { ascending: false }),
    ])
    const prof = profRes.data
    setProfile(prof)
    setEditForm({ full_name: prof?.full_name || '', bio: prof?.bio || '', location: prof?.location || '' })
    setBookings(bookRes.data || [])
    setReviews(revRes.data || [])
    setBadges(badgeRes.data || [])
    setMyPosts(postsRes.data || [])
    const ids = (savedRes.data || []).map(s => s.tour_id)
    if (ids.length > 0) {
      const { data } = await supabase.from('Itineraries')
        .select('id,slug,title,location,cover_image_url,category,duration_display,price_per_person')
        .in('id', ids).eq('is_active', true)
      setSavedTours(data || [])
    } else {
      setSavedTours([])
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    await supabase.from('Users').update({
      full_name: editForm.full_name.trim() || null,
      bio:       editForm.bio.trim() || null,
      location:  editForm.location.trim() || null,
    }).eq('user_id', user.id)
    setProfile(p => ({ ...p, ...editForm }))
    setEditing(false)
    setSavingProfile(false)
  }

  const uploadAvatar = async (file) => {
    if (!file) return
    setAvatarUploading(true)
    const blob = await new Promise(res => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new window.Image()
        img.onload = () => {
          const s = Math.min(400, img.width, img.height)
          const c = document.createElement('canvas')
          c.width = s; c.height = s
          c.getContext('2d').drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, s, s)
          c.toBlob(b => res(b), 'image/jpeg', 0.82)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
    const path = `avatars/${user.id}.jpg`
    await supabase.storage.from('user-media').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    const url = `${SUPABASE_URL}/storage/v1/object/public/user-media/${path}?t=${Date.now()}`
    await supabase.from('Users').update({ profile_pic: url }).eq('user_id', user.id)
    setProfile(p => ({ ...p, profile_pic: url }))
    setAvatarUploading(false)
  }

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return
    await supabase.from('Bookings').update({ status: 'cancelled' }).eq('id', id)
    loadAll()
  }

  const deleteSaved = async (tourId) => {
    await supabase.from('Property_Saves').delete().eq('user_id', user.id).eq('tour_id', tourId)
    setSavedTours(p => p.filter(t => t.id !== tourId))
  }

  const deletePost = async (pid) => {
    if (!confirm('Delete this draft permanently?')) return
    await supabase.from('Blog_Posts').delete().eq('id', pid)
    setMyPosts(p => p.filter(x => x.id !== pid))
  }

  if (authLoading || !user) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-700 rounded-full animate-spin" />
    </div>
  )

  const displayName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Traveller'
  const initials = displayName.slice(0, 2).toUpperCase()
  const upcoming  = bookings.filter(b => b.status !== 'cancelled' && (!b.booking_date || new Date(b.booking_date) > new Date()))
  const past      = bookings.filter(b => b.status !== 'cancelled' && b.booking_date && new Date(b.booking_date) <= new Date())
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  const TABS = [
    { id: 'trips',   label: 'Trips',    count: bookings.filter(b => b.status !== 'cancelled').length },
    { id: 'saved',   label: 'Saved',    count: savedTours.length },
    { id: 'reviews', label: 'Reviews',  count: reviews.length },
    { id: 'stories', label: 'Stories',  count: myPosts.length },
    { id: 'badges',  label: 'Badges',   count: badges.length },
  ]

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-20">

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
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-violet-700 rounded-full flex items-center justify-center border-2 border-white cursor-pointer hover:bg-violet-800 transition shadow-sm disabled:opacity-50">
                {avatarUploading
                  ? <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
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
                  <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
                  {profile?.location && <p className="flex items-center gap-1 text-xs text-slate-400 mt-1"><MapPin className="w-3 h-3" />{profile.location}</p>}
                  {profile?.bio && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{profile.bio}</p>}
                  {profile?.member_since && <p className="text-xs text-slate-400 mt-1.5">Member since {new Date(profile.member_since).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>}
                </>
              )}
            </div>

            {!editing && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-700 bg-slate-50 border border-slate-200 hover:border-violet-300 px-3 py-2 rounded-xl transition cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={async () => { await signOut(); navigate('/') }}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl transition cursor-pointer">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-50">
            {[
              { label: 'Trips',     v: profile?.trips_count    || bookings.filter(b => b.status !== 'cancelled').length },
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
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white border border-violet-100 animate-pulse" />)}</div>
        ) : (
          <>
            {tab === 'trips'   && <BookingSection upcoming={upcoming} past={past} cancelled={cancelled} onCancel={cancelBooking} />}
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

function BookingSection({ upcoming, past, cancelled, onCancel }) {
  const [sub, setSub] = useState('upcoming')
  const list = sub === 'upcoming' ? upcoming : sub === 'past' ? past : cancelled
  return (
    <>
      <div className="flex gap-2 mb-4">
        {[{ id:'upcoming', l:`Upcoming (${upcoming.length})`}, {id:'past', l:`Past (${past.length})`}, {id:'cancelled', l:`Cancelled (${cancelled.length})`}].map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer ${sub === t.id ? 'bg-violet-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'}`}>
            {t.l}
          </button>
        ))}
      </div>
      {list.length === 0
        ? <EmptyState icon={sub==='upcoming'?'📅':'📖'} title={sub==='upcoming'?'No upcoming trips':'No trips yet'} cta="/itineraries" ctaLabel="Browse tours" />
        : <div className="space-y-3">{list.map(b => <BookingCard key={b.id} booking={b} sub={sub} onCancel={onCancel} />)}</div>}
    </>
  )
}

function BookingCard({ booking: b, sub, onCancel }) {
  const t = b.Itineraries
  const sc = { confirmed:'text-violet-700 bg-violet-50', completed:'text-blue-700 bg-blue-50', cancelled:'text-red-600 bg-red-50', pending:'text-amber-700 bg-amber-50' }
  return (
    <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
      <div className="flex gap-3 p-4">
        {t?.cover_image_url && <img src={t.cover_image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/itinerary/${t?.slug}`} className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-violet-700">{t?.title || 'Tour'}</Link>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sc[b.status]||'text-slate-600 bg-slate-50'}`}>{b.status}</span>
          </div>
          {t?.location && <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5"><MapPin className="w-2.5 h-2.5" />{t.location}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            {b.booking_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.booking_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.num_persons} person{b.num_persons!==1?'s':''}</span>
            {b.total_amount && <span className="font-semibold text-slate-600">₹{Number(b.total_amount).toLocaleString('en-IN')}</span>}
          </div>
        </div>
      </div>
      {sub === 'upcoming' && b.status === 'confirmed' && (
        <div className="border-t border-slate-50 px-4 pb-3 pt-2 flex justify-end">
          <button onClick={() => onCancel(b.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer">Cancel booking</button>
        </div>
      )}
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
            <span className="text-xs font-bold text-violet-700">{t.price_per_person?`₹${Number(t.price_per_person).toLocaleString('en-IN')}`:'On Request'}</span>
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
