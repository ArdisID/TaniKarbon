import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

export function getDashboardPathForRole(role) {
  if (role === 'surveyor') return '/surveyor/tugas';
  if (role === 'farmer') return '/mitra-tani';
  if (role === 'corporate' || role === 'company') return '/korporat';
  if (role === 'admin') return '/admin';
  return '/mitra-tani';
}

function matchesRolePath(path, prefixes) {
  const normalized = (path || '').toLowerCase();
  return prefixes.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

function isProtectedRoute(path) {
  return Object.values(PROTECTED_ROLES).some(prefixes => matchesRolePath(path, prefixes));
}

/**
 * GuestRoute: Melindungi halaman /login dan /register agar user yang sudah login
 * tidak bisa mengaksesnya (termasuk via tombol "Back" di browser).
 * Pengguna langsung dilempar (redirect) ke dashboard sesuai rolenya.
 */
export function GuestRoute({ children, currentUser }) {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  const user = currentUser || storedUser;

  if (token && user) {
    const role = user?.role === 'company' ? 'corporate' : user?.role;
    if (role === 'surveyor') {
      return <Navigate to="/surveyor/tugas" replace />;
    }
    if (role === 'farmer') {
      return <Navigate to="/mitra-tani" replace />;
    }
    if (role === 'corporate') {
      return <Navigate to="/korporat" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/mitra-tani" replace />;
  }

  return children;
}

/**
 * ProtectedRoute: Menjamin rute workspace hanya bisa diakses oleh user terautentikasi
 * dengan role yang sesuai. Mencegah unauthenticated access dan cross-role bypass.
 */
export function ProtectedRoute({ children, allowedRoles, currentUser }) {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  const user = currentUser || storedUser;

  if (!token || !user) {
    if (allowedRoles && allowedRoles.includes('surveyor')) {
      return <Navigate to="/surveyor/login" replace />;
    }
    if (allowedRoles && allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const role = user?.role === 'company' ? 'corporate' : user?.role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'surveyor') return <Navigate to="/surveyor/tugas" replace />;
    if (role === 'farmer') return <Navigate to="/mitra-tani" replace />;
    if (role === 'corporate') return <Navigate to="/korporat" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [authTab, setAuthTab] = useState('farmer');

  // Shared state
  const [walletBalance, setWalletBalance] = useState(0);
  const [trees, setTrees] = useState([...TREES_DATA]);
  const [totalRetired, setTotalRetired] = useState(2400);

  // Verifikasi sesi auth terhadap backend GET /api/v1/auth/me saat mount
  useEffect(() => {
    async function verifySession() {
      const token = getStoredToken();
      if (!token) return;

      try {
        const me = await getMe();
        if (!me) {
          // Token expired atau tidak valid
          clearAuthSession();
          setCurrentUser(null);
          const path = window.location.pathname.toLowerCase();
          if (isProtectedRoute(path)) {
            window.location.replace('/login');
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

    if (resolvedView === 'landing') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (resolvedView === 'auth' || resolvedView === 'login') {
      navigate('/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (resolvedView === 'register') {
      navigate('/register');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (resolvedView === 'surveyor_login') {
      navigate('/surveyor/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (resolvedView === 'admin_login') {
      navigate('/admin/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const dest = getDashboardPathForRole(resolvedView);
    navigate(dest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  // Handler saat login berhasil dengan history stack replacement (replace: true)
  const handleLogin = useCallback((role, userData) => {
    let resolvedRole = role === 'company' ? 'corporate' : role;
    if (userData) {
      const normalizedUser = {
        ...userData,
        role: userData.role === 'company' ? 'corporate' : userData.role,
      };
      setCurrentUser(normalizedUser);
      resolvedRole = normalizedUser.role;
    } else {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
        resolvedRole = stored.role;
      }
    }
    const targetPath = getDashboardPathForRole(resolvedRole);
    navigate(targetPath, { replace: true });
  }, [navigate]);

  // Handler Logout: Pembersihan total localStorage & hard redirect untuk membuang Workspace dari memori
  const handleLogout = useCallback(() => {
    clearAuthSession();
    setCurrentUser(null);
    window.location.replace('/login');
  }, []);

  const handleAddTree = useCallback((newTree) => {
    setTrees(prev => [...prev, newTree]);
  }, []);

  const handleRetire = useCallback((tons) => {
    setTotalRetired(prev => prev + tons);
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7F2] text-[#173829]">
      <Routes>
        <Route path="/" element={<LandingPage onNavigate={handleNavigate} />} />

        {/* Guest Routes: Terproteksi dari user yang sudah login */}
        <Route
          path="/login"
          element={
            <GuestRoute currentUser={currentUser}>
              <AuthGateway
                defaultTab={authTab}
                initialMode="login"
                onLogin={handleLogin}
                onBack={() => handleNavigate('landing')}
                onNavigateRole={(target) => handleNavigate(target)}
              />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute currentUser={currentUser}>
              <AuthGateway
                defaultTab={authTab}
                initialMode="register"
                onLogin={handleLogin}
                onBack={() => handleNavigate('landing')}
                onNavigateRole={(target) => handleNavigate(target)}
              />
            </GuestRoute>
          }
        />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/daftar" element={<Navigate to="/register" replace />} />

        <Route
          path="/surveyor/login"
          element={
            <GuestRoute currentUser={currentUser}>
              <SurveyorLoginView
                onLogin={handleLogin}
                onBack={() => handleNavigate('landing')}
                onNavigate={handleNavigate}
              />
            </GuestRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <GuestRoute currentUser={currentUser}>
              <AdminLoginView
                onLogin={handleLogin}
                onBack={() => handleNavigate('landing')}
                onNavigate={handleNavigate}
              />
            </GuestRoute>
          }
        />

        {/* Protected Routes: Portal Petani Mitra */}
        <Route
          path="/mitra-tani/*"
          element={
            <ProtectedRoute allowedRoles={['farmer']} currentUser={currentUser}>
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
            </ProtectedRoute>
          }
        />
        <Route path="/farmer" element={<Navigate to="/mitra-tani" replace />} />
        <Route path="/farmer/*" element={<Navigate to="/mitra-tani" replace />} />
        <Route path="/petani" element={<Navigate to="/mitra-tani" replace />} />
        <Route path="/petani/*" element={<Navigate to="/mitra-tani" replace />} />

        {/* Protected Routes: Portal Korporat / ESG */}
        <Route
          path="/korporat/*"
          element={
            <ProtectedRoute allowedRoles={['corporate']} currentUser={currentUser}>
              <CorporateMarketplace
                currentUser={currentUser}
                onLogout={handleLogout}
                totalRetired={totalRetired}
                onRetire={handleRetire}
                onBack={() => handleNavigate('landing')}
                onNavigateRole={(target) => handleNavigate(target)}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/corporate" element={<Navigate to="/korporat" replace />} />
        <Route path="/corporate/*" element={<Navigate to="/korporat" replace />} />
        <Route path="/b2b" element={<Navigate to="/korporat" replace />} />
        <Route path="/b2b/*" element={<Navigate to="/korporat" replace />} />

        {/* Protected Routes: Portal Surveyor Lapangan */}
        <Route
          path="/surveyor/*"
          element={
            <ProtectedRoute allowedRoles={['surveyor']} currentUser={currentUser}>
              <SurveyorWorkspace
                currentUser={currentUser}
                onLogout={handleLogout}
                onNavigateRole={(target) => handleNavigate(target)}
                onBack={() => handleNavigate('landing')}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/surveyor" element={<Navigate to="/surveyor/tugas" replace />} />
        <Route path="/petugas" element={<Navigate to="/surveyor/tugas" replace />} />
        <Route path="/petugas/*" element={<Navigate to="/surveyor/tugas" replace />} />
        <Route path="/verifier" element={<Navigate to="/surveyor/tugas" replace />} />
        <Route path="/verifier/*" element={<Navigate to="/surveyor/tugas" replace />} />

        {/* Protected Routes: Portal Admin Platform */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']} currentUser={currentUser}>
              <AdminWorkspace
                currentUser={currentUser}
                onLogout={handleLogout}
                onNavigateRole={(target) => handleNavigate(target)}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/authority" element={<Navigate to="/admin" replace />} />
        <Route path="/authority/*" element={<Navigate to="/admin" replace />} />
        <Route path="/manager" element={<Navigate to="/admin" replace />} />
        <Route path="/manager/*" element={<Navigate to="/admin" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

