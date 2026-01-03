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
import { ToastContainer } from './components/ui/ToastContainer.js';

// Page imports
import Dashboard from './pages/Dashboard/index.js';
import Albums from './pages/Albums/index.js';
import Projects from './pages/Projects/index.js';
import Finances from './pages/Finances/index.js';
import Calendar from './pages/Calendar/index.js';
import Statistics from './pages/Statistics/index.js';
import Settings from './pages/Settings/index.js';
import SetupPassword from './pages/SetupPassword/SetupPassword.js';

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

function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  // Public routes (no auth required)
  const PublicRoutes = () => (
    <Routes>
      <Route path="/setup-password" element={<SetupPassword />} />
      <Route path="/login" element={<Login />} />
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
          padding: window.innerWidth >= 640 ? '24px' : '16px',
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.ALBUMS} element={<Albums />} />
          <Route path={ROUTES.PROJECTS} element={<Projects />} />
          <Route path={ROUTES.FINANCES} element={<Finances />} />
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
          
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
        </Routes>
      </main>
      </div>
    </ToastProvider>
  );
}

export default App;


