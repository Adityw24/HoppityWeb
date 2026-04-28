import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <div className="px-5 pt-12 sm:px-8 sm:pt-16">
        <Link to="/"
          aria-label="Back to home"
          title="Back to home"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#f7f1ff]">
          <ArrowLeft className="w-5 h-5" />
          <span className="sr-only">Back to home</span>
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-8">Last updated: April 2026</p>

        <div className="bg-white rounded-3xl border border-violet-100 p-6 sm:p-8 space-y-8 text-slate-700 leading-8">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Who we are</h2>
            <p className="text-sm leading-7">Hoppity is operated by Triffair, a travel technology company based in India. We build curated travel experiences that connect travellers with extraordinary destinations across India. Our website is <a href="https://www.hoppity.in" className="text-violet-600 hover:underline">www.hoppity.in</a> and you can contact us at <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline">sales@hoppity.in</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. What we collect</h2>
            <p className="text-sm leading-7">When you create an account, we collect your name, email address, and phone number. When you make a booking, we collect tour selection, travel dates, and group size. We also collect search queries and usage data to personalise your experience and improve our recommendations. If you sign in via Google, we receive your name, email address, and profile picture from Google.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. How we use your data</h2>
            <p className="text-sm leading-7">Your information is used to manage bookings, send booking confirmations, provide customer support, and show you personalised travel recommendations. We do not sell your personal data to third parties. We do not use your data for advertising profiling.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Third-party services</h2>
            <p className="text-sm leading-7">We use the following third-party services to operate Hoppity:</p>
            <ul className="text-sm mt-3 space-y-2 list-disc list-inside text-slate-600">
              <li><strong>Supabase</strong> — database and authentication (servers in ap-south-1, India)</li>
              <li><strong>Razorpay</strong> — payment processing (PCI-DSS compliant)</li>
              <li><strong>Google Sign-In</strong> — optional authentication</li>
              <li><strong>Google Analytics</strong> — anonymous usage analytics</li>
            </ul>
            <p className="text-sm mt-3 leading-7">Each of these services has their own privacy policy governing their use of your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Photography and content</h2>
            <p className="text-sm leading-7">Destination photography displayed in Hoppity is sourced from licensed Destination Management Company (DMC) partners and official Indian government tourism boards, provided as rights-cleared material for commercial use. No user-generated imagery is reproduced without consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Data retention</h2>
            <p className="text-sm leading-7">We retain your personal data for as long as your account is active or as needed to provide services. Booking records are retained for 7 years for legal and financial compliance. You may request deletion of your account and all associated data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Your rights</h2>
            <p className="text-sm leading-7">You have the right to access, correct, or delete your personal data at any time. You may also withdraw consent, request data portability, or object to processing. To exercise any of these rights, contact us at <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline">sales@hoppity.in</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Delete your account</h2>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Account deletion is permanent</p>
              <p className="text-sm text-red-700 leading-6 mb-4">Deleting your account will permanently remove your profile, saved itineraries, booking history, and any travel stories you have written. This action cannot be undone.</p>
              <p className="text-sm text-slate-600 leading-6">To delete your account, you can:</p>
              <ul className="text-sm text-slate-600 mt-2 space-y-1 list-disc list-inside">
                <li>Go to your <a href="/profile" className="text-violet-600 hover:underline font-medium">Profile → Settings → Delete Account</a></li>
                <li>Email us at <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline">sales@hoppity.in</a> with subject "Delete My Account"</li>
                <li>WhatsApp us at <a href="https://wa.me/919752377323" className="text-violet-600 hover:underline">+91 97523 77323</a></li>
              </ul>
              <p className="text-xs text-slate-400 mt-3">We will process deletion requests within 30 days. Some data may be retained for legal compliance.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Contact</h2>
            <p className="text-sm leading-7">For any privacy concerns or data requests, contact us at <a href="mailto:sales@hoppity.in" className="text-violet-600 hover:underline">sales@hoppity.in</a>. We aim to respond within 48 hours.</p>
          </section>

        </div>
      </div>
    </div>
  )
}

export default Privacy
