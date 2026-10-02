'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Clock, Globe, Film, ChevronRight,
  Users, Calendar, MapPin, CalendarX
} from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import { Showtime, SAMPLE_MOVIES } from '@/lib/store';
import AppImage from '@/components/ui/AppImage';

// Helper: format "YYYY-MM-DD" string to "D Mon" without timezone conversion
function formatDateString(dateStr: string): string {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${monthNames[month]}`;
}

// Helper: get today's date as YYYY-MM-DD in local time
function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function MovieDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedMovie, setSelectedMovie, setSelectedShowtime, setSelectedDate, movies, getSeatMatrix, isMovieScheduled, getMovieScheduledShowtimes, bookings } = useApp();
  const [activeDate, setActiveDate] = useState<string>('');
  const [activeShowtime, setActiveShowtime] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const movieId = searchParams.get('id');
  const movie = selectedMovie
    || (movieId ? movies.find(m => m.id === movieId) : null)
    || (movieId ? SAMPLE_MOVIES.find(m => m.id === movieId) : null)
    || movies[0]
    || SAMPLE_MOVIES[0];

  // Check if this movie has any scheduled showtimes
  const hasScheduledShowtimes = movie ? isMovieScheduled(movie.id) : false;
  const scheduledForMovie = movie ? getMovieScheduledShowtimes(movie.id) : [];

  // --- DYNAMIC DATE DERIVATION ---
  // Extract unique dates from scheduled showtimes for this movie, sorted ascending
  const uniqueDates: string[] = Array.from(
    new Set(scheduledForMovie.map(s => s.date))
  ).sort();

  // --- DYNAMIC SHOWTIME FILTERING ---
  // Filter scheduled showtimes by the currently selected date
  const showtimesForActiveDate: Showtime[] = scheduledForMovie
    .filter(s => s.date === activeDate)
    .map(s => {
      const trueBooked = bookings
        .filter(b => b.showtime?.id === s.id)
        .reduce((acc, b) => acc + (b.seats?.length ?? 0), 0);
      return {
        id: s.id,
        movieId: s.movieId,
        time: s.time,
        date: s.date,
        availableSeats: s.totalSeats - trueBooked - s.blockedSeats.length,
        seats: [],
      };
    });

  // On mount / when uniqueDates changes, auto-select the first available date
  useEffect(() => {
    if (uniqueDates.length > 0 && !uniqueDates.includes(activeDate)) {
      setActiveDate(uniqueDates[0]);
      setActiveShowtime(null);
    }
  }, [uniqueDates.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // When date changes, auto-select first showtime for that date
  useEffect(() => {
    if (showtimesForActiveDate.length > 0) {
      setActiveShowtime(showtimesForActiveDate[0].id);
    } else {
      setActiveShowtime(null);
    }
  }, [activeDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (movie && (!selectedMovie || selectedMovie.id !== movie.id)) {
      setSelectedMovie(movie);
    }
  }, [movie, selectedMovie, setSelectedMovie]);

  const getAvailableSeats = (showtimeId: string): number => {
    const matrix = getSeatMatrix(showtimeId);
    const unavailable = matrix.filter(s =>
      s.status === 'BOOKED' || s.status === 'LOCKED' || s.status === 'BLOCKED'
    ).length;
    return 197 - unavailable;
  };

  const handleProceed = () => {
    if (!activeShowtime || !movie || !activeDate) return;
    const st = showtimesForActiveDate.find(s => s.id === activeShowtime);
    if (!st) return;
    const availSeats = getAvailableSeats(activeShowtime);
    if (availSeats === 0) return;
    // Pass the date string directly — no new Date() wrapping to avoid UTC shift
    const showtimeWithDate: Showtime = { ...st, date: activeDate };
    setSelectedShowtime(showtimeWithDate);
    setSelectedDate(activeDate);
    router.push(`/seat-matrix?movieId=${movie.id}&time=${encodeURIComponent(st.time)}`);
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Film size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground">Loading movie...</p>
        <button onClick={() => router.push('/home')} className="btn-primary w-auto px-8">Go to Home</button>
      </div>
    );
  }

  const plotText = movie.plot;
  const shortPlot = plotText.length > 160 ? plotText.slice(0, 160) + '…' : plotText;
  const activeSeatsLeft = activeShowtime ? getAvailableSeats(activeShowtime) : 197;
  const isSoldOut = activeSeatsLeft === 0;
  const todayStr = getTodayString();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Backdrop + Header */}
      <div className="relative w-full" style={{ height: '340px' }}>
        <AppImage src={movie.poster} alt={`${movie.title} backdrop`} fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(18,18,18,0.5) 50%, #121212 100%)' }} />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12 pb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()} className="p-2.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <ArrowLeft size={20} className="text-white" />
          </motion.button>
          <div className="px-3 py-1.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <span className="text-white text-xs font-semibold">Tiroda Township Cinema</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <div className="flex items-end gap-4">
            <div className="relative w-20 h-28 flex-shrink-0 rounded-2xl overflow-hidden shadow-elevated border border-white/10">
              <AppImage src={movie.poster} alt={`${movie.title} poster`} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-white text-2xl font-extrabold leading-tight">{movie.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">{movie.year} · {movie.language}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          <span className="meta-chip flex items-center gap-1.5"><Star size={11} fill="#FFD700" stroke="#FFD700" />{movie.rating}/10 IMDb</span>
          <span className="meta-chip flex items-center gap-1.5"><Clock size={11} />{movie.runtime}</span>
          <span className="meta-chip flex items-center gap-1.5"><Globe size={11} />{movie.language}</span>
          <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{movie.certificate}</span>
        </div>

        {/* Genre chips */}
        <div className="flex flex-wrap gap-2">
          {movie.genre.split(',').map(g => (
            <span key={`genre-${g.trim()}`} className="px-3 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border">{g.trim()}</span>
          ))}
        </div>

        {/* Plot */}
        <div>
          <h3 className="text-white text-sm font-bold mb-2">Synopsis</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{expanded ? plotText : shortPlot}</p>
          {plotText.length > 160 && (
            <button onClick={() => setExpanded(v => !v)} className="text-primary text-sm font-semibold mt-1">{expanded ? 'Show less' : 'Read more'}</button>
          )}
        </div>

        {/* Cast & Director */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
            <div className="flex items-center gap-2 mb-1"><Film size={14} className="text-primary" /><span className="text-muted-foreground text-xs font-medium">Director</span></div>
            <p className="text-white text-sm font-semibold truncate">{movie.director.split(',')[0]}</p>
          </div>
          <div className="p-3 rounded-2xl" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
            <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-primary" /><span className="text-muted-foreground text-xs font-medium">Cast</span></div>
            <p className="text-white text-sm font-semibold truncate">{movie.cast.split(',')[0]}</p>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <MapPin size={18} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">Adani Township Cinema Hall</p>
            <p className="text-muted-foreground text-xs">Gate 2, Community Center · Tiroda, Maharashtra</p>
          </div>
        </div>

        {/* BOOKING LOCK: No scheduled showtimes */}
        {!hasScheduledShowtimes ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 flex flex-col items-center gap-4 text-center"
            style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-yellow-900/20 border border-yellow-800/40 flex items-center justify-center">
              <CalendarX size={32} className="text-yellow-500" />
            </div>
            <div>
              <h3 className="text-white text-base font-bold mb-2">Not Scheduled Yet</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The theater administration has not allocated showtimes for this film. Please check back later or explore other available movies.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/explore')}
              className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold"
            >
              Explore Other Movies
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Date Selector — fully dynamic from scheduled showtimes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-primary" />
                <h3 className="text-white text-sm font-bold">Select Date</h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                {uniqueDates.map((dateStr) => {
                  const isToday = dateStr === todayStr;
                  const formatted = formatDateString(dateStr);
                  return (
                    <motion.button
                      key={`day-${dateStr}`}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setActiveDate(dateStr); setActiveShowtime(null); }}
                      className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-0.5 border transition-all duration-200 ${activeDate === dateStr ? 'border-primary bg-primary/15' : 'border-border bg-transparent'}`}
                    >
                      <span className={`text-xs font-semibold ${activeDate === dateStr ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isToday ? 'Today' : formatted}
                      </span>
                      <span className={`text-sm font-bold ${activeDate === dateStr ? 'text-white' : 'text-muted-foreground'}`}>
                        {isToday ? formatted : dateStr.split('-')[2]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Showtime Selector — filtered by activeDate */}
            <div>
              <h3 className="text-white text-sm font-bold mb-3">Select Showtime</h3>
              <div className="flex gap-3 flex-wrap">
                {showtimesForActiveDate.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No showtimes for this date.</p>
                ) : (
                  showtimesForActiveDate.map(st => {
                    const seatsLeft = getAvailableSeats(st.id);
                    const soldOut = seatsLeft === 0;
                    return (
                      <motion.button
                        key={`st-${st.id}`}
                        whileTap={{ scale: soldOut ? 1 : 0.95 }}
                        onClick={() => !soldOut && setActiveShowtime(st.id)}
                        disabled={soldOut}
                        className={`flex-1 p-4 rounded-2xl border transition-all duration-200 ${soldOut ? 'border-gray-700 bg-gray-900/50 opacity-60 cursor-not-allowed' : activeShowtime === st.id ? 'border-primary bg-primary/15' : 'border-border bg-transparent'}`}
                      >
                        <p className={`text-base font-bold ${soldOut ? 'text-gray-500' : activeShowtime === st.id ? 'text-primary' : 'text-white'}`}>{st.time}</p>
                        <p className={`text-xs mt-0.5 font-semibold ${soldOut ? 'text-red-500' : 'text-muted-foreground'}`}>{soldOut ? 'Sold Out' : `${seatsLeft} seats left`}</p>
                        <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                          <div className={`h-full rounded-full ${soldOut ? 'bg-gray-600' : 'bg-primary'}`} style={{ width: `${(seatsLeft / 197) * 100}%` }} />
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed Bottom CTA — only when scheduled */}
      {hasScheduledShowtimes && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 z-40" style={{ background: 'linear-gradient(to top, #121212 60%, transparent)' }}>
          <motion.button
            whileTap={{ scale: isSoldOut ? 1 : 0.97 }}
            onClick={handleProceed}
            disabled={!activeShowtime || isSoldOut}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 ${isSoldOut ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'btn-primary'}`}
          >
            {isSoldOut ? 'Sold Out' : <><span>Select Seats</span><ChevronRight size={18} /></>}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function MovieDetailsWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Film size={48} className="text-muted-foreground animate-pulse" />
      </div>
    }>
      <MovieDetailsContent />
    </Suspense>
  );
}

export default function MovieDetailsPage() {
  return (
    <AppProvider>
      <MovieDetailsWithSuspense />
    </AppProvider>
  );
}