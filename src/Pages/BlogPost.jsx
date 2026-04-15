import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Clock, Share2, BookOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const SUPABASE_URL = 'https://wenhudcyvlhilpgazylg.supabase.co'

export default function BlogPostPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    loadPost()
  }, [slug])

  const loadPost = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('Blog_Posts')
      .select('*, Users!Blog_Posts_author_id_fkey(full_name, username, profile_pic, is_creator)')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single()

    if (data) {
      setPost(data)
      setLikesCount(data.likes_count)

      // Check if liked
      if (user) {
        const { data: likeData } = await supabase
          .from('Blog_Likes').select('id')
          .eq('blog_id', data.id).eq('user_id', user.id).maybeSingle()
        setLiked(!!likeData)
      }

      // Increment view (fire and forget)
      supabase.rpc('increment_blog_views', { p_blog_id: data.id })

      // Load comments
      loadComments(data.id)

      // Load related posts (same category)
      if (data.category) {
        const { data: related } = await supabase.rpc('personalized_blog_feed', {
          p_user_id: user?.id ?? null,
          p_limit: 3,
          p_offset: 0,
          p_category: data.category,
        })
        setRelatedPosts((related || []).filter(r => r.id !== data.id).slice(0, 3))
      }
    }
    setLoading(false)
  }

  const loadComments = async (blogId) => {
    const { data } = await supabase
      .from('Blog_Comments')
      .select('*, Users!Blog_Comments_user_id_fkey(full_name, username, profile_pic)')
      .eq('blog_id', blogId)
      .order('created_at')
    setComments(data || [])
  }

  const toggleLike = async () => {
    if (!user) { window.location.href = '/auth'; return }
    if (liked) {
      await supabase.from('Blog_Likes').delete()
        .eq('blog_id', post.id).eq('user_id', user.id)
      setLiked(false)
      setLikesCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from('Blog_Likes').insert({ blog_id: post.id, user_id: user.id })
      setLiked(true)
      setLikesCount(c => c + 1)
    }
  }

  const submitComment = async () => {
    if (!user) { window.location.href = '/auth'; return }
    if (!commentText.trim()) return
    setSubmittingComment(true)
    await supabase.from('Blog_Comments').insert({
      blog_id: post.id, user_id: user.id, content: commentText.trim()
    })
    setCommentText('')
    await loadComments(post.id)
    setSubmittingComment(false)
  }

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: post?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied!')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center">
      <div className="text-violet-600 text-sm">Loading…</div>
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-[#f7f1ff] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">📖</div>
        <h2 className="text-xl font-bold text-slate-900">Story not found</h2>
        <Link to="/blog" className="text-violet-600 hover:underline mt-2 block">← Back to stories</Link>
      </div>
    </div>
  )

  const author = post.Users
  const authorName = author?.full_name || author?.username || 'Hoppity'

  return (
    <div className="min-h-screen bg-white">
      {/* Back nav */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30 flex items-center gap-3">
        <Link to="/blog" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 transition flex-shrink-0">
          <ArrowLeft className="w-4 h-4" /> Stories
        </Link>
        <div className="h-4 w-px bg-slate-200" />
        <p className="text-sm text-slate-700 font-medium truncate flex-1">{post.title}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm font-semibold transition cursor-pointer px-3 py-1.5 rounded-full ${
              liked ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
            }`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
            {likesCount}
          </button>
          <button onClick={share}
            className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700 transition cursor-pointer">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Cover */}
        {post.cover_image_url && (
          <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden mb-10">
            <img src={post.cover_image_url} alt={post.title}
              className="w-full h-full object-cover" />
          </div>
        )}

        {/* Category + read time */}
        <div className="flex items-center gap-3 mb-6">
          {post.category && (
            <Link to={`/blog?category=${post.category}`}
              className="text-xs font-bold text-violet-700 uppercase tracking-widest hover:underline">
              {post.category}
            </Link>
          )}
          {post.is_featured && (
            <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full">⭐ Featured</span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" /> {post.read_time_minutes} min read
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 leading-tight mb-6">
          {post.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-10 pb-8 border-b border-slate-100">
          {author?.profile_pic ? (
            <img src={author.profile_pic} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black text-base">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">{authorName}</span>
              {author?.is_creator && (
                <span className="bg-violet-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">CREATOR</span>
              )}
            </div>
            {post.published_at && (
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(post.published_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>

        {/* ── HTML content with prose styling ── */}
        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-slate-100">
            {post.tags.map(tag => (
              <span key={tag}
                className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement bar */}
        <div className="flex items-center gap-4 mt-8 pb-8 border-b border-slate-100">
          <button onClick={toggleLike}
            className={`flex items-center gap-2 text-sm font-semibold transition cursor-pointer px-4 py-2 rounded-full ${
              liked
                ? 'bg-red-50 text-red-600'
                : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
            }`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </button>
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <MessageCircle className="w-4 h-4" />
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
          <button onClick={share}
            className="ml-auto flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 transition cursor-pointer">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-xl font-black text-slate-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Add comment */}
          {user ? (
            <div className="mb-8">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Share your thoughts…"
                rows={3}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={submitComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="rounded-2xl bg-violet-700 text-white px-6 py-2.5 text-sm font-semibold hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingComment ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </div>
          ) : (
            <Link to="/auth"
              className="block w-full text-center py-3 border-2 border-dashed border-violet-200 rounded-2xl text-sm text-violet-700 font-semibold hover:bg-violet-50 transition mb-8">
              Sign in to leave a comment
            </Link>
          )}

          {/* Comment list */}
          <div className="space-y-5">
            {comments.map(c => {
              const cUser = c.Users
              const cName = cUser?.full_name || cUser?.username || 'Traveller'
              return (
                <div key={c.id} className="flex gap-3">
                  {cUser?.profile_pic ? (
                    <img src={cUser.profile_pic} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                      {cName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-2xl px-4 py-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-900">{cName}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              )
            })}
            {comments.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">
                No comments yet — be the first to share your thoughts.
              </p>
            )}
          </div>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-14 pt-8 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-900 mb-6">More {post.category} Stories</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPosts.map(rp => (
                <Link key={rp.id} to={`/blog/${rp.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-violet-100 hover:shadow-md transition cursor-pointer">
                  {rp.cover_image_url ? (
                    <div className="h-28 overflow-hidden">
                      <img src={rp.cover_image_url} alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </div>
                  ) : (
                    <div className="h-28 bg-violet-50 flex items-center justify-center text-4xl">📝</div>
                  )}
                  <div className="p-3">
                    <p className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{rp.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{rp.read_time_minutes} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Global blog prose styles */}
      <style>{`
        .blog-prose { font-size: 17px; line-height: 1.8; color: #1e293b; }
        .blog-prose h1 { font-size: 2rem; font-weight: 800; margin: 2rem 0 1rem; line-height: 1.2; }
        .blog-prose h2 { font-size: 1.5rem; font-weight: 700; margin: 1.75rem 0 0.875rem; }
        .blog-prose h3 { font-size: 1.25rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .blog-prose p { margin: 0 0 1.25rem; }
        .blog-prose ul, .blog-prose ol { padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .blog-prose li { margin-bottom: 0.4rem; }
        .blog-prose blockquote {
          border-left: 4px solid #7c3aed; padding-left: 1.25rem;
          margin: 1.5rem 0; color: #64748b; font-style: italic;
        }
        .blog-prose img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
        .blog-prose video { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
        .blog-prose a { color: #7c3aed; text-decoration: underline; }
        .blog-prose a:hover { color: #5b21b6; }
        .blog-prose strong { font-weight: 700; }
        .blog-prose em { font-style: italic; }
        .blog-prose code {
          background: #f1f5f9; padding: 2px 6px; border-radius: 4px;
          font-size: 0.875em; font-family: ui-monospace, monospace;
        }
        .blog-prose pre {
          background: #1e293b; color: #e2e8f0; padding: 1.25rem;
          border-radius: 10px; overflow-x: auto; margin: 1.5rem 0;
          font-size: 0.875em;
        }
        .blog-prose mark { background-color: #fef9c3; padding: 1px 2px; border-radius: 3px; }
        .blog-prose hr { border: none; border-top: 2px solid #f1f5f9; margin: 2rem 0; }
      `}</style>
    </div>
  )
}
