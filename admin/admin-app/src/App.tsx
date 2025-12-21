import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/index.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { NotificationPanel } from './components/panels/NotificationPanel.js';
import { ProfilePanel } from './components/panels/ProfilePanel.js';
import { MobileMenuDrawer } from './components/panels/MobileMenuDrawer.js';
import { Login } from './components/auth/Login.js';
import { ROUTES } from './utils/constants.js';

// Page imports
import Dashboard from './pages/Dashboard.js';
import Albums from './pages/Albums.js';
import Projects from './pages/Projects.js';
import Finances from './pages/Finances.js';
import Calendar from './pages/Calendar.js';
import Statistics from './pages/Statistics.js';
import Settings from './pages/Settings.js';

// Access Control pages
import Users from './pages/Users.js';
import Roles from './pages/Roles.js';
import Tenants from './pages/Tenants.js';

// Team pages
import TeamMembers from './pages/TeamMembers.js';
import Designations from './pages/Designations.js';
import Equipments from './pages/Equipments.js';

// Workflow pages
import ProjectTypes from './pages/ProjectTypes.js';
import ProjectStatus from './pages/ProjectStatus.js';
import EventTypes from './pages/EventTypes.js';
import DeliveryStatus from './pages/DeliveryStatus.js';

function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <div>
      <Header />
      <Sidebar />
      <NotificationPanel />
      <ProfilePanel />
      <MobileMenuDrawer />
      
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
          <Route path={ROUTES.USERS} element={<Users />} />
          <Route path={ROUTES.ROLES} element={<Roles />} />
          <Route path={ROUTES.TENANTS} element={<Tenants />} />
          
          {/* Team routes */}
          <Route path={ROUTES.TEAM_MEMBERS} element={<TeamMembers />} />
          <Route path={ROUTES.DESIGNATIONS} element={<Designations />} />
          <Route path={ROUTES.EQUIPMENTS} element={<Equipments />} />
          
          {/* Workflow routes */}
          <Route path={ROUTES.PROJECT_TYPES} element={<ProjectTypes />} />
          <Route path={ROUTES.PROJECT_STATUS} element={<ProjectStatus />} />
          <Route path={ROUTES.EVENT_TYPES} element={<EventTypes />} />
          <Route path={ROUTES.DELIVERY_STATUS} element={<DeliveryStatus />} />
          
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;


