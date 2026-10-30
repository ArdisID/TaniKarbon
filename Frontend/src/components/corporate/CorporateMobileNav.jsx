import React from 'react';
import { 
  BarChart3, 
  ShoppingBag, 
  Award, 
  CreditCard,
  LogOut
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

export default function CorporateMobileNav({ currentTab, onSelectTab, onLogout }) {
  const handleLogoutClick = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun korporat?')) {
      clearAuthSession();
      if (onLogout) {
        onLogout();
      } else {
        window.location.replace('/login');
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'marketplace', label: 'Bursa', icon: ShoppingBag },
    { id: 'certificates', label: 'Sertifikat', icon: Award },
    { id: 'wallet', label: 'Dompet', icon: CreditCard },
  ];

  return (
    <nav 
      aria-label="Navigasi Mobile Perusahaan"
      className="fixed bottom-3 inset-x-4 z-50 lg:hidden max-w-md mx-auto"
    >
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(15,30,46,0.12)] px-2 py-1.5 h-16 flex items-center justify-around font-sans">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
            >
              {isActive ? (
                <div className="bg-sky-100 text-blue-700 px-3 py-1 rounded-full flex items-center justify-center shadow-2xs">
                  <Icon className="w-4 h-4 stroke-[2.4]" />
                </div>
              ) : (
                <Icon className="w-5 h-5 stroke-[1.75] text-slate-400 group-hover:text-slate-600" />
              )}
              <span className={`text-[10px] leading-tight ${
                isActive 
                  ? 'font-extrabold text-blue-700' 
                  : 'font-semibold text-slate-500'
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
          aria-label="Keluar dari akun"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer text-rose-500 hover:text-rose-700 active:scale-95"
        >
          <div className="hover:bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full flex items-center justify-center transition">
            <LogOut className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <span className="text-[10px] leading-tight font-bold text-rose-600">
            Keluar
          </span>
        </button>
      </div>
    </nav>
  );
}
