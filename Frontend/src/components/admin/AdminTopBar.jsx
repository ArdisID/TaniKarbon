import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Activity, 
  Menu,
  CheckCircle2,
  Lock,
  LogOut
} from 'lucide-react';

export default function AdminTopBar({ 
  currentUser,
  onLogout,
  onToggleMobileMenu 
}) {

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 transition-all font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Desktop Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition lg:hidden cursor-pointer"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-300" />
            </div>
            <span className="font-extrabold text-[#14382C] text-base font-sans">TaniKarbon Admin</span>
          </div>

          {/* Desktop Breadcrumb Context */}
          <div className="hidden lg:flex items-center gap-2 font-sans text-xs">
            <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px] uppercase">
              ROOT AUTHORITY
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-500">Executive Command Center</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">Registry &amp; Settlement Systems</span>
          </div>
        </div>

        {/* Right: Engine Indicators & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PostGIS Engine Indicator */}
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>PostGIS Engine: Online</span>
          </div>

          {/* SRN-PPI Sync Indicator */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>SRN-PPI Sync: Active <span className="font-mono text-[11px] text-blue-700 font-semibold">(28ms)</span></span>
          </div>

          {/* User Profile Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-lg bg-[#14382C] text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
              {(currentUser?.full_name || 'Admin')[0].toUpperCase()}
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[140px]">
                {currentUser?.full_name || 'Admin Platform'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate max-w-[140px]">
                {currentUser?.email || 'admin@tanikarbon.com'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
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
