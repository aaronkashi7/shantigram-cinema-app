'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, UserPlus, Phone, ChevronDown, AlertCircle } from 'lucide-react';
import { AppProvider, useApp } from '@/lib/context';

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

function LoginContent() {
  const router = useRouter();
  const { setEmployeeId } = useApp();

  // Step 1: phone entry; Step 2: OTP entry
  const [step, setStep] = useState<1 | 2>(1);
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [testModeToast, setTestModeToast] = useState(false);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));

    // STRICT CHECK: phone must exist in registered users
    let found = false;
    try {
      const registeredUsers: RegisteredUser[] = JSON.parse(localStorage.getItem('adani_registered_users') || '[]');
      found = registeredUsers.some(u => u.phone === phone);
    } catch { /* ignore */ }

    setIsLoading(false);

    if (!found) {
      setPhoneError('No account found for this number. Please register first.');
      return;
    }

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
      const next = document.getElementById(`login-otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`login-otp-${index - 1}`);
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

    // Retrieve existing registered user profile
    let matchedUser: RegisteredUser | null = null;
    try {
      const registeredUsers: RegisteredUser[] = JSON.parse(localStorage.getItem('adani_registered_users') || '[]');
      matchedUser = registeredUsers.find(u => u.phone === phone) || null;
    } catch { /* ignore */ }

    if (!matchedUser) {
      // Should not reach here due to the check in handleSendOtp, but guard anyway
      setOtpError('Account not found. Please register first.');
      setIsLoading(false);
      return;
    }

    // Save the active user profile to localStorage for profile page
    try {
      localStorage.setItem('adani_active_user', JSON.stringify(matchedUser));
    } catch { /* ignore */ }

    setEmployeeId(matchedUser.employeeId);
    setIsLoading(false);
    router.push('/home');
  };

  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setTestModeToast(true);
    setTimeout(() => setTestModeToast(false), 4000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 relative overflow-hidden">
      {/* Background ambient */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D32F2F 0%, transparent 70%)' }}
      />

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

      <div className="w-full max-w-sm">
        {/* Logo + Branding */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #D32F2F, #B71C1C)' }}>
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
              <rect x="2" y="4" width="38" height="34" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
              <rect x="2" y="4" width="6" height="6" fill="white" opacity="0.4"/>
              <rect x="34" y="4" width="6" height="6" fill="white" opacity="0.4"/>
              <rect x="2" y="32" width="6" height="6" fill="white" opacity="0.4"/>
              <rect x="34" y="32" width="6" height="6" fill="white" opacity="0.4"/>
              <polygon points="16,13 32,21 16,29" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Shantigram Cinema</h1>
          <p className="text-muted-foreground text-sm mt-1">Community Cinema • APML Tiroda</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="glass-card rounded-3xl p-6"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
                <p className="text-muted-foreground text-sm mb-6">Enter your registered phone number to sign in</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-foreground mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(v => !v)}
                          className="flex items-center gap-1.5 h-full px-3 rounded-xl border border-border bg-muted text-white text-sm font-semibold min-w-[80px] justify-between"
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

                      {/* Phone Input */}
                      <div className="relative flex-1">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          value={phone}
                          onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError(''); }}
                          placeholder="10-digit number"
                          type="tel"
                          className="input-field pl-9 font-tabular"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                    {phoneError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-start gap-1.5 mt-2 p-2.5 rounded-xl"
                        style={{ background: '#2A1010', border: '1px solid #D32F2F40' }}
                      >
                        <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-xs leading-tight">{phoneError}</p>
                      </motion.div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="btn-primary flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <span>Checking…</span>
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        <span>Send OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setOtpError(''); }}
                  className="text-gray-500 text-xs mb-4 flex items-center gap-1 hover:text-white transition-colors"
                >
                  ← Change number
                </button>
                <h2 className="text-xl font-bold text-white mb-1">Verify OTP</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Enter the 6-digit code sent to {selectedCountry.code} {phone}
                </p>

                <div className="space-y-4">
                  {/* 6-digit OTP input */}
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={`login-otp-key-${i}`}
                        id={`login-otp-${i}`}
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
                    className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        <span>Verify &amp; Sign In</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="w-full text-center text-sm text-muted-foreground hover:text-white transition-colors py-1"
                  >
                    Didn&apos;t receive it? <span className="text-primary font-semibold">Resend OTP</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Register CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <button
            onClick={() => router.push('/register')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-primary/30 text-primary text-sm font-semibold transition-all"
            style={{ background: 'rgba(211,47,47,0.06)' }}
          >
            <UserPlus size={16} />
            New to Township? Register Employee Account
          </button>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Exclusive to APML Tiroda employees
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AppProvider>
      <LoginContent />
    </AppProvider>
  );
}