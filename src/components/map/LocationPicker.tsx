import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents, useMap } from 'react-leaflet';

interface LatLng { lat: number; lng: number }

interface Props {
  value: LatLng | null;
  onChange: (val: LatLng | null) => void;
}

// ── Click handler — sits inside MapContainer ──────────────────────────────────

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

// ── Re-center when value changes (e.g. geolocation) ──────────────────────────

function RecenterMap({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], 14, { animate: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);
  return null;
}

// ── LocationPicker ────────────────────────────────────────────────────────────

/**
 * LocationPicker — compact Leaflet map for picking a gym location.
 * Used inside the trainer request form in the profile popup.
 *
 * - Click on the map to drop a pin.
 * - "Use my location" uses browser geolocation.
 * - Calls onChange with { lat, lng } on every location update.
 */
export default function LocationPicker({ value, onChange }: Props) {
  // Wide view centered roughly over India as default
  const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
  const DEFAULT_ZOOM = 4;

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently ignore — user may have denied permission
    );
  }, [onChange]);

  return (
    <div className="space-y-1.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {value ? 'Tap map to adjust pin' : 'Tap map to place gym pin'}
        </p>
        <button
          type="button"
          onClick={handleGeolocate}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M12 1v4M12 19v4M1 12h4M19 12h4" />
          </svg>
          Use my location
        </button>
      </div>

      {/* Map */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600"
        style={{ height: 180, isolation: 'isolate' }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          zoomControl
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onChange={(lat, lng) => onChange({ lat, lng })} />
          <RecenterMap value={value} />
          {value && (
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={10}
              pathOptions={{
                color: '#7c3aed',
                fillColor: '#7c3aed',
                fillOpacity: 0.85,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordinates display */}
      {value ? (
        <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 text-right">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      ) : (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right">No pin set</p>
      )}
    </div>
  );
}
