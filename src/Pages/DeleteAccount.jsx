import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import {
  ArrowLeft, AlertTriangle, User, FileText,
  MapPin, CreditCard, Trash2, Loader2,
} from "lucide-react";

const SERVICE_ID    = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const ADMIN_TID     = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID;
const USER_TID      = import.meta.env.VITE_EMAILJS_USER_TEMPLATE_ID;
const PUBLIC_KEY    = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export default function DeleteAccount() {
  const [email, setEmail]       = useState("");
  const [reason, setReason]     = useState("");
  const [otherText, setOtherText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    emailjs.init(PUBLIC_KEY);
  }, []);

  const isValid = email.includes("@") && email.includes(".") && confirmed;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");

    const finalReason = reason === "Other" ? otherText || "Other" : reason || "Not specified";
    const time = new Date().toLocaleString();

    try {
      // 1. Notify you (admin) about the deletion request
      await emailjs.send(SERVICE_ID, ADMIN_TID, {
        user_email: email,
        reason: finalReason,
        time,
      });

      // 2. Send confirmation email to the user
      await emailjs.send(SERVICE_ID, USER_TID, {
        user_email: email,
        time,
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again or contact contact@triffair.com");
    } finally {
      setLoading(false);
    }
  };

  const deletionItems = [
    { icon: <User className="w-3.5 h-3.5 text-violet-600" />, label: "Profile & account", desc: "Name, email, password and all account settings." },
    { icon: <MapPin className="w-3.5 h-3.5 text-violet-600" />, label: "Trip itineraries", desc: "All saved journeys, destinations, and custom plans." },
    { icon: <FileText className="w-3.5 h-3.5 text-violet-600" />, label: "Booking history", desc: "Past and upcoming trip records and receipts." },
    { icon: <CreditCard className="w-3.5 h-3.5 text-violet-600" />, label: "Processed within 7 days", desc: "Your deletion request is completed within 7 business days." },
  ];

  return (
    <div className="min-h-screen bg-[#f7f1ff] px-6 py-12 lg:px-10">

      {/* Header */}
      <div className="relative mb-12">
        <Link
          to="/"
          aria-label="Go back"
          className="absolute left-3 top-3 z-10 h-11 w-11 rounded-xl bg-linear-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-md transition hover:scale-105 sm:left-6 sm:top-4 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        <div className="max-w-xl mx-auto pt-14 text-center sm:pt-0">
          <h1 className="text-2xl md:text-6xl font-black text-slate-950">Delete My Account</h1>
          <p className="mt-2 text-lg text-slate-600">This action is permanent and cannot be undone.</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto flex flex-col gap-4">

        {/* Warning banner */}
        <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-3xl p-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-base font-bold text-red-800 mb-1">Permanent deletion warning</p>
            <p className="text-sm text-red-700 leading-7">
              Your account, all trip itineraries, booking history, and personal data will be{" "}
              <strong>permanently deleted</strong> and cannot be recovered.
            </p>
          </div>
        </div>

        {/* What gets deleted */}
        <div className="overflow-hidden rounded-4xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-violet-50">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">What gets deleted</h2>
          </div>
          <div className="divide-y divide-violet-50">
            {deletionItems.map(({ icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 px-6 py-4">
                <div className="w-7 h-7 rounded-full bg-violet-50 border-2 border-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-violet-700 mb-1">{label}</p>
                  <p className="text-sm text-slate-600 leading-6">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="overflow-hidden rounded-4xl border border-violet-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-violet-50">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">Request deletion</h2>
          </div>

          {!submitted ? (
            <div className="px-6 py-5 flex flex-col gap-4">

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-violet-200 text-base text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Reason for leaving{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-violet-200 text-base text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition bg-white"
                >
                  <option value="">Select a reason…</option>
                  <option>I no longer need this service</option>
                  <option>I have privacy concerns</option>
                  <option>I'm switching to another platform</option>
                  <option>The service didn't meet my needs</option>
                  <option>Other</option>
                </select>
              </div>

              {reason === "Other" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Tell us more
                  </label>
                  <textarea
                    rows={3}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Share any additional feedback…"
                    className="w-full px-4 py-3 rounded-xl border border-violet-200 text-base text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition resize-none"
                  />
                </div>
              )}

              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <input
                  type="checkbox"
                  id="confirmCheck"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600 shrink-0"
                />
                <label htmlFor="confirmCheck" className="text-sm text-red-800 leading-6 cursor-pointer">
                  I understand that my account and{" "}
                  <strong>all associated data will be permanently deleted</strong>{" "}
                  and this action cannot be undone.
                </label>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 leading-6">
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className={`w-full py-3.5 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition ${
                  isValid && !loading
                    ? "bg-red-600 hover:bg-red-700 active:scale-[0.98]"
                    : "bg-red-300 cursor-not-allowed"
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Sending request…" : "Delete my account permanently"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center px-6 py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-black text-slate-950 mb-2">Request submitted</p>
                <p className="text-base text-slate-600 leading-8">
                  A confirmation has been sent to <strong className="text-slate-800">{email}</strong>.
                  Your account will be permanently deleted within{" "}
                  <strong className="text-slate-800">7 business days</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contact fallback */}
        <div className="overflow-hidden rounded-4xl bg-linear-to-br from-[#7c3aed] to-[#a78bfa] p-6 text-white">
          <h2 className="text-xl font-black mb-2">Need help instead?</h2>
          <p className="text-base text-violet-100 leading-8">
            If you didn't mean to request deletion, contact us immediately at{" "}
            <a href="mailto:contact@triffair.com?subject=Delete%20Account%20Support&body=Hi%20Triffair%20Team%2C%0A" className="font-bold underline text-white">
              contact@triffair.com
            </a>{" "}
            before your account is removed.
          </p>
        </div>

        <p className="text-center text-sm text-slate-400 pb-4">
          © 2026 Hoppity ·{" "}
          <Link to="/privacy-policy" className="text-violet-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}