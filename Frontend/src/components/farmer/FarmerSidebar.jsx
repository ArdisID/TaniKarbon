import React from 'react';
import { 
  Leaf, 
  LayoutDashboard, 
  MapPinned, 
  Sprout, 
  Satellite, 
  Wallet, 
  Shield, 
  LogOut,
  X
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

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
      sublabel: 'Ringkasan & Metrik',
      icon: LayoutDashboard,
    },
    {
      id: 'land',
      label: 'Manajemen Lahan',
      sublabel: 'Daftar Petak & Pohon',
      icon: MapPinned,
    },
    {
      id: 'wizard',
      label: 'Daftarkan Lahan',
      sublabel: 'Alur Pemetaan Baru',
      icon: Sprout,
      highlight: true,
      badge: 'Baru',
    },
    {
      id: 'timeline',
      label: 'Lacak Verifikasi',
      sublabel: 'Tahapan Audit Satelit',
      icon: Satellite,
    },
    {
      id: 'wallet',
      label: 'Dompet Karbon',
      sublabel: 'Bagi Hasil & Mutasi',
      icon: Wallet,
    },
  ];

  const handleLogoutClick = () => {
    clearAuthSession();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const displayName = currentUser?.full_name || 'Petani Mitra';
  const displayEmail = currentUser?.email || 'mitra@tanikarbon.id';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* MOBILE SCRIM (sidebar drawer overlay) */}
      <div 
        className={`fixed inset-0 z-40 bg-pine/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* FIXED LEFT SIDEBAR (single navigation surface — no top navbar) */}
      <aside 
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-stone-200 bg-white p-4 transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigasi utama"
      >
        <div className="flex min-h-0 flex-col gap-6">

          {/* 1. BRAND HEADER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={() => {
                  onSelectTab('dashboard');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="group flex items-center gap-3 rounded-xl px-1 py-1 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine text-white shadow-sm transition group-hover:bg-pine-800">
                  <Leaf className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-extrabold tracking-tight text-pine">TaniKarbon</span>
                  <span className="mt-0.5 inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                    Portal Mitra Petani
                  </span>
                </span>
              </button>

              {/* Mobile Close Button */}
              <button 
                type="button"
                onClick={onCloseMobile}
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 lg:hidden"
                aria-label="Tutup navigasi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* API / PostGIS sync indicator */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="truncate font-mono text-[10px] font-medium tracking-tight text-emerald-700">Tersinkron PostGIS</span>
            </div>
          </div>

          {/* 2. PRIMARY NAVIGATION */}
          <nav className="scroll-slim -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <p className="mb-2 px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-400">Menu Utama</p>
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive
                          ? 'bg-pine text-white shadow-sm'
                          : item.highlight
                          ? 'border border-emerald-300 bg-emerald-50/60 text-pine hover:border-emerald-400 hover:bg-emerald-50'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-pine'
                      }`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 transition ${
                        isActive
                          ? 'text-emerald-400'
                          : item.highlight
                          ? 'text-emerald-600'
                          : 'text-stone-400 group-hover:text-emerald-600'
                      }`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                          {item.badge && !isActive && (
                            <span className="rounded-md bg-emerald-500 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-wider text-white">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <span className={`mt-0.5 block truncate text-[11px] leading-tight ${
                          isActive 
                            ? 'text-emerald-100/70' 
                            : item.highlight
                            ? 'text-emerald-700/80'
                            : 'text-stone-400'
                        }`}>
                          {item.sublabel}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* 3. USER PROFILE + LOGOUT FOOTER */}
        <div className="space-y-2 border-t border-stone-200 pt-4">
          <div 
            onClick={onOpenProfile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (onOpenProfile) onOpenProfile();
              }
            }}
            className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50/70 p-2.5 transition hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
            title="Buka detail profil mitra petani"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine font-mono text-sm font-bold text-white">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-tight text-pine">
                {displayName}
              </span>
              <span className="block truncate font-mono text-[10px] leading-tight text-stone-500">
                {displayEmail}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
                <Shield className="h-2.5 w-2.5" /> Mitra Petani
              </span>
            </span>
          </div>

          <button 
            type="button"
            onClick={handleLogoutClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Keluar Akun
          </button>
        </div>
      </aside>
    </>
  );
}
