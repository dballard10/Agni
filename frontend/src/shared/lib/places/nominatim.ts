import type { TaskLocation } from "../../types/weekly";

// Nominatim API response structure (partial)
export interface NominatimPlace {
  place_id: string;
  osm_type: string;
  osm_id: string;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  type?: string;
  class?: string;
}

export interface PlaceSuggestion {
  id: string;
  label: string;
  secondaryLabel?: string;
  lat: number;
  lng: number;
  raw: NominatimPlace;
}

export interface SearchOptions {
  signal?: AbortSignal;
  lat?: number;
  lng?: number;
  limit?: number;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// Format a place into a user-friendly label
function formatPlaceLabel(place: NominatimPlace): {
  label: string;
  secondaryLabel?: string;
} {
  const addr = place.address;
  const name = place.name || "";

  if (!addr) {
    return { label: place.display_name };
  }

  // Build address parts
  const streetParts: string[] = [];
  if (addr.house_number) streetParts.push(addr.house_number);
  if (addr.road) streetParts.push(addr.road);
  const street = streetParts.join(" ");

  const locality = addr.city || addr.town || addr.village || "";
  const state = addr.state || "";
  const postcode = addr.postcode || "";

  // Primary label: name or street
  let primary = name || street || locality;

  // Secondary label: address details
  const secondaryParts: string[] = [];
  if (name && street) secondaryParts.push(street);
  if (locality && locality !== primary) secondaryParts.push(locality);
  if (state && state !== locality) secondaryParts.push(state);
  if (postcode) secondaryParts.push(postcode);

  const secondary = secondaryParts.join(", ");

  // If no good primary, fall back to display_name
  if (!primary) {
    return { label: place.display_name };
  }

  return {
    label: primary,
    secondaryLabel: secondary || undefined,
  };
}

// Search places using Nominatim
export async function searchPlaces(
  query: string,
  options: SearchOptions = {}
): Promise<PlaceSuggestion[]> {
  const { signal, lat, lng, limit = 5 } = options;

  if (!query.trim()) {
    return [];
  }

  const hasPosition = lat !== undefined && lng !== undefined;
  const requestedLimit = hasPosition
    ? Math.min(Math.max(limit * 4, 10), 40)
    : limit;

  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: String(requestedLimit),
  });

  // Add location bias if available (viewbox around user location)
  if (hasPosition) {
    const radiusKm = 50;
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.max(Math.cos(toRadians(lat)), 0.01));
    const viewbox = [
      lng - lngDelta,
      lat + latDelta,
      lng + lngDelta,
      lat - latDelta,
    ].join(",");
    params.set("viewbox", viewbox);
    params.set("bounded", "0"); // Prefer results in viewbox but don't exclude others
  }

  const url = `${NOMINATIM_BASE}?${params.toString()}`;

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      // Nominatim requires a User-Agent; browsers set one automatically
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`);
  }

  const data: NominatimPlace[] = await response.json();

  const sorted = hasPosition
    ? data
        .map((place) => {
          const placeLat = parseFloat(place.lat);
          const placeLng = parseFloat(place.lon);
          return {
            place,
            distanceKm: haversineKm(lat, lng, placeLat, placeLng),
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit)
        .map(({ place }) => place)
    : data;

  return sorted.map((place) => {
    const { label, secondaryLabel } = formatPlaceLabel(place);
    return {
      id: place.place_id,
      label,
      secondaryLabel,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      raw: place,
    };
  });
}

// Convert a PlaceSuggestion to a TaskLocation
export function suggestionToTaskLocation(
  suggestion: PlaceSuggestion
): TaskLocation {
  // Build the full label for display
  const fullLabel = suggestion.secondaryLabel
    ? `${suggestion.label}, ${suggestion.secondaryLabel}`
    : suggestion.label;

  // Build an Apple Maps URL (works well on Mac/iOS)
  // Format: https://maps.apple.com/?ll=lat,lng&q=name
  const mapUrl = `https://maps.apple.com/?ll=${suggestion.lat},${suggestion.lng}&q=${encodeURIComponent(suggestion.label)}`;

  return {
    label: fullLabel,
    mapUrl,
    lat: suggestion.lat,
    lng: suggestion.lng,
    provider: "nominatim",
    nominatim: {
      placeId: suggestion.raw.place_id,
      osmType: suggestion.raw.osm_type,
      osmId: suggestion.raw.osm_id,
      raw: suggestion.raw,
    },
  };
}

// Geolocation helper
let cachedPosition: { lat: number; lng: number } | null = null;
let geolocationPromise: Promise<{ lat: number; lng: number } | null> | null =
  null;

export function requestGeolocation(): Promise<{
  lat: number;
  lng: number;
} | null> {
  // Return cached position if available
  if (cachedPosition) {
    return Promise.resolve(cachedPosition);
  }

  // Return existing promise if already requesting
  if (geolocationPromise) {
    return geolocationPromise;
  }

  // Check if geolocation is available
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  geolocationPromise = new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        geolocationPromise = null;
        resolve(cachedPosition);
      },
      () => {
        // Permission denied or error
        geolocationPromise = null;
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });

  return geolocationPromise;
}

// Debounce helper
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

