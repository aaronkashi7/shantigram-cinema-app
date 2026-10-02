'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Download, Share2,
  MapPin, Calendar, Clock, User, Hash, Star, Ticket,
  Home as HomeIcon, Compass
} from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';
import AppImage from '@/components/ui/AppImage';
import QRCode from 'react-qr-code';

function QRCodeDisplay({ value }: { value: string }) {
  return (
    <div className="p-4 bg-white rounded-2xl inline-block">
      <QRCode
        value={value}
        size={160}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="M"
      />
    </div>
  );
}

function BottomNav({ activeRoute }: { activeRoute: string }) {
  const router = useRouter();
  const navItems = [
    { icon: HomeIcon, label: 'Home', route: '/home' },
    { icon: Compass, label: 'Explore', route: '/explore' },
    { icon: Ticket, label: 'My Tickets', route: '/digital-boarding-pass-ticket' },
    { icon: User, label: 'Profile', route: '/profile' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #2E2E2E' }}>
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map(item => (
          <button key={`nav-${item.label}`} onClick={() => router.push(item.route)} className="flex flex-col items-center gap-1 min-w-0 px-3">
            <item.icon size={22} className={activeRoute === item.route ? 'text-primary' : 'text-gray-500'} />
            <span className={`text-xs font-medium ${activeRoute === item.route ? 'text-primary' : 'text-gray-500'}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TicketContent() {
  const router = useRouter();
  const { bookings, employeeId } = useApp();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const d = new Date();
    setDateStr(`${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`);
  }, []);

  // Get the latest/active booking
  const latestBooking = bookings.length > 0 ? bookings[0] : null;

  // EMPTY STATE
  if (!latestBooking) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-24">
        {/* Header */}
        <div className="sticky top-0 z-30 px-5 py-4"
          style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
          <div>
            <h1 className="text-white text-base font-bold">My Tickets</h1>
            <p className="text-gray-500 text-xs">Active & Upcoming Passes</p>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Ticket size={40} className="text-primary/60" />
            </div>
            <div className="text-center">
              <h2 className="text-white text-xl font-bold mb-2">No Active Tickets</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                You don&apos;t have any upcoming shows booked right now.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/explore')}
              className="btn-primary flex items-center justify-center gap-2 w-full max-w-xs"
            >
              Explore Movies
            </motion.button>
          </motion.div>
        </div>

        <BottomNav activeRoute="/digital-boarding-pass-ticket" />
      </div>
    );
  }

  const { movie, showtime, seats, id: ref } = latestBooking;
  const empId = latestBooking.employeeId || employeeId || 'ADANI2401';
  const totalAmount = seats.length * 50;

  // Render booking creation date safely (createdAt is an ISO string, only used for display of booking date)
  const bookingDate = latestBooking.createdAt
    ? (() => {
        const d = new Date(latestBooking.createdAt);
        return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`;
      })()
    : dateStr;

  // Render show date: use the raw date string directly to avoid UTC timezone shift
  // showtime.date is "YYYY-MM-DD" — parse as local parts, not via new Date()
  const showDateDisplay = (() => {
    const raw = showtime.date;
    if (!raw) return bookingDate;
    const parts = raw.split('-');
    if (parts.length !== 3) return raw;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[0], 10);
    return `${day} ${monthNames[month]} ${year}`;
  })();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 px-5 py-4"
        style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-base font-bold">My Tickets</h1>
            <p className="text-gray-500 text-xs">Active & Upcoming Passes</p>
          </div>
          <button className="p-2.5 rounded-xl bg-muted">
            <Share2 size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-3xl overflow-hidden shadow-elevated"
          style={{ background: '#1A1A1A', border: '1px solid #333' }}
        >
          {/* Top section: Movie poster + title */}
          <div className="relative h-48 overflow-hidden">
            <AppImage
              src={movie.poster}
              alt={`${movie.title} ticket backdrop`}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(26,26,26,0.95) 100%)' }} />

            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-900/80 border border-green-600 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-green-400 text-xs font-bold">CONFIRMED</span>
            </div>

            <div className="absolute top-4 left-4 bg-primary rounded-xl px-3 py-1.5">
              <span className="text-white text-xs font-extrabold tracking-wide">SHANTIGRAM CINEMA</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-white text-xl font-extrabold leading-tight">{movie.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="meta-chip">{movie.genre.split(',')[0]}</span>
                <span className="meta-chip flex items-center gap-1">
                  <Star size={10} fill="#FFD700" stroke="#FFD700" />
                  {movie.rating}
                </span>
                <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {movie.certificate}
                </span>
              </div>
            </div>
          </div>

          {/* Torn edge divider */}
          <div className="relative mx-0 overflow-visible" style={{ height: '1px', margin: '0 -1px' }}>
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full" style={{ background: '#121212' }} />
            <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full" style={{ background: '#121212' }} />
          </div>

          {/* Details grid */}
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { icon: Calendar, label: 'Date', value: showDateDisplay },
                { icon: Clock, label: 'Show Time', value: showtime.time },
                { icon: MapPin, label: 'Venue', value: 'APML Tiroda Cinema' },
                { icon: User, label: 'Employee ID', value: empId },
              ].map(item => (
                <div key={`detail-${item.label}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon size={12} className="text-primary" />
                    <span className="text-gray-500 text-xs font-medium">{item.label}</span>
                  </div>
                  <p className="text-white text-sm font-semibold truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Seats */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Hash size={12} className="text-primary" />
                <span className="text-gray-500 text-xs font-medium">Seat Coordinates</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {seats.map(seat => (
                  <span
                    key={`ticket-seat-${seat.id}`}
                    className="bg-primary text-white text-sm font-extrabold px-3 py-1.5 rounded-xl font-tabular"
                  >
                    Row {seat.row} · #{seat.number}
                  </span>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between mb-5 p-3 rounded-2xl" style={{ background: '#242424' }}>
              <span className="text-gray-500 text-sm">Amount Paid</span>
              <span className="text-white text-lg font-extrabold font-tabular">₹{totalAmount}</span>
            </div>

            {/* Torn edge before QR */}
            <div className="relative overflow-visible mb-5" style={{ height: '1px', margin: '0 -20px' }}>
              <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
              <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full" style={{ background: '#121212' }} />
              <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full" style={{ background: '#121212' }} />
            </div>

            {/* QR Code section */}
            <div className="flex flex-col items-center pt-1">
              <QRCodeDisplay value={JSON.stringify({ type: 'ticket', bookingId: latestBooking.id, showtimeId: latestBooking.showtime.id, seats: seats.map(s => `${s.row}-${s.number}`) })} />
              <div className="mt-3 text-center">
                <p className="text-gray-500 text-xs mb-1">Booking Reference</p>
                <p className="text-white text-base font-extrabold font-mono tracking-widest">{ref}</p>
              </div>
              <p className="text-gray-500 text-xs mt-2 text-center">
                Show this QR code at the cinema entrance
              </p>
            </div>

            {/* Footer badge */}
            <div className="mt-5 flex items-center justify-center gap-2 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-gray-500 text-xs">Shantigram Cinema, APML Tiroda</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center justify-center gap-2"
            onClick={() => alert('Download feature would generate a PDF in production')}
          >
            <Download size={18} />
            Download Ticket
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/explore')}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Compass size={16} />
            Explore More Movies
          </motion.button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-5 px-4 leading-relaxed">
          This ticket is valid for one-time entry only. Non-transferable and exclusive to the named employee.
        </p>
      </div>

      <BottomNav activeRoute="/digital-boarding-pass-ticket" />
    </div>
  );
}

export default function DigitalBoardingPassTicketPage() {
  return (
    <AppProvider>
      <TicketContent />
    </AppProvider>
  );
}
