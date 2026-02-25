'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface SearchBarProps {
  onSelect: (lat: number, lng: number, label: string) => void;
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // Nominatim geocoding, bounded to Udine area
      const params = new URLSearchParams({
        q: `${q}, Udine`,
        format: 'json',
        limit: '5',
        viewbox: '13.1,46.15,13.35,46.0',
        bounded: '1',
        addressdetails: '1',
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { 'Accept-Language': 'it' } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  }

  function handleSelect(result: SearchResult) {
    const shortName = result.display_name.split(',').slice(0, 2).join(',');
    setQuery(shortName);
    setOpen(false);
    setResults([]);
    onSelect(parseFloat(result.lat), parseFloat(result.lon), shortName);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Cerca via o zona..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 border-0"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition"
            >
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
