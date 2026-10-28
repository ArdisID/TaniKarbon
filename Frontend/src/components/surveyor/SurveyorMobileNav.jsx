import React from 'react';
import { 
  ClipboardList, 
  History 
} from 'lucide-react';

export default function SurveyorMobileNav({ 
  currentTab, 
  onSelectTab,
  pendingCount = 0,
  syncQueueCount = 0
}) {
  const tabs = [
    { id: 'tasks', label: 'Tugas & Rute', icon: ClipboardList, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'sync', label: 'Riwayat & Sinkron', icon: History, badge: syncQueueCount > 0 ? syncQueueCount : null },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around font-sans">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition relative cursor-pointer ${
              isActive 
                ? 'text-[#14382C] font-bold' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition ${
              isActive ? 'bg-[#14382C] text-emerald-400 shadow-xs' : ''
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 font-sans leading-none">
              {tab.label}
            </span>

            {tab.badge && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
