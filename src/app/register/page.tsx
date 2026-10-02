'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Phone,
  Building2, CheckCircle2, ChevronDown
} from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';

const DIVISIONS = [
  'Administration',
  'Thermal Power Station',
  'Maintenance',
  'Operations',
  'Security',
  'Safety & Environment',
  'Human Resources',
];

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
];

interface RegisteredUser {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  division: string;
  createdAt: string;
}

/** Generate a 6-digit numeric corporate ID: APML-TRD-XXXXXX */
function generateTownshipId(): string {
  const empId = 'APML-TRD-' + Math.floor(100000 + Math.random() * 900000);
  return empId;
}

function RegisterContent() {
  const router = useRouter();
  const { setEmployeeId } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [testModeToast, setTestModeToast] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP — 6 digits
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required';
    if (!phone.trim() || !/^\d{10}$/.test(phone)) e.phone = '10-digit phone number required';
    if (!division) e.division = 'Please select your division';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep1Submit = async () => {
    if (!validate()) return;

    // Check if phone already registered
    try {
      const existing: RegisteredUser[] = JSON.parse(localStorage.getItem('adani_registered_users') || '[]');
      if (existing.some(u => u.phone === phone)) {
        setErrors(prev => ({ ...prev, phone: 'This number is already registered. Please login instead.' }));
        return;
      }
    } catch { /* ignore */ }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setStep(2);
    setTestModeToast(true);
    setTimeout(() => setTestModeToast(false), 4000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');
    if (value && index < 5) {
      const next = document.getElementById(`reg-otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`reg-otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    if (enteredOtp !== '123456') {
      setOtpError('Invalid OTP. Test Mode: use 123456');
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    // Generate Township ID: APML-TRD-YYYY-XXXX
    const newId = generateTownshipId();

    // Build complete user object
    const newUser: RegisteredUser = {
      employeeId: newId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      division,
      createdAt: new Date().toISOString(),
    };

    // Save to registered users list
    try {
      const existing: RegisteredUser[] = JSON.parse(localStorage.getItem('adani_registered_users') || '[]');
      existing.push(newUser);
      localStorage.setItem('adani_registered_users', JSON.stringify(existing));
    } catch { /* ignore */ }

    // Save as active user for profile page
    try {
      localStorage.setItem('adani_active_user', JSON.stringify(newUser));
    } catch { /* ignore */ }

    setEmployeeId(newId);
    setIsLoading(false);
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Test Mode Toast */}
      <AnimatePresence>
        {testModeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold shadow-elevated"
            style={{ background: 'linear-gradient(135deg, #1A2A1A, #0D1F0D)', border: '1px solid #4CAF5060', color: '#81C784', maxWidth: '320px', width: 'calc(100% - 40px)' }}
          >
            <span className="text-base">🧪</span>
            <span>Test Mode Active: Use OTP <span className="font-mono font-extrabold text-green-300">123456</span></span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 px-5 py-4" style={{ background: 'rgba(18,18,18,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2E2E2E' }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => step === 1 ? router.push('/login') : setStep(1)} className="p-2.5 rounded-xl bg-muted">
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
          <div>
            <h1 className="text-white text-base font-bold">Employee Registration</h1>
            <p className="text-gray-500 text-xs">Adani Power Plant · Tiroda Township</p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-3">
          {[1, 2].map(s => (
            <React.Fragment key={`step-${s}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-primary text-white' : 'bg-muted text-gray-500'}`}>
                {step > s ? <CheckCircle2 size={14} /> : s}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: Registration Form */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <h2 className="text-white text-xl font-bold">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">Fill in your employee details to register</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={fullName} onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }} placeholder="e.g. Rajesh Sharma" className="input-field pl-10" />
                </div>
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Plant/Township Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }} placeholder="e.g. rajesh.s@adani.com" type="email" className="input-field pl-10" />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Division Dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Division *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDivisionDropdown(v => !v)}
                    className="w-full flex items-center justify-between px-4 rounded-xl border border-border bg-muted text-sm font-medium"
                    style={{ minHeight: '48px', color: division ? 'white' : '#6B7280' }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-500 flex-shrink-0" />
                      <span>{division || 'Select your division'}</span>
                    </div>
                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                  <AnimatePresence>
                    {showDivisionDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl overflow-hidden shadow-elevated"
                        style={{ background: '#1E1E1E', border: '1px solid #333' }}
                      >
                        {DIVISIONS.map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { setDivision(d); setShowDivisionDropdown(false); setErrors(p => ({ ...p, division: '' })); }}
                            className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors hover:bg-muted ${division === d ? 'text-primary font-semibold' : 'text-white'}`}
                          >
                            {division === d && <CheckCircle2 size={14} className="text-primary flex-shrink-0" />}
                            <span>{d}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.division && <p className="text-red-400 text-xs mt-1">{errors.division}</p>}
              </div>

              {/* Phone with Country Code */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Mobile Phone Number *</label>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(v => !v)}
                      className="flex items-center gap-1.5 px-3 rounded-xl border border-border bg-muted text-white text-sm font-semibold min-w-[80px] justify-between"
                      style={{ minHeight: '48px' }}
                    >
                      <span>{selectedCountry.flag} {selectedCountry.code}</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 mt-1 z-50 rounded-2xl overflow-hidden shadow-elevated"
                          style={{ background: '#1E1E1E', border: '1px solid #333', minWidth: '160px' }}
                        >
                          {COUNTRY_CODES.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setCountryCode(c.code); setShowCountryDropdown(false); }}
                              className={`w-full flex items-center gap-2 px-4 py-3 text-sm text-left transition-colors hover:bg-muted ${countryCode === c.code ? 'text-primary font-semibold' : 'text-white'}`}
                            >
                              <span>{c.flag}</span>
                              <span>{c.name}</span>
                              <span className="ml-auto text-gray-500 font-mono text-xs">{c.code}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative flex-1">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={phone}
                      onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(p => ({ ...p, phone: '' })); }}
                      placeholder="10-digit number"
                      type="tel"
                      className="input-field pl-9 font-tabular"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <button
                type="button"
                onClick={handleStep1Submit}
                disabled={isLoading}
                className="btn-primary flex items-center justify-center gap-2 mt-2 w-full"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <span>Sending OTP…</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>

              <p className="text-center text-xs text-gray-600 pt-1">
                Already registered?{' '}
                <button onClick={() => router.push('/login')} className="text-primary font-semibold">Sign In</button>
              </p>
            </motion.div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-white text-xl font-bold">Verify Your Number</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter the 6-digit code sent to {selectedCountry.code} {phone}
                </p>
              </div>

              {/* Registration summary */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Registration Details</p>
                <div className="flex items-center gap-2">
                  <User size={13} className="text-primary flex-shrink-0" />
                  <span className="text-white text-sm font-semibold">{fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-400 text-xs">{email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-400 text-xs">{division}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-500 flex-shrink-0" />
                  <span className="text-gray-400 text-xs font-tabular">{selectedCountry.code} {phone}</span>
                </div>
              </div>

              {/* 6-digit OTP input */}
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={`reg-otp-key-${i}`}
                    id={`reg-otp-${i}`}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    maxLength={1}
                    type="tel"
                    className={`w-11 h-12 text-center text-xl font-bold rounded-xl border-2 bg-muted text-white outline-none transition-all font-tabular ${
                      digit ? 'border-primary' : 'border-gray-700'
                    } ${otpError ? 'border-red-500' : ''}`}
                  />
                ))}
              </div>

              <AnimatePresence>
                {otpError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-xs text-center"
                  >
                    {otpError}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join('').length < 6}
                className="btn-primary flex items-center justify-center gap-2 w-full disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <span>Verify &amp; Create Account</span>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AppProvider>
      <RegisterContent />
    </AppProvider>
  );
}
