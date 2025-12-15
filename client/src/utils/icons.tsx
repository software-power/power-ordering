// Features and logic by Wajihi Ramadan (JeehTech)
import {
    Home,
    Package,
    Users,
    Settings,
    Box,
    FileText,
    PieChart,
    Globe
} from 'lucide-react';

const iconMap: Record<string, any> = {
    'home': Home,
    'dashboard': Home,
    'products': Package,
    'users': Users,
    'settings': Settings,
    'box': Box,
    'file': FileText,
    'chart': PieChart,
    'globe': Globe,
    // Map common FA icons for compatibility
    'fa fa-home': Home,
    'fa fa-box': Package,
    'fa fa-users': Users,
    'fa fa-cog': Settings
};

export const getIcon = (name: string, props: any = {}) => {
    const IconComponent = iconMap[name.toLowerCase()] || iconMap['box']; // Default to Box
    return <IconComponent {...props} />;
};
