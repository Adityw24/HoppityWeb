import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Bold, Italic, Underline, List, ListOrdered,
  Quote, Link2, Image, AlignLeft, Type, Save, Send,
  X, Plus, Eye, EyeOff, Upload, Loader
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'

const CATEGORIES = ['Heritage', 'Trekking', 'Adventure', 'Wildlife', 'Culinary', 'Spiritual', 'Cultural']
const MAX_COVER_MB = 3
const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'

async function compressImage(file, maxPx = 1280, quality = 0.78) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function ToolbarBtn({ onClick, title, active, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer text-sm flex-shrink-0 ${
        active ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

function TagInput({ value, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (v && !value.includes(v) && value.length < 8) {
      onChange([...value, v])
      setInput('')
    }
  }
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          #{tag}
          <button type="button" onClick={() => onChange(value.filter(t => t !== tag))}
            className="cursor-pointer hover:text-violet-900"><X className="w-3 h-3" /></button>
        </span>
      ))}
      {value.length < 8 && (
        <div className="flex items-center gap-1">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
            placeholder="Add tag…"
            className="text-xs border border-slate-200 rounded-full px-3 py-1.5 outline-none focus:border-violet-400 w-24 sm:w-28"
          />
          <button type="button" onClick={add}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-violet-100 text-slate-500 hover:text-violet-700 cursor-pointer">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function BlogComposePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const editorRef = useRef(null)
  const coverInputRef = useRef(null)
  const inlineImgInputRef = useRef(null)

  const [title, setTitle]           = useState('')
  const [category, setCategory]     = useState(CATEGORIES[0])
  const [tags, setTags]             = useState([])
  const [coverUrl, setCoverUrl]     = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]           = useState(null)
  const [postId, setPostId]         = useState(null)
  const [postStatus, setPostStatus] = useState('draft')
  const [preview, setPreview]       = useState(false)
  const [linkUrl, setLinkUrl]       = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?next=/write')
  }, [user, authLoading])

  useEffect(() => {
    if (!isEdit || !user) return
    supabase.from('Blog_Posts').select('*').eq('id', id).eq('author_id', user.id).single()
      .then(({ data }) => {
        if (!data) { navigate('/profile'); return }
        setTitle(data.title || '')
        setCategory(data.category || CATEGORIES[0])
        setTags(data.tags || [])
        setCoverUrl(data.cover_image_url || '')
        setPostId(data.id)
        setPostStatus(data.status)
        if (editorRef.current) editorRef.current.innerHTML = data.content_html || ''
      })
  }, [id, user])

  const exec = (cmd, value = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }
  const queryCmd = cmd => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }
  const insertLink = () => {
    if (!linkUrl.trim()) return
    exec('createLink', linkUrl.trim())
    setLinkUrl(''); setShowLinkInput(false)
  }
  const insertImage = async (file) => {
    if (!file || !user) return
    const compressed = await compressImage(file)
    const path = `${user.id}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('blog-media').upload(path, compressed, { contentType: 'image/jpeg', upsert: true })
    if (error) { showToast('error', 'Image upload failed'); return }
    const url = `${SUPABASE_URL}/storage/v1/object/public/blog-media/${path}`
    exec('insertHTML', `<img src="${url}" style="max-width:100%;border-radius:12px;margin:1rem 0;" />`)
  }
  const uploadCover = async (file) => {
    if (!file || !user) return
    if (file.size > MAX_COVER_MB * 1024 * 1024) { showToast('error', `Cover must be under ${MAX_COVER_MB}MB`); return }
    setCoverUploading(true)
    const compressed = await compressImage(file, 1920, 0.82)
    const path = `covers/${user.id}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('blog-media').upload(path, compressed, { contentType: 'image/jpeg', upsert: true })
    if (error) { showToast('error', 'Cover upload failed'); setCoverUploading(false); return }
    setCoverUrl(`${SUPABASE_URL}/storage/v1/object/public/blog-media/${path}`)
    setCoverUploading(false)
  }
  const showToast = (type, msg) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000)
  }
  const buildPayload = (status) => {
    const content_html = editorRef.current?.innerHTML || ''
    const text = editorRef.current?.innerText || ''
    const excerpt = text.replace(/\s+/g, ' ').trim().slice(0, 200)
    return {
      author_id: user.id, title: title.trim(), category, tags,
      cover_image_url: coverUrl || null, content_html, excerpt, status,
      ...(status === 'pending' ? { published_at: new Date().toISOString() } : {}),
    }
  }
  const saveDraft = async () => {
    if (!title.trim()) { showToast('error', 'Add a title first'); return }
    setSaving(true)
    const payload = buildPayload('draft')
    let error, data
    if (postId) {
      ;({ error } = await supabase.from('Blog_Posts').update(payload).eq('id', postId))
    } else {
      ;({ data, error } = await supabase.from('Blog_Posts').insert(payload).select('id').single())
      if (data) setPostId(data.id)
    }
    setSaving(false)
    if (error) { showToast('error', error.message); return }
    setPostStatus('draft'); showToast('success', 'Draft saved')
  }
  const submitForReview = async () => {
    if (!title.trim()) { showToast('error', 'Add a title first'); return }
    const text = editorRef.current?.innerText || ''
    if (text.trim().length < 100) { showToast('error', 'Story needs at least 100 characters'); return }
    if (!window.confirm('Submit this story for review?')) return
    setSubmitting(true)
    const payload = buildPayload('pending')
    let error, data
    if (postId) {
      ;({ error } = await supabase.from('Blog_Posts').update(payload).eq('id', postId))
    } else {
      ;({ data, error } = await supabase.from('Blog_Posts').insert(payload).select('id').single())
      if (data) setPostId(data.id)
    }
    setSubmitting(false)
    if (error) { showToast('error', error.message); return }
    setPostStatus('pending'); showToast('success', "Submitted! We'll notify you when it's live.")
    setTimeout(() => navigate('/profile?tab=stories'), 2000)
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <Loader className="w-6 h-6 text-violet-600 animate-spin" />
    </div>
  )

  const getHtml = () => editorRef.current?.innerHTML || ''
  const canSubmit = postStatus === 'draft' || postStatus === 'on_hold'

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold border ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* ── Main container ──────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-28 sm:pb-24">

        {/* ── Top bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 pt-4">
          {/* Left: back + status */}
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/profile?tab=stories"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 transition flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">My Stories</span>
            </Link>
            {postStatus !== 'draft' && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                postStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                postStatus === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {postStatus === 'pending' ? '⏳ Review' :
                 postStatus === 'approved' ? '✓ Live' : postStatus}
              </span>
            )}
          </div>

          {/* Right: preview toggle + desktop action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setPreview(p => !p)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-violet-700 bg-white border border-slate-200 rounded-xl px-3 py-2 transition cursor-pointer">
              {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{preview ? 'Edit' : 'Preview'}</span>
            </button>

            {/* Desktop only: save + submit in top bar */}
            <button onClick={saveDraft} disabled={saving}
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-violet-700 bg-white border border-slate-200 rounded-xl px-4 py-2 transition cursor-pointer disabled:opacity-50">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            {canSubmit && (
              <button onClick={submitForReview} disabled={submitting}
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-xl px-4 py-2 transition cursor-pointer disabled:opacity-50 shadow-sm">
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
          </div>
        </div>

        {preview ? (
          /* ── Preview mode ──────────────────────────────────────── */
          <div className="bg-white rounded-3xl border border-violet-100 overflow-hidden shadow-sm">
            {coverUrl && (
              <div className="h-52 sm:h-64 overflow-hidden">
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 sm:p-8 md:p-12">
              <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">{category}</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 mt-3 mb-6 leading-tight">
                {title || 'Untitled Story'}
              </h1>
              <div className="blog-prose" dangerouslySetInnerHTML={{ __html: getHtml() }} />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
                  {tags.map(t => (
                    <span key={t} className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Editor mode ───────────────────────────────────────── */
          <div className="space-y-4">

            {/* Cover image */}
            <div className="bg-white rounded-3xl border border-violet-100 overflow-hidden">
              {coverUrl ? (
                <div className="relative h-44 sm:h-52 group">
                  <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <button type="button" onClick={() => coverInputRef.current?.click()}
                      className="bg-white text-slate-900 font-semibold text-sm px-4 py-2 rounded-xl cursor-pointer">
                      Change
                    </button>
                    <button type="button" onClick={() => setCoverUrl('')}
                      className="bg-white/20 text-white font-semibold text-sm px-4 py-2 rounded-xl cursor-pointer">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}
                  className="w-full h-32 sm:h-40 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition cursor-pointer group">
                  {coverUploading ? (
                    <><Loader className="w-5 h-5 animate-spin text-violet-600" /><span className="text-sm font-medium text-violet-600">Uploading…</span></>
                  ) : (
                    <><Upload className="w-5 h-5 group-hover:scale-110 transition" /><span className="text-sm font-medium">Add cover image</span><span className="text-xs text-slate-400">JPG, PNG up to 3MB</span></>
                  )}
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Story title…"
              maxLength={120}
              className="w-full text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 placeholder-slate-300 bg-transparent border-none outline-none leading-tight px-1"
            />

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 py-3 border-y border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</span>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5 outline-none focus:border-violet-400 cursor-pointer">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5">Tags</span>
                <TagInput value={tags} onChange={setTags} />
              </div>
            </div>

            {/* Rich editor */}
            <div className="bg-white rounded-3xl border border-violet-100 overflow-hidden shadow-sm">
              {/* Toolbar — scrollable on mobile */}
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-100 overflow-x-auto">
                <ToolbarBtn onClick={() => exec('formatBlock', 'h2')} title="Heading 2"><Type className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec('formatBlock', 'h3')} title="Heading 3"><span className="text-xs font-bold">H3</span></ToolbarBtn>
                <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />
                <ToolbarBtn onClick={() => exec('bold')} title="Bold" active={queryCmd('bold')}><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec('italic')} title="Italic" active={queryCmd('italic')}><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec('underline')} title="Underline" active={queryCmd('underline')}><Underline className="w-3.5 h-3.5" /></ToolbarBtn>
                <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />
                <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec('formatBlock', 'blockquote')} title="Blockquote"><Quote className="w-3.5 h-3.5" /></ToolbarBtn>
                <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />
                <ToolbarBtn onClick={() => setShowLinkInput(l => !l)} title="Insert link"><Link2 className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => inlineImgInputRef.current?.click()} title="Insert image"><Image className="w-3.5 h-3.5" /></ToolbarBtn>
                <ToolbarBtn onClick={() => exec('formatBlock', 'p')} title="Normal text"><AlignLeft className="w-3.5 h-3.5" /></ToolbarBtn>
                <input ref={inlineImgInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && insertImage(e.target.files[0])} />
              </div>

              {/* Link input — appears below toolbar */}
              {showLinkInput && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-violet-100 bg-violet-50">
                  <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && insertLink()}
                    placeholder="Paste URL and press Enter"
                    className="text-xs outline-none bg-transparent flex-1 text-slate-700"
                    autoFocus />
                  <button type="button" onClick={insertLink} className="text-xs font-bold text-violet-700 cursor-pointer flex-shrink-0">Add</button>
                  <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl('') }} className="cursor-pointer flex-shrink-0">
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}

              {/* Editable area */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder={"Start writing your story…\n\nShare a travel experience, hidden destination, tip or guide. Be honest, be curious, be you."}
                className="blog-prose min-h-[320px] sm:min-h-[420px] px-4 sm:px-8 py-5 sm:py-7 outline-none"
                style={{ caretColor: '#7c3aed' }}
                onInput={() => {}}
              />
            </div>

            {/* Writing tips */}
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2">💡 Tips</p>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                <li>• Be specific — name the place, describe the smell, the light, the moment</li>
                <li>• Add photos using the image button in the toolbar above</li>
                <li>• Stories are reviewed and published within 24–48 hours</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky bottom action bar ───────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-xl">
        <button onClick={saveDraft} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl py-3 transition cursor-pointer disabled:opacity-50">
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        {canSubmit && (
          <button onClick={submitForReview} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-violet-700 hover:bg-violet-800 rounded-2xl py-3 transition cursor-pointer disabled:opacity-50 shadow-md">
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>

      <style>{`
        .blog-prose { font-size: 16px; line-height: 1.85; color: #1e293b; }
        .blog-prose:empty:before,
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1; pointer-events: none; white-space: pre-line;
          font-size: 16px; line-height: 1.85;
        }
        @media (min-width: 640px) {
          .blog-prose, [contenteditable][data-placeholder]:empty:before { font-size: 17px; }
        }
        .blog-prose h1 { font-size: 1.75rem; font-weight: 800; margin: 2rem 0 1rem; line-height: 1.2; }
        .blog-prose h2 { font-size: 1.375rem; font-weight: 700; margin: 1.75rem 0 0.875rem; }
        .blog-prose h3 { font-size: 1.125rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .blog-prose p { margin: 0 0 1.25rem; }
        .blog-prose ul, .blog-prose ol { padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .blog-prose li { margin-bottom: 0.4rem; }
        .blog-prose blockquote { border-left: 4px solid #7c3aed; padding-left: 1.25rem; margin: 1.5rem 0; color: #64748b; font-style: italic; }
        .blog-prose img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
        .blog-prose a { color: #7c3aed; text-decoration: underline; }
        .blog-prose strong { font-weight: 700; }
        .blog-prose em { font-style: italic; }
        .blog-prose code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; font-family: ui-monospace, monospace; }
        .blog-prose hr { border: none; border-top: 2px solid #f1f5f9; margin: 2rem 0; }
      `}</style>
    </div>
  )
}
