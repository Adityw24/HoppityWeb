import { Link } from "react-router-dom";
import { ArrowLeft, Info, MessageSquare, Activity, Lock, Users, User, Cookie } from "lucide-react";
import { useEffect } from "react";

const sections = [
  {
    icon: <Info className="w-4 h-4 text-violet-600" />,
    title: "1. Introduction",
    content: (
      <>
        <p className="text-base leading-8 text-slate-700">
          Welcome to Hoppity! Your privacy is important to us. This Privacy Policy explains how
          Triffair Technologies Pvt Ltd ("Triffair," "we," "us," or "our"), headquartered in
          Bhopal, Madhya Pradesh, India, collects, uses, shares, and protects your information when
          you use our social and e-commerce platform, Hoppity.
        </p>
        <p className="mt-3 text-base leading-8 text-slate-700">
          By using Hoppity, you agree to the collection and use of information in accordance with
          this Privacy Policy. If you do not agree, please refrain from using our services.
        </p>
      </>
    ),
  },
  {
    icon: <MessageSquare className="w-4 h-4 text-violet-600" />,
    title: "2. Information We Collect",
    content: (
      <>
        <p className="text-base leading-8 text-slate-700">
          We collect different types of information depending on your relationship with Hoppity
          (customers, partners, vendors, influencers). This includes:
        </p>

        <ul className="mt-3 space-y-2">
          <li className="text-base font-semibold text-slate-900">a) Personal Information</li>
          {[
            "Name, username, and profile details",
            "Email address and phone number",
            "Date of birth (Minimum age: 14 years)",
            "Profile picture and media uploads",
            "Payment details for e-commerce transactions",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <ul className="mt-4 space-y-2">
          <li className="text-base font-semibold text-slate-900">b) Automatically Collected Data</li>
          {[
            "IP address, device information, and browser type",
            "Location data (if enabled by the user)",
            "Cookies and tracking technologies",
            "Usage data such as interactions, likes, shares, and comments",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <ul className="mt-4 space-y-2">
          <li className="text-base font-semibold text-slate-900">c) Vendor and Partner Information</li>
          {[
            "Business name, contact person details",
            "Tax and payment information",
            "Contractual agreements",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    icon: <Activity className="w-4 h-4 text-violet-600" />,
    title: "3. How We Use Your Information",
    content: (
      <ul className="mt-3 space-y-2">
        {[
          "Provide and improve the Hoppity platform",
          "Enable social interactions and e-commerce transactions",
          "Personalize content and recommendations",
          "Process payments and prevent fraud",
          "Conduct analytics and improve user experience",
          "Communicate updates, offers, and promotional content",
          "Comply with legal obligations",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: <Lock className="w-4 h-4 text-violet-600" />,
    title: "4. Sharing of Information",
    content: (
      <>
        <p className="text-base leading-8 text-slate-700">
          We do not sell user data. However, we may share data with:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "Service providers (e.g., hosting, analytics, payment processors)",
            "Partners and vendors for fulfillment and transactions",
            "Advertising and marketing partners for personalized promotions",
            "Law enforcement agencies when required by law",
            "Other users based on your privacy settings (e.g., comments, posts, profile visibility)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    icon: <Users className="w-4 h-4 text-violet-600" />,
    title: "5. Data Security and Retention",
    content: (
      <ul className="mt-3 space-y-2">
        {[
          "We use industry-standard security measures to protect your data.",
          "Data is retained for as long as necessary to fulfill the purposes outlined in this policy.",
          "Users can request data deletion by contacting us at contact@triffair.com.",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: <Cookie className="w-4 h-4 text-violet-600" />,
    title: "6. User Rights and Choices",
    content: (
      <>
        <p className="text-base leading-8 text-slate-700">
          Depending on your jurisdiction (e.g., GDPR, CCPA, DPDP Act India), you have rights such
          as:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "Accessing, correcting, or deleting your data",
            "Opting out of targeted ads",
            "Withdrawing consent for data processing",
            "Requesting data portability",
            "Restricting processing under certain conditions",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-base leading-8 text-slate-700">
          To exercise these rights, contact us at contact@triffair.com.
        </p>
      </>
    ),
  },
  {
    icon: <User className="w-4 h-4 text-violet-600" />,
    title: "7. Cookies and Tracking Technologies",
    content: (
      <>
        <p className="text-base leading-8 text-slate-700">
          We use cookies, pixels, and similar technologies for:
        </p>
        <ul className="mt-3 space-y-2">
          {[
            "Authentication and security",
            "Preferences and personalization",
            "Analytics and performance tracking",
            "Advertising and marketing",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-base text-slate-700 leading-7">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-base leading-8 text-slate-700">
          Users can manage cookie preferences through browser settings.
        </p>
      </>
    ),
  },
  {
    icon: <Lock className="w-4 h-4 text-violet-600" />,
    title: "8. Children's Privacy",
    content: (
      <p className="text-base leading-8 text-slate-700">
        Hoppity is not intended for users under 14. We do not knowingly collect data from minors
        below this age. If a minor's data is inadvertently collected, contact us for deletion.
      </p>
    ),
  },
  {
    icon: <MessageSquare className="w-4 h-4 text-violet-600" />,
    title: "9. Third-Party Integrations",
    content: (
      <p className="text-base leading-8 text-slate-700">
        Hoppity integrates with third-party services like social media platforms, payment
        providers, and marketing tools. These third parties have their own privacy policies, and
        we encourage users to review them separately.
      </p>
    ),
  },
  {
    icon: <Activity className="w-4 h-4 text-violet-600" />,
    title: "10. International Data Transfers",
    content: (
      <p className="text-base leading-8 text-slate-700">
        Hoppity operates globally. By using our services, you acknowledge that your data may be
        transferred, stored, and processed in countries outside your residence, which may have
        different data protection laws.
      </p>
    ),
  },
  {
    icon: <Info className="w-4 h-4 text-violet-600" />,
    title: "11. Changes to This Privacy Policy",
    content: (
      <p className="text-base leading-8 text-slate-700">
        We may update this Privacy Policy from time to time. Users will be notified of significant
        changes through in-app notifications or emails. Continued use of Hoppity constitutes
        acceptance of the revised policy.
      </p>
    ),
  },
  {
    icon: <Users className="w-4 h-4 text-violet-600" />,
    title: "12. Contact Information",
    content: (
      <>
        <p className="text-base leading-8 text-slate-700">
          For any privacy-related concerns, reach out to us at:
        </p>
        <div className="mt-3 rounded-2xl bg-violet-50 p-4 text-base leading-8 text-slate-700">
          <p className="font-semibold text-slate-900">Triffair Technologies Pvt Ltd</p>
          <p>Bhopal, Madhya Pradesh, India</p>
          <p>
            Email:{" "}
            <a
              className="font-semibold text-violet-700 underline"
              href="mailto:contact@triffair.com?subject=Privacy%20Policy%20Inquiry&body=Hi%20Triffair%20Team%2C%0A"
            >
              contact@triffair.com
            </a>
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f1ff] px-6 py-12 lg:px-10">
      <div className="relative mb-12">
        <Link
          to="/"
          aria-label="Go back to home"
          className="absolute left-3 top-3 z-10 h-11 w-11 rounded-xl bg-linear-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center shadow-md transition hover:scale-105 sm:left-6 sm:top-4 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        <div className="max-w-3xl mx-auto pt-14 text-center sm:pt-0">
          <h1 className="text-4xl md:text-5xl font-black text-slate-950">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {sections.map(({ icon, title, content }) => (
          <div key={title} className="overflow-hidden rounded-4xl border border-violet-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-violet-50 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 shrink-0">
                {icon}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
            </div>
            <div className="px-6 py-5">{content}</div>
          </div>
        ))}

        <div className="rounded-4xl border border-violet-100 bg-white p-6">
          <p className="text-base leading-8 text-slate-700">
            This Privacy Policy complies with global privacy laws, including GDPR (EU), CCPA
            (California, USA), DPDP Act (India), and other relevant regulations.
          </p>
        </div>

        <p className="text-center text-sm text-slate-400 pb-4">
          &copy; 2026 Triffair Technologies Pvt Ltd &middot; Privacy Policy
        </p>
      </div>
    </div>
  );
}
