// Features and logic by Wajihi Ramadan (JeehTech)
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getIcon } from '../utils/icons';
import { useSettings } from '../context/SettingsContext';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

type Submenu = { id: number; name: string; path: string };
type Menu = { id: number; name: string; icon?: string; path?: string; children?: Submenu[] };

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { state } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [expandedMenuIds, setExpandedMenuIds] = useState<number[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${settings.apiBaseUrl}/menus/my`, {
          headers: { Authorization: `Bearer ${state.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setMenus(data);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      // Fallback
      setMenus([
        { id: 1, name: 'Dashboard', path: '/dashboard', icon: 'home' },
        {
          id: 2,
          name: 'Products',
          icon: 'box',
          children: [
            { id: 21, name: 'All Products', path: '/products/list' },
            { id: 22, name: 'Categories', path: '/products/categories' }
          ]
        },
        { id: 3, name: 'Users', path: '/users/list', icon: 'users' },
        { id: 4, name: 'Roles', path: '/roles/list', icon: 'shield' },
        { id: 5, name: 'Settings', path: '/settings', icon: 'settings' },
      ]);
    }
    if (state.accessToken) load();
  }, [state.accessToken, settings.apiBaseUrl]);

  // Auto-expand menu if child is active
  useEffect(() => {
    if (menus.length > 0) {
      menus.forEach(m => {
        if (m.children && m.children.some(c => location.pathname === c.path)) {
          setExpandedMenuIds(prev => prev.includes(m.id) ? prev : [...prev, m.id]);
        }
      });
    }
  }, [location.pathname, menus]);

  // Handle Menu Click
  const handleMenuClick = (m: Menu) => {
    if (m.children && m.children.length > 0) {
      // Toggle Expansion
      setExpandedMenuIds(prev =>
        prev.includes(m.id)
          ? prev.filter(id => id !== m.id)
          : [...prev, m.id]
      );
    } else if (m.path) {
      navigate(m.path);
      onClose();
    }
  };

  const isExpanded = (id: number) => expandedMenuIds.includes(id);

  const isActive = (path?: string) => path && location.pathname === path;
  const isChildActive = (children?: Submenu[]) => children?.some(c => location.pathname === c.path);

  return (
    <>
      <div
        onClick={onClose}
        className={`lg-hidden ${isOpen ? 'fixed' : 'hidden'}`}
        style={{ inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
      />

      <nav
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          backgroundColor: '#0f172a',
          color: '#abb9e8',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.3s ease-in-out',
          width: '260px',
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '40px', maxWidth: '100%' }} />
            ) : (
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0 }}>
                {settings.companyName.substring(0, 10).toUpperCase()}
              </h1>
            )}
          </div>
          <button onClick={onClose} className="lg-hidden" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: '#6d788d', marginBottom: '1rem' }}>Menu</p>

          {menus.map(m => {
            const hasChildren = m.children && m.children.length > 0;
            const expanded = isExpanded(m.id);
            // Active if path matches OR if any child is active
            const active = isActive(m.path) || (hasChildren && isChildActive(m.children));

            return (
              <div key={m.id} style={{ marginBottom: '0.25rem' }}>
                <div
                  onClick={() => handleMenuClick(m)}
                  className="nav-item"
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: active ? 'white' : 'inherit',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getIcon(m.icon || 'circle', { size: 18 })}
                    <span style={{ fontSize: '0.93rem', fontWeight: active ? 600 : 400 }}>{m.name}</span>
                  </div>
                  {hasChildren && (
                    <span style={{ color: active ? 'white' : '#6d788d' }}>
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  )}
                </div>

                {hasChildren && expanded && (
                  <div className="fade-in" style={{ marginLeft: '1rem', marginTop: '0.25rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
                    {m.children!.map(sm => (
                      <div
                        key={sm.id}
                        onClick={() => { navigate(sm.path); onClose(); }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: location.pathname === sm.path ? 'white' : '#8898aa',
                          fontWeight: location.pathname === sm.path ? 600 : 400,
                          transition: 'color 0.2s'
                        }}
                      >
                        {sm.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
