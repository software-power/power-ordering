import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PageTitle from '../components/PageTitle';
import DataTableComponent from '../components/DataTable';
import { useSettings } from '../context/SettingsContext';

export default function OrderHistory() {
    const { state } = useAuth();
    const { settings } = useSettings();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (state.accessToken) fetchOrders();
    }, [state.accessToken]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${settings.apiBaseUrl}/orders`, {
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) setOrders(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const columns = [
        { name: 'Order #', selector: (row) => row.order_number, sortable: true },
        { name: 'Date', selector: (row) => new Date(row.order_date).toLocaleDateString(), sortable: true },
        { name: 'Total', selector: (row) => `TZS ${row.total_amount}`, sortable: true },
        {
            name: 'Status', selector: (row) => row.status, sortable: true,
            cell: (row) => (
                <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                    backgroundColor: row.status === 'Posted to Tally' ? '#dcfce7' : '#f3f4f6',
                    color: row.status === 'Posted to Tally' ? '#166534' : '#1f2937'
                }}>
                    {row.status}
                </span>
            )
        },
        { name: 'Tally Voucher', selector: (row) => row.tally_voucher_number || '-', sortable: true }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <PageTitle title="My Orders" />
                <a href="/catalogue" style={{
                    backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
                    borderRadius: '0.375rem', textDecoration: 'none', fontWeight: 500
                }}>
                    + Create New Order
                </a>
            </div>
            <DataTableComponent
                title="Recent Orders"
                columns={columns}
                data={orders}
                loading={loading}
            />
        </div>
    );
}
