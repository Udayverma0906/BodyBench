import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import GymMap from '../../components/map/GymMap';
import type { GymInfo } from '../../types/database';
import { supabase } from '../../lib/supabase';
import type { GymMarkerData } from '../../components/map/GymMap';

// ── AllGymsPage ───────────────────────────────────────────────────────────────

/**
 * AllGymsPage — superadmin view of every registered gym on an interactive map.
 * Click a marker or trainer card → drills into that trainer's My Gym view.
 */
export default function AllGymsPage() {
  const navigate = useNavigate();
  const [gyms, setGyms]           = useState<GymInfo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeId, setActiveId]   = useState<string | null>(null);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    supabase
      .rpc('get_all_gyms')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setGyms((data as GymInfo[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = gyms.filter(g => {
    const q = search.toLowerCase();
    return (
      !q ||
      (g.trainer_name ?? '').toLowerCase().includes(q) ||
      (g.gym_name     ?? '').toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q)
    );
  });

  // Build map markers only for gyms that have location data
  const markers: GymMarkerData[] = gyms
    .filter(g => g.gym_lat && g.gym_lng)
    .map(g => ({
      id:       g.trainer_id,
      position: [g.gym_lat!, g.gym_lng!],
      label:    g.gym_name ?? g.trainer_name ?? 'Gym',
      subLabel: `${g.client_count} client${g.client_count !== 1 ? 's' : ''}`,
    }));

  // Map center: average of all gym locations, or null if none
  const mapCenter: [number, number] | null = (() => {
    const withLoc = gyms.filter(g => g.gym_lat && g.gym_lng);
    if (withLoc.length === 0) return null;
    const lat = withLoc.reduce((s, g) => s + g.gym_lat!, 0) / withLoc.length;
    const lng = withLoc.reduce((s, g) => s + g.gym_lng!, 0) / withLoc.length;
    return [lat, lng];
  })();

  const handleDrilldown = (gym: GymInfo) => {
    navigate(`/admin/gyms/${gym.trainer_id}`, { state: { gym } });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Gyms</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {gyms.length} active trainer{gyms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {gyms.reduce((s, g) => s + g.client_count, 0)}
              </p>
              <p className="text-xs text-gray-400">total clients</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-xl px-4 py-3">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Interactive map */}
            <GymMap
              center={mapCenter}
              zoom={13}
              interactive
              markers={markers}
              activeMarkerId={activeId ?? undefined}
              onMarkerClick={id => {
                setActiveId(id);
                const gym = gyms.find(g => g.trainer_id === id);
                if (gym) handleDrilldown(gym);
              }}
              height={360}
            />

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search trainers or gyms…"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />

            {/* Trainer cards */}
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
                {search ? 'No gyms match your search.' : 'No active trainers yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(g => (
                  <GymCard
                    key={g.trainer_id}
                    gym={g}
                    isActive={activeId === g.trainer_id}
                    onHover={id => setActiveId(id)}
                    onClick={() => handleDrilldown(g)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── GymCard ───────────────────────────────────────────────────────────────────

function GymCard({
  gym,
  isActive,
  onHover,
  onClick,
}: {
  gym: GymInfo;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}) {
  const displayName  = gym.trainer_name ?? gym.email.split('@')[0];
  const initials     = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(gym.trainer_id)}
      onMouseLeave={() => onHover(null)}
      className={`w-full text-left rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-150 bg-white dark:bg-zinc-900 ${
        isActive
          ? 'border-indigo-400 dark:border-indigo-600 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-900'
          : 'border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-bold flex items-center justify-center shrink-0 select-none">
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {gym.trainer_name ?? gym.email}
          </p>
          {gym.trainer_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{gym.email}</p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {gym.gym_name ?? 'No gym name'}
        </div>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {gym.client_count} client{gym.client_count !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}
