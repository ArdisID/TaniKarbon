import React from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Award, 
  Cpu, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  Layers,
  X,
  LogOut
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

export default function CorporateSidebar({ 
  currentUser,
  onLogout,
  currentTab, 
  onSelectTab, 
  collapsed, 
  onToggleCollapse,
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
      highlight: true
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

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop (Hanya di mobile saat dibuka) */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 h-screen z-50 lg:z-20 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 shrink-0 ${
          mobileOpen ? 'left-0 shadow-2xl' : '-left-80 lg:left-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-72`}
      >
        {/* Top Header Branding */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 font-bold shadow-xs shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-[#14382C] text-base tracking-tight font-sans">
                    TaniKarbon
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    CORP
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans block leading-none mt-0.5">
                  Portal ESG &amp; Emisi
                </span>
              </div>
            </div>
          )}

          {/* Tombol Tutup Mobile (di layar mobile) */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition lg:hidden cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tombol Collapse Desktop (hanya di desktop) */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition mx-auto cursor-pointer"
            title={collapsed ? "Buka Sidebar" : "Perkecil Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu Navigation (Clean, Linear/Stripe style) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left group cursor-pointer ${
                  isActive
                    ? 'bg-[#14382C] text-white shadow-xs font-semibold'
                    : item.highlight
                    ? 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200/80 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg shrink-0 transition ${
                  isActive 
                    ? 'text-emerald-300' 
                    : item.highlight
                    ? 'text-emerald-700'
                    : 'text-slate-400 group-hover:text-slate-700'
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                {(!collapsed || mobileOpen) && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="text-sm font-sans truncate">{item.label}</span>
                    {item.highlight && !isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-emerald-600 text-white tracking-wide">
                        LIVE API
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profil Entitas Aktif & Tombol Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 font-sans">
          {(!collapsed || mobileOpen) ? (
            <div>
              <div 
                onClick={() => {
                  onOpenCompanyProfile();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#14382C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-mono">
                    {(currentUser?.full_name || 'IHN').substring(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-stone-900 leading-snug truncate group-hover:text-emerald-800 font-sans">
                      {currentUser?.full_name || 'PT Industri Hijau Nusantara'}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 truncate">
                        SRN-PPI Verified Buyer
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                      {currentUser?.email || 'esg@korporathijau.com'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-2xs"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Keluar Akun</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div 
                onClick={onOpenCompanyProfile}
                className="cursor-pointer group"
                title={`${currentUser?.full_name || 'PT Industri Hijau Nusantara'} (${currentUser?.email || ''})`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#14382C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-mono">
                  {(currentUser?.full_name || 'IHN').substring(0, 3).toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200 cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
