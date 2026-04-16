import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';

export interface GymMarkerData {
  id: string;
  position: [number, number];
  /** Primary label shown in tooltip (e.g. gym name or client name) */
  label?: string;
  /** Secondary label (e.g. "12 clients" or "Joined 3mo ago") */
  subLabel?: string;
  /** CSS hex color. Defaults to purple. */
  color?: string;
}

interface Props {
  /** Map center coordinates [lat, lng]. Pass null to show a placeholder. */
  center: [number, number] | null;
  zoom?: number;
  /** If false (default) all map interactions are disabled — static display. */
  interactive?: boolean;
  markers?: GymMarkerData[];
  /** ID of the currently active/selected marker — rendered larger. */
  activeMarkerId?: string;
  onMarkerClick?: (id: string) => void;
  height?: number;
  className?: string;
}

/**
 * GymMap — reusable Leaflet map widget.
 *
 * Used in three contexts:
 *   - Trainer's "My Gym" page: static map, single marker, no interaction.
 *   - Client's "My Gym" page: static map, single marker with join tooltip.
 *   - Superadmin "All Gyms": interactive map, many markers, click to drill down.
 */
export default function GymMap({
  center,
  zoom = 14,
  interactive = false,
  markers = [],
  activeMarkerId,
  onMarkerClick,
  height = 320,
  className = '',
}: Props) {
  if (!center) {
    return (
      <div
        style={{ height }}
        className={`rounded-2xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm text-gray-400 dark:text-gray-500">No gym location set</p>
      </div>
    );
  }

  return (
    <div style={{ height, isolation: 'isolate' }} className={`rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Gym/home marker — always show a marker at center if no explicit markers */}
        {markers.length === 0 && (
          <CircleMarker
            center={center}
            radius={12}
            pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.85, weight: 3 }}
          />
        )}

        {markers.map((m) => {
          const isActive = m.id === activeMarkerId;
          return (
            <CircleMarker
              key={m.id}
              center={m.position}
              radius={isActive ? 14 : 10}
              pathOptions={{
                color: m.color ?? '#7c3aed',
                fillColor: m.color ?? '#7c3aed',
                fillOpacity: 0.85,
                weight: isActive ? 4 : 2,
              }}
              eventHandlers={
                onMarkerClick ? { click: () => onMarkerClick(m.id) } : {}
              }
            >
              {(m.label || m.subLabel) && (
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                  <div className="min-w-max">
                    {m.label && (
                      <p className="text-xs font-semibold text-gray-900">{m.label}</p>
                    )}
                    {m.subLabel && (
                      <p className="text-xs text-gray-500">{m.subLabel}</p>
                    )}
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
