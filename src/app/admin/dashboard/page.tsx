'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Plus, ChevronDown, LayoutDashboard, Ticket, BarChart3, Lock, X, Check, AlertCircle, LogOut, ChevronRight, CalendarCheck, Eye, Search, Settings, Loader2, ArrowLeft } from 'lucide-react';
import { AppProvider, useApp, Booking } from '@/lib/context';
import { Seat, ScheduledShowtime } from '@/lib/store';
import AppImage from '@/components/ui/AppImage';
import AppLogo from '@/components/ui/AppLogo';

// ---- Admin Auth Guard ----
function useAdminAuth() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem('adani_admin_auth') || '{}');
      if (auth?.loggedIn) { setAuthorized(true); return; }
    } catch { /* ignore */ }
    router.replace('/admin-login');
  }, [router]);
  return authorized;
}

// ---- High-Fidelity Admin Seat Button ----
function AdminSeatButton({
  seat,
  effectiveStatus,
  onClick,
}: {
  seat: Seat;
  effectiveStatus: string;
  onClick: () => void;
}) {
  const [bouncing, setBouncing] = useState(false);

  const handleClick = () => {
    if (effectiveStatus === 'BOOKED' || effectiveStatus === 'LOCKED') return;
    setBouncing(true);
    onClick();
    setTimeout(() => setBouncing(false), 400);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'seat-available cursor-pointer hover:opacity-90';
      case 'SELECTED': return 'seat-selected cursor-pointer';
      case 'BOOKED': return 'seat-booked';
      case 'LOCKED': return 'seat-locked';
      case 'BLOCKED': return 'seat-blocked';
      default: return 'seat-available cursor-pointer';
    }
  };

  const isDisabled = effectiveStatus === 'BOOKED' || effectiveStatus === 'LOCKED';

  return (
    <motion.button
      onClick={handleClick}
      animate={bouncing ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      disabled={isDisabled}
      title={`${seat.row}${seat.number} (${effectiveStatus})`}
      className={`
        w-7 h-6 rounded-t-lg text-xs font-bold font-tabular
        flex items-center justify-center transition-colors duration-150
        ${getStatusClass(effectiveStatus)}
      `}
      aria-label={`Row ${seat.row} Seat ${seat.number} - ${effectiveStatus}`}
    >
      {seat.number}
    </motion.button>
  );
}

// ---- High-Fidelity Admin Seat Grid (replaces old mini grid) ----
function AdminSeatGrid({ showtimeId, onBlock, onUnblock }: {
  showtimeId: string;
  onBlock: (showtimeId: string, seatId: string) => void;
  onUnblock: (showtimeId: string, seatId: string) => void;
}) {
  const { getSeatMatrix, scheduledShowtimes, bookings } = useApp();

  // Always read live from global state — never use a stale prop
  const scheduledShowtime = scheduledShowtimes.find(s => s.id === showtimeId);

  const matrix = getSeatMatrix(showtimeId);
  const rows = ['M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

  // PURE DERIVED: compute booked seats from master bookings array — no stale bookedSeats array
  const bookedSeatIds = new Set<string>(
    bookings
      .filter(b => b.showtime?.id === showtimeId)
      .flatMap(b => b.seats.map(s => `${s.row}-${s.number}`))
  );
  // blockedSeats stores full seat IDs (e.g. "movie-xxx-sched-yyy-A-1")
  const blockedSet = new Set(scheduledShowtime?.blockedSeats ?? []);

  const getEffectiveStatus = (seat: Seat): string => {
    const rowNumKey = `${seat.row}-${seat.number}`;
    // booked: derived purely from master bookings array
    if (bookedSeatIds.has(rowNumKey)) return 'BOOKED';
    // blocked uses full seat ID
    if (blockedSet.has(seat.id)) return 'BLOCKED';
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED') return seat.status;
    if (seat.status === 'BLOCKED') return 'BLOCKED';
    return 'AVAILABLE';
  };

  const getRowBlocks = (row: string): { left: Seat[]; right: Seat[] } => {
    const rowSeats = matrix.filter(s => s.row === row);
    if (row === 'A') {
      // Row A: Left block seats 9-17 (9 seats), Right block seats 1-8 (8 seats). No aisle.
      return {
        left: rowSeats.filter(s => s.number >= 9).sort((a, b) => b.number - a.number),
        right: rowSeats.filter(s => s.number <= 8).sort((a, b) => b.number - a.number),
      };
    } else {
      // Rows B-M: Left block seats 8-15 (8 seats), Aisle 2 cols, Right block seats 1-7 (7 seats)
      return {
        left: rowSeats.filter(s => s.number >= 8).sort((a, b) => b.number - a.number),
        right: rowSeats.filter(s => s.number <= 7).sort((a, b) => b.number - a.number),
      };
    }
  };

  const handleSeatClick = (seat: Seat) => {
    const eff = getEffectiveStatus(seat);
    if (eff === 'BOOKED' || eff === 'LOCKED') return;
    if (eff === 'BLOCKED') {
      onUnblock(showtimeId, seat.id);
    } else {
      onBlock(showtimeId, seat.id);
    }
  };

  const allStatuses = matrix.map(s => getEffectiveStatus(s));
  const blockedCount = allStatuses.filter(s => s === 'BLOCKED').length;
  const bookedCount = allStatuses.filter(s => s === 'BOOKED').length;
  const availableCount = allStatuses.filter(s => s === 'AVAILABLE').length;

  return (
    <div key={showtimeId}>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5">
        {[
          { cls: 'seat-available', label: `Available (${availableCount})` },
          { cls: 'seat-booked', label: `Booked (${bookedCount})` },
          { cls: 'seat-blocked', label: `Blocked (${blockedCount})` },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-5 h-4 rounded-t-md ${item.cls}`} />
            <span className="text-gray-400 text-xs">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Screen indicator */}
      <div className="mb-4">
        <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
          <div
            className="h-2 rounded-full screen-glow mb-1"
            style={{ background: 'linear-gradient(90deg, transparent, #D32F2F80, #D32F2F, #D32F2F80, transparent)' }}
          />
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #444)' }} />
            <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">Screen</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #444)' }} />
          </div>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="space-y-1.5">
            {rows.map(row => {
              const { left, right } = getRowBlocks(row);
              return (
                <div key={`admin-row-${row}`} className="flex items-center gap-2">
                  {/* Row label left */}
                  <div className="w-5 flex-shrink-0 text-center">
                    <span className="text-muted-foreground text-xs font-bold font-tabular">{row}</span>
                  </div>

                  {/* Left block */}
                  <div className="flex gap-1 justify-end flex-1">
                    {left.map(seat => (
                      <AdminSeatButton
                        key={seat.id}
                        seat={seat}
                        effectiveStatus={getEffectiveStatus(seat)}
                        onClick={() => handleSeatClick(seat)}
                      />
                    ))}
                  </div>

                  {/* Aisle — 2 cols wide for B-M, none for A */}
                  <div className={`flex-shrink-0 flex items-center justify-center ${row === 'A' ? 'w-0' : 'w-8'}`}>
                    {row !== 'A' && <div className="w-px h-4 bg-border" />}
                  </div>

                  {/* Right block */}
                  <div className="flex gap-1 flex-1">
                    {right.map(seat => (
                      <AdminSeatButton
                        key={seat.id}
                        seat={seat}
                        effectiveStatus={getEffectiveStatus(seat)}
                        onClick={() => handleSeatClick(seat)}
                      />
                    ))}
                  </div>

                  {/* Row label right */}
                  <div className="w-5 flex-shrink-0 text-center">
                    <span className="text-muted-foreground text-xs font-bold font-tabular">{row}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500 text-xs mt-4">
        Click <span className="text-green-400 font-semibold">Available</span> seats to <span className="text-purple-400 font-semibold">Block</span> them · Click <span className="text-purple-400 font-semibold">Blocked</span> to unblock
      </p>
    </div>
  );
}

// ---- Township Movie Catalog Modal ----
function TownshipCatalogModal({ onClose }: { onClose: () => void }) {
  const { movies, scheduledShowtimes, addMovie, apiKey, setApiKey } = useApp();
  const scheduledIds = new Set(scheduledShowtimes.map(s => s.movieId));

  const [view, setView] = useState<'catalog' | 'search'>('catalog');
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [previewData, setPreviewData] = useState<{
    imdbID: string; Title: string; Poster: string; Runtime: string;
    Genre: string; Plot: string; Year: string; imdbRating: string;
    Director: string; Actors: string; Language: string; Rated: string; imdbVotes: string;
  } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toast, setToast] = useState('');

  const handleSaveKey = () => {
    setApiKey(localKey.trim());
    setShowKeyInput(false);
  };

  const handleSearch = async () => {
    if (!localKey.trim()) { setSearchError('Please enter your OMDb API key first.'); setShowKeyInput(true); return; }
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setPreviewData(null);
    try {
      const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(searchQuery.trim())}&apikey=${localKey.trim()}`);
      const data = await res.json();
      if (data.Response === 'True') {
        setPreviewData(data);
      } else {
        setSearchError(data.Error || 'Movie not found. Try a different title.');
      }
    } catch {
      setSearchError('Search failed. Check your API key and internet connection.');
    }
    setIsSearching(false);
  };

  const handleApprove = () => {
    if (!previewData) return;
    setIsAdding(true);
    const id = `omdb-${previewData.imdbID}-${Date.now()}`;
    const genreList = previewData.Genre.split(',').map((g: string) => g.trim()).filter(Boolean);
    const langList = previewData.Language.split(',').map((l: string) => l.trim()).filter(Boolean);
    const newMovie = {
      id,
      imdbID: previewData.imdbID,
      title: previewData.Title,
      year: previewData.Year,
      poster: previewData.Poster !== 'N/A' ? previewData.Poster : '/assets/images/no_image.png',
      backdrop: previewData.Poster !== 'N/A' ? previewData.Poster : '/assets/images/no_image.png',
      posterUrl: previewData.Poster !== 'N/A' ? previewData.Poster : '/assets/images/no_image.png',
      backdropUrl: previewData.Poster !== 'N/A' ? previewData.Poster : '/assets/images/no_image.png',
      plot: previewData.Plot,
      genre: previewData.Genre,
      genres: genreList,
      runtime: previewData.Runtime,
      rating: previewData.imdbRating !== 'N/A' ? previewData.imdbRating : '0',
      votes: previewData.imdbVotes !== 'N/A' ? previewData.imdbVotes : '0',
      director: previewData.Director,
      cast: previewData.Actors,
      language: langList[0] || 'English',
      languages: langList,
      certificate: previewData.Rated !== 'N/A' ? previewData.Rated : 'U/A',
      certification: previewData.Rated !== 'N/A' ? previewData.Rated : 'U/A',
      status: 'NOW_SHOWING' as const,
      showtimes: [],
    };
    addMovie(newMovie);
    setIsAdding(false);
    setToast(`"${previewData.Title}" added to catalog!`);
    setTimeout(() => setToast(''), 3000);
    setPreviewData(null);
    setSearchQuery('');
    setView('catalog');
  };

  const alreadyInCatalog = previewData ? movies.some(m => m.imdbID === previewData.imdbID) : false;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col"
        style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {view === 'search' && (
              <button onClick={() => { setView('catalog'); setPreviewData(null); setSearchError(''); setSearchQuery(''); }}
                className="p-1.5 rounded-lg bg-muted mr-1">
                <ArrowLeft size={16} className="text-white" />
              </button>
            )}
            <div>
              <h3 className="text-white text-lg font-bold">Township Movie Catalog</h3>
              <p className="text-gray-500 text-xs">{movies.length} film{movies.length !== 1 ? 's' : ''} in catalog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'catalog' && (
              <>
                <button onClick={() => setShowKeyInput(v => !v)}
                  className="p-2 rounded-xl bg-muted" title="OMDb API Key Settings">
                  <Settings size={16} className="text-gray-400" />
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView('search')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                >
                  <Plus size={16} /> Add New Movie
                </motion.button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-muted">
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {view === 'catalog' && showKeyInput && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-gray-800 flex-shrink-0">
              <div className="px-6 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">OMDb API Key</label>
                  <input value={localKey} onChange={e => setLocalKey(e.target.value)}
                    placeholder="Paste your OMDb API key here..."
                    type="password"
                    className="w-full text-white text-sm rounded-xl px-3 py-2 outline-none border border-gray-700 focus:border-primary"
                    style={{ background: '#242424' }} />
                </div>
                <button onClick={handleSaveKey}
                  className="mt-5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex-shrink-0">
                  Save
                </button>
              </div>
              <p className="px-6 pb-3 text-gray-600 text-xs">Get a free key at <span className="text-primary">omdbapi.com</span></p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'catalog' ? (
              <motion.div key="catalog-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {movies.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <Film size={28} className="text-gray-600" />
                    </div>
                    <p className="text-gray-400 text-sm font-semibold">No movies in catalog.</p>
                    <p className="text-gray-600 text-xs">Click "+ Add New Movie" to ingest your first title.</p>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-1 gap-2">
                    {movies.map(movie => (
                      <div key={movie.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#242424' }}>
                        <div className="relative flex-shrink-0 rounded-lg overflow-hidden" style={{ width: '40px', height: '56px' }}>
                          <AppImage src={movie.poster} alt={`${movie.title} poster thumbnail`} fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{movie.title}</p>
                          <p className="text-gray-500 text-xs truncate">{movie.runtime || '—'} · {movie.genre?.split(',')[0]?.trim() || '—'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${scheduledIds.has(movie.id) ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                          {scheduledIds.has(movie.id) ? 'Scheduled' : 'Catalog'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="search-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="p-5">
                <div className="mb-5">
                  <h4 className="text-white text-base font-bold mb-1">Smart Search</h4>
                  <p className="text-gray-500 text-xs">Search any movie title to fetch real data from OMDb</p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">OMDb API Key</label>
                  <div className="flex gap-2">
                    <input value={localKey} onChange={e => setLocalKey(e.target.value)}
                      placeholder="Enter your OMDb API key..."
                      type="password"
                      className="flex-1 text-white text-sm rounded-xl px-3 py-2.5 outline-none border border-gray-700 focus:border-primary"
                      style={{ background: '#242424' }} />
                    <button onClick={handleSaveKey}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex-shrink-0">
                      Save
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">Free key at <span className="text-primary">omdbapi.com</span> · Saved to browser</p>
                </div>

                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      placeholder="Enter movie title..."
                      className="w-full text-white text-sm rounded-xl pl-9 pr-4 py-3 outline-none border border-gray-700 focus:border-primary"
                      style={{ background: '#242424' }}
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-5 py-3 rounded-xl text-white text-sm font-bold flex items-center gap-2 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                  >
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Search</>}
                  </motion.button>
                </div>

                {searchError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-800/40 mb-4">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-xs">{searchError}</p>
                  </div>
                )}

                <AnimatePresence>
                  {previewData && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      className="rounded-2xl overflow-hidden border border-gray-700"
                      style={{ background: '#242424' }}
                    >
                      <div className="flex gap-4 p-4">
                        <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: '90px', height: '130px' }}>
                          <AppImage
                            src={previewData.Poster !== 'N/A' ? previewData.Poster : '/assets/images/no_image.png'}
                            alt={`${previewData.Title} official movie poster`}
                            fill className="object-cover" sizes="90px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-base font-bold leading-tight mb-1">{previewData.Title}</p>
                          <p className="text-gray-400 text-xs mb-2">{previewData.Year}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {previewData.Genre.split(',').slice(0, 3).map(g => (
                              <span key={g.trim()} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                                {g.trim()}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>⏱ {previewData.Runtime}</span>
                            {previewData.imdbRating !== 'N/A' && <span>⭐ {previewData.imdbRating}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">{previewData.Plot}</p>
                      </div>
                      <div className="px-4 pb-4">
                        {alreadyInCatalog ? (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-900/20 border border-green-800/40">
                            <Check size={14} className="text-green-400" />
                            <p className="text-green-400 text-sm font-semibold">Already in catalog</p>
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleApprove}
                            disabled={isAdding}
                            className="w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' }}
                          >
                            {isAdding ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <><Check size={16} /> Approve &amp; Add to Catalog</>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!previewData && !searchError && !isSearching && (
                  <div className="py-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
                      <Search size={24} className="text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">Search for a movie title above</p>
                    <p className="text-gray-600 text-xs">Real poster, runtime, genre, and plot will appear here</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl"
            style={{ background: '#1A1A1A', border: '1px solid #22C55E', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <Check size={16} className="text-green-400" />
            <span className="text-white text-sm font-semibold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Catalog Modal (alias) ----
function CatalogModal({ onClose }: { onClose: () => void }) {
  return <TownshipCatalogModal onClose={onClose} />;
}

// ---- All Active Schedules Modal ----
function ActiveSchedulesModal({ onClose }: { onClose: () => void }) {
  const { scheduledShowtimes, movies, bookings } = useApp();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: '#1A1A1A', border: '1px solid #2E2E2E', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-white text-lg font-bold">All Active Schedules</h3>
            <p className="text-gray-500 text-xs">{scheduledShowtimes.length} show{scheduledShowtimes.length !== 1 ? 's' : ''} scheduled</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-muted">
            <X size={18} className="text-white" />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {scheduledShowtimes.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <CalendarCheck size={32} className="text-gray-700" />
              <p className="text-gray-400 text-sm font-semibold">No shows scheduled yet</p>
              <p className="text-gray-600 text-xs">Use the Showtime Scheduler to add shows.</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {scheduledShowtimes.map(st => {
                const movie = movies.find(m => m.id === st.movieId);
                // TRUE booked count: sum seats from master bookings array for this showtime
                const trueBookedCount = bookings
                  .filter(b => b.showtime?.id === st.id)
                  .reduce((acc, b) => acc + b.seats.length, 0);
                const blockedCount = st.blockedSeats ? st.blockedSeats.length : 0;
                const available = 197 - trueBookedCount - blockedCount;
                return (
                  <div key={st.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#242424' }}>
                    <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                      <AppImage src={movie?.poster || ''} alt={movie?.title || ''} fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{movie?.title || st.movieId}</p>
                      <p className="text-gray-400 text-xs">{st.date} · {st.time}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-red-400 text-xs font-medium">{trueBookedCount} booked</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-green-400 text-xs font-medium">{available} available</span>
                        {blockedCount > 0 && (
                          <>
                            <span className="text-gray-600 text-xs">·</span>
                            <span className="text-purple-400 text-xs font-medium">{blockedCount} blocked</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-sm font-extrabold">{trueBookedCount}<span className="text-gray-500 text-xs font-normal">/197</span></p>
                      <p className="text-gray-500 text-xs">seats sold</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---- Overview Panel (Heatmap removed — only 3 metric cards) ----
function OverviewPanel({ onShowCatalog }: { onShowCatalog: () => void }) {
  const { movies, scheduledShowtimes, bookings } = useApp();
  const [showActiveSchedulesModal, setShowActiveSchedulesModal] = useState(false);

  const totalSeatsAllBookings = bookings.reduce((acc, b) => acc + b.seats.length, 0);

  return (
    <div>
      {/* Top Metrics Row — only 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Movies in Catalog */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowCatalog}
          className="p-5 rounded-2xl text-left cursor-pointer"
          style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/30 border border-blue-800/40 flex items-center justify-center">
              <Film size={20} className="text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm font-medium">Movies in Catalog</span>
          </div>
          <p className="text-white text-3xl font-extrabold">{movies.length}</p>
          <p className="text-blue-400 text-xs mt-1 flex items-center gap-1">Click to view all <ChevronRight size={12} /></p>
        </motion.button>

        {/* Active Schedules */}
        <motion.button
          whileHover={{ scale: 1.02, borderColor: '#4ADE80' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowActiveSchedulesModal(true)}
          className="p-5 rounded-2xl text-left cursor-pointer transition-all"
          style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-900/30 border border-green-800/40 flex items-center justify-center">
              <CalendarCheck size={20} className="text-green-400" />
            </div>
            <span className="text-gray-400 text-sm font-medium">Active Schedules</span>
          </div>
          <p className="text-white text-3xl font-extrabold">{scheduledShowtimes.length}</p>
          <p className="text-green-400 text-xs mt-1 flex items-center gap-1">Total upcoming shows scheduled <ChevronRight size={12} /></p>
        </motion.button>

        {/* Total Seats Booked */}
        <div className="p-5 rounded-2xl" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Ticket size={20} className="text-primary" />
            </div>
            <span className="text-gray-400 text-sm font-medium">Total Seats Booked</span>
          </div>
          <p className="text-white text-3xl font-extrabold">{totalSeatsAllBookings}</p>
          <p className="text-primary text-xs mt-1">Across all active bookings</p>
        </div>
      </div>

      {/* Active Schedules Modal */}
      <AnimatePresence>
        {showActiveSchedulesModal && (
          <ActiveSchedulesModal onClose={() => setShowActiveSchedulesModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Helper: parse "6:00 PM" -> [18, 0] ----
function parseTime(timeStr: string): [number, number] {
  try {
    const [time, period] = timeStr.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hours = h;
    if (period === 'PM' && h !== 12) hours += 12;
    if (period === 'AM' && h === 12) hours = 0;
    return [hours, m || 0];
  } catch {
    return [0, 0];
  }
}

// ---- Showtime Scheduler ----
function ShowtimeScheduler() {
  const { movies, addScheduledShowtime } = useApp();
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const TIME_SLOTS = ['10:00 AM', '1:00 PM', '3:00 PM', '6:00 PM', '9:00 PM', 'Custom'];

  const handleSubmit = () => {
    setError('');
    setSuccess('');
    if (!selectedMovieId || !selectedDate || !selectedTime) {
      setError('Please fill in all fields.');
      return;
    }
    const timeValue = selectedTime === 'Custom' ? customTime : selectedTime;
    if (!timeValue) { setError('Please enter a custom time.'); return; }

    const id = `sched-${selectedMovieId}-${selectedDate}-${timeValue.replace(/[: ]/g, '')}`;
    const newSt: ScheduledShowtime = {
      id,
      movieId: selectedMovieId,
      date: selectedDate,
      time: timeValue,
      totalSeats: 197,
      lockedSeats: [],
      blockedSeats: [],
    };

    const result = addScheduledShowtime(newSt);
    if (!result.success) {
      setError(result.error || 'Failed to schedule showtime.');
    } else {
      const movieTitle = movies.find(m => m.id === selectedMovieId)?.title || '';
      setSuccess(`"${movieTitle}" scheduled at ${timeValue} on ${selectedDate}. Now visible in User App.`);
      setSelectedMovieId('');
      setSelectedDate('');
      setSelectedTime('');
      setCustomTime('');
    }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Plus size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-white text-base font-bold">Schedule a Showtime</h3>
          <p className="text-gray-500 text-xs">Single-screen constraint enforced · Instantly visible in User App</p>
        </div>
      </div>

      {movies.length === 0 ? (
        <div className="py-10 flex flex-col items-center gap-3 text-center rounded-2xl" style={{ background: '#242424', border: '1px solid #2E2E2E' }}>
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
            <Film size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Ingest a movie first.</p>
          <p className="text-gray-600 text-xs max-w-xs">Go to the Overview tab and use the "Movies in Catalog" tool to add a movie before scheduling.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Select Movie</label>
              <div className="relative">
                <select
                  value={selectedMovieId}
                  onChange={e => setSelectedMovieId(e.target.value)}
                  className="w-full bg-muted text-white text-sm rounded-xl px-4 py-3 outline-none appearance-none border border-gray-700"
                >
                  <option value="">Choose a movie...</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-muted text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Time Slot</label>
              <div className="relative">
                <select
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="w-full bg-muted text-white text-sm rounded-xl px-4 py-3 outline-none appearance-none border border-gray-700"
                >
                  <option value="">Choose time...</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {selectedTime === 'Custom' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 mb-2">Custom Time</label>
              <input
                type="time"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
                className="w-full bg-muted text-white text-sm rounded-xl px-4 py-3 outline-none border border-gray-700"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: '#2D1B1B', border: '1px solid #5C2626' }}>
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: '#1B2D1B', border: '1px solid #265C26' }}>
              <Check size={16} className="text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
          >
            <Plus size={18} /> Schedule Showtime
          </motion.button>
        </>
      )}
    </div>
  );
}

// ---- Live Seat Management ----
function LiveSeatManagement() {
  const { scheduledShowtimes, movies, bookings, blockScheduledSeat, unblockScheduledSeat } = useApp();
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');

  const selectedSt = scheduledShowtimes.find(s => s.id === selectedShowtimeId);
  const selectedMovie = selectedSt ? movies.find(m => m.id === selectedSt.movieId) : null;

  // TRUE booked count from master bookings array (same source of truth as modal)
  const trueBookedCount = selectedSt
    ? bookings.filter(b => b.showtime?.id === selectedSt.id).reduce((acc, b) => acc + b.seats.length, 0)
    : 0;

  return (
    <div className="rounded-2xl p-6" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center">
          <Lock size={20} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-white text-base font-bold">Live Seat Management</h3>
          <p className="text-gray-500 text-xs">Click <span className="text-green-400 font-semibold">Available</span> seats to <span className="text-purple-400 font-semibold">Block</span> them · Syncs instantly to User App.</p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 mb-2">Select Showtime</label>
        <div className="relative">
          <select
            value={selectedShowtimeId}
            onChange={e => setSelectedShowtimeId(e.target.value)}
            className="w-full bg-muted text-white text-sm rounded-xl px-4 py-3 outline-none appearance-none border border-gray-700"
          >
            <option value="">Choose a scheduled showtime...</option>
            {scheduledShowtimes.map(st => {
              const movie = movies.find(m => m.id === st.movieId);
              return (
                <option key={st.id} value={st.id}>
                  {movie?.title || st.movieId} — {st.date} · {st.time}
                </option>
              );
            })}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        {scheduledShowtimes.length === 0 && (
          <p className="text-yellow-500 text-xs mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            No showtimes scheduled yet. Use the Scheduler tab to add one.
          </p>
        )}
      </div>

      {selectedShowtimeId && selectedSt && selectedMovie && (
        <div>
          <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ background: '#242424' }}>
            <div className="relative w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden">
              <AppImage src={selectedMovie.poster} alt={selectedMovie.title} fill className="object-cover" sizes="40px" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">{selectedMovie.title}</p>
              <p className="text-gray-400 text-xs">{selectedSt.date} · {selectedSt.time}</p>
              <p className="text-purple-400 text-xs">{selectedSt.blockedSeats.length} blocked · {trueBookedCount} booked</p>
            </div>
          </div>
          <AdminSeatGrid
            showtimeId={selectedShowtimeId}
            onBlock={blockScheduledSeat}
            onUnblock={unblockScheduledSeat}
          />
        </div>
      )}

      {!selectedShowtimeId && (
        <div className="py-8 flex flex-col items-center gap-2 text-center">
          <Lock size={32} className="text-gray-700" />
          <p className="text-gray-500 text-sm">Select a showtime to manage seats</p>
        </div>
      )}
    </div>
  );
}

// ---- Bookings Ledger ----
function BookingsLedger() {
  const { bookings, cancelBooking, movies, scheduledShowtimes } = useApp();
  const [activeTab, setActiveTab] = useState<'running' | 'past'>('running');

  const todayLocal = (() => {
    const n = new Date();
    const y = n.getFullYear();
    const mo = String(n.getMonth() + 1).padStart(2, '0');
    const d = String(n.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  })();

  const runningBookings = bookings.filter(b => {
    const showDate = b.showtime?.date || '';
    if (!showDate) return true;
    return showDate >= todayLocal;
  });

  const pastBookings = bookings.filter(b => {
    const showDate = b.showtime?.date || '';
    if (!showDate) return false;
    return showDate < todayLocal;
  });

  const displayBookings = activeTab === 'running' ? runningBookings : pastBookings;

  const getSeatCoords = (b: Booking) =>
    b.seats.map(s => `Row ${s.row} - #${s.number}`).join(', ');

  const formatBookingId = (id: string) => {
    if (id.startsWith('ADP-')) {
      const parts = id.split('-');
      if (parts.length >= 2) {
        const num = parts[parts.length - 1];
        return `ADP-${num.slice(-4)}`;
      }
    }
    return id.slice(0, 12);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <BarChart3 size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-white text-base font-bold">Bookings Ledger</h3>
            <p className="text-gray-500 text-xs">{bookings.length} total bookings in system</p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#242424' }}>
          <button
            onClick={() => setActiveTab('running')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'running' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Running / Upcoming ({runningBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'past' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Past Shows ({pastBookings.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {displayBookings.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-2 text-center">
            <Ticket size={32} className="text-gray-700" />
            <p className="text-gray-500 text-sm">No {activeTab === 'running' ? 'upcoming' : 'past'} bookings</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead>
              <tr style={{ background: '#242424' }}>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Booking ID</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Employee ID</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Movie Title</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Showtime</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Seat Coordinates</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayBookings.map((b, idx) => (
                <tr
                  key={b.id}
                  style={{
                    borderTop: '1px solid #2E2E2E',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="text-primary text-xs font-mono font-bold bg-primary/10 px-2 py-1 rounded-lg">
                      {formatBookingId(b.id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white text-sm font-semibold">{b.employeeId || 'ADANI2401'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-10 flex-shrink-0 rounded overflow-hidden">
                        <AppImage src={b.movie?.poster || ''} alt={b.movie?.title || ''} fill className="object-cover" sizes="28px" />
                      </div>
                      <span className="text-white text-sm font-medium max-w-32 truncate">{b.movie?.title || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-300 text-sm">{b.showtime?.date || b.createdAt?.split('T')[0] || '—'}</p>
                      <p className="text-gray-500 text-xs">{b.showtime?.time || '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-xs font-mono leading-relaxed">{getSeatCoords(b)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${activeTab === 'running' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                      {activeTab === 'running' ? 'Confirmed' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {activeTab === 'running' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => cancelBooking(b.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-800/50 hover:bg-red-900/20 transition-colors"
                      >
                        <X size={12} />
                        Revoke
                      </motion.button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---- Sidebar ----
type AdminSection = 'overview' | 'scheduler' | 'seats' | 'ledger';

function Sidebar({ active, onChange }: { active: AdminSection; onChange: (s: AdminSection) => void }) {
  const router = useRouter();

  const handleSignOut = () => {
    try { localStorage.removeItem('adani_admin_auth'); } catch { /* ignore */ }
    router.push('/admin-login');
  };

  const items: { id: AdminSection; icon: React.ElementType; label: string }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'scheduler', icon: CalendarCheck, label: 'Showtime Scheduler' },
    { id: 'seats', icon: Lock, label: 'Seat Management' },
    { id: 'ledger', icon: BarChart3, label: 'Bookings Ledger' },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: '#111111', borderRight: '1px solid #2E2E2E', width: '240px', minWidth: '240px' }}>
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <AppLogo size={36} />
          <div>
            <p className="text-white text-sm font-extrabold">Shantigram Cinema</p>
            <p className="text-primary text-xs font-semibold">Management Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              active === item.id ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800 space-y-2">
        <button
          onClick={() => window.open('/home', '_blank', 'noopener,noreferrer')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Eye size={18} />
          View User App
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
function AdminDashboardContent() {
  const authorized = useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  const sectionTitles: Record<AdminSection, string> = {
    overview: 'Dashboard Overview',
    scheduler: 'Showtime Scheduler',
    seats: 'Live Seat Management',
    ledger: 'Bookings Ledger',
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: 'inherit' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-screen sticky top-0">
        <Sidebar active={activeSection} onChange={setActiveSection} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex md:hidden"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setSidebarOpen(false)}>
            <motion.div initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              className="h-full flex flex-col"
              onClick={e => e.stopPropagation()}>
              <Sidebar active={activeSection} onChange={(s) => { setActiveSection(s); setSidebarOpen(false); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between"
          style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl bg-muted">
              <LayoutDashboard size={18} className="text-white" />
            </button>
            <div>
              <h1 className="text-white text-lg font-extrabold">{sectionTitles[activeSection]}</h1>
              <p className="text-gray-500 text-xs">Shantigram Cinema · Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10">
              <span className="text-primary text-xs font-semibold">Admin</span>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 p-6">
          {activeSection === 'overview' && (
            <OverviewPanel onShowCatalog={() => setShowCatalogModal(true)} />
          )}
          {activeSection === 'scheduler' && <ShowtimeScheduler />}
          {activeSection === 'seats' && <LiveSeatManagement />}
          {activeSection === 'ledger' && <BookingsLedger />}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCatalogModal && <CatalogModal onClose={() => setShowCatalogModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AppProvider>
      <AdminDashboardContent />
    </AppProvider>
  );
}
