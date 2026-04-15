import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import BasePopup from "../ui/BasePopup";

// ── Update these two constants with your own links ──────────────────────────
const LINKEDIN_URL = "https://www.linkedin.com/in/uday-verma0906/";
const GITHUB_URL   = "https://github.com/Udayverma0906/BodyBench";
const APP_VERSION  = "1.5.0";
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  onBack?: () => void;
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
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

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function Navbar({ onBack }: Props) {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
  const displayName: string =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? "User";

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    setShowProfile(false);
    await signOut();
  };

  return (
    <>
      <nav className="sticky top-0 z-10 w-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        {/* Left — brand + optional back */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Go back"
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft />
            </button>
          )}
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            BodyBench
          </Link>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1">
          {user && (
            <Link
              to="/dashboard"
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Dashboard
            </Link>
          )}
          {user && (
            <Link
              to="/history"
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              History
            </Link>
          )}

          <button
            onClick={() => setShowDetails(true)}
            aria-label="App details"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <InfoIcon />
          </button>

          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* Auth */}
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200 dark:border-gray-700">
            {user ? (
              <button
                onClick={() => setShowProfile(true)}
                aria-label="Your profile"
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition focus:outline-none"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="w-full h-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold flex items-center justify-center select-none">
                    {user.email?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                )}
              </button>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Profile popup */}
      <BasePopup
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="Your Profile"
      >
        <div className="flex flex-col items-center gap-3 mb-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900"
            />
          ) : (
            <span className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-2xl font-bold flex items-center justify-center select-none">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </span>
          )}
          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{displayName}</p>
            {user?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition"
        >
          Sign Out
        </button>
      </BasePopup>

      {/* Sign-out confirm popup */}
      <BasePopup
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Sign Out"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to sign out?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSignOutConfirm(false)}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition"
          >
            Sign Out
          </button>
        </div>
      </BasePopup>

      {/* Details popup */}
      <BasePopup
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="About BodyBench"
      >
        {/* Version badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
            v{APP_VERSION}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Fitness Assessment App
          </span>
        </div>

        <div className="space-y-3">
          {/* Created by */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">Created by</span>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Uday Verma
              <ExternalLinkIcon />
            </a>
          </div>

          {/* GitHub repo */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">GitHub</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Udayverma0906/BodyBench
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </BasePopup>
    </>
  );
}
