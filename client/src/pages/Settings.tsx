// Features and logic by Wajihi Ramadan (JeehTech)
import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';

export default function Settings() {
    const { settings, updateSettings, saveSettingsToServer, loading } = useSettings();
    const [activeTab, setActiveTab] = useState<'company' | 'api' | 'defaults'>('company');

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logoUrl' | 'faviconUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast.error('File size too large. Max 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                updateSettings({ [key]: reader.result as string });
                toast.success(`${key === 'logoUrl' ? 'Logo' : 'Favicon'} updated!`);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        await saveSettingsToServer();
    };

    return (
        <div className="card-animate" style={{ padding: '0.5rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <TabButton active={activeTab === 'company'} onClick={() => setActiveTab('company')}>Company Settings</TabButton>
                <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')}>API Endpoints</TabButton>
                <TabButton active={activeTab === 'defaults'} onClick={() => setActiveTab('defaults')}>Defaults</TabButton>
            </div>

            <div className="fade-in">
                {activeTab === 'company' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Company Name</label>
                            <input
                                className="form-input"
                                value={settings.companyName}
                                onChange={(e) => updateSettings({ companyName: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Company Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" style={{ height: 48, objectFit: 'contain' }} />}
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                                </div>
                            </div>

                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Favicon</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon" style={{ width: 32, height: 32, objectFit: 'contain' }} />}
                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'faviconUrl')} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'api' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>API Base URL</label>
                            <input
                                className="form-input"
                                value={settings.apiBaseUrl}
                                onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Endpoint for all backend data requests.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'defaults' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Currency</label>
                            <select
                                className="form-input"
                                value={settings.currency}
                                onChange={(e) => updateSettings({ currency: e.target.value })}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="TZS">TZS (TSh)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Country</label>
                            <input
                                className="form-input"
                                value={settings.country}
                                onChange={(e) => updateSettings({ country: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Default Sales Person</label>
                            <input
                                className="form-input"
                                value={settings.defaultSalesPerson}
                                onChange={(e) => updateSettings({ defaultSalesPerson: e.target.value })}
                                placeholder="Name or ID"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', textAlign: 'right' }}>
                <button className="submit-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 600 : 500,
                padding: '1rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
            }}
        >
            {children}
        </button>
    );
}
