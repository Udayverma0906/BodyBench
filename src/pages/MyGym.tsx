import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import GymMap from '../components/map/GymMap';
import ClientGrid from '../components/gym/ClientGrid';
import ClientDetailPanel from '../components/gym/ClientDetailPanel';
import { supabase } from '../lib/supabase';
import type { GymClient, TrainerGym, GymInfo } from '../types/database';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms     = Date.now() - new Date(iso).getTime();
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
  const years  = Math.floor(months / 12);
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;
  return 'this month';
}

// ── MyGym ─────────────────────────────────────────────────────────────────────

/**
 * MyGym page — three views based on role:
 *
 *   Trainer (isAdmin):        Map of own gym + client grid + detail panel.
 *   Client (has admin_id):    Map of trainer's gym + join tooltip.
 *   No trainer:               Prompt to join a trainer.
 *   Superadmin drilldown:     Same as trainer view but for another trainer
 *                             (/admin/gyms/:trainerId).
 */
export default function MyGym() {
  const { user, profile, isAdmin, isSuperAdmin } = useAuth();
  const { trainerId }   = useParams<{ trainerId?: string }>();
  const routerLocation  = useLocation();
  const navigate        = useNavigate();

  // ── Trainer view state ─────────────────────────────────────────────────────
  const [clients, setClients]             = useState<GymClient[]>([]);
  const [selectedClient, setSelected]     = useState<GymClient | null>(null);
  const [clientsLoading, setClientsLoading] = useState(false);

  // Gym info for superadmin drilldown (may come via router state or RPC fetch)
  const [drilldownGym, setDrilldownGym]   = useState<GymInfo | null>(
    (routerLocation.state as { gym?: GymInfo } | null)?.gym ?? null
  );

  // ── Client view state ──────────────────────────────────────────────────────
  const [trainerGym, setTrainerGym]       = useState<TrainerGym | null | undefined>(undefined);

  // ── Loading / error ────────────────────────────────────────────────────────
  const [error, setError]                 = useState<string | null>(null);

  // Determine which view to render
  const isSuperAdminDrilldown = isSuperAdmin && !!trainerId;
  const isTrainerView  = isAdmin || isSuperAdminDrilldown;
  const isClientView   = !isAdmin && !!profile?.admin_id;

  // ── Load clients (trainer view) ────────────────────────────────────────────
  useEffect(() => {
    if (!isTrainerView || !user) return;
    setClientsLoading(true);
    const params = trainerId ? { p_trainer_id: trainerId } : {};
    supabase
      .rpc('get_gym_clients', params)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setClients((data as GymClient[]) ?? []);
        setClientsLoading(false);
      });
  }, [isTrainerView, user, trainerId]);

  // ── Load drilldown gym info (superadmin, no router state) ──────────────────
  useEffect(() => {
    if (!isSuperAdminDrilldown || drilldownGym) return;
    supabase
      .rpc('get_all_gyms')
      .then(({ data }) => {
        const all = (data as GymInfo[]) ?? [];
        setDrilldownGym(all.find(g => g.trainer_id === trainerId) ?? null);
      });
  }, [isSuperAdminDrilldown, trainerId, drilldownGym]);

  // ── Load trainer gym info (client view) ────────────────────────────────────
  useEffect(() => {
    if (!isClientView || !user) return;
    supabase
      .rpc('get_trainer_gym')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else {
          const rows = (data as TrainerGym[]) ?? [];
          setTrainerGym(rows[0] ?? null);
        }
      });
  }, [isClientView, user]);

  // ── Resolve gym coordinates ────────────────────────────────────────────────
  const gymCenter: [number, number] | null = (() => {
    if (isSuperAdminDrilldown) {
      return drilldownGym?.gym_lat && drilldownGym?.gym_lng
        ? [drilldownGym.gym_lat, drilldownGym.gym_lng] : null;
    }
    if (isTrainerView) {
      return profile?.gym_lat && profile?.gym_lng
        ? [profile.gym_lat, profile.gym_lng] : null;
    }
    if (isClientView) {
      return trainerGym?.gym_lat && trainerGym?.gym_lng
        ? [trainerGym.gym_lat, trainerGym.gym_lng] : null;
    }
    return null;
  })();

  const gymName = isSuperAdminDrilldown
    ? (drilldownGym?.gym_name ?? 'Gym')
    : isTrainerView
    ? (profile?.gym_name ?? 'Your Gym')
    : (trainerGym?.gym_name ?? 'Your Trainer\'s Gym');

  const trainerDisplayName = isSuperAdminDrilldown
    ? drilldownGym?.trainer_name
    : trainerGym?.trainer_name;

  // ── Render: no trainer ─────────────────────────────────────────────────────
  if (!isAdmin && !profile?.admin_id) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Not connected to a gym</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join a trainer using their join code to see your gym here.
          </p>
        </main>
      </div>
    );
  }

  // ── Render: trainer view ───────────────────────────────────────────────────
  if (isTrainerView) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {isSuperAdminDrilldown && (
                <button
                  onClick={() => navigate('/admin/gyms')}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline mb-2 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  All Gyms
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{gymName}</h1>
              {trainerDisplayName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Trainer: {trainerDisplayName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{clients.length}</p>
              <p className="text-xs text-gray-400">client{clients.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Map */}
          <GymMap
            center={gymCenter}
            zoom={14}
            interactive={false}
            height={280}
            markers={gymCenter ? [{
              id: 'gym',
              position: gymCenter,
              label: gymName,
              subLabel: `${clients.length} client${clients.length !== 1 ? 's' : ''}`,
            }] : []}
          />

          {/* Client section */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Clients
            </h2>
            <ClientGrid
              clients={clients}
              loading={clientsLoading}
              onClientClick={setSelected}
            />
          </div>
        </main>

        {/* Detail panel */}
        <ClientDetailPanel client={selectedClient} onClose={() => setSelected(null)} />
      </div>
    );
  }

  // ── Render: client view ────────────────────────────────────────────────────
  const joinedAgo = timeAgo(trainerGym?.trainer_joined_at ?? null);
  const isLoadingGym = trainerGym === undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Gym</h1>
          {trainerGym && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              With {trainerGym.trainer_name ?? 'your trainer'}
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">{error}</p>
        )}

        {isLoadingGym ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Map */}
            <GymMap
              center={gymCenter}
              zoom={14}
              interactive={false}
              height={300}
              markers={gymCenter ? [{
                id: 'gym',
                position: gymCenter,
                label: gymName,
                subLabel: `Joined ${joinedAgo}`,
              }] : []}
            />

            {/* Gym info card */}
            {trainerGym && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {trainerGym.gym_name ?? 'Your Gym'}
                    </p>
                    {trainerGym.trainer_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Trainer: {trainerGym.trainer_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Member since</p>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{joinedAgo}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
