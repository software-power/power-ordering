import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PageTitle from '../components/PageTitle';
import DataTableComponent from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

export default function PriceLevelsMaster() {
    const { state } = useAuth();
    const { settings } = useSettings();
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({ name: '', syncToTally: false });

    useEffect(() => {
        if (state.accessToken) fetchLevels();
    }, [state.accessToken]);

    const fetchLevels = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${settings.apiBaseUrl}/masters/price-levels`, {
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) setLevels(await res.json());
        } catch (e) {
            console.error(e);
            toast.error("Failed to load price levels");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${settings.apiBaseUrl}/masters/price-levels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Price Level Created');
                if (formData.syncToTally) toast.success('Sync request queued');
                setIsModalOpen(false);
                setFormData({ name: '', syncToTally: false });
                fetchLevels();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to create');
            }
        } catch (e) {
            toast.error('Error creating price level');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            const res = await fetch(`${settings.apiBaseUrl}/masters/price-levels/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) {
                toast.success('Price Level Deleted');
                fetchLevels();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to delete');
            }
        } catch (e) {
            toast.error('Error deleting');
        }
    };

    const columns = [
        { name: 'Name', selector: (row: any) => row.name, sortable: true },
        {
            name: 'Status',
            selector: (row: any) => row.is_standard ? 'System Standard' : 'Custom',
            sortable: true
        },
        { name: 'Sync Status', selector: (row: any) => row.sync_status || '-', sortable: true },
        {
            name: 'Actions',
            cell: (row: any) => !row.is_standard && (
                <button
                    onClick={() => handleDelete(row.id)}
                    style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                    <Trash2 size={18} />
                </button>
            )
        }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <PageTitle title="Price Levels Master" />

            <DataTableComponent
                title="Price Levels"
                columns={columns}
                data={levels}
                loading={loading}
                actions={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
                            borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        <Plus size={18} /> Add Price Level
                    </button>
                }
            />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Price Level">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                        <input
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Distributor Price"
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            checked={formData.syncToTally}
                            onChange={e => setFormData({ ...formData, syncToTally: e.target.checked })}
                            id="syncCheck"
                        />
                        <label htmlFor="syncCheck" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Sync to Tally (Create in Tally)?</label>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button type="submit" className="submit-btn" style={{ width: 'auto' }}>Create</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
