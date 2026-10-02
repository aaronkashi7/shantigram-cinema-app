'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, X, Star, Home as HomeIcon,
  Ticket, User, Compass
} from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import { Movie } from '@/lib/store';
import AppImage from '@/components/ui/AppImage';

const FILTER_PILLS = ['All', 'Hindi', 'English', 'Telugu', 'Action', 'Thriller', 'Sci-Fi', 'Coming Soon'];

function MovieGridCard({ movie, isScheduled, onSelect }: { movie: Movie; isScheduled: boolean; onSelect: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="cursor-pointer"
    >
      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '2/3' }}>
        <AppImage
          src={movie.poster}
          alt={`${movie.title} movie poster`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {/* Rating badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
          <Star size={10} fill="#FFD700" stroke="#FFD700" />
          <span className="text-white text-xs font-bold">{movie.rating}</span>
        </div>
        {/* Certificate */}
        <div className="absolute top-2 left-2 bg-primary/90 rounded px-1.5 py-0.5">
          <span className="text-white text-xs font-bold">{movie.certificate}</span>
        </div>
        {/* Bottom info + CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-bold leading-tight line-clamp-2">{movie.title}</p>
          <p className="text-gray-300 text-xs mt-0.5 truncate">
            {movie.languages ? movie.languages.slice(0, 2).join(' · ') : movie.language}
          </p>
          <p className="text-gray-400 text-xs truncate mb-2">
            {movie.genres ? movie.genres.slice(0, 2).join(' · ') : movie.genre.split(',').slice(0, 2).join(' · ')}
          </p>
          {/* CTA Button */}
          {isScheduled ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSelect}
              className="w-full py-1.5 rounded-lg text-white text-xs font-bold flex items-center justify-center gap-1"
              style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
            >
              <Ticket size={11} /> Book Tickets
            </motion.button>
          ) : (
            <button
              disabled
              className="w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed"
              style={{ background: '#2E2E2E', color: '#F59E0B', border: '1px solid #3E3E3E' }}
            >
              Coming Soon
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ExploreContent() {
  const router = useRouter();
  const { movies, setSelectedMovie, setSelectedShowtime, scheduledShowtimes } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem('adani_employeeId');
      if (id) { setAuthorized(true); return; }
    } catch { /* ignore */ }
    router.replace('/login');
  }, [router]);
  const scheduledMovieIds = useMemo(() => new Set(scheduledShowtimes.map(s => s.movieId)), [scheduledShowtimes]);

  const filteredMovies = useMemo(() => {
    let list = [...movies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.genre.toLowerCase().includes(q) ||
        m.language.toLowerCase().includes(q)
      );
    }

    if (activeFilter !== 'All') {
      if (activeFilter === 'Coming Soon') {
        list = list.filter(m => !scheduledMovieIds.has(m.id));
      } else if (['Hindi', 'English', 'Telugu'].includes(activeFilter)) {
        list = list.filter(m => {
          const langs = m.languages || [m.language];
          return langs.some(l => l.toLowerCase().includes(activeFilter.toLowerCase()));
        });
      } else {
        list = list.filter(m => {
          const genres = m.genres || m.genre.split(',').map(g => g.trim());
          return genres.some(g => g.toLowerCase().includes(activeFilter.toLowerCase()));
        });
      }
    }

    return list;
  }, [movies, activeFilter, searchQuery, scheduledMovieIds]);

  // Split into scheduled (now showing) and unscheduled (catalog/coming soon)
  const nowShowingList = filteredMovies.filter(m => scheduledMovieIds.has(m.id));
  const catalogList = filteredMovies.filter(m => !scheduledMovieIds.has(m.id));
  const showSplit = activeFilter === 'All' && !searchQuery.trim();

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    if (movie.showtimes?.length > 0) setSelectedShowtime(movie.showtimes[0]);
    router.push(`/movie-details?id=${movie.id}`);
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-3" style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
        <div className="flex items-center gap-3 mb-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/home')} className="p-2.5 rounded-xl bg-muted flex-shrink-0">
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search movies, genres..."
              className="w-full bg-muted text-white text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none placeholder-gray-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-primary text-xs font-semibold">APML Tiroda</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {FILTER_PILLS.map(pill => (
            <button
              key={`pill-${pill}`}
              onClick={() => setActiveFilter(pill)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === pill ? 'bg-primary text-white' : 'bg-muted text-gray-400 border border-gray-700'}`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Compass size={36} className="text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-white text-base font-bold mb-1">Lineup Being Curated</p>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">Our cinematic lineup is currently being curated. Check back soon for upcoming releases!</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Search size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 text-sm text-center">No movies found for &quot;{activeFilter}&quot;</p>
            <button onClick={() => { setActiveFilter('All'); setSearchQuery(''); }} className="text-primary text-sm font-semibold">Clear filters</button>
          </div>
        ) : showSplit ? (
          <>
            {/* Now Showing Section */}
            {nowShowingList.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <h2 className="text-white text-base font-bold">Now Showing</h2>
                  <span className="text-gray-500 text-xs">({nowShowingList.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {nowShowingList.map(movie => (
                    <MovieGridCard
                      key={`explore-ns-${movie.id}`}
                      movie={movie}
                      isScheduled={true}
                      onSelect={() => handleSelectMovie(movie)}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Catalog / Coming Soon Section */}
            {catalogList.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <h2 className="text-white text-base font-bold">Coming Soon / Catalog</h2>
                  <span className="text-gray-500 text-xs">({catalogList.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {catalogList.map(movie => (
                    <MovieGridCard
                      key={`explore-cat-${movie.id}`}
                      movie={movie}
                      isScheduled={false}
                      onSelect={() => handleSelectMovie(movie)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white text-base font-bold">{activeFilter === 'All' ? 'All Movies' : activeFilter}</h2>
              <span className="text-gray-500 text-xs">{filteredMovies.length} films</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {filteredMovies.map(movie => (
                <MovieGridCard
                  key={`explore-${movie.id}`}
                  movie={movie}
                  isScheduled={scheduledMovieIds.has(movie.id)}
                  onSelect={() => handleSelectMovie(movie)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #2E2E2E' }}>
        <div className="flex items-center justify-around px-2 py-3">
          {[
            { icon: HomeIcon, label: 'Home', route: '/home', active: false },
            { icon: Compass, label: 'Explore', route: '/explore', active: true },
            { icon: Ticket, label: 'My Tickets', route: '/digital-boarding-pass-ticket', active: false },
            { icon: User, label: 'Profile', route: '/profile', active: false },
          ].map(item => (
            <button key={`nav-${item.label}`} onClick={() => router.push(item.route)} className="flex flex-col items-center gap-1 min-w-0 px-3">
              <item.icon size={22} className={item.active ? 'text-primary' : 'text-gray-500'} />
              <span className={`text-xs font-medium ${item.active ? 'text-primary' : 'text-gray-500'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <AppProvider>
      <ExploreContent />
    </AppProvider>
  );
}
