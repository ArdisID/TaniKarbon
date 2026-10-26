import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowLeftRight, 
  ChevronDown, 
  ExternalLink, 
  Database, 
  Activity, 
  Menu,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function AdminTopBar({ 
  onNavigateRole, 
  onToggleMobileMenu 
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-sans transition border border-slate-200 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Role Switcher</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in text-xs font-sans">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                      Navigasi Demo Penjurian
                    </span>
                    <strong className="text-[#14382C] font-bold block mt-0.5">
                      Role Aktif: Admin Platform
                    </strong>
                  </div>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('farmer');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium transition cursor-pointer"
                  >
                    <span>Masuk Portal Mitra Petani</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('corporate');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium transition cursor-pointer"
                  >
                    <span>Masuk Portal Korporat B2B</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('surveyor');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-emerald-800 font-semibold transition cursor-pointer"
                  >
                    <span>Masuk Portal Surveyor Lapangan</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('landing');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 font-medium transition cursor-pointer"
                  >
                    <span>Halaman Beranda Utama</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
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
