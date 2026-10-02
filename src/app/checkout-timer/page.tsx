'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, MapPin, Calendar, Film,
  AlertTriangle, CheckCircle, Loader2, Tag
} from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import AppImage from '@/components/ui/AppImage';

const LOCK_DURATION = 5 * 60;

function CheckoutContent() {
  const router = useRouter();
  const {
    selectedMovie, selectedShowtime, selectedSeats,
    clearSeats, lockSeats, employeeId, confirmBooking
  } = useApp();

  const [secondsLeft, setSecondsLeft] = useState(LOCK_DURATION);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lock seats on mount
  useEffect(() => {
    if (selectedShowtime && selectedSeats.length > 0) {
      lockSeats(selectedShowtime.id, selectedSeats.map(s => s.id));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // On expiry, release and redirect
  useEffect(() => {
    if (expired) {
      clearSeats();
      setTimeout(() => router.push('/movie-details'), 2000);
    }
  }, [expired, clearSeats, router]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const isUrgent = secondsLeft <= 60;

  const totalPrice = selectedSeats.length * 50;
  const grandTotal = totalPrice;

  const handleConfirm = useCallback(async () => {
    if (!selectedMovie || !selectedShowtime || selectedSeats.length === 0) return;
    setIsConfirming(true);
    await new Promise(r => setTimeout(r, 1500));
    // confirmBooking persists to localStorage and clears selectedSeats
    confirmBooking();
    setConfirmed(true);
    setIsConfirming(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => router.push('/digital-boarding-pass-ticket'), 800);
  }, [selectedMovie, selectedShowtime, selectedSeats, confirmBooking, router]);

  if (!selectedMovie || !selectedShowtime || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-5">
        <Film size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground text-center">No booking in progress.</p>
        <button onClick={() => router.push('/home')} className="btn-primary w-auto px-8">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-36">
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
          <div>
            <h1 className="text-white text-base font-bold">Checkout</h1>
            <p className="text-muted-foreground text-xs">Review your booking</p>
          </div>
        </div>
      </div>

      {/* Lock Timer Banner */}
      <AnimatePresence>
        {!confirmed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between ${
              isUrgent
                ? 'bg-red-950 border border-red-700' : 'border border-primary/30'
            }`}
            style={isUrgent ? {} : { background: 'rgba(211,47,47,0.08)' }}
          >
            <div className="flex items-center gap-2.5">
              {isUrgent
                ? <AlertTriangle size={18} className="text-red-400 animate-timer-pulse" />
                : <Clock size={18} className="text-primary" />
              }
              <div>
                <p className={`text-sm font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                  {expired ? 'Seats Released' : 'Seats held for'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {expired ? 'Redirecting back to movie…' : 'Complete booking before timer expires'}
                </p>
              </div>
            </div>
            <div className={`text-2xl font-extrabold font-tabular ${isUrgent ? 'text-red-400 animate-timer-pulse' : 'text-primary'}`}>
              {formatTime(secondsLeft)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success overlay */}
      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center gap-3 bg-green-950 border border-green-700"
          >
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-green-400 text-sm font-semibold">Booking confirmed! Generating your ticket…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 mt-5 space-y-4">
        {/* Movie summary card */}
        <div className="rounded-3xl overflow-hidden" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <div className="flex gap-4 p-4">
            <div className="relative w-20 h-28 flex-shrink-0 rounded-2xl overflow-hidden">
              <AppImage src={selectedMovie.poster} alt={`${selectedMovie.title} poster`} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white text-base font-bold leading-tight">{selectedMovie.title}</h2>
              <p className="text-muted-foreground text-xs mt-0.5">{selectedMovie.genre.split(',')[0]} · {selectedMovie.certificate}</p>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-primary flex-shrink-0" />
                  <span className="text-secondary-foreground text-xs">{selectedShowtime.date || 'Today'} · {selectedShowtime.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-primary flex-shrink-0" />
                  <span className="text-secondary-foreground text-xs">Tiroda Township Cinema · Gate 2</span>
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1">
                <span className="text-primary text-xs font-bold">ADANI TOWNSHIP</span>
              </div>
            </div>
          </div>

          <div className="ticket-torn-edge mx-0 border-t border-dashed border-border" />

          {/* Seats section */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-primary" />
              <p className="text-white text-sm font-bold">Selected Seats</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seat => (
                <span
                  key={`checkout-seat-${seat.id}`}
                  className="bg-primary/20 text-primary text-sm font-bold px-3 py-1.5 rounded-xl"
                >
                  {seat.row}-{seat.number}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="rounded-3xl p-5" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <h3 className="text-white text-sm font-bold mb-4">Price Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                Ticket × {selectedSeats.length} ({selectedSeats.length > 1 ? `${selectedSeats.length} seats` : '1 seat'})
              </span>
              <span className="text-white text-sm font-semibold font-tabular">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Convenience Fee</span>
              <span className="text-green-400 text-sm font-semibold">FREE</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="text-white text-base font-bold">Total Payable</span>
              <span className="text-white text-xl font-extrabold font-tabular">₹{grandTotal}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(211,47,47,0.08)' }}>
            <span className="text-primary text-xs">🎟️</span>
            <p className="text-primary text-xs font-medium">Township benefit: No booking fees for employees</p>
          </div>
        </div>

        {/* Employee info */}
        <div className="rounded-3xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <p className="text-muted-foreground text-xs font-medium mb-2">Booking as</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-sm font-bold">{(employeeId || 'A').charAt(0)}</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold">{employeeId || 'ADANI2401'}</p>
              <p className="text-muted-foreground text-xs">Adani Power Plant · Tiroda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 z-40"
        style={{ background: 'linear-gradient(to top, #121212 70%, transparent)' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          disabled={isConfirming || confirmed || expired || selectedSeats.length === 0}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Confirming Booking…</span>
            </>
          ) : confirmed ? (
            <>
              <CheckCircle size={18} />
              <span>Booking Confirmed!</span>
            </>
          ) : expired ? (
            <>
              <AlertTriangle size={18} />
              <span>Session Expired</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              <span>Confirm Booking · ₹{grandTotal}</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default function CheckoutTimerPage() {
  return (
    <AppProvider>
      <CheckoutContent />
    </AppProvider>
  );
}