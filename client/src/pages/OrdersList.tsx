
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DataTableComponent from '../components/DataTable';
import PageTitle from '../components/PageTitle';
import { useSettings } from '../context/SettingsContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Upload } from 'lucide-react';
import { usePermission } from '../rbac/usePermission';

export default function OrdersList() {
    const { state } = useAuth();
    const { settings } = useSettings();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ customer_name: '', amount: '' });
    const [syncing, setSyncing] = useState(false);
    const isAdmin = state.user?.role_id === 1;
    const canView = usePermission('order.view');
    const canAdd = usePermission('order.add');
    const canSync = usePermission('order.sync_to_tally');

    useEffect(() => {
        if (canView && state.accessToken) fetchOrders();
    }, [canView, state.accessToken]);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${settings.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success('Order Created');
                setIsModalOpen(false);
                fetchOrders();
            }
        } catch (e) { toast.error('Failed to create order'); }
    };

    const handleSyncToTally = async () => {
        setSyncing(true);
        try {
            const res = await fetch(`${settings.apiBaseUrl}/tally/orders/sync`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) {
                toast.success('Orders synced to Tally successfully');
                fetchOrders();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to sync orders');
            }
        } catch (e) {
            toast.error('Error syncing orders to Tally');
        } finally {
            setSyncing(false);
        }
    };

    const columns: any[] = [
        { name: 'ID', selector: (row: any) => row.id, sortable: true, width: '80px' },
        { name: 'Customer', selector: (row: any) => row.customer_name, sortable: true },
        { name: 'Amount', selector: (row: any) => row.amount, sortable: true },
    ];

    if (isAdmin) {
        columns.push({ name: 'Owner', selector: (row: any) => row.owner_name, sortable: true });
    }

    columns.push(
        {
            name: 'Status', selector: (row: any) => row.status, sortable: true, cell: (row: any) => (
                <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                    backgroundColor: row.status === 'Synced' ? '#dcfce7' : '#fef9c3',
                    color: row.status === 'Synced' ? '#166534' : '#854d0e'
                }}>
                    {row.status}
                </span>
            )
        },
        { name: 'Date', selector: (row: any) => new Date(row.order_date).toLocaleDateString(), sortable: true }
    );

    if (!canView) {
        return (
            <div style={{ padding: '2rem' }}>
                <PageTitle title="Orders" />
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <p>You don't have permission to view orders.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Please contact your administrator.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <PageTitle title="Orders" />
            <DataTableComponent
                title="Orders"
                columns={columns}
                data={orders}
                loading={loading}
                actions={
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canSync && (
                            <button
                                onClick={handleSyncToTally}
                                disabled={syncing}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    backgroundColor: '#f59e0b', color: 'white', padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem', border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
                                    fontWeight: 500, outline: 'none', opacity: syncing ? 0.6 : 1
                                }}
                            >
                                <Upload size={18} />
                                {syncing ? 'Syncing...' : 'Sync to Tally'}
                            </button>
                        )}
                        {canAdd && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                                    fontWeight: 500, outline: 'none'
                                }}
                            >
                                <Plus size={18} />
                                Create Order
                            </button>
                        )}
                    </div>
                }
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Order">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Customer Name</label>
                        <input
                            className="form-input"
                            value={formData.customer_name}
                            onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Amount</label>
                        <input
                            className="form-input"
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button type="submit" className="submit-btn" style={{ width: 'auto' }}>Save Order</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
