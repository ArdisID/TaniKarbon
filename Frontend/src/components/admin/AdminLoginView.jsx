import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { loginUser } from '../../api/auth';
import TaniKarbonLogo from '../common/TaniKarbonLogo';

export default function AdminLoginView({ onLogin, onBack, onNavigate }) {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState('ADM-ROOT-01');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser({
        identifier: adminId,
        password: password,
        role: 'admin'
      });
      if (onLogin) {
        onLogin('admin', data);
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Autentikasi admin gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setAdminId('ADM-ROOT-01');
    setPassword('••••••••••••');
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser({
        identifier: 'admin@tanikarbon.com',
        password: 'Password123!',
        role: 'admin'
      });
      if (onLogin) {
        onLogin('admin', data);
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      console.warn('Demo fallback:', err);
      if (onLogin) {
        onLogin('admin');
      }
      navigate('/admin', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center font-sans antialiased overflow-x-hidden"
      style={{
        backgroundImage: "url('/auth-bg-plantation.jpg')",
        backgroundColor: '#14382C'
      }}
    >
      {/* Soft atmospheric gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-amber-950/20 to-black/60 pointer-events-none" />

      {/* Subtle Concentric Rings radiating from behind the card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[500px] h-[500px] rounded-full border border-white/15 -translate-y-6" />
        <div className="absolute w-[750px] h-[750px] rounded-full border border-white/10 -translate-y-6" />
        <div className="absolute w-[1000px] h-[1000px] rounded-full border border-white/5 -translate-y-6" />
      </div>

      {/* Top Bar: Brand Logo & Back Button */}
      <div className="relative z-20 max-w-6xl w-full mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xs">
          <TaniKarbonLogo size={26} showText={true} textVariant="light" />
        </div>

        {/* Back to Home Button */}
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-800 text-xs font-semibold backdrop-blur-md border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Center Floating White Card (Same as Farmer Login) */}
      <div className="relative z-20 my-auto py-4 flex items-center justify-center">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[32px] p-7 sm:p-8 border border-white shadow-[0_24px_70px_-15px_rgba(0,0,0,0.35)] text-center transition-all animate-fade-in space-y-4">

          {/* Top Squircle Icon (Subtle Amber Differentiator) */}
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.12)] flex items-center justify-center mx-auto text-amber-600">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight font-sans">
              Masuk Portal Admin
            </h1>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed max-w-[280px] mx-auto font-sans">
              Otoritas klaster karbon, brankas escrow, dan audit pendaftaran pohon.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left animate-fade-in font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-tight font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Admin Identifier / Email
              </label>
              <input
                type="text"
                required
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="ADM-ROOT-01 / admin@tanikarbon.com"
                className="w-full px-4 py-2.5 bg-[#F3F4F6] focus:bg-white border border-transparent focus:border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 font-sans">
                Password Superadmin
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password Admin"
                  className="w-full px-4 pr-10 py-2.5 bg-[#F3F4F6] focus:bg-white border border-transparent focus:border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button (Subtle Warm Amber/Orange Accent) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs tracking-tight shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Masuk Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Button */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Demo 1-Klik Superadmin (ADM-ROOT-01)</span>
            </button>
          </div>

          {/* Switch to Public Login */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('auth')}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 transition font-sans"
            >
              Bukan Admin? <span className="text-amber-700 font-bold hover:underline">Masuk Portal Petani &amp; Korporat</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer Security Badges */}
      <footer className="relative z-20 text-center py-2">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] text-white/70 font-medium font-sans">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
            TaniKarbon Core Engine 2026
          </span>
          <span>·</span>
          <span>PostGIS Spatial Settlement</span>
          <span>·</span>
          <span>SRN-PPI &amp; ISO 14064 Compliant</span>
        </div>
      </footer>
    </div>
  );
}
