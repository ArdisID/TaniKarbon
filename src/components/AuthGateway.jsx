import React, { useState } from 'react';
import {
  Leaf, Lock, Mail, Eye, EyeOff, User, Smartphone, Building2,
  ArrowLeft, ArrowRight, ShieldCheck, Check, Compass
} from 'lucide-react';

export default function AuthGateway({ defaultTab = 'farmer', onLogin, onBack }) {
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');
  
  // Role: 'farmer' | 'surveyor' | 'corporate' | 'admin'
  const [role, setRole] = useState(defaultTab || 'farmer');
  
  // Dynamic credentials mapped by role
  const roleCredentials = {
    farmer: {
      name: 'Pak Joko Widodo',
      identifier: 'joko.widodo@tanikarbon.id',
      label: 'Email atau No. WhatsApp',
      placeholder: '0812xxxx / email',
      roleBadge: 'Mitra Tani',
      roleDesc: 'Kelola pohon binaan, pantau dividen karbon, dan tarik saldo.',
      subHeader: 'Masuk sebagai Petani Mitra Binaan'
    },
    surveyor: {
      name: 'Budi Santoso, S.Hut.',
      identifier: 'srv.budi@tanikarbon.id',
      label: 'ID Surveyor atau Email Dinas',
      placeholder: 'srv.budi@tanikarbon.id / SRV-BUDI-09',
      roleBadge: 'Staff / Field Surveyor',
      roleDesc: 'Verifikasi lapangan, geofencing GPS, dan audit lingkar batang.',
      subHeader: 'Masuk sebagai Petugas Verifikasi Lapangan'
    },
    corporate: {
      name: 'PT Industri Hijau Nusantara (Tbk)',
      identifier: 'esg-team@industrihijau.co.id',
      label: 'Email Korporat / Sustainability Team',
      placeholder: 'esg@perusahaan.co.id',
      roleBadge: 'Korporat ESG',
      roleDesc: 'Beli kredit karbon, neraca emisi, dan integrasi API ERP.',
      subHeader: 'Masuk sebagai Pembeli Emisi B2B'
    },
    admin: {
      name: 'Rangga Aditya, M.Sc.',
      identifier: 'admin.root@tanikarbon.id',
      label: 'ID Admin / Email Otoritas Registri',
      placeholder: 'admin.root@tanikarbon.id / ADM-ROOT-01',
      roleBadge: 'Admin Authority',
      roleDesc: 'Executive command center, PostGIS, klaster, dan bursa karbon.',
      subHeader: 'Masuk sebagai Registry & System Manager'
    }
  };

  // Form fields
  const [fullName, setFullName] = useState(roleCredentials[role]?.name || 'Pak Joko Widodo');
  const [identifier, setIdentifier] = useState(roleCredentials[role]?.identifier || 'joko.widodo@tanikarbon.id');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Switch role handler
  const handleSelectRole = (newRole) => {
    setRole(newRole);
    if (mode === 'login') {
      setFullName(roleCredentials[newRole].name);
      setIdentifier(roleCredentials[newRole].identifier);
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

  return (
    <div
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center font-sans"
      style={{
        backgroundImage: "url('/auth-bg.jpg')",
      }}
    >
      {/* Atmospheric radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-sky-950/20 to-black/50 pointer-events-none" />

      {/* Top Floating Bar: Back Button & Brand Badge */}
      <div className="relative z-20 max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-900 text-xs font-semibold backdrop-blur-md border border-white/60 shadow-sm transition-all active:scale-95 cursor-pointer"
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

      {/* Center Modal Card */}
      <div className="relative z-20 my-auto py-8 flex items-center justify-center">
        <div className="w-full max-w-[460px] bg-white/92 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 border border-white/80 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.25)] text-center transition-all animate-fade-in">
          
          {/* Top Squircle Icon */}
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200/90 shadow-2xs flex items-center justify-center mx-auto mb-3 text-[#14382C]">
            {role === 'farmer' && <Smartphone className="w-5 h-5 text-emerald-700" />}
            {role === 'surveyor' && <Compass className="w-5 h-5 text-teal-700" />}
            {role === 'corporate' && <Building2 className="w-5 h-5 text-blue-700" />}
            {role === 'admin' && <ShieldCheck className="w-5 h-5 text-purple-700" />}
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-sans">
            {mode === 'login' ? 'Masuk ke Portal Akun' : 'Daftar Akun Baru'}
          </h1>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-sm mx-auto font-sans">
            {roleCredentials[role].roleDesc}
          </p>

          {/* 4-Role Segmented Selector Grid */}
          <div className="mt-4 p-1 bg-stone-100 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] font-semibold text-stone-600 font-sans">
            {/* 1. Mitra Tani */}
            <button
              type="button"
              onClick={() => handleSelectRole('farmer')}
              className={`py-2 px-1.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'farmer'
                  ? 'bg-white text-emerald-900 font-bold shadow-xs border border-emerald-100'
                  : 'hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${role === 'farmer' ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span className="truncate">Mitra Tani</span>
            </button>

            {/* 2. Staff Surveyor */}
            <button
              type="button"
              onClick={() => handleSelectRole('surveyor')}
              className={`py-2 px-1.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'surveyor'
                  ? 'bg-white text-teal-900 font-bold shadow-xs border border-teal-100'
                  : 'hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${role === 'surveyor' ? 'text-teal-600' : 'text-stone-400'}`} />
              <span className="truncate">Surveyor</span>
            </button>

            {/* 3. Korporat ESG */}
            <button
              type="button"
              onClick={() => handleSelectRole('corporate')}
              className={`py-2 px-1.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'corporate'
                  ? 'bg-white text-blue-900 font-bold shadow-xs border border-blue-100'
                  : 'hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${role === 'corporate' ? 'text-blue-600' : 'text-stone-400'}`} />
              <span className="truncate">Korporat</span>
            </button>

            {/* 4. Admin Authority */}
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`py-2 px-1.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                role === 'admin'
                  ? 'bg-white text-purple-900 font-bold shadow-xs border border-purple-100'
                  : 'hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${role === 'admin' ? 'text-purple-600' : 'text-stone-400'}`} />
              <span className="truncate">Admin</span>
            </button>
          </div>

          {/* Active Role Indicator Badge */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            <span className="text-[10px] text-stone-400 font-sans">Role Aktif:</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
              role === 'farmer' ? 'bg-emerald-100 text-emerald-800' :
              role === 'surveyor' ? 'bg-teal-100 text-teal-800' :
              role === 'corporate' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {roleCredentials[role].roleBadge}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-left">
            {/* If Register mode: Full Name field */}
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1 font-sans">
                  Nama Lengkap / Instansi
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Email / Identifier field */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1 font-sans">
                {roleCredentials[role].label}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleCredentials[role].placeholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all font-sans"
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
                    onClick={() => alert('Fitur pemulihan kata sandi telah dikirim ke email terdaftar.')}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 transition-colors font-sans cursor-pointer"
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
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 focus:border-[#14382C] focus:ring-2 focus:ring-[#14382C]/10 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? `Masuk ke Portal ${roleCredentials[role].roleBadge}` : 'Daftar Sekarang'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch between Sign In and Sign Up */}
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 font-medium font-sans">
            {mode === 'login' ? (
              <p>
                Belum punya akun?{' '}
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
                  Masuk ke akun
                </button>
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Footer / Compliance Strip */}
      <div className="relative z-20 text-center">
        <p className="text-[11px] text-white/80 font-medium drop-shadow-sm font-sans">
          Platform MRV Agroforestri Berbasis AI &amp; Satelit · Terdaftar di SRN-PPI KLHK · POJK No. 51/2017 ESG
        </p>
      </div>
    </div>
  );
}
