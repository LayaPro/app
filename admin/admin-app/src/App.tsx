
import { Header } from './components/layout/Header.js'
import { NotificationPanel } from './components/panels/NotificationPanel.js'
import { ProfilePanel } from './components/panels/ProfilePanel.js'
import { MobileMenuDrawer } from './components/panels/MobileMenuDrawer.js'

function App() {
  return (
    <div>
      <Header />
      <NotificationPanel />
      <ProfilePanel />
      <MobileMenuDrawer />
    </div>
  )
}

export default App

