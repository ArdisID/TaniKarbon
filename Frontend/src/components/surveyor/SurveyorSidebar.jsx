import React from 'react';
import {
  ClipboardList,
  History,
  Compass,
  UserCheck,
  LogOut,
  MapPin,
  Wifi,
  WifiOff,
  Pencil
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';
import TaniKarbonLogo from '../common/TaniKarbonLogo';

export default function SurveyorSidebar({
  currentUser,
  onLogout,
  onOpenProfile,
  currentTab,
  onSelectTab,
  pendingCount = 0,
  syncQueueCount = 0,
  isOnline = true
}) {
  const menuItems = [
    {
      id: 'tasks',
      label: 'Tugas & Antrean',
      icon: ClipboardList,
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'map',
      label: 'Peta GPS & Rute',
      icon: MapPin
    },
    {
      id: 'sync',
      label: 'Riwayat & Sinkron',
      icon: History,
      badge: syncQueueCount > 0 ? `${syncQueueCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
  };

  const handleLogoutClick = () => {
    clearAuthSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.replace('/login');
    }
  };

  return (
    <aside
      id="surveyor-sidebar"
      className="hidden lg:flex fixed inset-y-0 left-0 z-50 h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 font-sans"
      aria-label="Navigasi Surveyor"
    >
      <div className="flex min-h-0 flex-col gap-5">
        {/* Top Header Branding */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center">
            <TaniKarbonLogo size={36} textVariant="dark" subtitle="SURVEYOR LAPANGAN" />
          </div>
        </div>

        {/* Network Sync Status Badge */}
        <div className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${isOnline
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          <span className="font-semibold truncate">
            {isOnline ? 'Online · Mode Sinkronisasi' : 'Offline · Disimpan Lokal'}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-left cursor-pointer font-sans ${isActive
                    ? 'bg-[#0F291E] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1 rounded-lg shrink-0 transition ${isActive
                      ? 'text-emerald-300'
                      : 'text-slate-400 group-hover:text-slate-700'
                    }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-sans truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profil Petugas Lapangan & Tombol Logout */}
      <div className="pt-3 border-t border-slate-100 font-sans">
        <div 
          onClick={onOpenProfile}
          className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition-all duration-200 cursor-pointer group shadow-2xs"
          title="Klik untuk mengedit profil surveyor"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F291E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 leading-snug truncate font-sans group-hover:text-emerald-800 transition-colors">
                  {currentUser?.full_name || 'Budi Surveyor'}
                </h4>
                <Pencil className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 truncate">
                  Role: <span className="font-sans font-semibold">Surveyor Lapangan</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                {currentUser?.email || 'surveyor@tanikarbon.com'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-xs font-sans"
          title="Keluar dari akun"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
