import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import BasePopup from "../ui/BasePopup";
import LocationPicker from "../map/LocationPicker";
import { supabase } from "../../lib/supabase";
import type { Profile, TrainerGym, TrainerRequest } from "../../types/database";

// ── Update these two constants with your own links ──────────────────────────
const LINKEDIN_URL = "https://www.linkedin.com/in/uday-verma0906/";
const GITHUB_URL   = "https://github.com/Udayverma0906/BodyBench";
const APP_VERSION  = "2.0.0";
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

// ── TrainerSection — shown inside the profile popup for non-admin users ────────

function TrainerSection({ profile, userId, onRefresh }: {
  profile: Profile | null;
  userId: string;
  onRefresh: () => Promise<void>;
}) {
  const [code, setCode]             = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [trainerName, setTrainerName] = useState<string | null>(null);

  // Use get_trainer_gym RPC — it resolves trainer_name from both profiles
  // and OAuth metadata, same source as the MyGym page uses.
  useEffect(() => {
    if (!profile?.admin_id) return;
    let mounted = true;
    supabase
      .rpc("get_trainer_gym")
      .then(({ data }) => {
        if (mounted) {
          const rows = (data as TrainerGym[]) ?? [];
          setTrainerName(rows[0]?.trainer_name ?? null);
        }
      });
    return () => { mounted = false; };
  }, [profile?.admin_id]);

  const join = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.rpc("join_trainer", { p_code: trimmed });

    if (err) {
      setError("Code not found. Check with your trainer.");
    } else {
      setCode("");
      await onRefresh();
    }
    setLoading(false);
  };

  const leave = async () => {
    setLoading(true);
    setLeaveError(null);
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ admin_id: null })
      .eq("id", userId);
    if (updateErr) {
      setLeaveError("Couldn't leave. Please try again.");
      setLoading(false);
    } else {
      await onRefresh();
      setLoading(false);
      setConfirming(false);
    }
  };

  // ── Connected state ────────────────────────────────────────────────────────
  if (profile?.admin_id) {
    return (
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-1 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {trainerName ?? "Trainer"}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Connected ✓</p>
          </div>
          {confirming ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setConfirming(false); setLeaveError(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={leave}
                disabled={loading}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition"
              >
                {loading ? "…" : "Leave"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition"
            >
              Leave trainer
            </button>
          )}
        </div>
        {leaveError && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{leaveError}</p>
        )}
      </div>
    );
  }

  // ── Join state ─────────────────────────────────────────────────────────────
  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-1 mb-4">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Join a Trainer</p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="Enter code"
          maxLength={8}
          className="flex-1 px-3 py-1.5 text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <button
          onClick={join}
          disabled={loading || !code.trim()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition"
        >
          {loading ? "…" : "Join"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

// ── BecomeTrainerSection — shown inside the profile popup for non-admin users ──

function BecomeTrainerSection({ userId }: { userId: string }) {
  const [request, setRequest]         = useState<TrainerRequest | null | undefined>(undefined);
  const [message, setMessage]         = useState("");
  const [gymName, setGymName]         = useState("");
  const [gymLocation, setGymLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [newRejection, setNewRejection] = useState(false);

  const storageKey = `bb_trainer_req_${userId}`;

  // Fetch existing request; detect pending → rejected change for notification (#9)
  useEffect(() => {
    supabase
      .from("trainer_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const req = (data as TrainerRequest) ?? null;
        setRequest(req);
        if (req?.status === "rejected" && localStorage.getItem(storageKey) === "pending") {
          setNewRejection(true);
        }
        if (req) localStorage.setItem(storageKey, req.status);
      });
  }, [userId, storageKey]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.rpc("submit_trainer_request", {
      p_message:  message.trim() || null,
      p_gym_name: gymName.trim() || null,
      p_gym_lat:  gymLocation?.lat ?? null,
      p_gym_lng:  gymLocation?.lng ?? null,
    });
    if (err) {
      setError(err.message);
    } else {
      const { data } = await supabase
        .from("trainer_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const req = (data as TrainerRequest) ?? null;
      setRequest(req);
      if (req) localStorage.setItem(storageKey, req.status);
      setMessage("");
      setShowForm(false);
    }
    setLoading(false);
  };

  const dismissRejection = () => {
    setNewRejection(false);
    localStorage.setItem(storageKey, "rejected");
  };

  // Still loading initial state
  if (request === undefined) return null;

  // Approved — they're admin now, this section won't show anyway
  if (request?.status === "approved") return null;

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-1 mb-4 space-y-3">
      {/* #9 — new rejection notification banner */}
      {newRejection && (
        <div className="flex items-start justify-between gap-2 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2.5">
          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
            Your trainer request was reviewed and not approved.
          </p>
          <button
            onClick={dismissRejection}
            className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0 transition"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pending state */}
      {request?.status === "pending" && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Trainer Access</p>
            <p className="text-xs text-amber-500 dark:text-amber-400 mt-0.5">Request pending review…</p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium">
            Pending
          </span>
        </div>
      )}

      {/* Rejected state */}
      {request?.status === "rejected" && !showForm && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Trainer Access</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Request was not approved.</p>
          </div>
          <button
            onClick={() => { dismissRejection(); setRequest(null); setShowForm(true); }}
            className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
          >
            Try again
          </button>
        </div>
      )}

      {/* No request yet — show CTA */}
      {!request && !showForm && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Are you a trainer?</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Request access to manage clients.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
          >
            Request
          </button>
        </div>
      )}

      {/* Request form */}
      {showForm && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Request Trainer Access</p>

          {/* Gym name */}
          <input
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            placeholder="Gym name (e.g. FitZone Gym)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />

          {/* Location picker */}
          <LocationPicker value={gymLocation} onChange={setGymLocation} />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: tell us a bit about yourself…"
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition"
          />
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="flex-1 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition"
            >
              {loading ? "Sending…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── JoinCodeSection — shown for admin/trainer users to share their code
// Read-only display + copy. Regeneration is managed in Field Config page.

function JoinCodeSection({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!profile.join_code) return;
    await navigator.clipboard.writeText(profile.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile.join_code) return null;

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-1 mb-4">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        Gym Join Code
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 font-mono text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-3 py-2 rounded-lg tracking-widest text-center select-all">
          {profile.join_code}
        </code>
        <button
          onClick={copy}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition min-w-[64px]"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ── EditProfileSection ────────────────────────────────────────────────────────

function EditProfileSection({ userId, currentName, onSaved }: {
  userId: string;
  currentName: string;
  onSaved: () => void | Promise<void>;
}) {
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(currentName);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);

    // Update auth metadata → triggers onAuthStateChange → Navbar display refreshes automatically
    const { error: authErr } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    if (authErr) { setError(authErr.message); setSaving(false); return; }

    // Update profiles table so RPCs (get_all_users_admin, get_gym_clients, etc.) return new name
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ full_name: trimmed } as never)
      .eq('id', userId);
    if (dbErr) { setError(dbErr.message); setSaving(false); return; }

    setSaving(false);
    setEditing(false);
    onSaved();
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setName(currentName); setEditing(true); }}
        className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition flex items-center gap-1 mt-0.5"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2.414a2 2 0 01.586-1.414z" />
        </svg>
        Edit name
      </button>
    );
  }

  return (
    <div className="w-full mt-2 space-y-2">
      <input
        autoFocus
        value={name}
        onChange={e => { setName(e.target.value); setError(null); }}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        placeholder="Your full name"
        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(false)}
          className="flex-1 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

export default function Navbar({ onBack }: Props) {
  const { theme, toggle } = useTheme();
  const { user, profile, isAdmin, isSuperAdmin, signOut, refreshProfile } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending trainer request count — superadmin only
  useEffect(() => {
    if (!isSuperAdmin) return;
    supabase
      .from("trainer_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => setPendingCount(count ?? 0));
  }, [isSuperAdmin]);

  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture;
  const displayName: string =
    profile?.full_name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ?? "User";

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    setShowProfile(false);
    await signOut();
  };

  return (
    <>
      <nav className="sticky top-0 w-full px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800" style={{ zIndex: 1050 }}>
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
          {user && (
            <Link
              to="/gym"
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              My Gym
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/fields"
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950 transition"
            >
              Fields
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/admin/gyms"
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950 transition"
            >
              Gyms
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/admin/users"
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950 transition"
            >
              Users
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/admin/requests"
              className="relative px-3 py-1.5 text-sm font-medium rounded-lg text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950 transition"
            >
              Trainers
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
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
          <div className="text-center flex flex-col items-center">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{displayName}</p>
            {user?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
            )}
            {user && !avatarUrl && (
              <EditProfileSection
                userId={user.id}
                currentName={profile?.full_name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''}
                onSaved={refreshProfile}
              />
            )}
          </div>
        </div>

        {/* Join code — admin/trainer users only */}
        {user && isAdmin && profile && (
          <JoinCodeSection profile={profile} />
        )}

        {/* Trainer section — all users (admins can also be a client of another trainer) */}
        {user && (
          <TrainerSection
            profile={profile}
            userId={user.id}
            onRefresh={refreshProfile}
          />
        )}

        {/* Become a Trainer — non-admin users only */}
        {user && !isAdmin && (
          <BecomeTrainerSection userId={user.id} />
        )}

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
