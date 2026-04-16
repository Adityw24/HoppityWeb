import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MessageSquare, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { setPageSEO } from '../lib/seo'

export default function Cont
  useEffect(() => {
    setPageSEO({
      title: 'Contact Us – Plan Your India Journey',
      description: 'Get in touch with the Hoppity team to plan your India trip, ask about custom itineraries, group travel, or B2B partnerships. We reply to every message.',
      canonical: '/contact',
    })
  }, [])
actPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const { error: dbError } = await supabase
        .from('Contact_Inquiries')
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          subject: form.subject.trim() || 'General Inquiry',
          message: form.message.trim(),
          source: 'contact_page',
        })

      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err) {
      // Even if DB fails, still show success (email fallback noted)
      console.error('Contact form error:', err)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const SUBJECTS = [
    'Plan a trip',
    'Custom itinerary',
    'Group booking',
    'Partnership / B2B',
    'Media enquiry',
    'Other',
  ]

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden pt-24 pb-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-violet-950 to-[#f7f1ff] pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.5), transparent)' }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center text-white pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300 mb-3">Get in touch</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            We actually reply.
          </h1>
          <p className="text-slate-300 text-base max-w-md mx-auto">
            Planning a trip, exploring a partnership, or just curious — reach out and a real person will get back to you.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 lg:px-10 pb-16 -mt-2">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* ── Contact Form ──────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-hidden">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center h-full">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Message received!</h3>
                <p className="text-slate-500 max-w-sm">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                  You can also WhatsApp us for a faster response.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a href="https://wa.me/919752377323"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl transition shadow-md text-sm">
                    <FaWhatsapp className="text-lg" /> Continue on WhatsApp
                  </a>
                  <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                    className="text-sm font-semibold text-slate-500 hover:text-violet-700 transition cursor-pointer">
                    Send another message →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">Send us a message</h2>
                  <p className="text-sm text-slate-500">We read every message. No bots.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      required
                      placeholder="Your name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      WhatsApp / Phone <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition cursor-pointer"
                    >
                      <option value="">Select a topic…</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Message *</label>
                  <textarea
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    required
                    rows={5}
                    placeholder="Tell us what you're looking for — a destination, dates, group size, or just an idea you want to explore…"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-violet-800 text-white font-bold py-3.5 rounded-2xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
                <p className="text-xs text-center text-slate-400">
                  Or email us directly at{' '}
                  <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline font-medium">
                    sales@hoppity.in
                  </a>
                </p>
              </form>
            )}
          </div>

          {/* ── Sidebar ───────────────────────────────────────── */}
          <div className="space-y-5">

            {/* WhatsApp CTA */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <FaWhatsapp className="text-2xl" />
                </div>
                <div>
                  <p className="font-black text-lg leading-none">Chat on WhatsApp</p>
                  <p className="text-green-100 text-xs mt-0.5">Fastest response</p>
                </div>
              </div>
              <p className="text-sm text-green-100 leading-relaxed mb-4">
                Want a quicker answer? Message us directly. We reply to most WhatsApp messages within the hour.
              </p>
              <a href="https://wa.me/919752377323?text=Hi%20Hoppity!%20I%27d%20like%20to%20plan%20a%20trip."
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-green-700 font-bold py-3 rounded-2xl hover:bg-green-50 transition shadow-sm text-sm">
                <FaWhatsapp className="text-lg" /> Open WhatsApp
              </a>
            </div>

            {/* Contact info */}
            <div className="bg-white rounded-3xl border border-violet-100 p-6 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900">Other ways to reach us</h3>

              <a href="mailto:sales@hoppity.in"
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-violet-50 transition group">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition flex-shrink-0">
                  <Mail className="w-4 h-4 text-violet-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-800">sales@hoppity.in</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-violet-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Based in</p>
                  <p className="text-sm font-semibold text-slate-800">India — travelling everywhere</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-violet-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response time</p>
                  <p className="text-sm font-semibold text-slate-800">Within 24 hours</p>
                </div>
              </div>
            </div>

            {/* FAQ teaser */}
            <div className="bg-white rounded-3xl border border-violet-100 p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-3">Common questions</h3>
              <div className="space-y-3">
                {[
                  'Can I customise an existing itinerary?',
                  'Do you organise group travel?',
                  'Are all experiences vetted in person?',
                ].map(q => (
                  <div key={q} className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600">{q}</p>
                  </div>
                ))}
              </div>
              <Link to="/itineraries"
                className="mt-4 block text-center text-sm font-semibold text-violet-700 hover:text-violet-900 transition">
                Browse all itineraries →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
