import React, { useState } from 'react';
import { 
  Compass, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  MapPin, 
  Wifi, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Leaf, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { loginUser } from '../../api/auth';

export default function SurveyorLoginView({ onLogin, onBack, onNavigate }) {
  const [surveyorId, setSurveyorId] = useState('SRV-BUDI-09');
  const [pin, setPin] = useState('847291');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser({
        identifier: surveyorId,
        password: pin,
        role: 'surveyor'
      });
      onLogin('surveyor', data);
    } catch (err) {
      setErrorMessage(err.message || 'Verifikasi petugas gagal.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setSurveyorId('SRV-BUDI-09');
    setPin('847291');
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser({
        identifier: 'surveyor@tanikarbon.com',
        password: 'Password123!',
        role: 'surveyor'
      });
      onLogin('surveyor', data);
    } catch (err) {
      console.warn('Demo fallback:', err);
      onLogin('surveyor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center font-sans antialiased"
      style={{ backgroundImage: "url('/auth-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-[#14382C]/40 to-stone-950/80 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-20 max-w-md w-full mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-stone-700 text-xs font-semibold backdrop-blur-md border border-white/60 shadow-xs transition active:scale-95 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 backdrop-blur-md border border-white/60 shadow-xs">
          <div className="w-4 h-4 rounded-full bg-teal-800 text-teal-200 flex items-center justify-center">
            <Compass className="w-2.5 h-2.5" />
          </div>
          <span className="font-extrabold text-[11px] text-teal-950 tracking-tight font-sans">
            TaniKarbon Field Staff
          </span>
        </div>
      </div>

      {/* Center Mobile-First Field Card */}
      <div className="relative z-20 my-auto py-6 flex items-center justify-center">
        <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/90 shadow-2xl transition animate-fade-in space-y-4">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center mx-auto shadow-2xs">
              <Compass className="w-6 h-6 text-teal-700" />
            </div>
            
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider font-sans">
              Portal Petugas Lapangan
            </div>
            
            <h1 className="text-xl font-bold text-stone-900 tracking-tight font-sans">
              Masuk Surveyor MRV
            </h1>
            <p className="text-xs text-slate-500 font-sans max-w-xs mx-auto">
              Sistem verifikasi fisik geofencing, audit lingkar batang pohon, dan antrean sinkronisasi offline.
            </p>
          </div>

          {/* Device & GPS Status Indicator */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] font-sans">
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>GPS Geofence: Aktif (&le; 50m)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
              <Wifi className="w-3 h-3 text-slate-400" />
              <span>Siap Offline</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left font-sans animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-tight font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                ID Petugas Lapangan
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={surveyorId}
                  onChange={(e) => setSurveyorId(e.target.value)}
                  placeholder="Contoh: SRV-BUDI-09"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-800 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                PIN Keamanan Lapangan (6 Digit)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-800 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Buka Lembar Kerja Surveyor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Button (Fitur Demo Lomba) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 text-teal-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
              <span>⚡ 1-Click Demo: Budi Santoso (SRV-BUDI-09)</span>
            </button>
          </div>

          {/* Navigation to Public Login */}
          <div className="text-center pt-1 text-xs text-slate-400 font-sans">
            Bukan staf petugas?{' '}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('auth')}
              className="font-bold text-teal-800 hover:underline cursor-pointer"
            >
              Login Mitra Tani &amp; Korporat
            </button>
          </div>

        </div>
      </div>

      {/* Footer Note */}
      <div className="relative z-20 text-center">
        <p className="text-[11px] text-white/70 font-sans">
          Aplikasi Inspeksi Terakreditasi Standar ISO 14064-2 &amp; Verra VM0042
        </p>
      </div>

    </div>
  );
}
