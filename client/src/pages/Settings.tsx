// Features and logic by Wajihi Ramadan (JeehTech)
import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import toast from 'react-hot-toast';
import PageTitle from '../components/PageTitle';

import { useAuth } from '../auth/AuthContext';

export default function Settings() {
    const { state } = useAuth();
    const { settings, updateSettings, saveSettingsToServer, loading } = useSettings();
    const [activeTab, setActiveTab] = useState<'company' | 'api' | 'defaults' | 'tally'>('company');
    const [tallyConfig, setTallyConfig] = useState({
        tally_url: '',
        tally_port: '',
        tally_sales_ledger: '',
        default_price_level: 'Standard'
    });
    const [userRole, setUserRole] = useState<number | null>(null);
    const [parentId, setParentId] = useState<number | null>(null);
    const [testingTally, setTestingTally] = useState(false);

    // Fetch user profile for Tally Config
    useEffect(() => {
        if (!state.accessToken) return;
        fetch(`${settings.apiBaseUrl}/auth/profile`, {
            headers: { Authorization: `Bearer ${state.accessToken}` }
        })
            .then(res => res.json())
            .then(data => {
                setUserRole(data.role_id);
                setParentId(data.parent_id);
                setTallyConfig({
                    tally_url: data.tally_url || 'http://localhost',
                    tally_port: data.tally_port || '9000',
                    tally_sales_ledger: data.tally_sales_ledger || '',
                    default_price_level: data.default_price_level || 'Standard'
                });

                // Set default tab based on role
                if (data.role_id === 1) setActiveTab('company');
                else if (!data.parent_id) setActiveTab('tally'); // Main Tally User
                else setActiveTab('api'); // Employee
            })
            .catch(console.error);
    }, [state.accessToken, settings.apiBaseUrl]);

    const handleTestTally = async () => {
        setTestingTally(true);
        try {
            const res = await fetch(`${settings.apiBaseUrl}/tally/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(tallyConfig)
            });
            const data = await res.json();
            if (res.ok) toast.success(data.message);
            else toast.error(data.message);
        } catch (e) {
            toast.error('Connection Failed');
        } finally {
            setTestingTally(false);
        }
    };

    const handleSaveTally = async () => {
        if (!state.user) return;
        // Update user profile with new Tally config
        try {
            const res = await fetch(`${settings.apiBaseUrl}/users/${state.user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(tallyConfig)
            });
            if (res.ok) toast.success('Tally Configuration Saved');
            else toast.error('Failed to save configuration');
        } catch (e) {
            toast.error('Error saving configuration');
        }
    };

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
            <PageTitle title="Settings" />
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                {userRole === 1 && (
                    <>
                        <TabButton active={activeTab === 'company'} onClick={() => setActiveTab('company')}>Company Settings</TabButton>
                        <TabButton active={activeTab === 'defaults'} onClick={() => setActiveTab('defaults')}>Defaults</TabButton>
                        <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')}>API Endpoints</TabButton>
                    </>
                )}

                {/* Show Tally tab for Main Tally Users (No parent) or Admin */}
                {(userRole === 1 || !parentId) && (
                    <TabButton active={activeTab === 'tally'} onClick={() => setActiveTab('tally')}>Tally Integration</TabButton>
                )}
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

                {activeTab === 'tally' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', color: '#0369a1' }}>
                            Configure your local Tally Prime instance connection. Ensure Tally is running and ODBC Server is enabled.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label>Tally URL</label>
                                <input
                                    className="form-input"
                                    value={tallyConfig.tally_url}
                                    onChange={(e) => setTallyConfig({ ...tallyConfig, tally_url: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tally Port</label>
                                <input
                                    className="form-input"
                                    value={tallyConfig.tally_port}
                                    onChange={(e) => setTallyConfig({ ...tallyConfig, tally_port: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Sales Ledger</label>
                                <input
                                    className="form-input"
                                    value={tallyConfig.tally_sales_ledger || ''}
                                    onChange={(e) => setTallyConfig({ ...tallyConfig, tally_sales_ledger: e.target.value })}
                                    placeholder="e.g. Sales Account"
                                />
                            </div>
                            <div className="form-group">
                                <label>Default Price Level</label>
                                <select
                                    className="form-input"
                                    value={tallyConfig.default_price_level || 'Standard'}
                                    onChange={(e) => setTallyConfig({ ...tallyConfig, default_price_level: e.target.value })}
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Wholesale">Wholesale</option>
                                    <option value="Retail">Retail</option>
                                    <option value="Distributor">Distributor</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="submit-btn"
                                style={{ backgroundColor: '#64748b', width: 'auto' }}
                                onClick={handleTestTally}
                                disabled={testingTally}
                            >
                                {testingTally ? 'Testing...' : 'Test Connection'}
                            </button>
                            <button
                                className="submit-btn"
                                style={{ width: 'auto' }}
                                onClick={handleSaveTally}
                            >
                                Save Configuration
                            </button>
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

            {/* Global Save button - hide on Tally tab as it has its own Save Configuration button */}
            {activeTab !== 'tally' && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', textAlign: 'right' }}>
                    <button className="submit-btn" style={{ width: 'auto', padding: '0.75rem 2rem' }} onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            )}
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
