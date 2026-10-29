import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

  // Parse initial route from URL with strict guard
  const parseCurrentRoute = useCallback(() => {
    const path = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const queryPlotId = searchParams.get('plotId');

    if (path.includes('/peta-rute')) {
      // Peta rute telah terintegrasi di Dashboard, redirect ke /surveyor/tugas
      window.history.replaceState(null, '', '/surveyor/tugas');
      return { tab: 'tasks', plotId: null };
    }
    if (path.includes('/inspeksi')) {
      if (!queryPlotId || queryPlotId.trim() === '') {
        // Guard: Jika dibuka tanpa plotId yang valid, langsung redirect ke /surveyor/tugas (DILARANG fallback tasks[0])
        window.history.replaceState(null, '', '/surveyor/tugas');
        return { tab: 'tasks', plotId: null };
      }
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

  // Fetch Real Tasks from PostgreSQL (Strict Guard: DILARANG fallback ke data[0])
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true);
      const data = await getSurveyorTasks();
      if (Array.isArray(data)) {
        setTasks(data);
        const path = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const qId = searchParams.get('plotId');
        if (path.includes('/inspeksi')) {
          if (!qId) {
            window.history.replaceState(null, '', '/surveyor/tugas');
            setCurrentTab('tasks');
            setActivePlotId(null);
          } else {
            const exists = data.some(t => t.id === qId || t.land_id === qId);
            if (!exists && data.length > 0) {
              showToast('Lahan tidak ditemukan dalam daftar tugas Anda.', 'amber');
              window.history.replaceState(null, '', '/surveyor/tugas');
              setCurrentTab('tasks');
              setActivePlotId(null);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch surveyor tasks from backend:', err.message);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Two-way URL routing binding
  const handleSelectTab = useCallback((tabId, params = {}) => {
    let targetPath = '/surveyor/tugas';
    let targetPlotId = params.plotId;

    if (tabId === 'inspection') {
      if (!targetPlotId) {
        // Guard: Jika tidak ada plotId, DILARANG masuk mode inspeksi dan DILARANG fallback ke tasks[0]
        targetPath = '/surveyor/tugas';
        tabId = 'tasks';
      } else {
        targetPath = `/surveyor/inspeksi?plotId=${targetPlotId}`;
      }
    } else if (tabId === 'sync' || tabId === 'riwayat') {
      tabId = 'sync';
      targetPath = '/surveyor/riwayat';
      targetPlotId = null;
    } else {
      // Default: /surveyor/tugas
      tabId = 'tasks';
      targetPath = '/surveyor/tugas';
      targetPlotId = null;
    }

    if (window.location.pathname + window.location.search !== targetPath) {
      navigate(targetPath);
    }

    setCurrentTab(tabId);
    setActivePlotId(targetPlotId || null);
  }, [navigate]);

  // Sync state whenever URL / location changes
  useEffect(() => {
    const route = parseCurrentRoute();
    setCurrentTab(route.tab);
    setActivePlotId(route.plotId);
  }, [location.pathname, location.search, parseCurrentRoute]);

  // Listen to popstate (browser Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setCurrentTab(route.tab);
      setActivePlotId(route.plotId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseCurrentRoute]);

  // Sync / Audit Complete Callback
  const handleAuditComplete = useCallback((decision) => {
    fetchTasks();
    handleSelectTab('tasks');
  }, [fetchTasks, handleSelectTab]);

  // Riwayat lahan yang sudah selesai diaudit (verified / rejected) dari database PostgreSQL
  const completedHistory = useMemo(() => {
    return tasks
      .filter((t) => {
        const s = String(t.status || '').toLowerCase();
        return s === 'verified' || s === 'approved' || s.includes('verif') || s === 'rejected';
      })
      .map((t) => {
        const isVerified = String(t.status || '').toLowerCase().includes('verif') || t.status === 'approved';
        const totalCarbon = (t.tree_blocks || []).reduce(
          (acc, b) => acc + (Number(b.estimated_tco2e_per_year) || 0), 0
        ).toFixed(1);
        const latestLog = (t.survey_logs && t.survey_logs.length > 0) ? t.survey_logs[0] : null;

        return {
          id: t.id,
          ticketId: t.ticket_code || `TKT-${t.id.slice(0, 8).toUpperCase()}`,
          farmerName: t.farmer_name || t.farmerName || 'Petani Mitra',
          farmerPhone: t.farmer_phone || t.farmerPhone,
          landName: t.name || t.landName || 'Petak Agroforestri',
          areaSqm: t.area_sqm || t.areaM2 || 0,
          treeBlocks: t.tree_blocks || [],
          treeCount: t.treeCount || (t.tree_blocks || []).reduce((acc, b) => acc + (b.total_population || 0), 0),
          decision: isVerified ? 'Disahkan (Pre-Verified)' : 'Ditolak',
          isVerified,
          validatedCarbon: isVerified ? `${totalCarbon} tCO2e/thn` : '0 tCO2e',
          checkInTime: latestLog?.created_at
            ? new Date(latestLog.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
            : (t.scheduledDate || 'Tercatat di Ledger'),
          gpsCoord: `${(Number(t.lat) || -6.3686).toFixed(4)}, ${(Number(t.lng) || 106.8331).toFixed(4)}`,
          clusterStatus: isVerified ? 'Selesai Lapangan' : 'Audit Ditolak',
          surveyLogs: t.survey_logs || [],
          notes: latestLog?.notes || (isVerified ? 'Telah memenuhi standar alometrik & geofencing lapangan.' : 'Tidak memenuhi kualifikasi batas/tegakan.')
        };
      });
  }, [tasks]);

  // Mode Fokus Tanpa Sidebar (Fullscreen Execution Mode)
  const isInspectionMode = currentTab === 'inspection' && Boolean(activePlotId);
  const pendingCount = tasks.filter(t => (t.status === 'draft' || t.status === 'pending_survey') && (t.tree_blocks?.length > 0)).length;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans antialiased">
      {/* React Router Nested Outlet for surveyor subroutes */}
      <Outlet />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F291E] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-slide-in-right max-w-md font-sans">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold leading-relaxed">{toastMessage.msg}</p>
        </div>
      )}

      {/* 1. Strict Sidebar-Only Navigation: SEMBUNYIKAN saat mode inspeksi layar penuh */}
      {!isInspectionMode && (
        <SurveyorSidebar
          currentUser={currentUser}
          onLogout={onLogout}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          pendingCount={pendingCount}
          syncQueueCount={offlineQueue.length}
          isOnline={isOnline}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area (Full-Width jika mode inspeksi; lg:ml-64 jika ada sidebar) */}
      <main className={`min-w-0 flex-1 ${isInspectionMode ? 'w-full' : 'lg:ml-64'}`}>
        {/* Mobile Header Bar (Hanya tampil pada mode dashboard ber-sidebar) */}
        {!isInspectionMode && (
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
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
        )}

        {/* Render View Container */}
        {isInspectionMode ? (
          /* Mode Fokus Layar Penuh: Tanpa batas padding luar */
          <SurveyorInspectionView
            plotId={activePlotId}
            tasks={tasks}
            currentUser={currentUser}
            onBack={() => handleSelectTab('tasks')}
            onNavigateTab={handleSelectTab}
            onToast={showToast}
            onAuditComplete={handleAuditComplete}
          />
        ) : (
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {/* TAB 1: Tugas & Rute Inspeksi (Dashboard) -> /surveyor/tugas */}
            {currentTab === 'tasks' && (
              <SurveyorDashboardView
                currentUser={currentUser}
                tasks={tasks}
                onStartInspection={(task) => handleSelectTab('inspection', { plotId: task.id })}
                onNavigateTab={handleSelectTab}
                onToast={showToast}
                onRefreshTasks={fetchTasks}
              />
            )}

            {/* TAB 2: Riwayat & Sinkronisasi -> /surveyor/riwayat */}
            {currentTab === 'sync' && (
              <OfflineSyncAndHistoryView
                isOnline={isOnline}
                offlineQueue={offlineQueue}
                onSyncAll={() => setOfflineQueue([])}
                history={completedHistory}
                onToast={showToast}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
