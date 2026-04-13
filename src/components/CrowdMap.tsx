import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/data/mockLocations';
import { CrowdBadge } from './CrowdBadge';
import { TrendingUp, TrendingDown, Minus, LocateFixed } from 'lucide-react';

const Metropolis_CENTER: [number, number] = [13.0500, 80.2500];
const DEFAULT_ZOOM = 12;
const GOOGLE_BLUE = '#4285F4';

const FLY_DURATION = 1.5;

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: FLY_DURATION });
  }, [lat, lng, map]);
  return null;
}

function CenterOnUser({
  position,
  shouldCenter,
  onCentered,
}: {
  position: { lat: number; lng: number } | null;
  shouldCenter: boolean;
  onCentered: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (position && shouldCenter) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 15), { duration: FLY_DURATION });
      onCentered();
    }
  }, [position, shouldCenter, map, onCentered]);
  return null;
}

interface CrowdMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  onNavigate?: (location: Location) => void;
  selectedLocation?: Location | null;
}

export function CrowdMap({ locations, onLocationSelect, onNavigate, selectedLocation }: CrowdMapProps) {
  const mapRef = useRef<L.Map>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [centerOnUserNext, setCenterOnUserNext] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    setCenterOnUserNext(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const posObj = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPosition(posObj);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const handleCentered = useCallback(() => setCenterOnUserNext(false), []);

  const TrendIcon = (trend: Location['trend']) => {
    const icons = { rising: TrendingUp, falling: TrendingDown, stable: Minus };
    return icons[trend];
  };

  const icons = useMemo(() => {
    const createIcon = (color: string) => L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="map-marker-container">
          <div class="map-marker-dot" style="background: ${color};"></div>
          <div class="map-marker-pulse" style="background: ${color};"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });

    return {
      low: createIcon('#10B981'),
      medium: createIcon('#F59E0B'),
      high: createIcon('#EF4444'),
      currentLocation: createIcon(GOOGLE_BLUE),
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={Metropolis_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {selectedLocation && (
          <MapRecenter lat={selectedLocation.lat} lng={selectedLocation.lng} />
        )}
        <CenterOnUser
          position={userPosition}
          shouldCenter={centerOnUserNext}
          onCentered={handleCentered}
        />
        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={icons.currentLocation}
            zIndexOffset={1000}
          >
            <Popup className="custom-popup">
              <div className="p-4 min-w-[220px]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[#4285F4]/10">
                    <LocateFixed className="w-4 h-4 text-[#4285F4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">You are here</h3>
                    <p className="text-xs text-muted-foreground">Current location</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full py-2 px-4 bg-[#4285F4] text-white rounded-lg text-sm font-medium hover:bg-[#4285F4]/90 transition-colors"
                  onClick={goToMyLocation}
                >
                  Center map on me
                </button>
              </div>
            </Popup>
          </Marker>
        )}
        {locations.map((location) => {
          const Icon = TrendIcon(location.trend);
          const capacityPercentage = Math.round((location.currentCount / location.capacity) * 100);

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={icons[location.crowdLevel]}
              eventHandlers={{
                click: () => onLocationSelect?.(location),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-4 min-w-[220px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{location.name}</h3>
                      <p className="text-xs text-muted-foreground">{location.address}</p>
                    </div>
                    <CrowdBadge level={location.crowdLevel} size="sm" showPulse={false} />
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trend</span>
                      <span className="flex items-center gap-1 capitalize">
                        <Icon className={`w-3.5 h-3.5 ${location.trend === 'rising' ? 'text-crowd-high' :
                          location.trend === 'falling' ? 'text-crowd-low' :
                            'text-muted-foreground'
                          }`} />
                        {location.trend}
                      </span>
                    </div>
                  </div>

                  <button
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    onClick={() => onNavigate?.(location)}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <button
        type="button"
        onClick={goToMyLocation}
        disabled={geoLoading}
        className="absolute bottom-20 lg:bottom-4 right-4 z-[1000] bg-card border border-border rounded-full p-2.5 shadow-lg hover:bg-secondary transition-colors disabled:opacity-50"
        aria-label="My location"
      >
        <LocateFixed className="w-5 h-5 text-[#4285F4]" />
      </button>
    </div>
  );
}
