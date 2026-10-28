import React, { useState, useCallback, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthGateway from './components/AuthGateway';
import SurveyorLoginView from './components/surveyor/SurveyorLoginView';
import AdminLoginView from './components/admin/AdminLoginView';
import FarmerWorkspace from './components/FarmerWorkspace';
import CorporateMarketplace from './components/CorporateMarketplace';
import SurveyorWorkspace from './components/SurveyorWorkspace';
import AdminWorkspace from './components/AdminWorkspace';
import { TREES_DATA } from './data';
import { getStoredUser, getStoredToken, clearAuthSession, getMe } from './api/auth';

const PROTECTED_ROLES = {
  farmer: ['/mitra-tani', '/farmer', '/petani'],
  corporate: ['/korporat', '/corporate', '/b2b'],
  surveyor: ['/surveyor', '/petugas', '/verifier'],
  admin: ['/admin', '/authority', '/manager'],
};

const ROLE_PRIMARY_PATHS = {
  farmer: '/mitra-tani/dashboard',
  corporate: '/korporat',
  surveyor: '/surveyor',
  admin: '/admin',
};

const LOGIN_PATHS = ['/login', '/auth', '/daftar', '/surveyor/login', '/admin/login'];

function matchesRolePath(path, prefixes) {
  const normalized = (path || '').toLowerCase();
  return prefixes.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function isProtectedRoute(path) {
  return Object.values(PROTECTED_ROLES).some(prefixes => matchesRolePath(path, prefixes));
}

function getRoleFromPath(path) {
  for (const [role, prefixes] of Object.entries(PROTECTED_ROLES)) {
    if (matchesRolePath(path, prefixes)) return role;
  }
  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [authTab, setAuthTab] = useState('farmer');

  // Shared state
  const [walletBalance, setWalletBalance] = useState(0);
  const [trees, setTrees] = useState([...TREES_DATA]);
  const [totalRetired, setTotalRetired] = useState(2400);

  // Initial view resolver with strict guard
  const getInitialView = () => {
    const path = window.location.pathname.toLowerCase();
    const token = getStoredToken();
    const user = getStoredUser();
    const userRole = user?.role === 'company' ? 'corporate' : user?.role;

    // 1. Unauthenticated trying to access protected route -> force /login
    if ((!token || !user) && isProtectedRoute(path)) {
      window.history.replaceState({ view: 'auth' }, '', '/login');
      return 'auth';
    }

    // 2. Authenticated user trying to access login or other role workspace -> redirect to own workspace
    if (token && user && userRole) {
      const targetRole = getRoleFromPath(path);
      const isLogin = LOGIN_PATHS.includes(path);
      if (isLogin || (targetRole && targetRole !== userRole)) {
        const targetPath = ROLE_PRIMARY_PATHS[userRole] || '/mitra-tani/dashboard';
        window.history.replaceState({ view: userRole }, '', targetPath);
        return userRole;
      }
      if (targetRole === userRole) {
        return userRole;
      }
    }

    // 3. Normal path resolution
    if (path === '/surveyor/login') return 'surveyor_login';
    if (path === '/admin/login') return 'admin_login';
    const matchedRole = getRoleFromPath(path);
    if (matchedRole) return matchedRole;
    if (LOGIN_PATHS.includes(path)) return 'auth';
    return 'landing';
  };

  const [view, setView] = useState(getInitialView);

  // Verify auth session against backend GET /api/v1/auth/me on mount
  useEffect(() => {
    async function verifySession() {
      const token = getStoredToken();
      const path = window.location.pathname.toLowerCase();

      if (!token) {
        if (isProtectedRoute(path)) {
          window.history.replaceState({ view: 'auth' }, '', '/login');
          setView('auth');
        }
        return;
      }

      try {
        const me = await getMe();
        if (!me) {
          // Token expired or invalid
          clearAuthSession();
          setCurrentUser(null);
          if (isProtectedRoute(path)) {
            window.history.replaceState({ view: 'auth' }, '', '/login');
            setView('auth');
          }
        } else {
          const normalizedRole = me.role === 'company' ? 'corporate' : me.role;
          const updatedUser = {
            id: me.id,
            email: me.email,
            full_name: me.full_name,
            role: normalizedRole,
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('tanikarbon_user', JSON.stringify(updatedUser));

          // If on login path or accessing another role's route, force redirect to user's workspace
          const targetRole = getRoleFromPath(path);
          if (LOGIN_PATHS.includes(path) || (targetRole && targetRole !== normalizedRole)) {
            const userPath = ROLE_PRIMARY_PATHS[normalizedRole] || '/mitra-tani/dashboard';
            window.history.replaceState({ view: normalizedRole }, '', userPath);
            setView(normalizedRole);
          }
        }
      } catch (err) {
        console.error('Session verification error:', err);
      }
    }

    verifySession();
  }, []);

  const handleNavigate = useCallback((targetView, tab) => {
    let resolvedView = targetView;
    if (resolvedView === 'company') resolvedView = 'corporate';
    if (tab) setAuthTab(tab);

    const token = getStoredToken();
    const user = getStoredUser();
    const userRole = user?.role === 'company' ? 'corporate' : user?.role;

    // Guard against unauthenticated access to protected view
    const viewRoles = ['farmer', 'corporate', 'surveyor', 'admin'];
    if (viewRoles.includes(resolvedView) && (!token || !user)) {
      window.history.replaceState({ view: 'auth' }, '', '/login');
      setView('auth');
      return;
    }

    // Guard against authenticated user going to login page or foreign role
    if (token && user && userRole) {
      if (resolvedView === 'auth' || resolvedView === 'surveyor_login' || resolvedView === 'admin_login') {
        resolvedView = userRole;
      } else if (viewRoles.includes(resolvedView) && resolvedView !== userRole) {
        resolvedView = userRole;
      }
    }

    setView(resolvedView);
    let targetPath = '/';
    if (resolvedView === 'farmer') {
      const cur = window.location.pathname.toLowerCase();
      targetPath = matchesRolePath(cur, PROTECTED_ROLES.farmer) ? window.location.pathname : '/mitra-tani/dashboard';
    }
    else if (resolvedView === 'corporate') targetPath = '/korporat';
    else if (resolvedView === 'surveyor') targetPath = '/surveyor';
    else if (resolvedView === 'surveyor_login') targetPath = '/surveyor/login';
    else if (resolvedView === 'admin') targetPath = '/admin';
    else if (resolvedView === 'admin_login') targetPath = '/admin/login';
    else if (resolvedView === 'auth') targetPath = '/login';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view: resolvedView }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back / Forward buttons with STRICT ROUTE & ROLE GUARD
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname.toLowerCase();
      const token = getStoredToken();
      const user = getStoredUser();
      const userRole = user?.role === 'company' ? 'corporate' : user?.role;

      // 1. Unauthenticated guard
      if (!token || !user) {
        if (isProtectedRoute(currentPath)) {
          window.history.replaceState({ view: 'auth' }, '', '/login');
          setView('auth');
          return;
        }
        if (currentPath === '/surveyor/login') setView('surveyor_login');
        else if (currentPath === '/admin/login') setView('admin_login');
        else if (LOGIN_PATHS.includes(currentPath)) setView('auth');
        else setView('landing');
        return;
      }

      // 2. Authenticated guard (Anti Back-Button Bypass to /login or other role)
      const targetRole = getRoleFromPath(currentPath);
      const isLoginPath = LOGIN_PATHS.includes(currentPath);

      if (isLoginPath || (targetRole && targetRole !== userRole)) {
        // Intercept back-button attempt to login or wrong role!
        const expectedPath = ROLE_PRIMARY_PATHS[userRole] || '/mitra-tani/dashboard';
        window.history.replaceState({ view: userRole }, '', expectedPath);
        setView(userRole);
        return;
      }

      // Valid navigation for authenticated user
      if (targetRole === userRole) {
        setView(userRole);
      } else if (currentPath === '/') {
        setView('landing');
      } else {
        const expectedPath = ROLE_PRIMARY_PATHS[userRole] || '/mitra-tani/dashboard';
        window.history.replaceState({ view: userRole }, '', expectedPath);
        setView(userRole);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = useCallback((role, userData) => {
    let resolvedRole = role === 'company' ? 'corporate' : role;
    if (userData) {
      const normalizedUser = {
        ...userData,
        role: userData.role === 'company' ? 'corporate' : userData.role
      };
      setCurrentUser(normalizedUser);
      resolvedRole = normalizedUser.role;
    }
    handleNavigate(resolvedRole);
  }, [handleNavigate]);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    setCurrentUser(null);
    window.history.replaceState({ view: 'auth' }, '', '/login');
    setView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
            currentUser={currentUser}
            onLogout={handleLogout}
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
            currentUser={currentUser}
            onLogout={handleLogout}
            totalRetired={totalRetired}
            onRetire={handleRetire}
            onBack={() => handleNavigate('landing')}
            onNavigateRole={(target) => handleNavigate(target)}
          />
        )}
        {view === 'surveyor' && (
          <SurveyorWorkspace
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateRole={(target) => handleNavigate(target)}
            onBack={() => handleNavigate('landing')}
          />
        )}
        {view === 'admin' && (
          <AdminWorkspace
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigateRole={(target) => handleNavigate(target)}
          />
        )}
      </div>
    </div>
  );
}

