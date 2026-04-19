import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

type Mode = "signin" | "signup";

// ── Icons ─────────────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
      className="fill-gray-800 dark:fill-white">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// ── Shared input class ────────────────────────────────────────────────────────

const inputClass = [
  "w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900",
  "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600",
  "border-gray-200 dark:border-gray-700 outline-none transition",
  "focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900",
  "focus:border-blue-400 dark:focus:border-blue-500",
].join(" ");

// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const { session, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after a successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const [mode, setMode]               = useState<Mode>("signin");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [fullName, setFullName]       = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [signupDone, setSignupDone]   = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && session) navigate(from, { replace: true });
  }, [session, loading, navigate, from]);

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        // onAuthStateChange fires → useEffect above redirects
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() || null } },
        });
        if (error) setError(error.message);
        else setSignupDone(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setFullName('');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {/* Minimal top bar */}
      <div className="w-full px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          BodyBench
        </Link>
        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {mode === "signin"
                ? "Sign in to track your fitness progress"
                : "Start tracking your fitness today"}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl p-8">

            {signupDone ? (
              /* Post-signup confirmation */
              <div className="text-center space-y-3 py-2">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="text-green-600 dark:text-green-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">Check your inbox</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We sent a confirmation link to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
                  Click it to activate your account.
                </p>
                <button
                  onClick={() => { setSignupDone(false); switchMode("signin"); }}
                  className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline mt-2 inline-block"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                {/* OAuth buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>
                  <button
                    onClick={() => handleOAuth("github")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <GitHubIcon />
                    Continue with GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <hr className="flex-1 border-gray-200 dark:border-gray-700" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">or continue with email</span>
                  <hr className="flex-1 border-gray-200 dark:border-gray-700" />
                </div>

                {/* Email / password form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        className={inputClass}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition"
                  >
                    {submitting
                      ? "Please wait…"
                      : mode === "signin" ? "Sign In" : "Create Account"}
                  </button>
                </form>

                {/* Mode toggle */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                  {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    {mode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </>
            )}
          </div>

          {/* Back link */}
          <p className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              ← Back to home
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
