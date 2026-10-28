import React, { useState, useEffect, useCallback } from 'react';
import SurveyorSidebar from './surveyor/SurveyorSidebar';
import SurveyorDashboardView from './surveyor/SurveyorDashboardView';
import SurveyorInspectionView from './surveyor/SurveyorInspectionView';
import OfflineSyncAndHistoryView from './surveyor/OfflineSyncAndHistoryView';
import { getSurveyorTasks } from '../api/surveyor';
import { CheckCircle2, Menu } from 'lucide-react';

export default function SurveyorWorkspace({ 
  currentUser,
  onLogout,
  onNavigateRole, 
  onBack 
}) {
  // Parse initial route from URL
  const parseCurrentRoute = useCallback(() => {
    const path = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const queryPlotId = searchParams.get('plotId');

    if (path.includes('/peta-rute')) {
      return { tab: 'map', plotId: null };
    }
    if (path.includes('/inspeksi')) {
      return { tab: 'inspection', plotId: queryPlotId };
    }
    if (path.includes('/riwayat')) {
      return { tab: 'sync', plotId: null };
    }
    // Default: /surveyor/tugas
    return { tab: 'tasks', plotId: null };
  }, []);

  const initialRoute = parseCurrentRoute();
  const [currentTab, setCurrentTab] = useState(initialRoute.tab);
  const [activePlotId, setActivePlotId] = useState(initialRoute.plotId);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Network State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Real Database Tasks
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // History & Offline Queue
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [history, setHistory] = useState([]);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg, tone = 'emerald') => {
    setToastMessage({ msg, tone });
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Online/Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi internet pulih · Mode Sinkronisasi Aktif', 'emerald');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sinyal offline · Data disimpan lokal di IndexedDB', 'amber');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Fetch Real Tasks from PostgreSQL
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true);
      const data = await getSurveyorTasks();
      if (Array.isArray(data)) {
        setTasks(data);
        // If we are on inspection tab and activePlotId is not set, set to first plot
        if (!activePlotId && data.length > 0) {
          const searchParams = new URLSearchParams(window.location.search);
          const qId = searchParams.get('plotId');
          if (qId) {
            setActivePlotId(qId);
          } else {
            setActivePlotId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch surveyor tasks from backend:', err.message);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [activePlotId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Two-way URL routing binding
  const handleSelectTab = useCallback((tabId, params = {}) => {
    let targetPath = '/surveyor/tugas';
    let targetPlotId = params.plotId || activePlotId;

    if (tabId === 'map') {
      targetPath = '/surveyor/peta-rute';
    } else if (tabId === 'inspection') {
      if (!targetPlotId && tasks.length > 0) {
        targetPlotId = tasks[0].id;
      }
      targetPath = targetPlotId ? `/surveyor/inspeksi?plotId=${targetPlotId}` : '/surveyor/inspeksi';
    } else if (tabId === 'sync') {
      targetPath = '/surveyor/riwayat';
    }

    if (window.location.pathname + window.location.search !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }

    setCurrentTab(tabId);
    if (params.plotId) {
      setActivePlotId(params.plotId);
    } else if (targetPlotId && tabId === 'inspection') {
      setActivePlotId(targetPlotId);
    }
  }, [activePlotId, tasks]);

  // Listen to popstate (browser Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setCurrentTab(route.tab);
      if (route.plotId) {
        setActivePlotId(route.plotId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseCurrentRoute]);

  // Sync / Audit Complete Callback
  const handleAuditComplete = useCallback((decision) => {
    fetchTasks();
    handleSelectTab('tasks');
  }, [fetchTasks, handleSelectTab]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F291E] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-slide-in-right max-w-md font-sans">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold leading-relaxed">{toastMessage.msg}</p>
        </div>
      )}

      {/* 1. Strict Sidebar-Only Navigation (No duplicate top navbar) */}
      <SurveyorSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        pendingCount={tasks.filter(t => t.status === 'draft' || t.status === 'pending_survey').length}
        syncQueueCount={offlineQueue.length}
        isOnline={isOnline}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area (Offset for lg:ml-64 sidebar-only layout) */}
      <main className="min-w-0 flex-1 lg:ml-64">
        {/* Mobile Header Bar (Mobile-only trigger for drawer) */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-[#0F291E] text-sm font-sans tracking-tight">TaniKarbon</h2>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              FIELD
            </span>
          </div>
          <div className="w-8" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: Tugas & Antrean (Dashboard) -> /surveyor/tugas */}
          {currentTab === 'tasks' && (
            <SurveyorDashboardView
              currentUser={currentUser}
              tasks={tasks}
              onStartInspection={(task) => handleSelectTab('inspection', { plotId: task.id })}
              onNavigateTab={handleSelectTab}
              onToast={showToast}
            />
          )}

          {/* TAB 2: Peta & Rute Kebun -> /surveyor/peta-rute */}
          {currentTab === 'map' && (
            <SurveyorDashboardView
              currentUser={currentUser}
              tasks={tasks}
              onStartInspection={(task) => handleSelectTab('inspection', { plotId: task.id })}
              onNavigateTab={handleSelectTab}
              onToast={showToast}
            />
          )}

          {/* TAB 3: Form Eksekusi Inspeksi Lahan -> /surveyor/inspeksi?plotId=... */}
          {currentTab === 'inspection' && (
            <SurveyorInspectionView
              plotId={activePlotId}
              tasks={tasks}
              currentUser={currentUser}
              onBack={() => handleSelectTab('tasks')}
              onNavigateTab={handleSelectTab}
              onToast={showToast}
              onAuditComplete={handleAuditComplete}
            />
          )}

          {/* TAB 4: Riwayat & Sinkronisasi -> /surveyor/riwayat */}
          {currentTab === 'sync' && (
            <OfflineSyncAndHistoryView
              isOnline={isOnline}
              offlineQueue={offlineQueue}
              onSyncAll={() => setOfflineQueue([])}
              history={history}
              onToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
}
