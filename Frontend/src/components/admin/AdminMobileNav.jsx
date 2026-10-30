import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Award, 
  Landmark, 
  MoreHorizontal,
  Sliders,
  FileCheck2,
  Users,
  ChevronRight,
  X,
  LogOut
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

export default function AdminMobileNav({ currentTab, onSelectTab, onLogout }) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreRef = useRef(null);

  const handleLogoutClick = () => {
    if (window.confirm('Keluar dari sesi Administrator platform?')) {
      clearAuthSession();
      if (onLogout) {
        onLogout();
      } else {
        window.location.replace('/login');
      }
    }
  };

  const mainItems = [
    { id: 'dashboard', label: 'Command', icon: LayoutDashboard },
    { id: 'clusters', label: 'Klaster', icon: MapPin },
    { id: 'audit', label: 'Audit', icon: Award },
    { id: 'finance', label: 'Keuangan', icon: Landmark },
  ];

  const secondaryItems = [
    { id: 'parameters', label: 'Master Parameter', desc: 'Alometrik & Emisi', icon: Sliders },
    { id: 'registry', label: 'Registri & API', desc: 'SRN-PPI & Integrasi', icon: FileCheck2 },
    { id: 'users', label: 'Pengguna & Surveyor', desc: 'Hak Akses & Petugas', icon: Users },
  ];

  const isSecondaryActive = secondaryItems.some(item => item.id === currentTab);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    }
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMoreMenu]);

  const handleSelectSecondary = (id) => {
    onSelectTab(id);
    setShowMoreMenu(false);
  };

  return (
    <nav 
      ref={moreRef}
      aria-label="Navigasi Mobile Admin"
      className="fixed bottom-3 inset-x-4 z-50 lg:hidden max-w-md mx-auto"
    >
      {/* Popover Menu Lainnya */}
      {showMoreMenu && (
        <div className="mb-2 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-[0_12px_40px_rgba(20,56,44,0.15)] p-3 animate-fade-in font-sans">
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-stone-100">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Menu Pengaturan Lanjutan
            </span>
            <button
              type="button"
              onClick={() => setShowMoreMenu(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Tutup menu lainnya"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSecondary(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition text-left cursor-pointer ${
                    isActive 
                      ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300' 
                      : 'text-stone-700 hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-xs leading-snug">{item.label}</div>
                      <div className="text-[10px] text-stone-400 font-normal">{item.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-amber-800' : 'text-stone-300'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Admin Logout Button inside More Popover */}
          <div className="pt-2 mt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Keluar dari Akun Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar Dock */}
      <div className="bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-[0_8px_30px_rgba(20,56,44,0.08)] px-2 py-1.5 h-16 flex items-center justify-around font-sans">
        {mainItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setShowMoreMenu(false);
                onSelectTab(item.id);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer"
            >
              {isActive ? (
                <div className="bg-amber-500/15 px-3 py-0.5 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 stroke-[2.2] text-amber-800" />
                </div>
              ) : (
                <Icon className="w-5 h-5 stroke-[1.75] text-stone-400" />
              )}
              <span className={`text-[10px] leading-none ${
                isActive 
                  ? 'font-bold text-amber-900' 
                  : 'font-medium text-stone-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* 5th Item: Lainnya (with Popover Toggle) */}
        <button
          type="button"
          onClick={() => setShowMoreMenu(prev => !prev)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer"
        >
          {isSecondaryActive || showMoreMenu ? (
            <div className="bg-amber-500/15 px-3 py-0.5 rounded-full flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 stroke-[2.2] text-amber-800" />
            </div>
          ) : (
            <MoreHorizontal className="w-5 h-5 stroke-[1.75] text-stone-400" />
          )}
          <span className={`text-[10px] leading-none ${
            isSecondaryActive || showMoreMenu 
              ? 'font-bold text-amber-900' 
              : 'font-medium text-stone-500'
          }`}>
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}
