import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/layout/Navbar";
import { supabase } from "../../lib/supabase";
import type { TrainerRequest } from "../../types/database";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">{label}</p>
  );
}

// ── Request card ───────────────────────────────────────────────────────────────

function RequestCard({
  req,
  onApprove,
  onReject,
}: {
  req: TrainerRequest;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);

  const handle = async (action: "approve" | "reject") => {
    setBusy(action);
    if (action === "approve") await onApprove(req.id);
    else await onReject(req.id);
    setBusy(null);
  };

  const initials = (req.user_name ?? req.user_email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-bold flex items-center justify-center shrink-0 select-none">
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {req.user_name ?? "—"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{req.user_email ?? "—"}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(req.created_at)}</p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* Message */}
      {req.message && (
        <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 leading-relaxed">
          "{req.message}"
        </p>
      )}

      {/* Actions — only for pending */}
      {req.status === "pending" && (
        <div className="flex gap-3">
          <button
            onClick={() => handle("reject")}
            disabled={!!busy}
            className="flex-1 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition"
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <button
            onClick={() => handle("approve")}
            disabled={!!busy}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition"
          >
            {busy === "approve" ? "Approving…" : "Approve"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: TrainerRequest["status"] }) {
  if (status === "pending")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium shrink-0">
        Pending
      </span>
    );
  if (status === "approved")
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 font-medium shrink-0">
        Approved
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium shrink-0">
      Rejected
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TrainerRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TrainerRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("trainer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setRequests((data as TrainerRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const approve = async (id: string) => {
    const { error: err } = await supabase.rpc("approve_trainer", { p_request_id: id });
    if (err) { alert(err.message); return; }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
  };

  const reject = async (id: string) => {
    const { error: err } = await supabase.rpc("reject_trainer", { p_request_id: id });
    if (err) { alert(err.message); return; }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
  };

  const pending  = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trainer Requests</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review and approve users who want trainer access.
            </p>
          </div>
          {pending.length > 0 && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              {pending.length} pending
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Pending section */}
        {!loading && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Pending
            </h2>
            {pending.length === 0
              ? <EmptyState label="No pending requests." />
              : pending.map(r => (
                  <RequestCard key={r.id} req={r} onApprove={approve} onReject={reject} />
                ))
            }
          </section>
        )}

        {/* Resolved section */}
        {!loading && resolved.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Previously Resolved
            </h2>
            {resolved.map(r => (
              <RequestCard key={r.id} req={r} onApprove={approve} onReject={reject} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
