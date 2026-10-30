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
import TaniKarbonLogo from '../common/TaniKarbonLogo';

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
        {/* Left: Mobile Brand or Desktop Context */}
        <div className="flex items-center gap-3">

          {/* Brand Logo HANYA di Mobile (di Desktop ditangani Sidebar) */}
          <div className="flex items-center lg:hidden">
            <TaniKarbonLogo size={28} showText={true} textVariant="dark" subtitle="CORP" />
          </div>

          {/* Desktop Breadcrumb Context (Bersih & Elegan Standar Linear/Stripe) */}
          <div className="hidden lg:flex items-center gap-2 font-sans text-xs">
            <span className="font-medium text-slate-400">Portal Perusahaan</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">PT Industri Hijau Nusantara (Tbk)</span>
            <span className="text-slate-300">/</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              Buku Emisi 2026 Aktif
            </span>
          </div>
        </div>

        {/* Right: User Profile & Role Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* User Profile Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-[#0F1E2E] text-sky-300 flex items-center justify-center text-xs font-bold font-sans">
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
