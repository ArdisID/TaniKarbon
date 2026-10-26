import React, { useState, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import AuthGateway from './components/AuthGateway';
import SurveyorLoginView from './components/surveyor/SurveyorLoginView';
import AdminLoginView from './components/admin/AdminLoginView';
import FarmerWorkspace from './components/FarmerWorkspace';
import CorporateMarketplace from './components/CorporateMarketplace';
import SurveyorWorkspace from './components/SurveyorWorkspace';
import AdminWorkspace from './components/AdminWorkspace';
import { TREES_DATA } from './data';

export default function App() {
  // Path-based route resolver
  const getInitialView = () => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/surveyor/login') return 'surveyor_login';
    if (path === '/admin/login') return 'admin_login';
    if (path === '/mitra-tani' || path === '/farmer' || path === '/petani') return 'farmer';
    if (path === '/korporat' || path === '/corporate' || path === '/b2b') return 'corporate';
    if (path === '/surveyor' || path === '/petugas' || path === '/verifier') return 'surveyor';
    if (path === '/admin' || path === '/authority' || path === '/manager') return 'admin';
    if (path === '/login' || path === '/auth' || path === '/daftar') return 'auth';
    return 'landing';
  };

  const [view, setView] = useState(getInitialView);
  const [authTab, setAuthTab] = useState('farmer');

  // Shared state
  const [walletBalance, setWalletBalance] = useState(3250000);
  const [trees, setTrees] = useState([...TREES_DATA]);
  const [totalRetired, setTotalRetired] = useState(2400);

  const handleNavigate = useCallback((targetView, tab) => {
    if (tab) setAuthTab(tab);
    setView(targetView);
    let targetPath = '/';
    if (targetView === 'farmer') targetPath = '/mitra-tani';
    else if (targetView === 'corporate') targetPath = '/korporat';
    else if (targetView === 'surveyor') targetPath = '/surveyor';
    else if (targetView === 'surveyor_login') targetPath = '/surveyor/login';
    else if (targetView === 'admin') targetPath = '/admin';
    else if (targetView === 'admin_login') targetPath = '/admin/login';
    else if (targetView === 'auth') targetPath = '/login';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view: targetView }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back / Forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname.toLowerCase();
      if (currentPath === '/surveyor/login') {
        setView('surveyor_login');
      } else if (currentPath === '/admin/login') {
        setView('admin_login');
      } else if (currentPath === '/mitra-tani' || currentPath === '/farmer' || currentPath === '/petani') {
        setView('farmer');
      } else if (currentPath === '/korporat' || currentPath === '/corporate' || currentPath === '/b2b') {
        setView('corporate');
      } else if (currentPath === '/surveyor' || currentPath === '/petugas' || currentPath === '/verifier') {
        setView('surveyor');
      } else if (currentPath === '/admin' || currentPath === '/authority' || currentPath === '/manager') {
        setView('admin');
      } else if (currentPath === '/login' || currentPath === '/auth' || currentPath === '/daftar') {
        setView('auth');
      } else {
        setView('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = useCallback((role) => {
    handleNavigate(role);
  }, [handleNavigate]);

  const handleAddTree = useCallback((newTree) => {
    setTrees(prev => [...prev, newTree]);
  }, []);

  const handleRetire = useCallback((tons) => {
    setTotalRetired(prev => prev + tons);
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7F2] text-[#173829]">
      {/* Views */}
      <div className="animate-fade-in" key={view}>
        {view === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}
        {view === 'auth' && (
          <AuthGateway
            defaultTab={authTab}
            onLogin={handleLogin}
            onBack={() => handleNavigate('landing')}
            onNavigateRole={(target) => handleNavigate(target)}
          />
        )}
        {view === 'surveyor_login' && (
          <SurveyorLoginView
            onLogin={handleLogin}
            onBack={() => handleNavigate('landing')}
            onNavigate={handleNavigate}
          />
        )}
        {view === 'admin_login' && (
          <AdminLoginView
            onLogin={handleLogin}
            onBack={() => handleNavigate('landing')}
            onNavigate={handleNavigate}
          />
        )}
        {view === 'farmer' && (
          <FarmerWorkspace
            walletBalance={walletBalance}
            onUpdateBalance={setWalletBalance}
            trees={trees}
            onAddTree={handleAddTree}
            onBack={() => handleNavigate('landing')}
            onNavigateRole={(target) => handleNavigate(target)}
          />
        )}
        {view === 'corporate' && (
          <CorporateMarketplace
            totalRetired={totalRetired}
            onRetire={handleRetire}
            onBack={() => handleNavigate('landing')}
            onNavigateRole={(target) => handleNavigate(target)}
          />
        )}
        {view === 'surveyor' && (
          <SurveyorWorkspace
            onNavigateRole={(target) => handleNavigate(target)}
            onBack={() => handleNavigate('landing')}
          />
        )}
        {view === 'admin' && (
          <AdminWorkspace
            onNavigateRole={(target) => handleNavigate(target)}
          />
        )}
      </div>
    </div>
  );
}
