'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AppProvider } from '@/lib/context';


function AdminLoginContent() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError('');
    if (!adminId?.trim() || !pin?.trim()) {
      setError('Please enter Admin ID and PIN');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (adminId?.trim()?.toUpperCase() === 'ADMIN' && pin === '1234') {
        try {
          localStorage.setItem('adani_admin_auth', JSON.stringify({ id: adminId?.toUpperCase(), loggedIn: true }));
        } catch { /* ignore */ }
        router?.push('/admin/dashboard');
      } else {
        setError('Invalid Admin ID or PIN. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      {/* Back */}
      <div className="absolute top-6 left-5">
        <button
          onClick={() => router?.push('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(211,47,47,0.2)', border: '1px solid rgba(211,47,47,0.4)' }}>
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-white text-2xl font-extrabold">Admin Access</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Shantigram Cinema · Management Portal
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl p-6 space-y-4"
          style={{ background: '#1A1A1A', border: '1px solid #2E2E2E' }}>
          <div>
            <label className="block text-sm font-semibold text-secondary-foreground mb-2">Admin ID</label>
            <input
              type="text"
              value={adminId}
              onChange={e => setAdminId(e?.target?.value)}
              onKeyDown={e => e?.key === 'Enter' && handleLogin()}
              placeholder="Enter Admin ID"
              className="input-field w-full"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary-foreground mb-2">PIN</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e?.target?.value)}
                onKeyDown={e => e?.key === 'Enter' && handleLogin()}
                placeholder="Enter PIN"
                className="input-field w-full pr-12"
                maxLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-900/30 border border-red-800/50"
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: loading ? '#4A1A1A' : 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <>
                <Shield size={18} />
                Access Dashboard
              </>
            )}
          </motion.button>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 rounded-2xl border border-yellow-800/40 bg-yellow-900/10">
          <p className="text-yellow-400 text-xs text-center font-medium">
            Demo credentials: ID: <span className="font-mono font-bold">ADMIN</span> · PIN: <span className="font-mono font-bold">1234</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <AppProvider>
      <AdminLoginContent />
    </AppProvider>
  );
}
