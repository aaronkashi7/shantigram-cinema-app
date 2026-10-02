'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Search, X, Plus, Star, Clock, ChevronRight, Home as HomeIcon, Ticket, User, Bell, Loader2, Compass, Moon, Sun, LogOut, Info } from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import { Movie } from '@/lib/store';
import { searchOMDb, getMovieDetails, OMDbSearchResult } from '@/lib/omdb';
import AppImage from '@/components/ui/AppImage';
import AppLogo from '@/components/ui/AppLogo';

function MovieCard({ movie, onSelect }: { movie: Movie; onSelect: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className="movie-card flex-shrink-0"
      style={{ width: '140px' }}
    >
      <div className="relative rounded-2xl overflow-hidden" style={{ height: '210px' }}>
        <AppImage
          src={movie.poster}
          alt={`${movie.title} movie poster`}
          fill
          className="object-cover"
          sizes="140px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <Star size={10} fill="#FFD700" stroke="#FFD700" />
          <span className="text-white text-xs font-semibold font-tabular">{movie.rating}</span>
        </div>
        <div className="absolute top-2 left-2 bg-primary/90 rounded px-1.5 py-0.5">
          <span className="text-white text-xs font-bold">{movie.certificate}</span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-white text-sm font-semibold leading-tight truncate">{movie.title}</p>
        <p className="text-muted-foreground text-xs mt-0.5 truncate">{movie.genre.split(',')[0]}</p>
        <div className="flex items-center gap-1 mt-1">
          <Clock size={10} className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{movie.runtime}</span>
        </div>
      </div>
    </motion.div>
  );
}

function HeroCarousel({ movies, onSelect }: { movies: Movie[]; onSelect: (m: Movie) => void }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (movies.length === 0) return;
    timerRef.current = setTimeout(() => {
      setCurrent(c => (c + 1) % movies.length);
    }, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, movies.length]);

  if (movies.length === 0) return null;
  const movie = movies[current];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ height: '260px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`hero-${movie.id}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <AppImage
            src={movie.poster}
            alt={`${movie.title} hero banner`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="hero-gradient absolute inset-0" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">NOW SHOWING</span>
          <span className="text-muted-foreground text-xs">{movie.year}</span>
        </div>
        <h2 className="text-white text-2xl font-extrabold leading-tight mb-1 truncate">{movie.title}</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star size={12} fill="#FFD700" stroke="#FFD700" />
            <span className="text-white text-sm font-semibold">{movie.rating}/10</span>
          </div>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-muted-foreground text-xs">{movie.genre.split(',')[0]}</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-muted-foreground text-xs">{movie.runtime}</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(movie)}
          className="mt-3 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
        >
          Book Tickets <ChevronRight size={16} />
        </motion.button>
      </div>

      <div className="absolute top-4 right-4 flex gap-1.5">
        {movies.map((_, i) => (
          <button
            key={`dot-${i}`}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

// Cleaned-up App Settings Drawer
function AppSettingsDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { employeeId, setEmployeeId } = useApp();
  const [darkMode, setDarkMode] = useState(true);

  const handleSignOut = () => {
    setEmployeeId('');
    try { localStorage.removeItem('adani_employeeId'); } catch { /* ignore */ }
    onClose();
    router.push('/login');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="rounded-t-3xl overflow-hidden"
        style={{ background: '#1A1A1A', maxHeight: '70vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="px-5 pt-4 pb-8">
            <div className="bottom-sheet-handle" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white text-lg font-bold">App Settings</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Shantigram Cinema · APML Tiroda</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-muted">
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* App Theme */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#242424', border: '1px solid #2E2E2E' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-yellow-400" />}
                  <div>
                    <p className="text-white text-sm font-semibold">App Theme</p>
                    <p className="text-gray-500 text-xs">{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-primary' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* App Version Info */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#242424', border: '1px solid #2E2E2E' }}>
              <div className="flex items-center gap-3">
                <Info size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-white text-sm font-semibold">App Version</p>
                  <p className="text-gray-500 text-xs">Shantigram Cinema v2.0 · Build 2024.10</p>
                  <p className="text-gray-600 text-xs mt-0.5">Shantigram Cinema System</p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSignOut}
              className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 border border-red-800/50"
              style={{ background: 'rgba(211,47,47,0.08)' }}
            >
              <LogOut size={16} className="text-red-400" />
              <span className="text-red-400 text-sm font-semibold">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ApiConfigDrawer({ onClose }: { onClose: () => void }) {
  const { apiKey, setApiKey, addMovie, movies } = useApp();
  const [localKey, setLocalKey] = useState(apiKey);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OMDbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');

  const handleSaveKey = () => { setApiKey(localKey); };

  const handleSearch = async () => {
    if (!localKey.trim()) { setSearchError('Enter your OMDb API key first'); return; }
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await searchOMDb(query, localKey);
      if (res.Response === 'True' && res.Search) {
        setResults(res.Search.slice(0, 6));
      } else {
        setSearchError(res.Error || 'No results found');
        setResults([]);
      }
    } catch {
      setSearchError('Search failed. Check your API key and connection.');
    }
    setIsSearching(false);
  };

  const handleAddMovie = async (item: OMDbSearchResult) => {
    if (!localKey.trim()) return;
    setAddingId(item.imdbID);
    try {
      const detail = await getMovieDetails(item.imdbID, localKey);
      if (detail.Response === 'True') {
        const newMovie: Movie = {
          id: `omdb-${detail.imdbID}`,
          imdbID: detail.imdbID,
          title: detail.Title,
          year: detail.Year,
          poster: detail.Poster !== 'N/A' ? detail.Poster : '/assets/images/no_image.png',
          backdrop: detail.Poster !== 'N/A' ? detail.Poster : '/assets/images/no_image.png',
          plot: detail.Plot,
          genre: detail.Genre,
          runtime: detail.Runtime,
          rating: detail.imdbRating,
          director: detail.Director,
          cast: detail.Actors,
          language: detail.Language,
          certificate: detail.Rated,
          showtimes: [],
        };
        addMovie(newMovie);
      }
    } catch { /* silently fail */ }
    setAddingId(null);
  };

  const alreadyAdded = (imdbID: string) => movies.some(m => m.imdbID === imdbID);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="rounded-t-3xl overflow-hidden"
        style={{ background: '#1A1A1A', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto" style={{ maxHeight: '90vh' }}>
          <div className="px-5 pt-4 pb-6">
            <div className="bottom-sheet-handle" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white text-lg font-bold">API Config &amp; Add Movies</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Powered by OMDb API</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-muted">
                <X size={18} className="text-white" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-foreground mb-2">OMDb API Key</label>
              <div className="flex gap-2">
                <input value={localKey} onChange={e => setLocalKey(e.target.value)} placeholder="Enter your OMDb API key" className="input-field flex-1 text-sm py-3" type="password" />
                <button onClick={handleSaveKey} className="px-4 py-3 bg-primary rounded-xl text-white text-sm font-semibold">Save</button>
              </div>
              <p className="text-muted-foreground text-xs mt-1.5">Get a free key at omdbapi.com</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-foreground mb-2">Search Movies</label>
              <div className="flex gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="e.g. Interstellar, RRR..." className="input-field flex-1 text-sm py-3" />
                <button onClick={handleSearch} disabled={isSearching} className="px-4 py-3 bg-muted rounded-xl">
                  {isSearching ? <Loader2 size={18} className="text-white animate-spin" /> : <Search size={18} className="text-white" />}
                </button>
              </div>
              {searchError && <p className="text-red-400 text-xs mt-1.5">{searchError}</p>}
            </div>
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Search Results</p>
                {results.map(item => (
                  <div key={`search-${item.imdbID}`} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: '#242424' }}>
                    <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <AppImage src={item.Poster !== 'N/A' ? item.Poster : '/assets/images/no_image.png'} alt={`${item.Title} poster`} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{item.Title}</p>
                      <p className="text-muted-foreground text-xs">{item.Year} · {item.Type}</p>
                    </div>
                    <button
                      onClick={() => handleAddMovie(item)}
                      disabled={addingId === item.imdbID || alreadyAdded(item.imdbID)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${alreadyAdded(item.imdbID) ? 'bg-green-900 text-green-400' : 'bg-primary text-white'}`}
                    >
                      {addingId === item.imdbID ? <Loader2 size={12} className="animate-spin" /> : alreadyAdded(item.imdbID) ? '✓ Added' : <><Plus size={12} /> Add</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HomeContent() {
  const router = useRouter();
  const { movies, setSelectedMovie, setSelectedShowtime, employeeId, apiKey, addMovie, scheduledShowtimes, isMovieScheduled } = useApp();
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showApiDrawer, setShowApiDrawer] = useState(false);
  const [greeting, setGreeting] = useState('Good evening');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem('adani_employeeId');
      if (id) { setAuthorized(true); return; }
    } catch { /* ignore */ }
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch live OMDb data on page load
  useEffect(() => {
    if (!apiKey || !movies.length) return;
    const fetchLivePoster = async () => {
      try {
        const featured = movies.find(m => m.imdbID) || movies[0];
        if (!featured?.imdbID) return;
        const detail = await getMovieDetails(featured.imdbID, apiKey);
        if (detail.Response === 'True' && detail.Poster && detail.Poster !== 'N/A') {
          const updatedMovie: Movie = { ...featured, poster: detail.Poster, backdrop: detail.Poster, plot: detail.Plot || featured.plot, rating: detail.imdbRating || featured.rating };
          addMovie(updatedMovie);
        }
      } catch { /* Silently fail */ }
    };
    fetchLivePoster();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Only movies that have scheduled showtimes
  const scheduledMovieIds = new Set(scheduledShowtimes.map(s => s.movieId));
  const nowShowingMovies = movies.filter(m => scheduledMovieIds.has(m.id));
  const heroMovies = nowShowingMovies.length > 0 ? nowShowingMovies : movies.slice(0, 3);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    if (movie.showtimes && movie.showtimes.length > 0) {
      setSelectedShowtime(movie.showtimes[0]);
    }
    router.push(`/movie-details?id=${movie.id}`);
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 px-5 pt-safe" style={{ background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(20px)', paddingTop: '16px', paddingBottom: '12px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <AppLogo size={32} />
              <div>
                <p className="text-xs text-muted-foreground">{greeting},</p>
                <p className="text-white text-sm font-bold">{employeeId || 'Employee'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-full border border-primary/30 bg-primary/10">
              <span className="text-primary text-xs font-semibold">APML Tiroda</span>
            </div>
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="p-2.5 rounded-xl bg-muted relative"
            >
              <Settings size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-6">
        {/* Hero Carousel — only scheduled movies */}
        {heroMovies.length > 0 && (
          <HeroCarousel movies={heroMovies} onSelect={handleSelectMovie} />
        )}

        {/* Now Showing — only scheduled movies */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-header">Now Showing</h2>
            <button onClick={() => router.push('/explore')} className="flex items-center gap-1 text-primary text-xs font-semibold">
              See All <ChevronRight size={14} />
            </button>
          </div>
          {nowShowingMovies.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 rounded-2xl" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
              <Bell size={28} className="text-muted-foreground" />
              <p className="text-muted-foreground text-sm text-center">No showtimes scheduled for today.<br />Check the Explore tab for upcoming movies.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {nowShowingMovies.map(movie => (
                <MovieCard key={`now-showing-${movie.id}`} movie={movie} onSelect={() => handleSelectMovie(movie)} />
              ))}
            </div>
          )}
        </div>

        {/* Today's Showtimes — only scheduled movies */}
        {nowShowingMovies.length > 0 && (
          <div>
            <h2 className="section-header">Today&apos;s Showtimes</h2>
            <div className="space-y-3">
              {nowShowingMovies.slice(0, 5).map(movie => {
                const movieScheduled = scheduledShowtimes.filter(s => s.movieId === movie.id);
                return (
                  <motion.div
                    key={`showtime-card-${movie.id}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectMovie(movie)}
                    className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer"
                    style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
                  >
                    <div className="relative w-14 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                      <AppImage src={movie.poster} alt={`${movie.title} thumbnail`} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{movie.title}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{movie.genre.split(',')[0]} · {movie.runtime}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {movieScheduled.map(st => (
                          <span key={`chip-${movie.id}-${st.id}`} className="bg-primary/15 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                            {st.time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Township notice */}
        <div className="rounded-2xl p-4 border border-primary/20" style={{ background: 'rgba(211,47,47,0.06)' }}>
          <div className="flex items-start gap-3">
            <Bell size={18} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-semibold">Township Cinema</p>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                Shantigram Cinema • APML Tiroda · Gate 2, Community Hall · Bookings open 24 hours in advance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
        style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #2E2E2E' }}>
        <div className="flex items-center justify-around px-2 py-3">
          {[
            { icon: HomeIcon, label: 'Home', route: '/home', active: true },
            { icon: Compass, label: 'Explore', route: '/explore', active: false },
            { icon: Ticket, label: 'My Tickets', route: '/digital-boarding-pass-ticket', active: false },
            { icon: User, label: 'Profile', route: '/profile', active: false },
          ].map(item => (
            <button key={`nav-${item.label}`} onClick={() => router.push(item.route)} className="flex flex-col items-center gap-1 min-w-0 px-3">
              <item.icon size={22} className={item.active ? 'nav-active' : 'nav-inactive'} />
              <span className={`text-xs font-medium ${item.active ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drawers */}
      <AnimatePresence>
        {showSettingsDrawer && <AppSettingsDrawer onClose={() => setShowSettingsDrawer(false)} />}
        {showApiDrawer && <ApiConfigDrawer onClose={() => setShowApiDrawer(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppProvider>
      <HomeContent />
    </AppProvider>
  );
}