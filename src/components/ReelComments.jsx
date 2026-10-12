import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Send, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchAuthors, timeAgo } from '../lib/reels'

function Avatar({ u, size = 'w-8 h-8' }) {
  const name = u?.full_name || u?.username || '?'
  return (
    <div className={`${size} rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0`}>
      {u?.profile_pic ? <img src={u.profile_pic} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// Bottom sheet on phones, side panel on desktop. Comments arrive over Supabase
// realtime (INSERT/DELETE filtered by reel_id), so two people on the same reel
// see each other's comments instantly.
export default function ReelComments({ reel, user, onClose, onNeedAuth }) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText]     = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]   = useState('')
  const authors = useRef({})
  const inputRef = useRef(null)

  const withAuthor = async (rows) => {
    const missing = rows.map(r => r.user_id).filter(id => !authors.current[id])
    if (missing.length) Object.assign(authors.current, await fetchAuthors(missing))
    return rows.map(r => ({ ...r, author: authors.current[r.user_id] || null }))
  }

  useEffect(() => {
    let alive = true
    setLoading(true); setItems([]); setError('')

    ;(async () => {
      const { data, error } = await supabase
        .from('Reel_Comments')
        .select('id,reel_id,user_id,body,created_at')
        .eq('reel_id', reel.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!alive) return
      if (error) { setError(error.message || 'Could not load comments'); setLoading(false); return }
      const rows = await withAuthor(data || [])
      if (alive) { setItems(rows); setLoading(false) }
    })()

    const ch = supabase
      .channel(`reel-comments-${reel.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Reel_Comments', filter: `reel_id=eq.${reel.id}` },
        async (p) => {
          const [row] = await withAuthor([p.new])
          if (!alive) return
          setItems(prev => (prev.some(c => c.id === row.id) ? prev : [row, ...prev]))
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'Reel_Comments', filter: `reel_id=eq.${reel.id}` },
        (p) => setItems(prev => prev.filter(c => c.id !== p.old?.id)))
      .subscribe()

    return () => { alive = false; supabase.removeChannel(ch) }
  }, [reel.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const send = async (e) => {
    e?.preventDefault?.()
    const body = text.trim()
    if (!body || sending) return
    if (!user) { onNeedAuth?.(); return }
    setSending(true); setError('')
    const { data, error } = await supabase
      .from('Reel_Comments')
      .insert({ reel_id: reel.id, user_id: user.id, body })
      .select('id,reel_id,user_id,body,created_at')
      .single()
    setSending(false)
    if (error) { setError('Could not post comment. Try again.'); return }
    setText('')
    const [row] = await withAuthor([data])
    setItems(prev => (prev.some(c => c.id === row.id) ? prev : [row, ...prev]))
    inputRef.current?.focus()
  }

  const remove = async (c) => {
    const snapshot = items
    setItems(prev => prev.filter(x => x.id !== c.id))
    const { error } = await supabase.from('Reel_Comments').delete().eq('id', c.id)
    if (error) { setItems(snapshot); setError('Could not delete comment.') }
  }

  const isReelOwner = user?.id === reel.creator_id

  return (
    <>
      <button aria-label="Close comments" onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/40 sm:bg-transparent cursor-default" />
      <div role="dialog" aria-label="Comments"
        className="fixed inset-x-0 bottom-0 z-[71] flex h-[70dvh] flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-24 sm:h-auto sm:w-[380px] sm:rounded-3xl sm:border sm:border-violet-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-black text-slate-900">
            Comments <span className="ml-1 text-slate-400 font-semibold">{items.length ? items.length : ''}</span>
          </h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-24 rounded bg-slate-100" /><div className="h-3 w-full rounded bg-slate-100" /></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-bold text-slate-700">No comments yet</p>
              <p className="mt-1 text-xs text-slate-400">Be the first to say something.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(c => {
                const name = c.author?.full_name || c.author?.username || 'Traveller'
                const canDelete = user && (c.user_id === user.id || isReelOwner)
                return (
                  <li key={c.id} className="group flex gap-3">
                    <Avatar u={c.author} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">
                        <Link to={`/creator/${c.user_id}`} onClick={onClose} className="font-bold text-slate-800 hover:text-violet-700">{name}</Link>
                        <span className="ml-2">{timeAgo(c.created_at)}</span>
                      </p>
                      <p className="mt-0.5 break-words text-sm leading-snug text-slate-700">{c.body}</p>
                    </div>
                    {canDelete && (
                      <button onClick={() => remove(c)} aria-label="Delete comment"
                        className="self-start rounded-full p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && <p className="px-5 pb-1 text-xs font-semibold text-red-600">{error}</p>}

        <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
          <input ref={inputRef} value={text} maxLength={500}
            onChange={e => setText(e.target.value)}
            onFocus={() => { if (!user) onNeedAuth?.() }}
            placeholder={user ? 'Add a comment…' : 'Sign in to comment'}
            className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-violet-300" />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Post comment"
            className="grid h-10 w-10 place-items-center rounded-full bg-violet-700 text-white transition hover:bg-violet-800 disabled:opacity-40 cursor-pointer">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  )
}