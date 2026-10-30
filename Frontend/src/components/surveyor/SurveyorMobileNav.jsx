import React from 'react';
import { 
  ClipboardList, 
  MapPin, 
  CheckCircle2, 
  RefreshCw,
  LogOut 
} from 'lucide-react';
import { clearAuthSession } from '../../api/auth';

export default function SurveyorMobileNav({ 
  currentTab, 
  onSelectTab,
  pendingCount = 0,
  syncQueueCount = 0,
  onLogout
}) {
  const handleLogoutClick = () => {
    if (window.confirm('Keluar dari sesi akun Surveyor lapangan?')) {
      clearAuthSession();
      if (onLogout) {
        onLogout();
      } else {
        window.location.replace('/login');
      }
    }
  };

  const navItems = [
    { 
      id: 'tasks', 
      label: 'Tugas', 
      icon: ClipboardList, 
      badge: pendingCount > 0 ? pendingCount : null 
    },
    { 
      id: 'map', 
      label: 'Peta GPS', 
      icon: MapPin 
    },
    { 
      id: 'inspection', 
      label: 'Inspeksi', 
      icon: CheckCircle2 
    },
    { 
      id: 'sync', 
      label: 'Sinkronisasi', 
      icon: RefreshCw, 
      badge: syncQueueCount > 0 ? syncQueueCount : null 
    },
  ];

  return (
    <nav 
      aria-label="Navigasi Mobile Surveyor"
      className="fixed bottom-3 inset-x-4 z-50 lg:hidden max-w-md mx-auto"
    >
      <div className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-[0_8px_30px_rgba(20,56,44,0.1)] px-2 py-1.5 h-16 flex items-center justify-around font-sans">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer relative active:scale-95"
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

              {item.badge && !isActive && (
                <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-sans font-bold tabular-nums flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Dedicated Mobile Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          aria-label="Keluar dari sesi surveyor"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-200 cursor-pointer text-rose-500 hover:text-rose-700 active:scale-95"
        >
          <div className="hover:bg-rose-50 text-rose-600 px-2 py-1 rounded-full flex items-center justify-center transition">
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
