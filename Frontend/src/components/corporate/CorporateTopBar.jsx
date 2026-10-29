import React, { useState } from 'react';
import { 
  Building2, 
  Activity, 
  ShieldCheck, 
  Zap,
  Menu,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

export default function CorporateTopBar({ 
  currentUser,
  onLogout,
  sidebarCollapsed, 
  onToggleSidebar,
  apiConnected = true
}) {
  const handleLogoutClick = () => {
    clearAuthSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.replace('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Mobile Brand, or Desktop Context */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Trigger: HANYA MUNCUL DI MOBILE / TABLET (lg:hidden) */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden cursor-pointer"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo HANYA di Mobile (di Desktop ditangani Sidebar) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 font-bold shadow-xs shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#14382C] text-base tracking-tight font-sans">TaniKarbon</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  CORP
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Breadcrumb Context (Bersih & Elegan Standar Linear/Stripe) */}
          <div className="hidden lg:flex items-center gap-2 font-sans text-xs">
            <span className="font-medium text-slate-400">Portal Perusahaan</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">PT Industri Hijau Nusantara (Tbk)</span>
            <span className="text-slate-300">/</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              Buku Emisi 2026 Aktif
            </span>
          </div>
        </div>

        {/* Right: ERP Webhook Status & Role Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Indikator Koneksi API ERP (Font Sans, Monospace hanya untuk latency ms) */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>ERP Webhook: Connected <span className="font-mono text-[11px] text-emerald-700 font-semibold">(24ms)</span></span>
          </div>

          {/* User Profile Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-lg bg-[#14382C] text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
              {(currentUser?.full_name || 'Korporat')[0].toUpperCase()}
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[140px]">
                {currentUser?.full_name || 'PT Industri Hijau'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate max-w-[140px]">
                {currentUser?.email || 'esg@korporathijau.com'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-2xs font-sans"
            title="Keluar dari akun"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
