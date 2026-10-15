"use client";

import { useEffect, useRef, useState } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface SearchResult {
  label: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface GooglePlacesSearchProps {
  placeholder?: string;
  onSelect: (result: SearchResult) => void;
  autoFocus?: boolean;
}

/**
 * Google Places Autocomplete search box.
 * Shows real-time suggestions as the user types, exactly like Google Maps.
 */
export function GooglePlacesSearch({
  placeholder = "Search for a place...",
  onSelect,
  autoFocus = false,
}: GooglePlacesSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualResults, setManualResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [value, setValue] = useState("");

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !inputRef.current) return;

    // Wait for Google Maps to load
    const checkGoogle = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        clearInterval(checkGoogle);

        const autocomplete = new google.maps.places.Autocomplete(
          inputRef.current!,
          {
            types: ["geocode", "establishment"],
            componentRestrictions: { country: "ng" },
            fields: ["formatted_address", "geometry", "name", "place_id"],
          },
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            onSelect({
              label: place.formatted_address || place.name || "Selected location",
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id,
            });
            setValue(place.formatted_address || place.name || "");
            setShowResults(false);
          }
        });

        autocompleteRef.current = autocomplete;
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, [onSelect]);

  // Fallback: manual search via Geocoding API
  const handleManualSearch = async () => {
    if (!value.trim() || !GOOGLE_MAPS_KEY) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          value + ", Nigeria",
        )}&key=${GOOGLE_MAPS_KEY}&language=en&region=ng`,
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const results: SearchResult[] = data.results.slice(0, 5).map(
          (r: {
            formatted_address: string;
            geometry: { location: { lat: number; lng: number } };
            place_id?: string;
          }) => ({
            label: r.formatted_address,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
            placeId: r.place_id,
          }),
        );
        setManualResults(results);
        setShowResults(true);
      }
    } catch (err) {
      console.error("[places search] error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectManual = (result: SearchResult) => {
    onSelect(result);
    setValue(result.label);
    setShowResults(false);
    setManualResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!e.target.value) setShowResults(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleManualSearch();
            }
          }}
          onFocus={() => autoFocus && inputRef.current?.select()}
          placeholder={placeholder}
          className="pl-9 pr-9 rounded-full"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setShowResults(false);
              setManualResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Manual search results (fallback) */}
      {showResults && manualResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-[2000] max-h-64 overflow-y-auto">
          {manualResults.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectManual(result)}
              className="w-full text-left px-3 py-2.5 hover:bg-muted transition border-b border-border/40 last:border-0 flex items-start gap-2"
            >
              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-medium truncate">{result.label}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
