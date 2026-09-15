"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { API_BASE, setAuthToken, getAuthHeaders, resilientFetch } from "../../lib/api";
import { ArrowRight, Lock, Mail, Sparkles, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Login to get token and cookie
      const res = await resilientFetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
      }

      if (data.user) {
        login(data.user, data.access_token);
        router.push("/chat");
        return;
      }

      // 2. Fetch user profile
      const meRes = await resilientFetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      
      if (meRes.ok) {
        const userData = await meRes.json();
        login(userData, data.access_token);
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
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
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
              <span>गीतामित्र संवाद</span>
            </div>
            <h1 className="text-2xl font-bold font-serif tracking-tight text-stone-900 dark:text-white">
              Return to GitaMitra
            </h1>
            <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 font-sans font-medium">
              Enter your credentials to return to your spiritual sanctuary
            </p>
          </div>
        </div>

        {/* Temple Glass Card */}
        <div className="temple-card p-8 shadow-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-serif text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5 font-serif">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative font-sans">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="seeker@gitamitra.org"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-2xl border border-amber-500/30 bg-white/90 dark:bg-[#120e26]/90 text-stone-900 dark:text-white placeholder-stone-400 text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 font-serif">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative font-sans">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
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

            <div className="pt-2 font-serif">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:shadow-amber-500/45 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{isLoading ? "Entering Sanctuary..." : "Enter Spiritual Sanctuary"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-amber-500/20 pt-4">
            <p className="text-xs text-stone-600 dark:text-stone-300 font-serif">
              New Seeker?{" "}
              <Link
                href="/register"
                className="font-bold text-amber-700 dark:text-amber-300 hover:underline ml-1"
              >
                Begin Your Journey
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
