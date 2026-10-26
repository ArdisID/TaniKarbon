import React, { useState, useEffect } from 'react';
import AdminSidebar from './admin/AdminSidebar';
import AdminTopBar from './admin/AdminTopBar';
import AdminDashboardView from './admin/AdminDashboardView';
import ClusterGeoManagementView from './admin/ClusterGeoManagementView';
import ExternalAuditAndMintingView from './admin/ExternalAuditAndMintingView';
import FinancialEscrowAndPayoutView from './admin/FinancialEscrowAndPayoutView';
import SystemParametersMasterView from './admin/SystemParametersMasterView';
import RegistryAndApiMonitorView from './admin/RegistryAndApiMonitorView';
import UserAndSurveyorManagementView from './admin/UserAndSurveyorManagementView';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminWorkspace({ onNavigateRole }) {
  // Current active tab in Admin platform
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleShowToast = (msg) => {
    setToastMessage(msg);
  };

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short max-w-md">
          <div className="px-4 py-3 bg-[#14382C] text-white rounded-2xl shadow-xl border border-emerald-500/30 flex items-center justify-between gap-3 text-xs font-sans">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="leading-snug">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer (Hidden on Desktop: lg:hidden) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            <AdminSidebar
              currentTab={currentTab}
              onSelectTab={handleSelectTab}
              actionRequiredCount={8}
            />
          </div>
        </div>
      )}

      {/* Desktop Layout Structure */}
      <div className="flex-1 flex">
        {/* Fixed Left Sidebar (Desktop Only) */}
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          actionRequiredCount={8}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Global TopBar */}
          <AdminTopBar
            onNavigateRole={onNavigateRole}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />

          {/* Tab Views Router */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <AdminDashboardView onNavigateTab={handleSelectTab} />
            )}

            {currentTab === 'clusters' && (
              <ClusterGeoManagementView onToast={handleShowToast} />
            )}

            {currentTab === 'audit' && (
              <ExternalAuditAndMintingView onToast={handleShowToast} />
            )}

            {currentTab === 'finance' && (
              <FinancialEscrowAndPayoutView onToast={handleShowToast} />
            )}

            {currentTab === 'parameters' && (
              <SystemParametersMasterView onToast={handleShowToast} />
            )}

            {currentTab === 'registry' && (
              <RegistryAndApiMonitorView onToast={handleShowToast} />
            )}

            {currentTab === 'users' && (
              <UserAndSurveyorManagementView onToast={handleShowToast} />
            )}
          </main>

          {/* Simple Global Footer */}
          <footer className="border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400 font-sans">
            TaniKarbon System Manager &amp; Registry Authority Platform &copy; 2026 • Standar Registri Nasional Pengendalian Perubahan Iklim (SRN-PPI) &amp; ISO 14064-2
          </footer>
        </div>
      </div>

    </div>
  );
}
