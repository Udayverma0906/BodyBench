import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { useTheme } from '../../context/ThemeContext';

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const INDIGO = '#6366f1';

export interface GymMarkerData {
  id: string;
  position: [number, number];
  label?: string;
  subLabel?: string;
  color?: string;
}

interface Props {
  center: [number, number] | null;
  zoom?: number;
  interactive?: boolean;
  markers?: GymMarkerData[];
  activeMarkerId?: string;
  onMarkerClick?: (id: string) => void;
  height?: number;
  className?: string;
}

// Auto-fits the map viewport to show all markers on mount
function FitBounds({ markers }: { markers: GymMarkerData[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length < 2) return;
    map.fitBounds(
      markers.map(m => m.position),
      { padding: [48, 48], maxZoom: 13 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

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
  const { theme } = useTheme();
  const tileUrl = theme === 'dark' ? TILE_DARK : TILE_LIGHT;

  if (!center) {
    return (
      <div
        style={{ height }}
        className={`rounded-2xl bg-gray-100 dark:bg-zinc-800 flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700 ${className}`}
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
    <div style={{ height, isolation: 'isolate' }} className={`rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 ${className}`}>
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
        <TileLayer url={tileUrl} />

        {markers.length > 1 && <FitBounds markers={markers} />}

        {markers.length === 0 && (
          <CircleMarker
            center={center}
            radius={12}
            pathOptions={{ color: INDIGO, fillColor: INDIGO, fillOpacity: 0.85, weight: 3 }}
          />
        )}

        {markers.map((m) => {
          const isActive = m.id === activeMarkerId;
          const color = m.color ?? INDIGO;
          return (
            <CircleMarker
              key={m.id}
              center={m.position}
              radius={isActive ? 14 : 10}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isActive ? 4 : 2,
              }}
              eventHandlers={
                onMarkerClick ? { click: () => onMarkerClick(m.id) } : {}
              }
            >
              {(m.label || m.subLabel) && (
                <Tooltip
                  direction="top"
                  offset={[0, -14]}
                  opacity={1}
                  permanent={false}
                  className="gym-map-tooltip"
                >
                  {m.label && (
                    <span className="gym-map-tooltip__label">{m.label}</span>
                  )}
                  {m.subLabel && (
                    <span className="gym-map-tooltip__sub">{m.subLabel}</span>
                  )}
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
