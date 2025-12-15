// Features and logic by Wajihi Ramadan (JeehTech)
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';

type Settings = {
    companyName: string;
    logoUrl: string;
    faviconUrl: string;
    currency: string;
    country: string;
    defaultSalesPerson: string;
    apiBaseUrl: string;
    themePrimaryColor: string;
};

type SettingsContextType = {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    saveSettingsToServer: () => Promise<void>;
    loading: boolean;
};

const defaultSettings: Settings = {
    companyName: 'PowerApp',
    logoUrl: '',
    faviconUrl: '',
    currency: 'USD',
    country: 'USA',
    defaultSalesPerson: '',
    apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    themePrimaryColor: '#4f46e5'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { state } = useAuth();
    const [settings, setSettingsState] = useState<Settings>(() => {
        const saved = localStorage.getItem('app-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });
    const [loading, setLoading] = useState(false);

    // Fetch settings from server on mount or when token changes
    useEffect(() => {
        async function fetchSettings() {
            if (!state.accessToken) return;

            try {
                const res = await fetch(`${settings.apiBaseUrl}/settings`, {
                    headers: { Authorization: `Bearer ${state.accessToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        // Map snake_case to camelCase if needed, or adjust type
                        const mapped: Settings = {
                            companyName: data.company_name || settings.companyName,
                            logoUrl: data.logo_url || settings.logoUrl,
                            faviconUrl: data.favicon_url || settings.faviconUrl,
                            currency: data.currency || settings.currency,
                            country: data.country || settings.country,
                            defaultSalesPerson: data.default_sales_person || settings.defaultSalesPerson,
                            apiBaseUrl: settings.apiBaseUrl, // Assume apiBaseUrl is client-local config usually
                            themePrimaryColor: data.theme_primary_color || settings.themePrimaryColor
                        };
                        setSettingsState(prev => ({ ...prev, ...mapped }));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch settings", e);
            }
        }
        fetchSettings();
    }, [state.accessToken, settings.apiBaseUrl]);

    // Sync to local storage and update Favicon/Theme
    useEffect(() => {
        localStorage.setItem('app-settings', JSON.stringify(settings));

        // Update Favicon
        if (settings.faviconUrl) {
            const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = settings.faviconUrl;
            document.getElementsByTagName('head')[0].appendChild(link);
        }

        // Update Theme Color
        if (settings.themePrimaryColor) {
            document.documentElement.style.setProperty('--primary', settings.themePrimaryColor);
        }
    }, [settings]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettingsState(prev => ({ ...prev, ...newSettings }));
    };

    const saveSettingsToServer = async () => {
        setLoading(true);
        try {
            // Map to snake_case for server
            const payload = {
                company_name: settings.companyName,
                logo_url: settings.logoUrl,
                favicon_url: settings.faviconUrl,
                currency: settings.currency,
                country: settings.country,
                default_sales_person: settings.defaultSalesPerson,
                theme_primary_color: settings.themePrimaryColor
            };

            const res = await fetch(`${settings.apiBaseUrl}/settings/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save settings');
            toast.success('Settings saved to server!');
        } catch (e) {
            console.error(e);
            toast.error('Error saving settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, saveSettingsToServer, loading }}>
            <HelmetProvider>
                <Helmet>
                    <title>{settings.companyName} - Dashboard</title>
                </Helmet>
                {children}
            </HelmetProvider>
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
