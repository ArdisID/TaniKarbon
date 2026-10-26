import React, { useState } from 'react';
import {
  Leaf, Lock, Mail, Eye, EyeOff, User, Smartphone, Building2,
  ArrowLeft, ArrowRight, ShieldCheck, Check, Compass, Zap
} from 'lucide-react';

export default function AuthGateway({ defaultTab = 'farmer', onLogin, onBack, onNavigateRole }) {
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');
  
  // Public Role: 'farmer' | 'corporate'
  const [role, setRole] = useState(defaultTab === 'corporate' ? 'corporate' : 'farmer');

  // Input states
  const [fullName, setFullName] = useState(role === 'farmer' ? 'Pak Joko Widodo' : 'Budi Santoso');
  const [identifier, setIdentifier] = useState(
    role === 'farmer' ? '0812-9847-1920' : 'esg-team@industrihijau.co.id'
  );
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Switch between Mitra Tani and Perusahaan ESG
  const handleSwitchTab = (newRole) => {
    setRole(newRole);
    if (mode === 'login') {
      if (newRole === 'farmer') {
        setFullName('Pak Joko Widodo');
        setIdentifier('0812-9847-1920');
      } else {
        setFullName('PT Industri Hijau Nusantara (Tbk)');
        setIdentifier('esg-team@industrihijau.co.id');
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(role);
    }, 600);
  };

  // 1-Click Demo Login for Lomba/Judging Sessions
  const handleQuickDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(role);
    }, 400);
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center font-sans antialiased"
      style={{
        backgroundImage: "url('/auth-bg.jpg')",
      }}
    >
      {/* Soft atmospheric radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-sky-950/20 to-black/50 pointer-events-none" />

      {/* Top Floating Bar: Back Button & Brand Badge */}
      <div className="relative z-20 max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold backdrop-blur-md border border-white/60 shadow-xs transition-all active:scale-95 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="w-5 h-5 rounded-full bg-[#14382C] text-emerald-300 flex items-center justify-center">
            <Leaf className="w-3 h-3" />
          </div>
          <span className="font-extrabold text-xs text-[#14382C] tracking-tight font-sans">TaniKarbon</span>
        </div>
      </div>

      {/* Center Modal Card */}
      <div className="relative z-20 my-auto py-6 flex items-center justify-center">
        <div className="w-full max-w-[420px] bg-white/92 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.25)] text-center transition-all animate-fade-in space-y-4">
          
          {/* Top Squircle Icon */}
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center mx-auto text-[#14382C]">
            {role === 'farmer' ? (
              <Smartphone className="w-6 h-6 text-emerald-700" />
            ) : (
              <Building2 className="w-6 h-6 text-sky-700" />
            )}
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-sans">
              {mode === 'login' ? 'Masuk ke TaniKarbon' : 'Daftar Akun Baru'}
            </h1>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-xs mx-auto font-sans">
              {role === 'farmer'
                ? 'Kelola pohon pekarangan, pantau dividen karbon, dan tarik saldo dividen.'
                : 'Akses bursa kredit karbon terverifikasi, neraca emisi, dan integrasi ERP.'}
            </p>
          </div>

          {/* 2 Clean Toggle Tabs: Mitra Tani vs Perusahaan ESG */}
          <div className="p-1 bg-stone-100 rounded-2xl flex items-center text-xs font-semibold text-stone-600 font-sans">
            <button
              type="button"
              onClick={() => handleSwitchTab('farmer')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                role === 'farmer'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs border border-emerald-100'
                  : 'hover:text-stone-900'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${role === 'farmer' ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span>Mitra Tani</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('corporate')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                role === 'corporate'
                  ? 'bg-white text-sky-950 font-bold shadow-xs border border-sky-100'
                  : 'hover:text-stone-900'
              }`}
            >
              <Building2 className={`w-4 h-4 ${role === 'corporate' ? 'text-sky-600' : 'text-stone-400'}`} />
              <span>Perusahaan ESG</span>
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            {/* If Register mode: Full Name field */}
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1 font-sans">
                  {role === 'farmer' ? 'Nama Lengkap Petani' : 'Nama Perusahaan / PT'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'farmer' ? 'Contoh: Joko Widodo' : 'Contoh: PT Industri Hijau Nusantara'}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
                  />
                </div>
              </div>
            )}

            {/* Email / WhatsApp field */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1 font-sans">
                {role === 'farmer' ? 'Nomor HP / WhatsApp' : 'Work Email Korporat'}
              </label>
              <div className="relative">
                {role === 'farmer' ? (
                  <Smartphone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <input
                  type={role === 'farmer' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'farmer' ? '0812-xxxx-xxxx' : 'esg@perusahaan.co.id'}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider font-sans">
                  Kata Sandi
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Petunjuk pemulihan telah dikirim ke nomor HP/Email Anda.')}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 transition font-sans cursor-pointer"
                  >
                    Lupa sandi?
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
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? (role === 'farmer' ? 'Masuk ke Portal Petani' : 'Masuk ke Portal Korporat') : 'Daftar Sekarang'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Button (Fitur Presentasi Lomba) */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>
                ⚡ 1-Click Demo Login: {role === 'farmer' ? 'Pak Joko Widodo (Mitra Tani)' : 'PT Industri Hijau Nusantara (Korporat)'}
              </span>
            </button>
          </div>

          {/* Switch Register/Login */}
          <div className="text-xs text-stone-500 font-sans pt-1">
            {mode === 'login' ? (
              <p>
                Belum terdaftar?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#14382C] hover:underline cursor-pointer"
                >
                  Daftar di sini
                </button>
              </p>
            ) : (
              <p>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#14382C] hover:underline cursor-pointer"
                >
                  Masuk di sini
                </button>
              </p>
            )}
          </div>

          {/* Tautan Khusus Internal Staff & Admin (Dipisah Rapi) */}
          <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-sans text-stone-500">
            <button
              type="button"
              onClick={() => onNavigateRole && onNavigateRole('surveyor_login')}
              className="hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <Compass className="w-3 h-3 text-teal-700" />
              <span>Portal Staff Surveyor &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateRole && onNavigateRole('admin_login')}
              className="hover:text-purple-900 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <ShieldCheck className="w-3 h-3 text-purple-700" />
              <span>Portal Admin Otoritas &rarr;</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 text-center">
        <p className="text-[11px] text-white/80 font-sans">
          Platform MRV Agroforestri Berbasis AI &amp; Satelit · Terdaftar di SRN-PPI KLHK · POJK No. 51/2017 ESG
        </p>
      </div>
    </div>
  );
}
