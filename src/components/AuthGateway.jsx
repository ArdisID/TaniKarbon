import React, { useState } from 'react';
import {
  Leaf, Lock, Mail, Eye, EyeOff, User, Smartphone, Building2,
  ArrowLeft, ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export default function AuthGateway({ defaultTab = 'farmer', onLogin, onBack }) {
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');
  // Role: 'farmer' | 'corporate'
  const [role, setRole] = useState(defaultTab || 'farmer');
  
  // Form fields
  const [fullName, setFullName] = useState(role === 'farmer' ? 'Pak Joko Widodo' : 'Budi Santoso');
  const [identifier, setIdentifier] = useState(
    role === 'farmer' ? 'joko.widodo@tanikarbon.id' : 'esg-team@telkom.co.id'
  );
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(role);
    }, 600);
  };

  const handleQuickDemo = (targetRole) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(targetRole);
    }, 400);
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center font-sans"
      style={{
        backgroundImage: "url('/auth-bg.jpg')",
      }}
    >
      {/* Soft atmospheric radial gradient overlay so scenery stays visible but card pops */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-sky-950/20 to-black/50 pointer-events-none" />

      {/* Top Floating Bar: Back Button & Brand Badge */}
      <div className="relative z-20 max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold backdrop-blur-md border border-white/60 shadow-sm transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-sm">
          <div className="w-5 h-5 rounded-full bg-[#14382C] text-emerald-300 flex items-center justify-center">
            <Leaf className="w-3 h-3" />
          </div>
          <span className="font-extrabold text-xs text-[#14382C] tracking-tight">TaniKarbon</span>
        </div>
      </div>

      {/* Center Modal Card (Inspired by Dribbble Morva Labs design) */}
      <div className="relative z-20 my-auto py-8 flex items-center justify-center">
        <div className="w-full max-w-[420px] bg-white/90 sm:bg-white/92 backdrop-blur-2xl rounded-[32px] p-7 sm:p-9 border border-white/80 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.25)] text-center transition-all animate-fade-in">
          
          {/* Top Squircle Icon: Arrow entering bracket (Dribbble shot signature) */}
          <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-center mx-auto mb-4 text-[#14382C]">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            {mode === 'login' ? 'Sign in with email' : 'Daftar Mitra TaniKarbon'}
          </h1>
          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
            {mode === 'login'
              ? 'Kelola pohon pekarangan, pantau dividen karbon, dan akses registri transparan.'
              : 'Daftarkan petak pekarangan Anda secara gratis untuk mulai menerima dividen karbon.'}
          </p>

          {/* Role Segmented Selector: Petani vs Korporat */}
          <div className="mt-5 p-1 bg-stone-100/90 rounded-xl flex items-center text-xs font-semibold text-stone-600">
            <button
              type="button"
              onClick={() => {
                setRole('farmer');
                if (mode === 'login') setIdentifier('joko.widodo@tanikarbon.id');
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'farmer'
                  ? 'bg-white text-[#14382C] font-bold shadow-2xs'
                  : 'hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mitra Tani</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('corporate');
                if (mode === 'login') setIdentifier('esg-team@telkom.co.id');
              }}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'corporate'
                  ? 'bg-white text-[#14382C] font-bold shadow-2xs'
                  : 'hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Korporat ESG</span>
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
            {/* If Register mode: Full Name field */}
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'farmer' ? 'Contoh: Joko Widodo' : 'Contoh: PT Telkom ESG'}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50/90 hover:bg-white focus:bg-white border border-stone-200/90 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email / WhatsApp field */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                {role === 'farmer' ? 'Email atau No. WhatsApp' : 'Email Korporat'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={role === 'farmer' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'farmer' ? '0812xxxx / email' : 'esg@perusahaan.co.id'}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50/90 hover:bg-white focus:bg-white border border-stone-200/90 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Kata Sandi
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Fitur reset kata sandi telah dikirim ke email/WhatsApp Anda.')}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-10 py-3 bg-stone-50/90 hover:bg-white focus:bg-white border border-stone-200/90 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-sm rounded-xl shadow-[0_10px_25px_rgba(20,56,44,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Get Started' : 'Daftar Sekarang'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dotted Divider (matching Dribbble screenshot) */}
          <div className="my-5 flex items-center justify-center">
            <span className="text-[11px] font-mono text-stone-400 tracking-widest select-none">
              ········· Or sign in with ·········
            </span>
          </div>

          {/* 3 Social / Fast Sign-In Buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleQuickDemo(role)}
              title="Masuk dengan Google"
              className="py-2.5 bg-white border border-stone-200/90 rounded-xl flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs active:scale-95 group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            </button>

            {/* WhatsApp (Indonesian Farmer Standard) */}
            <button
              type="button"
              onClick={() => handleQuickDemo('farmer')}
              title="Masuk Cepat WhatsApp OTP"
              className="py-2.5 bg-white border border-stone-200/90 rounded-xl flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs active:scale-95 group"
            >
              <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
            </button>

            {/* Apple / Corporate SSO */}
            <button
              type="button"
              onClick={() => handleQuickDemo('corporate')}
              title="Masuk dengan Apple / Corporate SSO"
              className="py-2.5 bg-white border border-stone-200/90 rounded-xl flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs active:scale-95 group text-stone-900"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.91.04-2.02.61-2.67 1.38-.57.66-.99 1.76-.86 2.81 1.02.08 2.06-.52 2.59-1.26z" />
              </svg>
            </button>
          </div>

          {/* Quick Demo Instant Access Pills */}
          <div className="mt-4 pt-3.5 border-t border-stone-200/70 text-[11px] font-mono">
            <span className="text-stone-400 block mb-1.5 text-center">Akses Cepat Demo Penjurian:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemo('farmer')}
                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold transition-colors text-center"
              >
                Pak Joko (Tani)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('corporate')}
                className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold transition-colors text-center"
              >
                Korporat ESG B2B
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('surveyor')}
                className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold transition-colors text-center"
              >
                Surveyor Lapangan
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold transition-colors text-center"
              >
                Admin Platform
              </button>
            </div>
          </div>

          {/* Switch between Sign In and Sign Up */}
          <p className="mt-5 text-xs text-stone-500 font-medium">
            {mode === 'login' ? (
              <>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#14382C] hover:underline"
                >
                  Daftar gratis di sini
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#14382C] hover:underline"
                >
                  Masuk ke akun
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Bottom Footer / Compliance Strip */}
      <div className="relative z-20 text-center">
        <p className="text-[11px] text-white/80 font-medium drop-shadow-sm">
          Platform MRV Agroforestri Berbasis AI &amp; Satelit · Terdaftar di SRN-PPI KLHK · POJK No. 51/2017 ESG
        </p>
      </div>
    </div>
  );
}
