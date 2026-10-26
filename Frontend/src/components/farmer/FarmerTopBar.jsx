import React, { useState } from 'react';
import { 
  Leaf, Wifi, WifiOff, RefreshCw, ChevronDown, 
  ArrowLeftRight, UserCheck, Shield, ExternalLink, Menu
} from 'lucide-react';

export default function FarmerTopBar({ 
  onNavigateRole, 
  sidebarCollapsed, 
  onToggleSidebar,
  activeTabTitle
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle / Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Collapse Toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
            title={sidebarCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#14382C] text-lg tracking-tight">TaniKarbon</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  Mitra Petani
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-none hidden sm:block">AgroCarbon MRV Platform</p>
            </div>
          </div>
        </div>

        {/* Center / Right: Sync Status & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline / Online Sync Indicator */}
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition shadow-xs ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70' 
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
            }`}
            title="Klik untuk simulasi mode offline"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-[11px] font-medium hidden xs:inline">
              {isOnline ? '● Tersinkronisasi (Siap Offline)' : '● Mode Lokal (Offline)'}
            </span>
            <span className="text-[11px] font-medium xs:hidden">
              {isOnline ? 'Tersinkron' : 'Offline'}
            </span>
          </button>

          {/* Role / Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition border border-stone-200/80"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Ganti Role / Demo</span>
              <span className="sm:hidden">Role</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {showRoleMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-fade-in text-xs">
                  <div className="px-3 py-2 border-b border-stone-100 mb-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Navigasi Platform</span>
                    <strong className="text-[#14382C] font-bold block">Role Aktif: Petani (Pak Joko)</strong>
                  </div>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('corporate');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-between text-stone-700 font-semibold transition"
                  >
                    <span>Masuk Portal Korporat B2B</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('surveyor');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-between text-emerald-800 font-semibold transition"
                  >
                    <span>Masuk Portal Surveyor (Field)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-between text-purple-900 font-semibold transition"
                  >
                    <span>Masuk Admin Platform (Authority)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('landing');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-50 flex items-center justify-between text-stone-700 font-semibold transition"
                  >
                    <span>Halaman Beranda Utama</span>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
