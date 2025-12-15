// Features and logic by Wajihi Ramadan (JeehTech)
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeContextType = {
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [primaryColor, setPrimaryColorState] = useState(() => {
        return localStorage.getItem('theme-primary') || '#4f46e5';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--primary', primaryColor);
        // Calculate hover color (slightly darker)
        // Simple heuristic: reduce lightness or just use same for now, 
        // but ideally we'd manipulate HSL. For now let's just stick to the main color 
        // and rely on CSS opacity or calc if needed. 
        // Or we can just set one var.
        localStorage.setItem('theme-primary', primaryColor);
    }, [primaryColor]);

    const setPrimaryColor = (color: string) => {
        setPrimaryColorState(color);
    };

    return (
        <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
