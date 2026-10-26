import React, { useState } from 'react';
import { 
  Building2, 
  Activity, 
  ArrowLeftRight, 
  ChevronDown, 
  ExternalLink, 
  ShieldCheck, 
  Zap,
  Menu,
  CheckCircle2
} from 'lucide-react';

export default function CorporateTopBar({ 
  onNavigateRole, 
  sidebarCollapsed, 
  onToggleSidebar,
  apiConnected = true
}) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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

          {/* Role / Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold font-sans transition border border-slate-200 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Ganti Role / Demo</span>
              <span className="sm:hidden">Role</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in text-xs font-sans">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                      Navigasi Platform
                    </span>
                    <strong className="text-[#14382C] font-bold block mt-0.5">
                      Role Aktif: Perusahaan (B2B)
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
                      onNavigateRole('surveyor');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-emerald-800 font-semibold transition cursor-pointer"
                  >
                    <span>Masuk Portal Surveyor (Field)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onNavigateRole('admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-purple-900 font-semibold transition cursor-pointer"
                  >
                    <span>Masuk Admin Platform (Authority)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
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
