// Features and logic by Wajihi Ramadan (JeehTech)
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Footer from './Footer';
import { useSettings } from '../context/SettingsContext';

export default function Layout() {
  const location = useLocation();
  const { settings } = useSettings();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Determine title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('products')) return 'Products';
    if (path.includes('users')) return 'Users';
    if (path.includes('settings')) return 'System Settings';
    return 'Dashboard';
  };

  const pageTitle = getPageTitle();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-card)' }}>
      <Helmet>
        <title>{settings.companyName} - {pageTitle}</title>
      </Helmet>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Topbar floating effect */}
        <Topbar title={pageTitle} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

        <main style={{
          flex: 1,
          padding: '2rem',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
          marginTop: '1rem',
          boxSizing: 'border-box'
        }}>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
