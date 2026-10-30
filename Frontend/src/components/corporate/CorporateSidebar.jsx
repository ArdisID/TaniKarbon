import React from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Award, 
  Cpu, 
  CreditCard, 
  Building2,
  CheckCircle2,
  LogOut,
  X
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';
import TaniKarbonLogo from '../common/TaniKarbonLogo';

export default function CorporateSidebar({ 
  currentUser,
  onLogout,
  currentTab, 
  onSelectTab, 
  onOpenCompanyProfile,
  mobileOpen = false,
  onCloseMobile
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Overview & Neraca Emisi',
      icon: BarChart3,
    },
    {
      id: 'marketplace',
      label: 'Bursa Katalog Klaster',
      icon: ShoppingBag,
    },
    {
      id: 'certificates',
      label: 'Sertifikat & Audit ESG',
      icon: Award,
    },
    {
      id: 'integrations',
      label: 'Integrasi ERP & API',
      icon: Cpu,
    },
    {
      id: 'wallet',
      label: 'Dompet Deposit & Billing',
      icon: CreditCard,
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

  const displayName = currentUser?.company_name || currentUser?.full_name || 'PT Industri Hijau Nusantara';
  const displayEmail = currentUser?.email || 'esg@korporathijau.com';
  const monogram = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'IHN';

  return (
    <>
      {/* DESKTOP FIXED SIDEBAR (Identik dengan format layout FarmerSidebar) */}
      <aside 
        id="corporate-sidebar"
        className="hidden lg:flex fixed inset-y-0 left-0 z-50 h-screen w-64 flex-col justify-between border-r border-slate-200/80 bg-white p-5 font-sans"
        aria-label="Navigasi Utama Korporat"
      >
        <div className="flex min-h-0 flex-col gap-6">
          {/* 1. BRAND HEADER */}
          <div className="flex items-center justify-between">
            <button 
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center text-left cursor-pointer group"
            >
              <TaniKarbonLogo size={36} textVariant="dark" subtitle="PORTAL ESG & EMISI" />
            </button>
          </div>

          {/* 2. MENU NAVIGASI BERSIH */}
          <nav className="min-h-0 flex-1 overflow-y-auto space-y-1.5 pt-1">
            {menuItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 text-left group cursor-pointer text-xs ${
                    isActive
                      ? 'bg-[#0F1E2E] text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl shrink-0 transition ${
                    isActive 
                      ? 'bg-white/10 text-sky-400' 
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 3. KARTU PROFIL ENTITAS AKTIF */}
        <div className="pt-4 border-t border-slate-200/80">
          <div 
            onClick={onOpenCompanyProfile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (onOpenCompanyProfile) onOpenCompanyProfile();
              }
            }}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 hover:border-sky-300 hover:bg-sky-50/30 transition cursor-pointer"
            title="Buka detail profil korporat & kelola emisi"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F1E2E] text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs font-sans">
                {monogram}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>API ERP Terhubung</span>
              </span>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogoutClick();
                }}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER (Bila dibuka di mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white p-5 flex flex-col justify-between shadow-2xl z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <TaniKarbonLogo size={32} textVariant="dark" subtitle="PORTAL ESG" />
                <button 
                  onClick={onCloseMobile} 
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = currentTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left text-xs ${
                        isActive
                          ? 'bg-[#0F1E2E] text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100 font-semibold'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
