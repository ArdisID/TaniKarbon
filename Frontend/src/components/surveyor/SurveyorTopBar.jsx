import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  CheckCircle2, 
  Compass, 
  ShieldCheck,
  RefreshCw,
  LogOut
} from 'lucide-react';

export default function SurveyorTopBar({ 
  currentUser,
  onLogout,
  isOnline = true, 
  onToggleOnline,
  offlinePackDownloaded = false,
  onDownloadOfflinePack,
  isDownloadingPack = false,
  downloadProgress = 0
}) {

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 transition-all font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Branding & Role Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 font-bold shadow-xs shrink-0">
            <Compass className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#14382C] text-base tracking-tight font-sans">
                TaniKarbon
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                SURVEYOR LAPANGAN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
              Field Verification &amp; Anti-Fraud Geofencing
            </p>
          </div>
        </div>

        {/* Right: Interactive Signal Header, Offline Pack, & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Interactive NetworkStatusHeader: BISA DIKLIK SAAT DEMO! */}
          <button
            onClick={onToggleOnline}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans font-medium border transition cursor-pointer shadow-2xs select-none ${
              isOnline
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Klik untuk simulasi toggle status Online / Offline"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="hidden md:inline font-sans">
              {isOnline ? 'Online — Terhubung ke Server Pusat' : 'Offline Mode — Tersimpan di IndexedDB'}
            </span>
            <span className="md:hidden font-sans">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>

          {/* Tombol Unduh Offline Pack (14.2 MB) */}
          <button
            onClick={onDownloadOfflinePack}
            disabled={isDownloadingPack || offlinePackDownloaded}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-medium border transition ${
              offlinePackDownloaded
                ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-default'
                : isDownloadingPack
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 cursor-wait'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs cursor-pointer'
            }`}
            title="Unduh data poligon & foto kecamatan ke memori HP sebelum naik gunung"
          >
            {isDownloadingPack ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span className="font-mono text-[11px]">{downloadProgress}%</span>
              </>
            ) : offlinePackDownloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paket Offline Siap</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh Paket Offline (14.2 MB)</span>
              </>
            )}
          </button>

          {/* User Profile Info */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-lg bg-[#14382C] text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
              {(currentUser?.full_name || 'Surveyor')[0].toUpperCase()}
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[140px]">
                {currentUser?.full_name || 'Budi Santoso, S.Hut'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate max-w-[140px]">
                {currentUser?.email || 'surveyor@tanikarbon.com'}
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
