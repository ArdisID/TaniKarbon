import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Activity, 
  CheckCircle2, 
  Lock, 
  LogOut 
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';
import TaniKarbonLogo from '../common/TaniKarbonLogo';

export default function AdminTopBar({ 
  currentUser,
  onLogout,
  onToggleMobileMenu 
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
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 py-2.5 transition-all font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Brand & Desktop Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile Brand */}
          <div className="flex items-center lg:hidden">
            <TaniKarbonLogo size={28} showText={true} textVariant="dark" subtitle="ADMIN" />
          </div>

          {/* Desktop Breadcrumb Context */}
          <div className="hidden lg:flex items-center gap-2 font-sans text-xs">
            <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-[10px] uppercase">
              ROOT AUTHORITY
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-500">Executive Command Center</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">Registry &amp; Settlement Systems</span>
          </div>
        </div>

        {/* Right: User Profile & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs font-bold font-sans shrink-0">
              {(currentUser?.full_name || 'Admin')[0].toUpperCase()}
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[190px]">
                {currentUser?.full_name || 'Admin Pusat TaniKarbon'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate max-w-[190px]">
                {currentUser?.email || 'admin@tanikarbon.com'}
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
