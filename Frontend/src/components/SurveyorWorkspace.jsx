import React, { useState, useEffect } from 'react';
import SurveyorTopBar from './surveyor/SurveyorTopBar';
import SurveyorSidebar from './surveyor/SurveyorSidebar';
import SurveyorMobileNav from './surveyor/SurveyorMobileNav';
import SurveyorDashboardView from './surveyor/SurveyorDashboardView';
import FieldMapNavigationView from './surveyor/FieldMapNavigationView';
import FieldInspectionWorksheetView from './surveyor/FieldInspectionWorksheetView';
import AnnualReverificationView from './surveyor/AnnualReverificationView';
import OfflineSyncAndHistoryView from './surveyor/OfflineSyncAndHistoryView';
import ScheduleVisitModal from './surveyor/ScheduleVisitModal';
import { CheckCircle2 } from 'lucide-react';

export default function SurveyorWorkspace({ 
  currentUser,
  onLogout,
  onNavigateRole, 
  onBack 
}) {
  // 1. Navigation state
  const [currentTab, setCurrentTab] = useState('tasks'); // 'tasks' | 'map' | 'inspection' | 'vintage' | 'sync'

  // 2. Interactive Network / PWA State (BISA DIKLIK SAAT DEMO)
  const [isOnline, setIsOnline] = useState(true);
  const [offlinePackDownloaded, setOfflinePackDownloaded] = useState(false);
  const [isDownloadingPack, setIsDownloadingPack] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // 3. Survey Tickets State
  const [tickets, setTickets] = useState([
    {
      id: 'TKT-WNSB-042',
      farmerName: 'Pak Joko Widodo',
      farmerPhone: '0812-3456-7890',
      landName: 'Lahan 1 - Pekarangan Garung',
      areaM2: 4520,
      treeCount: 100,
      species: 'Mangga Harumanis & Alpukat Mentega',
      distanceKm: 2.4,
      status: 'Menunggu Survei',
      scheduledDate: '27 Okt 2026',
      scheduledTime: '10:00 WIB',
      isToday: false,
      isScheduled: true,
      notes: 'Batas patok sudah ditandai bambu putih.',
      lat: -7.3639,
      lng: 109.9886
    },
    {
      id: 'TKT-WNSB-043',
      farmerName: 'Pak Hendra Wijaya',
      farmerPhone: '0813-8821-4921',
      landName: 'Lahan 2 - Lereng Sindoro Utara',
      areaM2: 6800,
      treeCount: 140,
      species: 'Alpukat Mentega & Kopi Arabika',
      distanceKm: 1.2,
      status: 'Menunggu Survei',
      scheduledDate: '26 Okt 2026',
      scheduledTime: '13:30 WIB',
      isToday: true,
      isScheduled: true,
      notes: 'Jadwal survei fisik hari ini pukul 13:30.',
      lat: -7.3580,
      lng: 109.9920
    },
    {
      id: 'TKT-WNSB-044',
      farmerName: 'Pak Slamet Riyadi',
      farmerPhone: '0857-9912-3341',
      landName: 'Kebun Sengon Blok Kidul',
      areaM2: 3200,
      treeCount: 80,
      species: 'Sengon Soloman',
      distanceKm: 3.5,
      status: 'Menunggu Survei',
      scheduledDate: '26 Okt 2026',
      scheduledTime: '09:00 WIB',
      isToday: true,
      isScheduled: true,
      notes: 'Akses masuk lewat jalan setapak dusun.',
      lat: -7.3695,
      lng: 109.9840
    },
    {
      id: 'TKT-WNSB-045',
      farmerName: 'Bu Siti Aminah',
      farmerPhone: '0821-4455-6677',
      landName: 'Lahan Agroforestri Bawah',
      areaM2: 5100,
      treeCount: 110,
      species: 'Durian Montong & Alpukat',
      distanceKm: 4.8,
      status: 'Menunggu Survei',
      scheduledDate: null,
      scheduledTime: null,
      isToday: false,
      isScheduled: false,
      notes: 'Belum dijadwalkan kunjungan.',
      lat: -7.3710,
      lng: 109.9950
    },
    {
      id: 'TKT-WNSB-046',
      farmerName: 'Pak Agus Santoso',
      farmerPhone: '0819-2233-4455',
      landName: 'Kebun Buah Puncak Dieng',
      areaM2: 3900,
      treeCount: 90,
      species: 'Alpukat & Mangga',
      distanceKm: 5.6,
      status: 'Menunggu Revisi Petani',
      scheduledDate: null,
      scheduledTime: null,
      isToday: false,
      isScheduled: false,
      notes: 'Foto pita ukur pohon #3 buram, diminta foto ulang.',
      lat: -7.3520,
      lng: 109.9810
    },
    {
      id: 'TKT-WNSB-047',
      farmerName: 'Pak Mulyono',
      farmerPhone: '0878-1122-3344',
      landName: 'Lahan Konservasi Mata Air',
      areaM2: 7400,
      treeCount: 160,
      species: 'Beringin & Alpukat Mentega',
      distanceKm: 6.2,
      status: 'Menunggu Survei',
      scheduledDate: null,
      scheduledTime: null,
      isToday: false,
      isScheduled: false,
      notes: 'Belum dijadwalkan kunjungan.',
      lat: -7.3750,
      lng: 109.9790
    }
  ]);

  // 4. Inspection & Modal State
  const [activeInspectionTicket, setActiveInspectionTicket] = useState(tickets[0]);
  const [selectedTicketForSchedule, setSelectedTicketForSchedule] = useState(null);

  // 5. Offline Queue & History
  const [offlineQueue, setOfflineQueue] = useState([
    {
      id: 'OFF-01',
      ticketId: 'TKT-WNSB-042',
      farmerName: 'Pak Joko Widodo',
      landName: 'Lahan 1 - Pekarangan Garung',
      filesCount: 4,
      totalSizeMb: 8.4,
      status: 'Tersimpan Lokal (IndexedDB)',
      createdAt: '26 Okt 2026, 10:20 WIB'
    }
  ]);

  const [history, setHistory] = useState([
    {
      id: 'HIS-0941',
      ticketId: 'TKT-WNSB-038',
      farmerName: 'Pak Supardi',
      landName: 'Lahan Durian Karanganyar',
      decision: 'Disahkan ke Pre-Verified',
      validatedCarbon: '+2.10 tCO2e',
      checkInTime: '24 Okt 2026, 09:15 WIB',
      gpsCoord: '-7.3621, 109.9870',
      clusterStatus: 'Lulus Audit Eksternal (Verified)'
    },
    {
      id: 'HIS-0940',
      ticketId: 'TKT-WNSB-035',
      farmerName: 'Pak Wahyudi',
      landName: 'Kebun Alpukat Lembah Sindoro',
      decision: 'Disahkan ke Pre-Verified',
      validatedCarbon: '+1.85 tCO2e',
      checkInTime: '23 Okt 2026, 14:30 WIB',
      gpsCoord: '-7.3640, 109.9895',
      clusterStatus: 'Lulus Audit Eksternal (Verified)'
    }
  ]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Handlers
  const handleToggleOnline = () => {
    setIsOnline(prev => {
      const next = !prev;
      showToast(next ? 'Perangkat Online: Terhubung ke Server Pusat TaniKarbon.' : 'Mode Offline Aktif: Data survei akan disimpan di memori IndexedDB.');
      return next;
    });
  };

  const handleDownloadOfflinePack = () => {
    setIsDownloadingPack(true);
    setDownloadProgress(15);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloadingPack(false);
          setOfflinePackDownloaded(true);
          showToast('Paket Wilayah Kerja (14.2 MB) berhasil diunduh. Siap dipakai tanpa sinyal internet!');
          return 100;
        }
        return prev + 25;
      });
    }, 350);
  };

  const handleScheduleSuccess = (ticketId, date, time, notes) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          isScheduled: true,
          scheduledDate: date,
          scheduledTime: `${time} WIB`,
          notes: notes || t.notes
        };
      }
      return t;
    }));
  };

  const handleStartInspectionFromTicket = (ticket) => {
    setActiveInspectionTicket(ticket);
    setCurrentTab('map');
  };

  const handleCheckInSuccess = (ticket) => {
    setActiveInspectionTicket(ticket);
    setCurrentTab('inspection');
  };

  const handleCompleteVerification = (resultData) => {
    const isApproved = resultData.decision === 'approved';
    const isRevision = resultData.decision === 'revision';

    // Update tickets status
    setTickets(prev => prev.map(t => {
      if (t.id === resultData.ticketId) {
        return {
          ...t,
          status: isApproved ? 'Pre-Verified (Antrean Klaster)' : isRevision ? 'Menunggu Revisi Petani' : 'Ditolak'
        };
      }
      return t;
    }));

    // Record history
    const historyItem = {
      id: `HIS-${Math.floor(1000 + Math.random() * 9000)}`,
      ticketId: resultData.ticketId,
      farmerName: resultData.farmerName,
      landName: activeInspectionTicket?.landName || 'Lahan Pertanian',
      decision: isApproved ? 'Disahkan ke Pre-Verified' : isRevision ? 'Diminta Revisi' : 'Ditolak',
      validatedCarbon: isApproved ? `+${resultData.validatedCarbon} tCO2e` : '0.00 tCO2e',
      checkInTime: resultData.timestamp,
      gpsCoord: '-7.3639, 109.9886',
      clusterStatus: isApproved ? 'Menunggu Batch Audit Eksternal' : 'Tidak Memenuhi Syarat'
    };
    setHistory(prev => [historyItem, ...prev]);

    // If offline, add to offline queue
    if (!isOnline) {
      const queueItem = {
        id: `OFF-${Date.now().toString().slice(-4)}`,
        ticketId: resultData.ticketId,
        farmerName: resultData.farmerName,
        landName: activeInspectionTicket?.landName || 'Lahan Pertanian',
        filesCount: 4,
        totalSizeMb: 7.8,
        status: 'Tersimpan Lokal (IndexedDB)',
        createdAt: resultData.timestamp
      };
      setOfflineQueue(prev => [queueItem, ...prev]);
    }

    // Switch tab to sync view to see result
    setTimeout(() => {
      setCurrentTab('sync');
    }, 400);
  };

  const handleSyncAll = () => {
    setOfflineQueue([]);
  };

  const pendingTicketsCount = tickets.filter(t => t.status === 'Menunggu Survei').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 lg:bottom-6 right-6 z-50 bg-[#14382C] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center gap-3 animate-slide-in-right max-w-md font-sans">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* 1. Left Sidebar Navigation (Desktop-Only, strictly no mobile hamburger) */}
      <SurveyorSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        pendingCount={pendingTicketsCount}
        syncQueueCount={offlineQueue.length}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* 2. Topbar Kontekstual & Network Status Header */}
        <SurveyorTopBar
          currentUser={currentUser}
          onLogout={onLogout}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          offlinePackDownloaded={offlinePackDownloaded}
          onDownloadOfflinePack={handleDownloadOfflinePack}
          isDownloadingPack={isDownloadingPack}
          downloadProgress={downloadProgress}
          onNavigateRole={onNavigateRole}
        />

        {/* 3. Dynamic Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          
          {/* HALAMAN 1: Dashboard & Antrean Tiket Survei */}
          {currentTab === 'tasks' && (
            <SurveyorDashboardView
              tickets={tickets}
              onOpenScheduleModal={(ticket) => setSelectedTicketForSchedule(ticket)}
              onStartInspection={handleStartInspectionFromTicket}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onToast={showToast}
            />
          )}

          {/* HALAMAN 2: Peta Navigasi & Geofencing Lapangan */}
          {currentTab === 'map' && (
            <FieldMapNavigationView
              selectedTicket={activeInspectionTicket}
              allTickets={tickets}
              onTicketChange={(ticket) => setActiveInspectionTicket(ticket)}
              onCheckInSuccess={handleCheckInSuccess}
              onToast={showToast}
            />
          )}

          {/* HALAMAN 3: Lembar Kerja Inspeksi Lapangan */}
          {currentTab === 'inspection' && (
            <FieldInspectionWorksheetView
              ticket={activeInspectionTicket}
              onCompleteVerification={handleCompleteVerification}
              onBackToMap={() => setCurrentTab('map')}
              onToast={showToast}
            />
          )}

          {/* HALAMAN 4: Siklus Tahunan / Perpanjangan Vintage */}
          {currentTab === 'vintage' && (
            <AnnualReverificationView onToast={showToast} />
          )}

          {/* HALAMAN 5: Manajer Sinkronisasi Offline & Riwayat */}
          {currentTab === 'sync' && (
            <OfflineSyncAndHistoryView
              isOnline={isOnline}
              offlineQueue={offlineQueue}
              onSyncAll={handleSyncAll}
              history={history}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar (Mobile-Only, lg:hidden) */}
      <SurveyorMobileNav
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        pendingCount={pendingTicketsCount}
        syncQueueCount={offlineQueue.length}
      />

      {/* Modal Penjadwalan Lapangan */}
      {selectedTicketForSchedule && (
        <ScheduleVisitModal
          ticket={selectedTicketForSchedule}
          onClose={() => setSelectedTicketForSchedule(null)}
          onScheduleSuccess={handleScheduleSuccess}
          onToast={showToast}
        />
      )}

    </div>
  );
}
