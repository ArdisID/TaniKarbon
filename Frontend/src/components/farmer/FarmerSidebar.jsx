import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  PlusCircle, 
  FileCheck2, 
  Wallet, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  User,
  ExternalLink
} from 'lucide-react';

export default function FarmerSidebar({ 
  currentTab, 
  onSelectTab, 
  collapsed, 
  onToggleCollapse,
  onOpenProfile
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Ringkasan & Klaster',
      icon: LayoutDashboard,
    },
    {
      id: 'land',
      label: 'Manajemen Lahan',
      sublabel: 'Daftar Petak & Pohon',
      icon: Map,
    },
    {
      id: 'wizard',
      label: 'Daftarkan Lahan',
      sublabel: 'Alur Pemetaan Baru',
      icon: PlusCircle,
      highlight: true
    },
    {
      id: 'timeline',
      label: 'Lacak Verifikasi',
      sublabel: 'Tahapan Audit Satelit',
      icon: FileCheck2,
    },
    {
      id: 'wallet',
      label: 'Dompet Karbon',
      sublabel: 'Bagi Hasil 88/12',
      icon: Wallet,
    },
  ];

  return (
    <aside 
      className={`hidden md:flex flex-col bg-white border-r border-stone-200/80 transition-all duration-300 z-20 sticky top-0 h-screen ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#14382C] flex items-center justify-center text-emerald-400 font-black text-sm">
              TK
            </div>
            <div>
              <h2 className="font-extrabold text-[#14382C] text-sm leading-tight">TaniKarbon</h2>
              <span className="text-[10px] text-stone-400 font-medium">Portal Mitra Petani</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition mx-auto"
          title={collapsed ? "Buka Menu" : "Tutup Menu"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Menu Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition font-medium text-xs text-left group ${
                isActive
                  ? 'bg-[#14382C] text-white shadow-sm shadow-[#14382C]/10 font-bold'
                  : item.highlight
                  ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200/80 font-bold'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl shrink-0 transition ${
                isActive 
                  ? 'bg-white/10 text-emerald-300' 
                  : item.highlight
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'text-stone-500 group-hover:text-stone-800'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.highlight && !isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-600 text-white">
                        BARU
                      </span>
                    )}
                  </div>
                  <span className={`block text-[10px] truncate ${
                    isActive ? 'text-emerald-200/80 font-normal' : 'text-stone-400'
                  }`}>
                    {item.sublabel}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profil Ringkas Pak Joko Widodo (Mitra Dusun Garung, Wonosobo) */}
      <div className="p-3 border-t border-stone-100 bg-stone-50/70">
        {!collapsed ? (
          <div 
            onClick={onOpenProfile}
            className="p-2.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-emerald-300 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src="/pak-joko.jpg"
                  alt="Pak Joko Widodo"
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                  <ShieldCheck className="w-2.5 h-2.5 text-white" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-[#14382C] truncate group-hover:text-emerald-700">
                    Pak Joko Widodo
                  </h4>
                </div>
                <p className="text-[10px] text-stone-500 truncate">Mitra Dusun Garung, Wonosobo</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Gapoktan Wono Subur
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={onOpenProfile}
            className="flex justify-center cursor-pointer group py-1"
            title="Pak Joko Widodo - Mitra Dusun Garung, Wonosobo"
          >
            <div className="relative">
              <img
                src="/pak-joko.jpg"
                alt="Pak Joko Widodo"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/30"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
