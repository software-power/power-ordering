// Features and logic by Wajihi Ramadan (JeehTech)
import { useAuth } from '../auth/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useState } from 'react';
import { LogOut, Palette, User, Menu } from 'lucide-react';
import ThemeSettings from './ThemeSettings';

export default function Topbar({ title, onToggleSidebar }: { title: string, onToggleSidebar: () => void }) {
    const { state, logout } = useAuth();
    const { settings } = useSettings();
    const [showThemeSettings, setShowThemeSettings] = useState(false);

    return (
        <header style={{
            height: '70px',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={onToggleSidebar}
                    className="lg-hidden"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: 0, display: 'flex' }}
                >
                    <Menu size={24} />
                </button>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                    {title}
                </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowThemeSettings(!showThemeSettings)}
                        title="Change Theme Color"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            padding: 8,
                            borderRadius: '50%',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Palette size={20} />
                    </button>
                    {showThemeSettings && <ThemeSettings onClose={() => setShowThemeSettings(false)} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600
                    }}>
                        {state.user?.email.charAt(0).toUpperCase()}
                    </div>

                    <button
                        onClick={logout}
                        title="Logout"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            padding: 8
                        }}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
}
