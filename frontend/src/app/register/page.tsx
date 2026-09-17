"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, LanguageSwitcherButton } from "../../context/LanguageContext";
import { API_BASE, setAuthToken, getAuthHeaders, resilientFetch } from "../../lib/api";
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  X,
  Scale,
  HeartPulse
} from "lucide-react";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"terms" | "disclaimer" | "privacy">("disclaimer");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t, isHindi } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError(
        isHindi
          ? "खाता बनाने हेतु कृपया सेवा की शर्तें, नियम और अस्वीकरण पढ़कर सहमति प्रदान करें।"
          : "Please review and agree to the Terms of Service, Conditions, and Disclaimers to create your account."
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Register
      const registerRes = await resilientFetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.detail || "Registration failed");
      }

      // 2. Login to get cookie and access token
      const loginRes = await resilientFetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!loginRes.ok) {
        throw new Error("Failed to auto-login after registration");
      }

      const loginData = await loginRes.json();
      if (loginData.access_token) {
        setAuthToken(loginData.access_token);
      }

      if (loginData.user) {
        login(loginData.user, loginData.access_token);
        router.push("/chat");
        return;
      }

      // 3. Fetch user profile
      const meRes = await resilientFetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (meRes.ok) {
        const userData = await meRes.json();
        login(userData, loginData.access_token);
        router.push("/chat");
      } else {
        router.push("/chat");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chariot-theme flex items-center justify-center px-4 py-12 text-stone-900 dark:text-stone-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-between items-center mb-2">
            <Link href="/" className="text-xs font-serif text-amber-700 dark:text-amber-300 hover:underline">
              ← {t.common.back}
            </Link>
            <LanguageSwitcherButton />
          </div>

          <div className="flex justify-center">
            <Link href="/" className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/30 blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/25 border border-amber-300/40 bg-black group-hover:scale-105 transition-transform">
                <img
                  src="/logo.png"
                  alt="GitaMitra Official Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 font-serif text-xs uppercase tracking-widest text-amber-900 dark:text-amber-300 mb-1 font-bold px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>आत्मसंयम योग</span>
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight text-stone-900 dark:text-white">
              {t.auth.registerTitle}
            </h1>
            <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 font-sans font-medium">
              {t.auth.registerSubtitle}
            </p>
          </div>
        </div>

        {/* Temple Glass Card */}
        <div className="temple-card p-6 sm:p-8 shadow-2xl">
          {/* Google Sign-Up */}
          <div className="space-y-2">
            <GoogleAuthButton mode="register" />
            <p className="text-[10px] text-center text-stone-500 dark:text-stone-400 font-sans">
              {isHindi
                ? "Google अथवा ईमेल से खाता बनाकर आप नीचे दी गई सेवा की शर्तों और अस्वीकरणों से सहमत होते हैं।"
                : "By signing up with Google or email, you agree to our Terms, Conditions & Disclaimers below."}
            </p>
          </div>

          {/* Elegant Sacred Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-500/20"></div>
            </div>
            <div className="relative px-3 bg-[#fbf9f5] dark:bg-[#120e26] rounded-full text-[10px] uppercase font-serif tracking-widest text-stone-500 dark:text-stone-400 font-semibold border border-amber-500/20">
              {t.auth.orContinueWith} email
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-serif text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5 font-serif">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                {t.auth.fullName}
              </label>
              <div className="relative font-sans">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t.auth.fullNamePlaceholder}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-2xl border border-amber-500/30 bg-white/90 dark:bg-[#120e26]/90 text-stone-900 dark:text-white placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 font-serif">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                {t.auth.email}
              </label>
              <div className="relative font-sans">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder={t.auth.emailPlaceholder}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-2xl border border-amber-500/30 bg-white/90 dark:bg-[#120e26]/90 text-stone-900 dark:text-white placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 font-serif">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                {t.auth.password}
              </label>
              <div className="relative font-sans">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder={t.auth.passwordPlaceholder}
                  className="block w-full pl-10 pr-10 py-2.5 rounded-2xl border border-amber-500/30 bg-white/90 dark:bg-[#120e26]/90 text-stone-900 dark:text-white placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sacred Agreement, Terms & Disclaimers Card */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isHindi ? "सेवा की शर्तें एवं पवित्र अस्वीकरण" : "Terms, Conditions & Sacred Disclaimers"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDocTab("disclaimer");
                    setModalOpen(true);
                  }}
                  className="text-[11px] font-serif text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  {t.auth.readFullTerms}
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] leading-relaxed text-stone-700 dark:text-stone-300 font-sans">
                <div className="flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>{isHindi ? "आध्यात्मिक AI अस्वीकरण:" : "Spiritual AI Disclaimer:"}</strong>{" "}
                    {isHindi
                      ? "गीतामित्र श्रीमद्भगवद्गीता पर आधारित एक AI मित्र है। यह कोई देवता, गुरु अथवा चिकित्सा/मानसिक परामर्शदाता नहीं है। आपात स्थिति में स्थानीय आपातकालीन सेवाओं से संपर्क करें।"
                      : "GitaMitra is an AI companion grounded in the Bhagavad Gita. It is NOT a deity, guru, or medical/psychological counselor. In crisis, contact emergency services."}
                  </span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>{isHindi ? "शर्तें एवं नियम:" : "Terms & Conditions:"}</strong>{" "}
                    {isHindi
                      ? "इस मंच का उपयोग आदरपूर्वक और व्यक्तिगत आध्यात्मिक चिंतन हेतु करें। किसी भी प्रकार का दुर्भावनापूर्ण दुरुपयोग प्रतिबंधित है।"
                      : "Use this platform with respect and for personal spiritual contemplation. Malicious abuse or unauthorized data access is prohibited."}
                  </span>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="pt-1 border-t border-amber-500/20 flex items-start space-x-2">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="mt-0.5 text-amber-600 dark:text-amber-400 cursor-pointer shrink-0"
                  aria-label="Toggle agreement checkbox"
                >
                  {agreedToTerms ? (
                    <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  )}
                </button>
                <label
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="text-[11px] text-stone-800 dark:text-stone-200 select-none cursor-pointer leading-tight font-sans font-medium"
                >
                  {isHindi ? (
                    <>
                      मैंने{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDocTab("terms");
                          setModalOpen(true);
                        }}
                        className="text-amber-700 dark:text-amber-400 underline font-semibold hover:opacity-80"
                      >
                        सेवा की शर्तें
                      </button>
                      , नियम और{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDocTab("disclaimer");
                          setModalOpen(true);
                        }}
                        className="text-amber-700 dark:text-amber-400 underline font-semibold hover:opacity-80"
                      >
                        महत्त्वपूर्ण अस्वीकरण
                      </button>{" "}
                      पढ़ लिए हैं और मैं उनसे सहमत हूँ।
                    </>
                  ) : (
                    <>
                      I have read and agree to the{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDocTab("terms");
                          setModalOpen(true);
                        }}
                        className="text-amber-700 dark:text-amber-400 underline font-semibold hover:opacity-80"
                      >
                        Terms of Service
                      </button>
                      , conditions, and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDocTab("disclaimer");
                          setModalOpen(true);
                        }}
                        className="text-amber-700 dark:text-amber-400 underline font-semibold hover:opacity-80"
                      >
                        Important Disclaimers
                      </button>
                      .
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="pt-2 font-serif">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:shadow-amber-500/45 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{isLoading ? t.common.loading : t.auth.registerButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-amber-500/20 pt-4">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-serif">
              {t.auth.haveAccount}{" "}
              <Link
                href="/login"
                className="font-bold text-amber-700 dark:text-amber-300 hover:underline ml-1"
              >
                {t.auth.signInLink}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Terms & Disclaimers Interactive Reader Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-2xl w-full max-h-[85vh] rounded-3xl bg-white dark:bg-[#120e26] border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  GitaMitra Sacred Covenant & Policies
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-amber-500/15 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Tabs */}
            <div className="flex border-b border-amber-500/20 px-4 bg-amber-500/5 text-xs font-serif font-semibold">
              <button
                onClick={() => setActiveDocTab("disclaimer")}
                className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
                  activeDocTab === "disclaimer"
                    ? "border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                }`}
              >
                Important Disclaimers
              </button>
              <button
                onClick={() => setActiveDocTab("terms")}
                className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
                  activeDocTab === "terms"
                    ? "border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                }`}
              >
                Terms of Service
              </button>
              <button
                onClick={() => setActiveDocTab("privacy")}
                className={`py-2.5 px-4 border-b-2 transition-colors cursor-pointer ${
                  activeDocTab === "privacy"
                    ? "border-amber-500 text-amber-900 dark:text-amber-200 font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
                }`}
              >
                Privacy Policy
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-stone-800 dark:text-stone-200 font-sans">
              {activeDocTab === "disclaimer" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-stone-900 dark:text-amber-100 font-serif">
                    <p className="font-bold">AI Spiritual Companion Statement</p>
                    <p className="text-xs mt-1 font-sans">
                      GitaMitra is an artificial intelligence software program created to reflect Bhagavad Gita wisdom. It is inspired by Shri Krishna&apos;s eternal teachings, but is NOT a deity, guru, or ordained human spiritual guide.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4" />
                      1. Medical & Psychological Emergencies
                    </h4>
                    <p>
                      GitaMitra is NOT a medical, psychiatric, or crisis intervention service. If you are experiencing suicidal thoughts, deep emotional crisis, or any mental health emergency, please immediately reach out to local professional emergency healthcare services or suicide prevention hotlines (such as 988 in the US or Kiran Helpline 1800-599-0019 in India).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                      2. Informational & Reflective Use
                    </h4>
                    <p>
                      All shloka commentaries, reflections, and guidance provided by GitaMitra are for spiritual education, contemplation, and personal moral reflection. They do not constitute professional legal, financial, or medical advice.
                    </p>
                  </div>
                </div>
              )}

              {activeDocTab === "terms" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                      1. Acceptance of Terms
                    </h4>
                    <p>
                      By creating an account or accessing GitaMitra, you agree to comply with and be legally bound by these Terms of Service. GitaMitra is offered as a tool for personal study and contemplation grounded in the 700 sacred verses of the Bhagavad Gita.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                      2. Acceptable Conduct & Sacred Respect
                    </h4>
                    <p>
                      Seekers must treat the sanctuary with respect. You agree not to use GitaMitra for unlawful purposes, hate speech, malicious prompt injection, or attempting unauthorized access to other seekers&apos; accounts or system databases.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                      3. Service Availability & Quotas
                    </h4>
                    <p>
                      We reserve the right to apply fair rate limits to ensure computational resources remain equitable and universally accessible for all spiritual seekers worldwide.
                    </p>
                  </div>
                </div>
              )}

              {activeDocTab === "privacy" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                      1. Strict User Memory Isolation
                    </h4>
                    <p>
                      Your spiritual inquiries, reflections, and long-term memory points are strictly isolated to your individual account ID. No other user can view or retrieve your personal conversations or reflections.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300">
                      2. Data Control & Deletion
                    </h4>
                    <p>
                      You retain full control over your data. You may view your extracted memories in the Sanctuary, export your complete chat history, or permanently delete your account and all associated data at any time from your settings.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-sans">
                Effective Date: September 2026 · GitaMitra v1.0
              </span>
              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-serif text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
