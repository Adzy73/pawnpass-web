"use client";

import { useState, useEffect, useRef } from "react";

interface AddressResult {
  id: string;
  place_name: string;
  text: string;
  context: any[];
  center: [number, number];
}

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, addressData?: AddressResult) => void;
  required?: boolean;
  className?: string;
}

export default function AddressAutocomplete({
  label = "Address",
  placeholder = "Start typing your address...",
  value,
  onChange,
  required = false,
  className = "",
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function searchAddress(searchQuery: string) {
    if (searchQuery.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
      if (!token) {
        console.error("NEXT_PUBLIC_MAPBOX_TOKEN not configured");
        return;
      }

      // Restrict to Australia, type=address for street-level results
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${token}&country=au&types=address&autocomplete=true&limit=5`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Mapbox search failed");

      const data = await res.json();
      setResults(data.features || []);
      setShowDropdown(true);
    } catch (err) {
      console.error("Address search error:", err);
    }
    setLoading(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAddress(val);
    }, 300);
  }

  function handleSelect(result: AddressResult) {
    setQuery(result.place_name);
    onChange(result.place_name, result);
    setShowDropdown(false);
    setResults([]);
  }

  // Parse address components from Mapbox context
  function getSubLabel(result: AddressResult): string {
    const parts: string[] = [];
    const ctx = result.context || [];

    // Find suburb, state, postcode from context
    const suburb = ctx.find((c: any) => c.id.startsWith("locality") || c.id.startsWith("place"));
    const state = ctx.find((c: any) => c.id.startsWith("region"));
    const postcode = ctx.find((c: any) => c.id.startsWith("postcode"));

    if (suburb) parts.push(suburb.text);
    if (state) parts.push(state.text);
    if (postcode) parts.push(postcode.text);

    return parts.join(", ");
  }

  const inputClasses = `w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FF6B00] transition-colors ${className}`;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-semibold text-white mb-2">
          {label}
          {required && <span className="text-[#FF6B00]"> *</span>}
        </label>
      )}
      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder={placeholder}
        className={inputClasses}
        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-6">
          <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-[#FF6B00] animate-spin" />
        </div>
      )}

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
            >
              <div className="text-sm font-medium text-gray-200">{result.text}</div>
              <div className="text-xs text-gray-500">{getSubLabel(result)}</div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && !loading && results.length === 0 && query.length >= 3 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-xl px-4 py-3">
          <p className="text-xs text-gray-500">No addresses found. Try typing more detail.</p>
        </div>
      )}
    </div>
  );
}
