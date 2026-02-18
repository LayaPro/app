import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/index.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { NotificationPanel } from './components/panels/NotificationPanel.js';
import { ProfilePanel } from './components/panels/ProfilePanel.js';
import { MobileMenuDrawer } from './components/panels/MobileMenuDrawer.js';
import { Login } from './components/auth/Login.js';
import { ROUTES } from './utils/constants.js';
import { ToastProvider } from './context/ToastContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { ToastContainer } from './components/ui/ToastContainer.js';
import { GoogleCallback } from './pages/GoogleCallback/index.js';

// Page imports
import Dashboard from './pages/Dashboard/index.js';
import Albums from './pages/Albums/index.js';
import Projects from './pages/Projects/index.js';
import Proposals from './pages/Proposals/index.js';
import FinancesLayout from './pages/Finances/FinancesLayout.js';
import FinancesOverview from './pages/Finances/FinancesOverview.js';
import FinancesCustomers from './pages/Finances/FinancesCustomers.js';
import FinancesTeamMembers from './pages/Finances/FinancesTeamMembers.js';
import FinancesExpenses from './pages/Finances/FinancesExpenses.js';
import Calendar from './pages/Calendar/index.js';
import Statistics from './pages/Statistics/index.js';
import Settings from './pages/Settings/index.js';
import AuditTrail from './pages/AuditTrail/index.js';
import SetupPassword from './pages/SetupPassword/SetupPassword.js';
import Todos from './pages/Todos/index.js';

// Access Control pages
import AccessManagement from './pages/AccessManagement/index.js';
import Users from './pages/Users/index.js';
import Roles from './pages/Roles/index.js';
import Tenants from './pages/Tenants/index.js';

// Team pages
import TeamMembers from './pages/TeamMembers/index.js';
import Designations from './pages/Designations/index.js';
import Equipments from './pages/Equipments/index.js';

// Workflow Setup pages
import EventsSetup from './pages/EventsSetup/index.js';
import GallerySetup from './pages/GallerySetup/index.js';
import ProjectsSetup from './pages/ProjectsSetup/index.js';
import { useEffect, useState } from 'react';
import { useAppDispatch } from './store/index.js';
import { setCredentials } from './store/slices/authSlice.js';

// Organization page
import Organization from './pages/Organization/index.js';

// Storage page
import Storage from './pages/Storage/index.js';

// Search Results page
import SearchResults from './pages/SearchResults/index.js';

function App() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for auth data in URL parameters (from marketing site redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const tenantId = params.get('tenantId');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Clear any existing auth data first
        localStorage.clear();
        sessionStorage.clear();
        
        // Store new auth data in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', userStr);
        if (tenantId) {
          localStorage.setItem('tenantId', tenantId);
        }

        // Update Redux state
        dispatch(setCredentials({ user, token }));

        // Clean up URL and force reload to ensure fresh state
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
      } catch (error) {
        console.error('Failed to parse auth data from URL:', error);
        setIsCheckingAuth(false);
      }
    } else {
      setIsCheckingAuth(false);
    }
  }, [dispatch]);

  // Show loading while checking for auth data in URL
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Public routes (no auth required)
  const PublicRoutes = () => (
    <Routes>
      <Route path="/setup-password" element={<SetupPassword />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="*" element={<Login />} />
    </Routes>
  );

  // Show public routes if not authenticated
  if (!isAuthenticated) {
    return <PublicRoutes />;
  }

  // Show main app if authenticated
  return (
    <ToastProvider>
      <NotificationProvider>
        <div>
          <Header />
          <Sidebar />
          <NotificationPanel />
          <ProfilePanel />
          <MobileMenuDrawer />
          <ToastContainer />
        
        {/* Main Content Area */}
        <main
        style={{
          marginLeft: window.innerWidth >= 1025 ? (sidebarCollapsed ? '80px' : '256px') 
                   : window.innerWidth >= 769 ? (sidebarCollapsed ? '80px' : '200px') 
                   : '0',
          marginTop: '80px',
          padding: window.innerWidth >= 640 ? '4px 24px 24px' : '4px 16px 16px',
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="/login" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path="/todos" element={<Todos />} />
          <Route path={ROUTES.ALBUMS} element={<Albums />} />
          <Route path={ROUTES.PROJECTS} element={<Projects />} />
          <Route path="/projects/:id" element={<Projects />} />
          <Route path={ROUTES.PROPOSALS} element={<Proposals />} />
          <Route path="/proposals/:id" element={<Proposals />} />
          
          {/* Finances routes with nested sub-routes */}
          <Route path={ROUTES.FINANCES} element={<FinancesLayout />}>
            <Route path={ROUTES.FINANCES_OVERVIEW} element={<FinancesOverview />} />
            <Route path={ROUTES.FINANCES_CUSTOMERS} element={<FinancesCustomers />} />
            <Route path={ROUTES.FINANCES_TEAM_MEMBERS} element={<FinancesTeamMembers />} />
            <Route path={ROUTES.FINANCES_EXPENSES} element={<FinancesExpenses />} />
          </Route>
          
          <Route path={ROUTES.CALENDAR} element={<Calendar />} />
          <Route path={ROUTES.STATISTICS} element={<Statistics />} />
          
          {/* Access Control routes */}
          <Route path={ROUTES.ACCESS_MANAGEMENT} element={<AccessManagement />} />
          <Route path={ROUTES.USERS} element={<Users />} />
          <Route path={ROUTES.ROLES} element={<Roles />} />
          <Route path={ROUTES.TENANTS} element={<Tenants />} />
          
          {/* Team routes */}
          <Route path={ROUTES.TEAM_MEMBERS} element={<TeamMembers />} />
          <Route path={ROUTES.DESIGNATIONS} element={<Designations />} />
          <Route path={ROUTES.EQUIPMENTS} element={<Equipments />} />
          
          {/* Workflow Setup */}
          <Route path={ROUTES.EVENTS_SETUP} element={<EventsSetup />} />
          <Route path={ROUTES.GALLERY_SETUP} element={<GallerySetup />} />
          <Route path={ROUTES.PROJECTS_SETUP} element={<ProjectsSetup />} />
          
          {/* Organization */}
          <Route path={ROUTES.ORGANIZATION} element={<Organization />} />
          
          {/* Search Results */}
          <Route path="/search" element={<SearchResults />} />
          
          <Route path={ROUTES.STORAGE} element={<Storage />} />
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
          <Route path={ROUTES.AUDIT_TRAIL} element={<AuditTrail />} />
          
          {/* Catch-all: redirect to dashboard */}
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </main>
        </div>
      </NotificationProvider>
    </ToastProvider>
  );
}

export default App;


