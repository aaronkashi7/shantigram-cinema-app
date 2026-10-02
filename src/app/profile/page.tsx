'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, Mail, Phone, Hash, Calendar, Clock, MapPin, Home as HomeIcon, Ticket, Compass, CheckCircle2, Trash2 } from 'lucide-react';
import { AppProvider, useApp, Booking } from '@/lib/context';
import AppImage from '@/components/ui/AppImage';
import QRCode from 'react-qr-code';

function QRCodeDisplay({ value, size = 90 }: { value: string; size?: number }) {
  return (
    <div className="p-2.5 bg-white rounded-xl inline-block">
      <QRCode
        value={value}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="M"
      />
    </div>
  );
}

interface UserProfile {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  division: string;
}

function TicketStubCard({ booking, isPast }: { booking: Booking; isPast: boolean }) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    if (booking.createdAt) {
      const d = new Date(booking.createdAt);
      setDateStr(`${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`);
    }
  }, [booking.createdAt]);

  const totalAmount = booking.seats.length * 50;

  const showDateDisplay = (() => {
    const raw = booking.showtime?.date;
    if (!raw) return dateStr;
    const parts = raw.split('-');
    if (parts.length !== 3) return raw;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const year = parseInt(parts[0], 10);
    return `${day} ${monthNames[month]} ${year}`;
  })();

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1A1A1A', border: `1px solid ${isPast ? '#2E2E2E' : '#D32F2F40'}` }}>
      <div className="px-4 py-2 flex items-center justify-between" style={{ background: isPast ? '#242424' : 'linear-gradient(135deg, #D32F2F22 0%, #B71C1C11 100%)', borderBottom: '1px dashed #2E2E2E' }}>
        <span className="text-xs font-bold tracking-widest" style={{ color: isPast ? '#666' : '#D32F2F' }}>
          {isPast ? 'PAST BOOKING' : 'UPCOMING'}
        </span>
        <span className="text-xs font-mono text-gray-500">{booking.id.slice(0, 12)}</span>
      </div>

      <div className="flex gap-3 p-4">
        <div className="relative w-14 h-20 flex-shrink-0 rounded-xl overflow-hidden">
          <AppImage src={booking.movie.poster} alt={`${booking.movie.title} poster`} fill className="object-cover" sizes="56px" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white text-sm font-bold leading-tight truncate">{booking.movie.title}</p>
            <span className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 ${isPast ? 'bg-gray-800 border border-gray-700' : 'bg-green-900/60 border border-green-600/50'}`}>
              <CheckCircle2 size={10} className={isPast ? 'text-gray-500' : 'text-green-400'} />
              <span className={`text-xs font-bold ${isPast ? 'text-gray-500' : 'text-green-400'}`}>{isPast ? 'Attended' : 'Confirmed'}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar size={11} className="text-primary" />
            <span className="text-gray-400 text-xs">{showDateDisplay}</span>
            <span className="text-gray-600">·</span>
            <Clock size={11} className="text-primary" />
            <span className="text-gray-400 text-xs">{booking.showtime.time}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Hash size={11} className="text-primary" />
            <span className="text-gray-400 text-xs truncate">
              {booking.seats.map(s => `${s.row}-${s.number}`).join(', ')}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-500 text-xs">{booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</span>
            <span className="text-white text-sm font-bold">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="relative mx-4" style={{ height: '1px' }}>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-700" />
        <div className="absolute -left-4 -top-2.5 w-5 h-5 rounded-full" style={{ background: '#121212' }} />
        <div className="absolute -right-4 -top-2.5 w-5 h-5 rounded-full" style={{ background: '#121212' }} />
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="text-gray-600" />
          <span className="text-gray-600 text-xs">Adani Township Cinema · Gate 2</span>
        </div>
        <span className="text-gray-600 text-xs font-mono">{booking.employeeId}</span>
      </div>
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { employeeId, setEmployeeId, bookings, cancelBooking } = useApp();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [hiddenPastIds, setHiddenPastIds] = useState<Set<string>>(new Set());
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem('adani_employeeId');
      if (id) { setAuthorized(true); return; }
    } catch { /* ignore */ }
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (!authorized) return;
    try {
      // Priority 1: active user set during login/register
      const activeUserRaw = localStorage.getItem('adani_active_user');
      if (activeUserRaw) {
        const activeUser: UserProfile = JSON.parse(activeUserRaw);
        setUserProfile(activeUser);
        return;
      }
      // Priority 2: look up by employeeId in registered users list
      if (employeeId) {
        const users: UserProfile[] = JSON.parse(localStorage.getItem('adani_registered_users') || '[]');
        const found = users.find(u => u.employeeId === employeeId);
        if (found) {
          setUserProfile(found);
          return;
        }
      }
    } catch { /* ignore */ }
  }, [employeeId, authorized]);

  const handleSignOut = () => {
    setEmployeeId('');
    try {
      localStorage.removeItem('adani_employeeId');
      localStorage.removeItem('adani_active_user');
    } catch { /* ignore */ }
    router.push('/login');
  };

  const isUpcoming = (booking: Booking): boolean => {
    try {
      const showDate = booking.showtime?.date;
      if (!showDate) return false;
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;
      return showDate >= todayStr;
    } catch {
      return false;
    }
  };

  const upcomingBookings = localBookings.filter(b => isUpcoming(b));
  const pastBookings = localBookings.filter(b => !isUpcoming(b)).filter(b => !hiddenPastIds.has(b.id));

  const clearPastHistory = () => {
    const pastIds = localBookings.filter(b => !isUpcoming(b)).map(b => b.id);
    setHiddenPastIds(prev => new Set([...prev, ...pastIds]));
  };

  const removePastBookingFromView = (bookingId: string) => {
    setHiddenPastIds(prev => new Set([...prev, bookingId]));
  };

  const cancelUpcomingBooking = (bookingId: string) => {
    cancelBooking(bookingId);
  };

  // Strict data binding — only show real registered data
  const displayName = userProfile?.fullName || '—';
  const displayId = userProfile?.employeeId || employeeId || '—';
  const displayEmail = userProfile?.email || '—';
  const displayPhone = userProfile?.phone || '—';
  const displayDivision = userProfile?.division || '—';

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 px-5 py-4" style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-base font-bold">My Profile</h1>
            <p className="text-gray-500 text-xs">Adani Power Plant · Tiroda Township</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-800/50 bg-red-950/30"
          >
            <LogOut size={15} className="text-red-400" />
            <span className="text-red-400 text-xs font-semibold">Sign Out</span>
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Township ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden shadow-elevated"
          style={{ background: 'linear-gradient(145deg, #1E1E1E 0%, #2A1A1A 100%)', border: '1px solid #D32F2F30' }}
        >
          {/* Card Header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}>
            <div>
              <p className="text-white/70 text-xs font-medium tracking-widest">SHANTIGRAM CINEMA</p>
              <p className="text-white text-sm font-extrabold tracking-wide">Community Cinema • APML Tiroda</p>
              <p className="text-white/60 text-xs mt-0.5">Cinema Pass</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 42 42" fill="none">
                  <rect x="2" y="4" width="38" height="34" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
                  <polygon points="16,13 32,21 16,29" fill="white"/>
                </svg>
              </div>
              <span className="text-white/80 text-xs font-bold">CINEMA</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 flex gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <User size={28} className="text-primary" />
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-gray-500 text-xs">Full Name</p>
                <p className="text-white text-base font-bold truncate">{displayName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Division</p>
                <p className="text-white text-xs font-semibold leading-tight">{displayDivision}</p>
              </div>
            </div>
          </div>

          {/* Details row */}
          <div className="px-5 pb-4 space-y-2">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-primary flex-shrink-0" />
              <span className="text-gray-400 text-xs truncate">{displayEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-primary flex-shrink-0" />
              <span className="text-gray-400 text-xs font-tabular">{displayPhone}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mx-5 mb-4" style={{ height: '1px' }}>
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-700" />
            <div className="absolute -left-5 -top-3 w-6 h-6 rounded-full" style={{ background: '#121212' }} />
            <div className="absolute -right-5 -top-3 w-6 h-6 rounded-full" style={{ background: '#121212' }} />
          </div>

          {/* Employee ID + QR */}
          <div className="px-5 pb-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Employee ID</p>
              <p className="text-primary text-lg font-extrabold font-mono tracking-wider">{displayId}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin size={11} className="text-gray-500" />
                <span className="text-gray-500 text-xs">Tiroda, Maharashtra</span>
              </div>
            </div>
            <QRCodeDisplay
              value={JSON.stringify({
                type: 'identity',
                employeeId: displayId,
                fullName: displayName,
                phone: displayPhone,
                division: displayDivision,
                email: displayEmail,
              })}
              size={90}
            />
          </div>
        </motion.div>

        {/* Booking History with Tabs */}
        <div>
          <h2 className="text-white text-base font-bold mb-3">Booking History</h2>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'upcoming' ? 'bg-primary text-white' : 'text-gray-500'}`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'past' ? 'bg-primary text-white' : 'text-gray-500'}`}
            >
              Past ({pastBookings.length})
            </button>
          </div>

          {activeTab === 'upcoming' && (
            <div>
              {upcomingBookings.length === 0 ? (
                <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <Ticket size={24} className="text-gray-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">No Upcoming Bookings</p>
                    <p className="text-gray-500 text-xs mt-1">Your upcoming show tickets will appear here</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/explore')}
                    className="btn-primary text-sm py-2.5 px-6"
                  >
                    Explore Movies
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map(booking => (
                    <div key={`upcoming-${booking.id}`} className="relative">
                      <TicketStubCard booking={booking} isPast={false} />
                      <button
                        onClick={() => cancelUpcomingBooking(booking.id)}
                        className="absolute top-3 right-3 flex items-center gap-1 text-red-400 text-xs font-semibold bg-black/60 rounded-lg px-2 py-1 hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 size={11} />
                        Cancel Ticket
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div>
              {pastBookings.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-500 text-xs">{pastBookings.length} past booking{pastBookings.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={clearPastHistory}
                    className="flex items-center gap-1.5 text-red-400 text-xs font-semibold"
                  >
                    <Trash2 size={12} />
                    Clear Past History
                  </button>
                </div>
              )}
              {pastBookings.length === 0 ? (
                <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <Clock size={24} className="text-gray-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-semibold">No Past Bookings</p>
                    <p className="text-gray-500 text-xs mt-1">Your attended shows will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map(booking => (
                    <div key={`past-${booking.id}`} className="relative">
                      <TicketStubCard booking={booking} isPast={true} />
                      <button
                        onClick={() => removePastBookingFromView(booking.id)}
                        className="absolute top-3 right-3 flex items-center gap-1 text-gray-400 text-xs font-semibold bg-black/60 rounded-lg px-2 py-1 hover:bg-gray-800/60 transition-colors"
                      >
                        <Trash2 size={11} />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid #2E2E2E' }}>
        <div className="flex items-center justify-around px-2 py-3">
          {[
            { icon: HomeIcon, label: 'Home', route: '/home', active: false },
            { icon: Compass, label: 'Explore', route: '/explore', active: false },
            { icon: Ticket, label: 'My Tickets', route: '/digital-boarding-pass-ticket', active: false },
            { icon: User, label: 'Profile', route: '/profile', active: true },
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

export default function ProfilePage() {
  return (
    <AppProvider>
      <ProfileContent />
    </AppProvider>
  );
}
