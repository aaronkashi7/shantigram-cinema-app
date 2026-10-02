'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Movie, Seat, Showtime, ScheduledShowtime, generateSeats } from './store';
import { supabase } from './supabaseClient';

export interface Booking {
  id: string;
  movie: Movie;
  showtime: Showtime;
  seats: Seat[];
  employeeId: string;
  createdAt: string;
}

interface AppContextType {
  movies: Movie[];
  addMovie: (movie: Movie) => void;
  selectedMovie: Movie | null;
  setSelectedMovie: (movie: Movie | null) => void;
  selectedShowtime: Showtime | null;
  setSelectedShowtime: (st: Showtime | null) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedSeats: Seat[];
  toggleSeat: (seat: Seat, showtimeId: string) => void;
  clearSeats: () => void;
  getSeatMatrix: (showtimeId: string) => Seat[];
  lockSeats: (showtimeId: string, seatIds: string[]) => void;
  blockSeat: (showtimeId: string, seatId: string) => void;
  unblockSeat: (showtimeId: string, seatId: string) => void;
  addShowtime: (movieId: string, showtime: Showtime) => void;
  bookingRef: string;
  setBookingRef: (ref: string) => void;
  employeeId: string;
  setEmployeeId: (id: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  bookings: Booking[];
  confirmBooking: () => string;
  cancelBooking: (bookingId: string) => void;
  // Scheduled showtimes (admin-managed)
  scheduledShowtimes: ScheduledShowtime[];
  addScheduledShowtime: (st: ScheduledShowtime) => { success: boolean; error?: string };
  removeScheduledShowtime: (id: string) => void;
  blockScheduledSeat: (scheduledShowtimeId: string, seatId: string) => void;
  unblockScheduledSeat: (scheduledShowtimeId: string, seatId: string) => void;
  getMovieScheduledShowtimes: (movieId: string) => ScheduledShowtime[];
  isMovieScheduled: (movieId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

// In-memory seat state per showtimeId
const seatCache: Record<string, Seat[]> = {};

function safeLocalGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeLocalSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovieState] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtimeState] = useState<Showtime | null>(null);
  const [selectedDate, setSelectedDateState] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [bookingRef, setBookingRefState] = useState('');
  const [employeeId, setEmployeeIdState] = useState('');
  const [apiKey, setApiKeyState] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduledShowtimes, setScheduledShowtimes] = useState<ScheduledShowtime[]>([]);

  // Hydrate from Supabase + localStorage on mount
  useEffect(() => {
    async function hydrateFromSupabase() {
      try {
        // Fetch movies from Supabase — always trust what Supabase returns
        const { data: moviesData } = await supabase.from('movies').select('*');
        const mappedMovies: Movie[] = (moviesData ?? []).map((m: any) => ({
          id: m.id,
          title: m.title,
          year: m.year || '',
          poster: m.poster_url || '',
          posterUrl: m.poster_url || '',
          backdrop: m.poster_url || '',
          backdropUrl: m.poster_url || '',
          plot: m.plot || '',
          genre: m.genre || '',
          runtime: m.runtime || '',
          rating: m.rating || '',
          director: m.director || '',
          cast: m.cast_members || '',
          language: m.language || '',
          certificate: m.certificate || '',
          status: (m.status as 'NOW_SHOWING' | 'COMING_SOON') || 'NOW_SHOWING',
          showtimes: [],
        }));
        setMovies(mappedMovies);

        // Fetch showtimes from Supabase — always trust what Supabase returns
        const { data: showtimesData } = await supabase.from('showtimes').select('*');
        const mappedScheduled: ScheduledShowtime[] = (showtimesData ?? []).map((s: any) => ({
          id: s.id,
          movieId: s.movie_id,
          date: s.show_date,
          time: s.show_time,
          totalSeats: s.total_seats || 197,
          lockedSeats: s.locked_seats || [],
          blockedSeats: s.blocked_seats || [],
        }));
        setScheduledShowtimes(mappedScheduled);
        // Pre-generate seat matrices
        mappedScheduled.forEach(st => {
          if (!seatCache[st.id]) {
            seatCache[st.id] = generateSeats(st.movieId, st.id);
          }
          st.blockedSeats.forEach((seatId: string) => {
            const s = seatCache[st.id].find(seat => seat.id === seatId);
            if (s && s.status === 'AVAILABLE') s.status = 'BLOCKED';
          });
        });

        // Fetch bookings from Supabase — always trust what Supabase returns
        const { data: bookingsData } = await supabase.from('bookings').select('*');
        const mappedBookings: Booking[] = (bookingsData ?? []).map((b: any) => ({
          id: b.id,
          movie: b.movie_snapshot || {},
          showtime: b.showtime_snapshot || {},
          seats: b.seats || [],
          employeeId: b.employee_id || '',
          createdAt: b.created_at || new Date().toISOString(),
        }));
        setBookings(mappedBookings);
      } catch {
        // Supabase unavailable — set all to empty arrays (no fallback to stale data)
        setMovies([]);
        setScheduledShowtimes([]);
        setBookings([]);
      }

      // Always restore UI-session state from localStorage
      const storedMovie = safeLocalGet<Movie | null>('adani_selectedMovie', null);
      setSelectedMovieState(storedMovie);
      const storedShowtime = safeLocalGet<Showtime | null>('adani_selectedShowtime', null);
      setSelectedShowtimeState(storedShowtime);
      const storedDate = safeLocalGet<string>('adani_selectedDate', '');
      setSelectedDateState(storedDate);
      const storedSeats = safeLocalGet<Seat[]>('adani_selectedSeats', []);
      setSelectedSeats(storedSeats);
      const storedRef = safeLocalGet<string>('adani_bookingRef', '');
      setBookingRefState(storedRef);
      const storedEmpId = safeLocalGet<string>('adani_employeeId', '');
      setEmployeeIdState(storedEmpId);
      const storedApiKey = safeLocalGet<string>('adani_omdb_key', '');
      setApiKeyState(storedApiKey);

      // Restore blocked seats from localStorage into seatCache
      const blockedMap = safeLocalGet<Record<string, string[]>>('adani_blocked_seats', {});
      Object.entries(blockedMap).forEach(([showtimeId, blockedIds]) => {
        if (!seatCache[showtimeId]) {
          seatCache[showtimeId] = generateSeats('movie', showtimeId);
        }
        blockedIds.forEach(id => {
          const s = seatCache[showtimeId].find(seat => seat.id === id);
          if (s && s.status === 'AVAILABLE') s.status = 'BLOCKED';
        });
      });

      setHydrated(true);
    }

    hydrateFromSupabase();
  }, []);

  const setSelectedMovie = useCallback((movie: Movie | null) => {
    setSelectedMovieState(movie);
    safeLocalSet('adani_selectedMovie', movie);
  }, []);

  const setSelectedShowtime = useCallback((st: Showtime | null) => {
    setSelectedShowtimeState(st);
    safeLocalSet('adani_selectedShowtime', st);
  }, []);

  const setSelectedDate = useCallback((d: string) => {
    setSelectedDateState(d);
    safeLocalSet('adani_selectedDate', d);
  }, []);

  const setBookingRef = useCallback((ref: string) => {
    setBookingRefState(ref);
    safeLocalSet('adani_bookingRef', ref);
  }, []);

  const setEmployeeId = useCallback((id: string) => {
    setEmployeeIdState(id);
    safeLocalSet('adani_employeeId', id);
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    safeLocalSet('adani_omdb_key', key);
  }, []);

  const addMovie = useCallback((movie: Movie) => {
    // Write to Supabase first, then update local state on success
    supabase.from('movies').insert([{
      id: movie.id,
      title: movie.title,
      poster_url: movie.posterUrl || movie.poster,
      plot: movie.plot,
      runtime: movie.runtime,
      genre: movie.genre,
      year: movie.year,
      rating: movie.rating,
      director: movie.director,
      cast_members: movie.cast,
      language: movie.language,
      certificate: movie.certificate,
      status: movie.status || 'NOW_SHOWING',
    }]).select().then(({ data, error }) => {
      if (!error) {
        setMovies(prev => {
          if (prev.find(m => m.id === movie.id)) return prev;
          const next = [movie, ...prev];
          safeLocalSet('adani_movies', next);
          return next;
        });
      } else {
        // Fallback: update local state even if Supabase fails
        setMovies(prev => {
          if (prev.find(m => m.id === movie.id)) return prev;
          const next = [movie, ...prev];
          safeLocalSet('adani_movies', next);
          return next;
        });
      }
    });
  }, []);

  const addShowtime = useCallback((movieId: string, showtime: Showtime) => {
    setMovies(prev => {
      const next = prev.map(m => {
        if (m.id !== movieId) return m;
        if (m.showtimes.find(st => st.id === showtime.id)) return m;
        return { ...m, showtimes: [...m.showtimes, showtime] };
      });
      safeLocalSet('adani_movies', next);
      return next;
    });
    if (!seatCache[showtime.id]) {
      seatCache[showtime.id] = generateSeats(movieId, showtime.id);
    }
  }, []);

  // ---- Scheduled Showtimes (Admin) ----

  const addScheduledShowtime = useCallback((st: ScheduledShowtime): { success: boolean; error?: string } => {
    let conflict = false;
    setScheduledShowtimes(prev => {
      // SINGLE-SCREEN CONSTRAINT: check for same date+time conflict with a DIFFERENT movie
      const existing = prev.find(s => s.date === st.date && s.time === st.time && s.movieId !== st.movieId);
      if (existing) {
        conflict = true;
        return prev;
      }
      // Duplicate check (same movie, date, time)
      const duplicate = prev.find(s => s.date === st.date && s.time === st.time && s.movieId === st.movieId);
      if (duplicate) {
        conflict = true;
        return prev;
      }
      const next = [...prev, st];
      safeLocalSet('adani_scheduled_showtimes', next);

      // Write to Supabase
      supabase.from('showtimes').upsert([{
        id: st.id,
        movie_id: st.movieId,
        show_date: st.date,
        show_time: st.time,
        blocked_seats: st.blockedSeats,
        locked_seats: st.lockedSeats,
        total_seats: st.totalSeats,
      }]).select().then(({ error }) => {
        if (error) console.error("Supabase error:", error);
      });

      return next;
    });
    if (conflict) {
      return { success: false, error: 'A movie is already scheduled at this date and time. Single-screen constraint violated.' };
    }
    // Pre-generate seat matrix
    if (!seatCache[st.id]) {
      seatCache[st.id] = generateSeats(st.movieId, st.id);
    }
    return { success: true };
  }, []);

  const removeScheduledShowtime = useCallback((id: string) => {
    setScheduledShowtimes(prev => {
      const next = prev.filter(s => s.id !== id);
      safeLocalSet('adani_scheduled_showtimes', next);
      return next;
    });
  }, []);

  const blockScheduledSeat = useCallback((scheduledShowtimeId: string, seatId: string) => {
    // Update seat cache
    const matrix = seatCache[scheduledShowtimeId] || generateSeats('movie', scheduledShowtimeId);
    seatCache[scheduledShowtimeId] = matrix;
    const s = matrix.find(seat => seat.id === seatId);
    if (s && (s.status === 'AVAILABLE' || s.status === 'BLOCKED')) {
      s.status = 'BLOCKED';
    }
    // Update scheduledShowtimes state
    setScheduledShowtimes(prev => {
      const next = prev.map(st => {
        if (st.id !== scheduledShowtimeId) return st;
        if (st.blockedSeats.includes(seatId)) return st;
        const updatedArray = [...st.blockedSeats, seatId];
        // Write to Supabase
        supabase.from('showtimes').update({ blocked_seats: updatedArray }).match({ id: scheduledShowtimeId }).then(({ error }) => {
          if (error) console.error("Supabase error:", error);
        });
        return { ...st, blockedSeats: updatedArray };
      });
      safeLocalSet('adani_scheduled_showtimes', next);
      return next;
    });
    // Also persist in blocked map for legacy seat cache
    const blockedMap = safeLocalGet<Record<string, string[]>>('adani_blocked_seats', {});
    if (!blockedMap[scheduledShowtimeId]) blockedMap[scheduledShowtimeId] = [];
    if (!blockedMap[scheduledShowtimeId].includes(seatId)) {
      blockedMap[scheduledShowtimeId].push(seatId);
    }
    safeLocalSet('adani_blocked_seats', blockedMap);
  }, []);

  const unblockScheduledSeat = useCallback((scheduledShowtimeId: string, seatId: string) => {
    const matrix = seatCache[scheduledShowtimeId];
    if (matrix) {
      const s = matrix.find(seat => seat.id === seatId);
      if (s && s.status === 'BLOCKED') s.status = 'AVAILABLE';
    }
    setScheduledShowtimes(prev => {
      const next = prev.map(st => {
        if (st.id !== scheduledShowtimeId) return st;
        const updatedArray = st.blockedSeats.filter(id => id !== seatId);
        // Write to Supabase
        supabase.from('showtimes').update({ blocked_seats: updatedArray }).match({ id: scheduledShowtimeId }).then(({ error }) => {
          if (error) console.error("Supabase error:", error);
        });
        return { ...st, blockedSeats: updatedArray };
      });
      safeLocalSet('adani_scheduled_showtimes', next);
      return next;
    });
    const blockedMap = safeLocalGet<Record<string, string[]>>('adani_blocked_seats', {});
    if (blockedMap[scheduledShowtimeId]) {
      blockedMap[scheduledShowtimeId] = blockedMap[scheduledShowtimeId].filter(id => id !== seatId);
    }
    safeLocalSet('adani_blocked_seats', blockedMap);
  }, []);

  const getMovieScheduledShowtimes = useCallback((movieId: string): ScheduledShowtime[] => {
    return scheduledShowtimes.filter(s => s.movieId === movieId);
  }, [scheduledShowtimes]);

  const isMovieScheduled = useCallback((movieId: string): boolean => {
    return scheduledShowtimes.some(s => s.movieId === movieId);
  }, [scheduledShowtimes]);

  // ---- Seat Matrix ----

  const getSeatMatrix = useCallback((showtimeId: string): Seat[] => {
    if (!seatCache[showtimeId]) {
      seatCache[showtimeId] = generateSeats('movie', showtimeId);
    }
    // Apply blocked seats from scheduledShowtimes
    const scheduled = scheduledShowtimes.find(s => s.id === showtimeId);
    if (scheduled) {
      scheduled.blockedSeats.forEach(seatId => {
        const s = seatCache[showtimeId].find(seat => seat.id === seatId);
        if (s && s.status === 'AVAILABLE') s.status = 'BLOCKED';
      });
    }
    return seatCache[showtimeId];
  }, [scheduledShowtimes]);

  const toggleSeat = useCallback((seat: Seat, showtimeId: string) => {
    const matrix = getSeatMatrix(showtimeId);
    const target = matrix.find(s => s.id === seat.id);
    if (!target) return;
    if (target.status === 'BOOKED' || target.status === 'LOCKED' || target.status === 'BLOCKED') return;

    if (target.status === 'SELECTED') {
      target.status = 'AVAILABLE';
      setSelectedSeats(prev => {
        const next = prev.filter(s => s.id !== seat.id);
        safeLocalSet('adani_selectedSeats', next);
        return next;
      });
    } else if (target.status === 'AVAILABLE') {
      target.status = 'SELECTED';
      setSelectedSeats(prev => {
        const next = [...prev, { ...target }];
        safeLocalSet('adani_selectedSeats', next);
        return next;
      });
    }
  }, [getSeatMatrix]);

  const clearSeats = useCallback(() => {
    setSelectedSeats([]);
    safeLocalSet('adani_selectedSeats', []);
  }, []);

  const lockSeats = useCallback((showtimeId: string, seatIds: string[]) => {
    const matrix = getSeatMatrix(showtimeId);
    seatIds.forEach(id => {
      const s = matrix.find(seat => seat.id === id);
      if (s) s.status = 'LOCKED';
    });
  }, [getSeatMatrix]);

  const blockSeat = useCallback((showtimeId: string, seatId: string) => {
    const matrix = getSeatMatrix(showtimeId);
    const s = matrix.find(seat => seat.id === seatId);
    if (s && (s.status === 'AVAILABLE' || s.status === 'BLOCKED')) {
      s.status = 'BLOCKED';
      const blockedMap = safeLocalGet<Record<string, string[]>>('adani_blocked_seats', {});
      if (!blockedMap[showtimeId]) blockedMap[showtimeId] = [];
      if (!blockedMap[showtimeId].includes(seatId)) {
        blockedMap[showtimeId].push(seatId);
      }
      safeLocalSet('adani_blocked_seats', blockedMap);
    }
  }, [getSeatMatrix]);

  const unblockSeat = useCallback((showtimeId: string, seatId: string) => {
    const matrix = getSeatMatrix(showtimeId);
    const s = matrix.find(seat => seat.id === seatId);
    if (s && s.status === 'BLOCKED') {
      s.status = 'AVAILABLE';
      const blockedMap = safeLocalGet<Record<string, string[]>>('adani_blocked_seats', {});
      if (blockedMap[showtimeId]) {
        blockedMap[showtimeId] = blockedMap[showtimeId].filter(id => id !== seatId);
      }
      safeLocalSet('adani_blocked_seats', blockedMap);
    }
  }, [getSeatMatrix]);

  const confirmBooking = useCallback((): string => {
    if (!selectedMovie || !selectedShowtime || selectedSeats.length === 0) return '';
    const ref = 'ADP-' + Date.now();
    const booking: Booking = {
      id: ref,
      movie: selectedMovie,
      showtime: selectedShowtime,
      seats: [...selectedSeats],
      employeeId: employeeId || 'ADANI2401',
      createdAt: new Date().toISOString(),
    };

    // Write to Supabase first, then update local state
    supabase.from('bookings').insert([{
      id: ref,
      user_id: employeeId || 'ADANI2401',
      showtime_id: selectedShowtime.id,
      seats: [...selectedSeats],
      employee_id: employeeId || 'ADANI2401',
      movie_snapshot: selectedMovie,
      showtime_snapshot: selectedShowtime,
    }]).select().then(({ data, error }) => {
      // Update local state regardless of Supabase result
      setBookings(prev => {
        const next = [booking, ...prev];
        safeLocalSet('adani_bookings', next);
        return next;
      });
      if (error) console.error("Supabase error:", error);
    });

    // Optimistically update local state immediately
    setBookings(prev => {
      const next = [booking, ...prev];
      safeLocalSet('adani_bookings', next);
      return next;
    });
    setBookingRefState(ref);
    safeLocalSet('adani_bookingRef', ref);
    setSelectedSeats([]);
    safeLocalSet('adani_selectedSeats', []);

    return ref;
  }, [selectedMovie, selectedShowtime, selectedSeats, employeeId]);

  const cancelBooking = useCallback((bookingId: string) => {
    // Delete from Supabase first
    supabase.from('bookings').delete().match({ id: bookingId }).then(({ error }) => {
      if (error) console.error("Supabase error:", error);
    });

    setBookings(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (booking) {
        // Free up seats in seat cache
        const showtimeId = booking.showtime.id;
        const matrix = seatCache[showtimeId];
        if (matrix) {
          booking.seats.forEach(seat => {
            const s = matrix.find(ms => ms.id === seat.id);
            if (s && (s.status === 'BOOKED' || s.status === 'LOCKED')) {
              s.status = 'AVAILABLE';
            }
          });
        }
      }
      const next = prev.filter(b => b.id !== bookingId);
      safeLocalSet('adani_bookings', next);
      return next;
    });
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      movies, addMovie,
      selectedMovie, setSelectedMovie,
      selectedShowtime, setSelectedShowtime,
      selectedDate, setSelectedDate,
      selectedSeats, toggleSeat, clearSeats,
      getSeatMatrix, lockSeats, blockSeat, unblockSeat,
      addShowtime,
      bookingRef, setBookingRef,
      employeeId, setEmployeeId,
      apiKey, setApiKey,
      bookings, confirmBooking, cancelBooking,
      scheduledShowtimes,
      addScheduledShowtime,
      removeScheduledShowtime,
      blockScheduledSeat,
      unblockScheduledSeat,
      getMovieScheduledShowtimes,
      isMovieScheduled,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}