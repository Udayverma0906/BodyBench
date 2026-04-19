import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";

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

const inputClass = [
  "w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-900",
  "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600",
  "border-gray-200 dark:border-gray-700 outline-none transition",
  "focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900",
  "focus:border-blue-400 dark:focus:border-blue-500",
].join(" ");

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/60 via-stone-50/40 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

      {/* Top bar */}
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

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {done ? "Password updated" : "Set new password"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {done
                ? "You can now sign in with your new password."
                : "Choose a strong password for your account."}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl p-8">
            {done ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="text-green-600 dark:text-green-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your password has been updated successfully.
                </p>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition mt-2"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New password
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                  {submitting ? "Updating…" : "Update Password"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center mt-6">
            <Link
              to="/login"
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              ← Back to sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
