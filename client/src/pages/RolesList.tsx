import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../rbac/usePermission';
import Modal from '../components/Modal';
import DataTableComponent from '../components/DataTable';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Plus } from 'lucide-react';

import { useConfirm } from '../context/ConfirmContext';

export default function RolesList() {
    const { state } = useAuth();
    const confirm = useConfirm();
    const canView = usePermission('role.view');
    const canAdd = usePermission('role.add');
    const canEdit = usePermission('role.edit');
    const canDelete = usePermission('role.delete');

    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', status: 'active' });

    useEffect(() => {
        if (canView) fetchRoles();
    }, [canView, state.accessToken]);

    async function fetchRoles() {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/roles`, {
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            } else {
                toast.error('Failed to fetch roles');
            }
        } catch (error) {
            toast.error('Error loading roles');
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = (role: any) => {
        setEditingRole(role);
        setFormData({ name: role.name, status: role.status || 'active' });
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingRole(null);
        setFormData({ name: '', status: 'active' });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!await confirm({ title: 'Delete Role', message: 'Are you sure you want to delete this role?', danger: true })) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/roles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) {
                toast.success('Role deleted');
                fetchRoles();
            } else {
                toast.error('Failed to delete role');
            }
        } catch (e) {
            toast.error('Error deleting role');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error('Role name is required');

        const url = editingRole
            ? `${import.meta.env.VITE_API_URL}/roles/${editingRole.id}`
            : `${import.meta.env.VITE_API_URL}/roles`;

        const method = editingRole ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(`Role ${editingRole ? 'updated' : 'created'}`);
                setIsModalOpen(false);
                fetchRoles();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Operation failed');
            }
        } catch (e) {
            toast.error('Error saving role');
        }
    };

    const columns = [
        { name: 'ID', selector: (row: any) => row.id, sortable: true, width: '80px' },
        { name: 'Name', selector: (row: any) => row.name, sortable: true },
        {
            name: 'Status',
            selector: (row: any) => row.status,
            sortable: true,
            cell: (row: any) => (
                <span style={{
                    padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                    backgroundColor: row.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: row.status === 'active' ? '#4ade80' : '#f87171'
                }}>
                    {row.status}
                </span>
            )
        },
        {
            name: 'Actions',
            right: true,
            cell: (row: any) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {canEdit && (
                        <button
                            onClick={() => handleEdit(row)}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDelete(row.id)}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#ef4444', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    if (!canView) return <div style={{ padding: '2rem', color: 'white' }}>Permission denied</div>;

    return (
        <div style={{ padding: '2rem', color: '#e2e8f0' }}>
            <DataTableComponent
                title="Roles"
                columns={columns}
                data={roles}
                loading={loading}
                actions={
                    canAdd && (
                        <button
                            onClick={handleAdd}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
                                borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                                fontWeight: 500, outline: 'none'
                            }}
                        >
                            <Plus size={18} /> Create Role
                        </button>
                    )
                }
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRole ? 'Edit Role' : 'Create Role'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Role Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.375rem',
                                backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                            placeholder="e.g. Manager"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.375rem',
                                backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                padding: '0.75rem 1.5rem', borderRadius: '0.375rem',
                                backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem', borderRadius: '0.375rem',
                                backgroundColor: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            {editingRole ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
