import { useAppSelector } from './store/index.js';
import { Header } from './components/layout/Header.js';
import { NotificationPanel } from './components/panels/NotificationPanel.js';
import { ProfilePanel } from './components/panels/ProfilePanel.js';
import { MobileMenuDrawer } from './components/panels/MobileMenuDrawer.js';
import { Login } from './components/auth/Login.js';

function App() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <div>
      <Header />
      <NotificationPanel />
      <ProfilePanel />
      <MobileMenuDrawer />
    </div>
  );
}

export default App;

