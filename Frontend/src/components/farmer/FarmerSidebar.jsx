import React from 'react';
import { 
  Leaf, 
  LayoutDashboard, 
  MapPinned, 
  MapPinPlus, 
  Satellite, 
  Wallet, 
  LogOut,
  X,
  CheckCircle2
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';
import TaniKarbonLogo from '../common/TaniKarbonLogo';

export default function FarmerSidebar({ 
  currentUser,
  onLogout,
  currentTab, 
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
  onOpenProfile
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'land',
      label: 'Manajemen Lahan',
      icon: MapPinned,
    },
    {
      id: 'wizard',
      label: 'Pendaftaran Lahan',
      icon: MapPinPlus,
    },
    {
      id: 'timeline',
      label: 'Lacak Verifikasi',
      icon: Satellite,
    },
    {
      id: 'wallet',
      label: 'Dompet Karbon',
      icon: Wallet,
    },
  ];

  const handleLogoutClick = () => {
    clearAuthSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.replace('/login');
    }
  };

  const displayName = currentUser?.full_name || 'Pak Joko Widodo';
  const displayEmail = currentUser?.email || 'mitra@tanikarbon.id';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside 
      id="sidebar"
      className="hidden lg:flex fixed inset-y-0 left-0 z-50 h-screen w-64 flex-col justify-between border-r border-stone-200/70 bg-white p-5 font-sans"
      aria-label="Navigasi utama"
    >
      <div className="flex min-h-0 flex-col gap-6">

        {/* 1. BRAND HEADER */}
        <div className="flex items-center justify-between">
          <button 
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center text-left cursor-pointer group"
          >
            <TaniKarbonLogo size={36} textVariant="dark" subtitle="MITRA PETANI INDONESIA" />
          </button>
        </div>

          {/* 2. MENU NAVIGASI BERSIH */}
          <nav className="min-h-0 flex-1 overflow-y-auto space-y-1.5 pt-2">
            {menuItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition cursor-pointer ${
                    isActive
                      ? 'bg-[#14382C] text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-emerald-400' : 'text-stone-400 group-hover:text-emerald-600'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. KARTU PROFIL RINGKAS & INDIKATOR SINYAL OFFLINE */}
        <div className="pt-4 border-t border-stone-200/70">
          <div 
            onClick={onOpenProfile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (onOpenProfile) onOpenProfile();
              }
            }}
            className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3 hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer"
            title="Buka detail profil mitra petani"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#14382C] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {displayName} <span className="font-normal text-stone-400">• Mitra Wonosobo</span>
                </p>
                <p className="text-[10px] text-stone-500 truncate">{displayEmail}</p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Mode Kebun Siap Offline
              </span>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogoutClick();
                }}
                className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
  );
}
