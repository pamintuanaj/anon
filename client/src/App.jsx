import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import GlobalNavigation from './components/organisms/GlobalNavigation.jsx'
import DemoNotice from './components/DemoNotice.jsx'
import Splash from './components/organisms/Splash.jsx'
import CommunityHub from './pages/CommunityHub.jsx'
import TrackerPage from './pages/TrackerPage.jsx'
import TrackerPicker from './pages/TrackerPicker.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import StashPage from './pages/StashPage.jsx'
import ToolsPage from './pages/ToolsPage.jsx'
import MiniCounterPage from './pages/MiniCounterPage.jsx'
import ThemeToggle from './components/molecules/ThemeToggle.jsx'
import Footer from './components/organisms/Footer.jsx'
import Logo from './components/atoms/Logo.jsx'
import NotFound from './pages/NotFound.jsx'
import { useZen } from './context/ZenContext.jsx'
import styles from './App.module.css'

export default function App() {
  const { isZenMode } = useZen()
  const location = useLocation()

  // The mini counter is a bare page for a small window: no navigation at all.
  if (location.pathname.startsWith('/mini/')) {
    return (
      <Routes>
        <Route path="/mini/:id" element={<MiniCounterPage />} />
      </Routes>
    )
  }

  return (
    <div className={`${styles.shell} ${isZenMode ? styles.zen : ''}`}>
      <Splash />
      {!isZenMode && <GlobalNavigation />}
      <div className={styles.column}>
        {!isZenMode && (
          <header className={styles.mobileBar}>
            <span className={styles.mobileBrand}><Logo size={30} title="" /> CrocheTa</span>
            <ThemeToggle compact />
          </header>
        )}
        {/* key = the address, so every page change replays the enter animation */}
        <main className={`${styles.main} enter`} key={location.pathname}>
          {!isZenMode && <DemoNotice />}
          <Routes>
            <Route path="/" element={<CommunityHub />} />
            <Route path="/workspace" element={<TrackerPicker />} />
            <Route path="/workspace/:id" element={<TrackerPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/inventory" element={<StashPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/guide" element={<Navigate to="/tools" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!isZenMode && <Footer />}
        </main>
      </div>
    </div>
  )
}
