'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, X, Film } from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import { Seat, SeatStatus, SAMPLE_MOVIES } from '@/lib/store';

function SeatButton({
  seat,
  onToggle,
}: {
  seat: Seat;
  onToggle: (seat: Seat) => void;
}) {
  const [bouncing, setBouncing] = useState(false);

  const handleClick = () => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED') return;
    setBouncing(true);
    onToggle(seat);
    setTimeout(() => setBouncing(false), 400);
  };

  const statusStyles: Record<SeatStatus, string> = {
    AVAILABLE: 'seat-available cursor-pointer hover:opacity-90',
    SELECTED: 'seat-selected cursor-pointer',
    BOOKED: 'seat-booked',
    LOCKED: 'seat-locked',
    BLOCKED: 'seat-blocked',
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={bouncing ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      className={`
        w-7 h-6 rounded-t-lg text-xs font-bold font-tabular
        flex items-center justify-center transition-colors duration-150
        ${statusStyles[seat.status]}
      `}
      aria-label={`Row ${seat.row} Seat ${seat.number} - ${seat.status}`}
      disabled={seat.status === 'BOOKED' || seat.status === 'LOCKED'}
    >
      {seat.number}
    </motion.button>
  );
}

function SeatMatrixContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedMovie, setSelectedMovie, selectedShowtime, setSelectedShowtime, selectedSeats, toggleSeat, getSeatMatrix, clearSeats, movies, bookings } = useApp();
  const [seatMatrix, setSeatMatrix] = useState<Seat[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resilient fallback: hydrate from query params or first available
  useEffect(() => {
    const movieId = searchParams.get('movieId');
    const timeParam = searchParams.get('time');

    let resolvedMovie = selectedMovie;
    if (!resolvedMovie && movieId) {
      resolvedMovie = movies.find(m => m.id === movieId)
        || SAMPLE_MOVIES.find(m => m.id === movieId)
        || movies[0]
        || SAMPLE_MOVIES[0];
      if (resolvedMovie) setSelectedMovie(resolvedMovie);
    }
    if (!resolvedMovie) {
      resolvedMovie = movies[0] || SAMPLE_MOVIES[0];
      if (resolvedMovie) setSelectedMovie(resolvedMovie);
    }

    if (!selectedShowtime && resolvedMovie) {
      let st = resolvedMovie.showtimes[0];
      if (timeParam) {
        const found = resolvedMovie.showtimes.find(s => s.time === decodeURIComponent(timeParam));
        if (found) st = found;
      }
      if (st) {
        setSelectedShowtime({ ...st, date: new Date().toISOString().split('T')[0] });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedShowtime) {
      setSeatMatrix(getSeatMatrix(selectedShowtime.id));
    }
  }, [selectedShowtime, getSeatMatrix]);

  const handleToggle = useCallback((seat: Seat) => {
    if (!selectedShowtime) return;
    toggleSeat(seat, selectedShowtime.id);
    setSeatMatrix(prev => [...prev]);
  }, [selectedShowtime, toggleSeat]);

  // PURE DERIVED: compute booked seat IDs from master bookings array
  const bookedSeatKeys = new Set<string>(
    bookings
      .filter(b => b.showtime?.id === selectedShowtime?.id)
      .flatMap(b => b.seats.map(s => `${s.row}-${s.number}`))
  );

  const getEffectiveSeat = (seat: Seat): Seat => {
    const key = `${seat.row}-${seat.number}`;
    if (bookedSeatKeys.has(key)) return { ...seat, status: 'BOOKED' };
    return seat;
  };

  const rows = ['M','L','K','J','I','H','G','F','E','D','C','B','A'];

  const getSeatsForRow = (row: string): Seat[] => {
    return seatMatrix.filter(s => s.row === row).sort((a, b) => b.number - a.number);
  };

  const getRowBlocks = (row: string): { left: Seat[]; right: Seat[] } => {
    const seats = seatMatrix.filter(s => s.row === row).sort((a, b) => b.number - a.number);
    if (row === 'A') {
      // Row A: 17 seats. Left block: seats 9-17 (9 seats), Right block: seats 1-8 (8 seats). No aisle gap.
      return {
        left: seats.filter(s => s.number >= 9).sort((a, b) => b.number - a.number).map(getEffectiveSeat),
        right: seats.filter(s => s.number <= 8).sort((a, b) => b.number - a.number).map(getEffectiveSeat),
      };
    } else {
      // Rows B-M: 15 seats. Left block: seats 8-15 (8 seats), Aisle: 2 cols, Right block: seats 1-7 (7 seats)
      return {
        left: seats.filter(s => s.number >= 8).sort((a, b) => b.number - a.number).map(getEffectiveSeat),
        right: seats.filter(s => s.number <= 7).sort((a, b) => b.number - a.number).map(getEffectiveSeat),
      };
    }
  };

  const totalPrice = selectedSeats.length * 50;

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    router.push('/checkout-timer');
  };

  const movie = selectedMovie || movies[0] || SAMPLE_MOVIES[0];
  const showtime = selectedShowtime;

  // Show loading state while hydrating
  if (!showtime) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-5">
        <Film size={48} className="text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground text-center">Loading seat map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 px-5 py-4"
        style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { clearSeats(); router.back(); }}
            className="p-2.5 rounded-xl bg-muted"
          >
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold truncate">{movie?.title || 'Select Seats'}</p>
            <p className="text-muted-foreground text-xs">{showtime.time} · {showtime.date || 'Today'}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Seats</p>
            <p className="text-white text-sm font-bold font-tabular">{selectedSeats.length} / 6 max</p>
          </div>
        </div>
      </div>

      {/* Scrollable seat area */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="px-4 pt-4 pb-4" style={{ minWidth: '320px' }}>
          {/* Screen indicator */}
          <div className="mb-6">
            <div className="relative mx-auto" style={{ maxWidth: '280px' }}>
              <div
                className="h-2 rounded-full screen-glow mb-1"
                style={{ background: 'linear-gradient(90deg, transparent, #D32F2F80, #D32F2F, #D32F2F80, transparent)' }}
              />
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #444)' }} />
                <span className="text-muted-foreground text-xs font-medium tracking-widest uppercase">Screen</span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #444)' }} />
              </div>
              <p className="text-center text-muted-foreground text-xs mt-1">All eyes this way ↑</p>
            </div>
          </div>

          {/* Seat Grid */}
          <div className="space-y-1.5">
            {rows.map(row => {
              const { left, right } = getRowBlocks(row);
              return (
                <div key={`row-${row}`} className="flex items-center gap-2">
                  {/* Row label left */}
                  <div className="w-5 flex-shrink-0 text-center">
                    <span className="text-muted-foreground text-xs font-bold font-tabular">{row}</span>
                  </div>

                  {/* Left block (higher seat numbers) */}
                  <div className="flex gap-1 justify-end flex-1">
                    {left.map(seat => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>

                  {/* Aisle */}
                  <div className={`flex-shrink-0 flex items-center justify-center ${row === 'A' ? 'w-0' : 'w-8'}`}>
                    {row !== 'A' && <div className="w-px h-4 bg-border" />}
                  </div>

                  {/* Right block (lower seat numbers) */}
                  <div className="flex gap-1 flex-1">
                    {right.map(seat => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        onToggle={handleToggle}
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

          {/* Legend */}
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              { label: 'Available', className: 'seat-available w-5 h-4 rounded-t-md' },
              { label: 'Selected', className: 'seat-selected w-5 h-4 rounded-t-md' },
              { label: 'Booked', className: 'seat-booked w-5 h-4 rounded-t-md' },
              { label: 'Blocked', className: 'seat-blocked w-5 h-4 rounded-t-md' },
            ].map(item => (
              <div key={`legend-${item.label}`} className="flex items-center gap-1.5">
                <div className={item.className} />
                <span className="text-muted-foreground text-xs">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-muted-foreground text-xs mt-3">
            Township Pricing · ₹50 per seat
          </p>
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="sticky bottom-0 z-40 px-5 pb-8 pt-4"
            style={{ background: 'linear-gradient(to top, #0A0A0A 70%, transparent)' }}
          >
            <div
              className="rounded-3xl p-4 mb-3"
              style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-muted-foreground text-xs">Selected Seats</p>
                  <p className="text-white text-sm font-bold mt-0.5">
                    {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-white text-lg font-extrabold font-tabular">₹{totalPrice}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedSeats.map(seat => (
                  <span
                    key={`tag-${seat.id}`}
                    className="flex items-center gap-1 bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full"
                  >
                    {seat.row}{seat.number}
                    <button
                      onClick={() => handleToggle(seat)}
                      className="ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleProceed}
              className="btn-primary flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state prompt */}
      {selectedSeats.length === 0 && (
        <div className="sticky bottom-0 px-5 pb-8 pt-4 text-center"
          style={{ background: 'linear-gradient(to top, #121212 60%, transparent)' }}>
          <p className="text-muted-foreground text-sm">Tap a seat to select it</p>
        </div>
      )}
    </div>
  );
}

function SeatMatrixWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Film size={48} className="text-muted-foreground animate-pulse" />
      </div>
    }>
      <SeatMatrixContent />
    </Suspense>
  );
}

export default function SeatMatrixPage() {
  return (
    <AppProvider>
      <SeatMatrixWithSuspense />
    </AppProvider>
  );
}