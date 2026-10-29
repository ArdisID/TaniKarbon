import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Terminal, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Server, 
  Activity, 
  Eye, 
  EyeOff,
  Database,
  AlertCircle
} from 'lucide-react';
import { loginUser } from '../../api/auth';

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
    <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 bg-slate-950 font-sans text-slate-100 antialiased selection:bg-purple-900 selection:text-white">
      {/* Background Matrix/Subtle Grid Effect */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #10B981 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#0E281F]/40 to-slate-950 pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-20 max-w-5xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition active:scale-95 cursor-pointer font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-emerald-400">
            PostGIS Gateway: SECURE
          </span>
        </div>
      </div>

      {/* Center Command Center Card */}
      <div className="relative z-20 my-auto py-8 flex items-center justify-center">
        <div className="w-full max-w-[440px] bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border border-slate-800 shadow-2xl transition animate-fade-in space-y-5">
          
          {/* Top Branding Authority Badge */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#14382C] border border-emerald-500/30 text-emerald-300 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800 uppercase tracking-wider font-sans">
              <span>ROOT SYSTEM AUTHORITY</span>
              <span>•</span>
              <span className="font-mono">SRN-PPI REGISTRY</span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              Admin Platform Gateway
            </h1>
            <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
              Otoritas pengesahan audit bursa karbon, brankas keuangan escrow, dan kontrol rumus alometrik.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 text-left font-sans animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-tight font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 font-sans">
                Admin Identifier / Root Email
              </label>
              <div className="relative">
                <Terminal className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="ADM-ROOT-01 / admin.root@tanikarbon.id"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm font-mono text-emerald-300 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 font-sans">
                Master Security Key / Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Master Key Password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm font-mono text-emerald-300 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Simulated HSM Indicator */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans p-2 rounded-lg bg-black/40 border border-slate-800">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enkripsi 256-bit HSM</span>
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">AUTH_TIER_0</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#14382C] hover:bg-[#1a4436] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Autentikasi &amp; Akses Command Center</span>
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Login Button (Fitur Demo Lomba) */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/50 border border-purple-800/80 text-purple-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
              <span>⚡ 1-Click Demo: Rangga Aditya, M.Sc. (ADM-ROOT-01)</span>
            </button>
          </div>

          {/* Public Portal Return Link */}
          <div className="text-center pt-1 text-xs text-slate-500 font-sans">
            Bukan Administrator Sistem?{' '}
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('auth')}
              className="font-semibold text-emerald-400 hover:underline cursor-pointer"
            >
              Masuk ke Portal Publik
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 text-center">
        <p className="text-[11px] text-slate-500 font-sans">
          TaniKarbon Core Engine &copy; 2026 • PostGIS Multi-Cluster Settlement Authority
        </p>
      </div>

    </div>
  );
}
