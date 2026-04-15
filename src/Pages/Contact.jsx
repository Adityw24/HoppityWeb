import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Mail, Phone, Send, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'

const SUBJECTS = [
  'Booking enquiry',
  'Existing booking issue',
  'Payment / refund',
  'Group booking',
  'Become a creator / guide',
  'Partnership',
  'Something else',
]

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setError('')
    const { error: dbErr } = await supabase.from('Contact_Inquiries').insert({
      name:    form.name.trim(),
      email:   form.email.trim(),
      phone:   form.phone.trim() || null,
      subject: form.subject,
      message: form.message.trim(),
      source:  'website',
    })
    setLoading(false)
    if (dbErr) {
      setError('Something went wrong. Please try WhatsApp or email below.')
    } else {
      setDone(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#ede5ff]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">

        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-700 mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-3">
          Get in touch
        </h1>
        <p className="text-lg text-slate-600 mb-12">
          We usually respond within a few hours. For urgent queries, WhatsApp is fastest.
        </p>

        <div className="grid md:grid-cols-3 gap-8">

          {/* Contact cards */}
          <div className="space-y-4 md:col-span-1">
            <a
              href="https://wa.me/919752377323?text=Hi%20Hoppity%2C%20I%20need%20help%20with"
              target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-violet-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition group"
            >
              <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">WhatsApp</p>
                <p className="text-sm text-slate-500 mt-0.5">+91 97523 77323</p>
                <p className="text-xs text-green-600 font-semibold mt-1">Usually replies in minutes</p>
              </div>
            </a>

            <a
              href="mailto:sales@hoppity.in"
              className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-violet-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Email</p>
                <p className="text-sm text-slate-500 mt-0.5">sales@hoppity.in</p>
                <p className="text-xs text-slate-400 font-semibold mt-1">Response within 24h</p>
              </div>
            </a>

            <div className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-violet-100 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Office Hours</p>
                <p className="text-sm text-slate-500 mt-0.5">Mon – Sat</p>
                <p className="text-sm text-slate-500">10 AM – 7 PM IST</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            {done ? (
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">Message received!</h2>
                <p className="text-slate-600 mb-6">
                  We'll get back to you at <strong>{form.email}</strong> within 24 hours.<br />
                  For urgent help, WhatsApp us directly.
                </p>
                <a
                  href="https://wa.me/919752377323"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-green-700 transition"
                >
                  <MessageCircle className="w-4 h-4" /> Open WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="bg-white rounded-3xl border border-violet-100 shadow-sm p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Priya Sharma"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                    <input
                      type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="priya@example.com"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone (optional)</label>
                    <input
                      type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                    <select
                      value={form.subject} onChange={e => set('subject', e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition bg-white"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                  <textarea
                    required rows={5} value={form.message} onChange={e => set('message', e.target.value)}
                    placeholder="Tell us how we can help…"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-violet-700 text-white rounded-2xl py-3.5 font-semibold hover:bg-violet-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Sending…' : <><Send className="w-4 h-4" /> Send Message</>}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Your message is saved securely. We reply within 24 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
