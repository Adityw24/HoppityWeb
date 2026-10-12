import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Heart, Film } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { REEL_COLS, byCreator, hydrateReels, fmtCount } from '../lib/reels'
import Navbar from '../components/Navbar'
import ReelsGrid from '../components/ReelsGrid'

// Public creator page: /creator/:id — header + Instagram-style reels grid.
export default function CreatorProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creator, setCreator] = useState(null)
  const [reels, setReels]     = useState([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true); setMissing(false)
    ;(async () => {
      const [u, r] = await Promise.all([
        supabase.from('Users').select('user_id,full_name,username,profile_pic,bio,location').eq('user_id', id).maybeSingle(),
        supabase.from('Reels').select(REEL_COLS).or(byCreator(id)).eq('status', 'published').not('video_url', 'is', null).order('created_at', { ascending: false }),
      ])
      if (!alive) return
      if (!u.data) { setMissing(true); setLoading(false); return }
      const hydrated = await hydrateReels(r.data || [], user?.id)
      if (!alive) return
      setCreator(u.data); setReels(hydrated); setLoading(false)
    })()
    return () => { alive = false }
  }, [id, user?.id])

  const name = creator?.full_name || creator?.username || 'Traveller'
  const totalLikes = reels.reduce((n, r) => n + (r.likes_count || 0), 0)

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <button onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/discover'))}
          aria-label="Back"
          className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-white/70 text-slate-600 ring-1 ring-violet-200/70 backdrop-blur transition hover:bg-white hover:text-violet-700 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="h-40 animate-pulse rounded-3xl border border-violet-100 bg-white" />
        ) : missing ? (
          <div className="rounded-3xl border border-violet-100 bg-white py-16 text-center">
            <h2 className="font-bold text-slate-900">Creator not found</h2>
            <Link to="/discover" className="mt-4 inline-block text-sm font-bold text-violet-700 hover:underline">Back to Discover →</Link>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-black text-white">
                  {creator.profile_pic ? <img src={creator.profile_pic} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black text-slate-900">{name}</h1>
                  {creator.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{creator.location}</p>}
                  {creator.bio && <p className="mt-2 text-sm leading-relaxed text-slate-600">{creator.bio}</p>}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-50 pt-4">
                <div className="text-center"><div className="flex items-center justify-center gap-1.5 text-xl font-black text-slate-900"><Film className="h-4 w-4 text-violet-600" />{reels.length}</div><div className="mt-0.5 text-xs text-slate-400">Reels</div></div>
                <div className="text-center"><div className="flex items-center justify-center gap-1.5 text-xl font-black text-slate-900"><Heart className="h-4 w-4 text-rose-500" />{fmtCount(totalLikes)}</div><div className="mt-0.5 text-xs text-slate-400">Likes</div></div>
              </div>
            </div>

            <ReelsGrid reels={reels} setReels={setReels} user={user} isOwner={user?.id === id} />
          </>
        )}
      </div>
    </div>
  )
}