import React from 'react';
import { LayoutDashboard, Map, Plus, FileCheck2, Wallet } from 'lucide-react';

export default function FarmerMobileNav({ currentTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'land', label: 'Lahan', icon: Map },
    { id: 'wizard', label: 'Tambah', icon: Plus, isAction: true },
    { id: 'timeline', label: 'Status', icon: FileCheck2 },
    { id: 'wallet', label: 'Dompet', icon: Wallet },
  ];

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40">
      <div className="bg-[#14382C]/95 backdrop-blur-lg border border-emerald-500/20 text-white rounded-3xl shadow-2xl px-2 py-1.5 flex items-center justify-around relative">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <div key={item.id} className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-label="Tambah Lahan Baru"
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-90 border-2 border-white/20 ${
                    isActive 
                      ? 'bg-emerald-400 text-[#14382C] ring-4 ring-emerald-500/30' 
                      : 'bg-emerald-500 text-stone-950 hover:bg-emerald-400'
                  }`}
                  style={{ width: '52px', height: '52px' }}
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
                <span className="text-[10px] font-bold text-emerald-300 mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition ${
                isActive
                  ? 'text-emerald-300 font-bold'
                  : 'text-stone-300/70 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${
                isActive ? 'bg-white/10 text-emerald-300' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
