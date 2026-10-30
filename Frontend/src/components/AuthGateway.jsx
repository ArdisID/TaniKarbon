import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Mail, Eye, EyeOff, Smartphone, Building2,
  ArrowLeft, ArrowRight, ShieldCheck, Compass, Zap,
  AlertCircle, CheckCircle2, UserPlus, LogIn
} from 'lucide-react';
import { loginUser, registerUser } from '../api/auth';
import TaniKarbonLogo from './common/TaniKarbonLogo';

export default function AuthGateway({
  defaultTab = 'farmer',
  initialMode = 'login',
  onLogin,
  onBack,
  onNavigateRole
}) {
  const navigate = useNavigate();
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState(initialMode);

  // Public Role: 'farmer' | 'corporate'
  const [role, setRole] = useState(defaultTab === 'corporate' ? 'corporate' : 'farmer');

  // Input states
  const [fullName, setFullName] = useState(role === 'farmer' ? 'Pak Joko Widodo' : 'PT Industri Hijau Nusantara');
  const [identifier, setIdentifier] = useState(
    role === 'farmer' ? '0812-9847-1920' : 'esg-team@industrihijau.co.id'
  );
  const [password, setPassword] = useState('••••••••••••');
  const [websiteUrl, setWebsiteUrl] = useState(''); // Honeypot anti-bot
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Switch between Mitra Tani and Perusahaan ESG
  const handleSwitchTab = (newRole) => {
    setRole(newRole);
    setErrorMessage('');
    if (mode === 'login') {
      if (newRole === 'farmer') {
        setFullName('Pak Joko Widodo');
        setIdentifier('0812-9847-1920');
      } else {
        setFullName('PT Industri Hijau Nusantara (Tbk)');
        setIdentifier('esg-team@industrihijau.co.id');
      }
    } else {
      if (newRole === 'farmer') {
        setFullName('Petani Mitra Baru');
        setIdentifier('petani.baru@tanikarbon.com');
      } else {
        setFullName('PT Solusi Karbon Indonesia');
        setIdentifier('kontak@solusikarbon.co.id');
      }
      setPassword('Password123!');
    }
  };

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    if (newMode === 'register') {
      if (role === 'farmer') {
        setFullName('Pak Sugeng Slamet');
        setIdentifier('sugeng.slamet@petanimaju.id');
      } else {
        setFullName('PT Nusa Hijau Lestari');
        setIdentifier('esg@nusahijau.co.id');
      }
      setPassword('Password123!');
    } else {
      if (role === 'farmer') {
        setFullName('Pak Joko Widodo');
        setIdentifier('0812-9847-1920');
      } else {
        setFullName('PT Industri Hijau Nusantara (Tbk)');
        setIdentifier('esg-team@industrihijau.co.id');
      }
      setPassword('••••••••••••');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const targetRole = role === 'farmer' ? 'farmer' : 'corporate';
      let data;

      if (mode === 'login') {
        data = await loginUser({
          identifier,
          password,
          role: targetRole,
        });
      } else {
        data = await registerUser({
          email: identifier,
          full_name: fullName,
          password,
          role: targetRole,
          website_url: websiteUrl,
        });
      }

      const resolvedRole = data.role === 'company' ? 'corporate' : data.role;
      if (onLogin) {
        onLogin(resolvedRole, data);
      }
      const targetPath = resolvedRole === 'corporate' ? '/korporat' : '/mitra-tani';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login for Competition Demo
  const handleQuickDemo = async (targetRole) => {
    const roleToLogin = targetRole || role;
    setLoading(true);
    setErrorMessage('');

    try {
      let creds;
      if (roleToLogin === 'farmer') {
        creds = { identifier: 'petani@tanikarbon.com', password: 'Password123!', role: 'farmer' };
      } else {
        creds = { identifier: 'esg@korporathijau.com', password: 'Password123!', role: 'corporate' };
      }

      const data = await loginUser(creds);
      const resolvedRole = data.role === 'company' ? 'corporate' : data.role;
      if (onLogin) {
        onLogin(resolvedRole, data);
      }
      const targetPath = resolvedRole === 'corporate' ? '/korporat' : '/mitra-tani';
      navigate(targetPath, { replace: true });
    } catch (err) {
      console.warn('Backend quick demo fallback:', err);
      // Fallback ke login offline jika backend tidak tersedia
      if (onLogin) {
        onLogin(roleToLogin);
      }
      const targetPath = roleToLogin === 'corporate' ? '/korporat' : '/mitra-tani';
      navigate(targetPath, { replace: true });
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
      {/* Soft atmospheric radial gradient overlay preserving plantation view while highlighting card */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-emerald-950/25 to-black/60 pointer-events-none" />

      {/* Subtle Concentric Rings radiating from behind the card (Dribbble Signature detail) */}
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
          onClick={onBack}
          className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-800 text-xs font-semibold backdrop-blur-md border border-white/80 shadow-xs transition-all active:scale-95 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Center Floating Card */}
      <div className="relative z-20 my-auto py-4 flex items-center justify-center">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[32px] p-7 sm:p-8 border border-white shadow-[0_24px_70px_-15px_rgba(0,0,0,0.35)] text-center transition-all animate-fade-in space-y-4">

          {/* Top Squircle Icon */}
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center mx-auto text-stone-900">
            {mode === 'login' ? (
              <svg
                className="w-5 h-5 text-stone-800"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="12" x2="15" y2="12" />
                <polyline points="11 8 15 12 11 16" />
                <path d="M16 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" />
              </svg>
            ) : (
              <UserPlus className="w-5 h-5 text-emerald-700" />
            )}
          </div>

          {/* Heading & Subtitle */}
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight font-sans">
              {mode === 'login' ? 'Masuk ke TaniKarbon' : 'Daftar Akun Baru'}
            </h1>
            <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed max-w-[280px] mx-auto font-sans">
              {mode === 'login'
                ? 'Portal verifikasi dan perdagangan offset karbon terintegrasi.'
                : 'Mulai langkah dekarbonisasi dan monetisasi kredit biomassa hijau.'}
            </p>
          </div>

          {/* Mode Switcher: Masuk vs Daftar */}
          <div className="flex items-center justify-center gap-1 p-1 bg-stone-100 rounded-xl text-xs font-semibold text-stone-600 font-sans">
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${mode === 'login' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className={`flex-1 py-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${mode === 'register' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
          </div>

          {/* Role Segmented Selector: Mitra Tani vs Perusahaan ESG */}
          <div className="p-1 bg-[#F3F4F6] rounded-xl flex items-center text-xs font-semibold text-stone-600 font-sans">
            <button
              type="button"
              onClick={() => handleSwitchTab('farmer')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${role === 'farmer' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${role === 'farmer' ? 'text-emerald-600' : 'text-stone-400'}`} />
              <span>Mitra Tani</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('corporate')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${role === 'corporate' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'hover:text-stone-900'
                }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${role === 'corporate' ? 'text-sky-600' : 'text-stone-400'}`} />
              <span>Perusahaan ESG</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left animate-fade-in font-sans">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-tight font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 text-left animate-fade-in font-sans">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-tight font-medium">{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">

            {/* Hidden Honeypot Input (Anti-Bot) */}
            <input
              type="text"
              name="website_url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* If Register mode: Full Name field */}
            {mode === 'register' && (
              <div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'farmer' ? 'Nama Lengkap Petani' : 'Nama Perusahaan / PT'}
                  className="w-full px-4 py-2.5 bg-[#F3F4F6] focus:bg-white border border-transparent focus:border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
                />
              </div>
            )}

            {/* Email / WhatsApp Input */}
            <div className="relative">
              {role === 'farmer' ? (
                <Smartphone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              ) : (
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <input
                type={role === 'farmer' && mode === 'login' ? 'text' : 'email'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'register' ? 'Alamat Email Resmi' : (role === 'farmer' ? 'Nomor WhatsApp / Email' : 'Email Resmi Korporat')}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] focus:bg-white border border-transparent focus:border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Password (Min. 8 karakter)' : 'Password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F3F4F6] focus:bg-white border border-transparent focus:border-stone-300 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 outline-none transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setInfoMessage('Petunjuk pemulihan kata sandi telah dikirim ke nomor WhatsApp / email Anda.');
                    }}
                    className="text-[11px] text-stone-400 hover:text-stone-700 transition cursor-pointer font-sans"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Primary Dark Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#18181B] hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{mode === 'login' ? 'Masuk ke Platform' : 'Daftar Akun Baru'}</span>
              )}
            </button>
          </form>

          {/* Dotted Divider */}
          <div className="pt-1 flex items-center justify-center">
            <span className="text-[11px] font-sans font-medium text-stone-400 tracking-wider select-none">
              Or sign in with
            </span>
          </div>

          {/* 3 Social Buttons in a Row (Google, WhatsApp, Apple) */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleQuickDemo()}
              title="Masuk dengan Google"
              className="py-2.5 bg-white border border-stone-200/80 rounded-xl flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs active:scale-95 cursor-pointer"
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

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => handleQuickDemo()}
              title="Masuk dengan WhatsApp OTP"
              className="py-2.5 bg-white border border-stone-200/80 rounded-xl flex items-center justify-center hover:bg-stone-50 hover:border-stone-300 transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleQuickDemo()}
              title="Masuk dengan Apple ID"
              className="py-2.5 bg-white border border-stone-200/80 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:border-stone-300 transition shadow-2xs active:scale-95 cursor-pointer text-stone-900"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.91.04-2.02.61-2.67 1.38-.57.66-.99 1.76-.86 2.81 1.02.08 2.06-.52 2.59-1.26z" />
              </svg>
            </button>
          </div>

          {/* Discrete 1-Click Demo Pill for Presentation */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemo()}
              className="w-full py-1.5 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/70 text-stone-600 text-[11px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              <span>
                1-Click Demo: {role === 'farmer' ? 'Pak Joko (Mitra Tani)' : 'PT Industri Hijau (Korporat)'}
              </span>
            </button>
          </div>

          {/* Separate internal links for Staff and Admin */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-sans text-stone-400">
            <button
              type="button"
              onClick={() => onNavigateRole && onNavigateRole('surveyor_login')}
              className="hover:text-teal-800 transition cursor-pointer flex items-center gap-1 font-medium"
            >
              <Compass className="w-3 h-3 text-teal-600" />
              <span>Portal Surveyor &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateRole && onNavigateRole('admin_login')}
              className="hover:text-purple-800 transition cursor-pointer flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>Portal Admin &rarr;</span>
            </button>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Strip */}
      <div className="relative z-20 text-center">
        <p className="text-[11px] text-white/85 font-sans font-medium drop-shadow-xs">
          TaniKarbon MRV &amp; Registry Authority &copy; 2026 · Standar SRN-PPI KLHK &amp; POJK 51
        </p>
      </div>
    </div>
  );
}
