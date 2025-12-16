import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';

interface PageTitleProps {
    title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
    const { settings } = useSettings();

    return (
        <Helmet>
            <title>{title} - {settings.companyName}</title>
        </Helmet>
    );
}
