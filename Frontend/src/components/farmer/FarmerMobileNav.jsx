import React from 'react';
import { 
  LayoutDashboard, 
  MapPinned, 
  Plus, 
  Satellite, 
  Wallet,
  LogOut 
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

export default function FarmerMobileNav({ currentTab, onSelectTab, onLogout }) {
  const handleLogoutClick = () => {
    if (window.confirm('Keluar dari sesi akun Mitra Tani?')) {
      clearAuthSession();
      if (onLogout) {
        onLogout();
      } else {
        window.location.replace('/login');
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'land', label: 'Lahan', icon: MapPinned },
    { id: 'wizard', label: 'Tambah', icon: Plus, isAction: true },
    { id: 'wallet', label: 'Dompet', icon: Wallet },
  ];

  return (
    <nav 
      aria-label="Navigasi Mobile Petani"
      className="fixed bottom-3 inset-x-4 z-40 lg:hidden max-w-md mx-auto"
    >
      <div className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-[0_8px_30px_rgba(20,56,44,0.1)] px-2 py-1.5 h-16 flex items-center justify-around font-sans">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          // Special Center Action "+ Tambah" Button
          if (item.isAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label="Daftarkan Lahan Baru"
                className="flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer active:scale-95"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
                  isActive 
                    ? 'bg-[#14382C] text-emerald-400 ring-2 ring-emerald-500/30' 
                    : 'bg-[#14382C] text-white hover:bg-[#1C4E3D]'
                }`}>
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className={`text-[10px] mt-0.5 leading-none font-bold ${
                  isActive ? 'text-[#14382C]' : 'text-emerald-700'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
            >
              {isActive ? (
                <div className="bg-emerald-500/12 px-3 py-0.5 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 stroke-[2.2] text-[#14382C]" />
                </div>
              ) : (
                <Icon className="w-5 h-5 stroke-[1.75] text-stone-400" />
              )}
              <span className={`text-[10px] leading-none ${
                isActive 
                  ? 'font-bold text-[#14382C]' 
                  : 'font-medium text-stone-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Dedicated Mobile Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          aria-label="Keluar dari akun mitra tani"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer text-rose-500 hover:text-rose-700 active:scale-95"
        >
          <div className="hover:bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full flex items-center justify-center transition">
            <LogOut className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <span className="text-[10px] leading-none font-bold text-rose-600">
            Keluar
          </span>
        </button>
      </div>
    </nav>
  );
}
