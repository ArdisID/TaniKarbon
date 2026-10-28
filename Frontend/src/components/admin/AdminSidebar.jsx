import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Award, 
  Landmark, 
  Sliders, 
  FileCheck2, 
  Users, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Building2,
  Cpu,
  BadgeAlert,
  LogOut
} from 'lucide-react';

export default function AdminSidebar({ 
  currentUser,
  onLogout,
  currentTab, 
  onSelectTab,
  actionRequiredCount = 8
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Executive Command Center',
      icon: LayoutDashboard,
    },
    {
      id: 'clusters',
      label: 'Manajemen Klaster & GIS',
      icon: MapPin,
    },
    {
      id: 'audit',
      label: 'Audit Eksternal & Penerbitan Bursa',
      icon: Award,
      badge: '2 Siap',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'finance',
      label: 'Brankas Keuangan, Escrow & Payout',
      icon: Landmark,
      badge: '5 Penarikan',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'parameters',
      label: 'Master Parameter & Alometrik',
      icon: Sliders,
    },
    {
      id: 'registry',
      label: 'Registri Sertifikat & Monitor API',
      icon: FileCheck2,
      highlight: true
    },
    {
      id: 'users',
      label: 'Manajemen Pengguna & Wilayah Surveyor',
      icon: Users,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col bg-white border-r border-slate-200 w-72 sticky top-0 h-screen z-20 shrink-0 font-sans">
      {/* Top Header Branding */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 font-bold shadow-xs shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-black text-[#14382C] text-base tracking-tight font-sans">
                TaniKarbon
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-purple-100 text-purple-900 border border-purple-200">
                AUTHORITY
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-sans block leading-none mt-0.5">
              Admin Platform &amp; Registry
            </span>
          </div>
        </div>
      </div>

      {/* Menu Navigation (7 Menu Bersih Tanpa Path URL) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left cursor-pointer font-sans ${
                isActive
                  ? 'bg-[#14382C] text-white shadow-xs font-semibold'
                  : item.highlight
                  ? 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200/80 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1 rounded-lg shrink-0 transition ${
                  isActive 
                    ? 'text-emerald-300' 
                    : item.highlight
                    ? 'text-emerald-700'
                    : 'text-slate-400 group-hover:text-slate-700'
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-sans truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profil Admin Platform & Tombol Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 font-sans">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#14382C] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-mono">
              {(currentUser?.full_name || 'Admin').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-stone-900 leading-snug truncate font-sans">
                {currentUser?.full_name || 'Rangga Aditya, M.Sc.'}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-purple-50 text-purple-900 border border-purple-200 truncate">
                  Role: <span className="font-mono">Administrator</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                {currentUser?.email || 'admin@tanikarbon.com'}
              </p>
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-2xs font-sans"
            title="Keluar dari akun"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Keluar Akun</span>
          </button>
        )}
      </div>
    </aside>
  );
}
