import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../rbac/usePermission';
import Modal from '../components/Modal';
import DataTableComponent from '../components/DataTable';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Plus, Check, X } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSettings } from '../context/SettingsContext';
import PageTitle from '../components/PageTitle';

export default function RolesList() {
    const { state } = useAuth();
    const { settings } = useSettings();
    const confirm = useConfirm();
    const canView = usePermission('role.view');
    const canAdd = usePermission('role.add');
    const canEdit = usePermission('role.edit');
    const canDelete = usePermission('role.delete');

    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Meta Data for Permissions UI
    const [meta, setMeta] = useState<{ menus: any[], submenus: any[], permissions: any[] }>({ menus: [], submenus: [], permissions: [] });
    const [metaLoading, setMetaLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', status: 'active', permission_ids: [] as number[], submenu_ids: [] as number[], is_client_accessible: true });
    const isAdmin = state.user?.role_id === 1;

    useEffect(() => {
        if (canView) {
            fetchRoles();
            fetchMeta();
        }
    }, [canView, state.accessToken]);

    async function fetchRoles() {
        setLoading(true);
        try {
            const res = await fetch(`${settings.apiBaseUrl}/roles`, {
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

    async function fetchMeta() {
        setMetaLoading(true);
        try {
            const res = await fetch(`${settings.apiBaseUrl}/roles/meta`, {
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMeta(data);
            }
        } catch (e) {
            console.error('Failed to load meta', e);
        } finally {
            setMetaLoading(false);
        }
    }

    const handleEdit = async (role: any) => {
        setEditingRole(role);
        // Fetch current permissions for this role
        let assigned: number[] = [];
        try {
            const res = await fetch(`${settings.apiBaseUrl}/roles/${role.id}/permissions`, {
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res.ok) {
                assigned = await res.json();
            }
        } catch (e) {
            console.error('Failed to fetch role permissions', e);
        }

        // Fetch assigned submenus
        let assignedSubmenus: number[] = [];
        try {
            const res2 = await fetch(`${settings.apiBaseUrl}/roles/${role.id}/submenus`, {
                headers: { Authorization: `Bearer ${state.accessToken}` }
            });
            if (res2.ok) {
                assignedSubmenus = await res2.json();
            }
        } catch (e) {
            console.error('Failed to fetch role submenus', e);
        }

        setFormData({
            name: role.name,
            status: role.status || 'active',
            permission_ids: assigned,
            submenu_ids: assignedSubmenus,
            is_client_accessible: role.is_client_accessible === 1 || role.is_client_accessible === true
        });
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingRole(null);
        setFormData({ name: '', status: 'active', permission_ids: [], submenu_ids: [], is_client_accessible: true });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!await confirm({ title: 'Delete Role', message: 'Are you sure you want to delete this role?', danger: true })) return;
        try {
            const res = await fetch(`${settings.apiBaseUrl}/roles/${id}`, {
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
            ? `${settings.apiBaseUrl}/roles/${editingRole.id}`
            : `${settings.apiBaseUrl}/roles`;

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

    // Permission Handlers
    const togglePermission = (id: number) => {
        setFormData(prev => {
            const has = prev.permission_ids.includes(id);
            return {
                ...prev,
                permission_ids: has ? prev.permission_ids.filter(p => p !== id) : [...prev.permission_ids, id]
            };
        });
    };

    const toggleMenu = (menuId: number, check: boolean) => {
        // Find all permission IDs for this menu
        const permIds = meta.permissions.filter(p => p.menu_id === menuId).map(p => p.id);
        setFormData(prev => {
            const current = new Set(prev.permission_ids);
            if (check) {
                permIds.forEach(id => current.add(id));
            } else {
                permIds.forEach(id => current.delete(id));
            }
            return { ...prev, permission_ids: Array.from(current) };
        });
    };

    const toggleSubmenu = (id: number) => {
        setFormData(prev => {
            const has = prev.submenu_ids.includes(id);
            return {
                ...prev,
                submenu_ids: has ? prev.submenu_ids.filter(s => s !== id) : [...prev.submenu_ids, id]
            };
        });
    };

    const checkAll = () => {
        const allIds = meta.permissions.map(p => p.id);
        const allSubmenus = meta.submenus.map(s => s.id);
        setFormData(prev => ({ ...prev, permission_ids: allIds, submenu_ids: allSubmenus }));
    };

    const uncheckAll = () => {
        setFormData(prev => ({ ...prev, permission_ids: [], submenu_ids: [] }));
    };

    const columns = [
        { name: 'ID', selector: (row: any) => row.id, sortable: true, width: '80px' },
        { name: 'Name', selector: (row: any) => row.name, sortable: true },
        {
            name: 'Owner',
            selector: (row: any) => row.owner_name || 'System',
            sortable: true,
            cell: (row: any) => (
                <span style={{
                    fontSize: '0.875rem',
                    color: row.owner_name ? '#64748b' : '#8b5cf6',
                    fontWeight: row.owner_name ? 400 : 500
                }}>
                    {row.owner_name || 'System'}
                </span>
            )
        },
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
            cell: (row: any) => (
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                    {row.id !== 1 && canEdit && (
                        <button
                            onClick={() => handleEdit(row)}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <Edit2 size={16} />
                        </button>
                    )}
                    {row.id !== 1 && canDelete && (
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

    // Helper to check if a menu is fully checked, partially checked, or unchecked
    const getMenuCheckState = (menuId: number) => {
        const permIds = meta.permissions.filter(p => p.menu_id === menuId).map(p => p.id);
        if (permIds.length === 0) return 'unchecked';
        const checkedCount = permIds.filter(id => formData.permission_ids.includes(id)).length;
        if (checkedCount === permIds.length) return 'checked';
        if (checkedCount > 0) return 'partial';
        return 'unchecked';
    };

    return (
        <div style={{ padding: '2rem', color: '#e2e8f0' }}>
            <PageTitle title="Roles" />
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
                maxWidth="1000px"
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1000px' }}>

                    {/* Role Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                placeholder="e.g. Sales Person"
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
                    </div>

                    {/* Is Client Accessible Checkbox (Admin Only) */}
                    {isAdmin && (
                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_client_accessible}
                                    onChange={e => setFormData({ ...formData, is_client_accessible: e.target.checked })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>Is Client Accessible</span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>(Allow Tally Users to see and assign this role)</span>
                            </label>
                        </div>
                    )}

                    {/* Permissions Grid */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>Role Permissions</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={checkAll} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Check all</button>
                                <button type="button" onClick={uncheckAll} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#ef4444', color: 'white', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Uncheck all</button>
                            </div>
                        </div>

                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            {/* Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr) 2fr', backgroundColor: '#f8fafc', padding: '0.75rem', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Menu</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Submenu(s)</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Permissions</div>
                            </div>

                            {/* Rows */}
                            {meta.menus.map(menu => {
                                const submenus = meta.submenus.filter(s => s.menu_id === menu.id);
                                const permissions = meta.permissions.filter(p => p.menu_id === menu.id);
                                if (permissions.length === 0 && submenus.length === 0) return null; // Skip empty

                                const menuState = getMenuCheckState(menu.id);

                                return (
                                    <div key={menu.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr) 2fr', borderBottom: '1px solid #f1f5f9', padding: '0.75rem', alignItems: 'start' }}>
                                        {/* Menu Column */}
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={menuState === 'checked'}
                                                ref={el => { if (el) el.indeterminate = menuState === 'partial'; }}
                                                onChange={(e) => toggleMenu(menu.id, e.target.checked)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>{menu.name}</span>
                                        </div>

                                        {/* Submenus Column */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {submenus.map(sub => (
                                                <label key={sub.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.submenu_ids.includes(sub.id)}
                                                        onChange={() => toggleSubmenu(sub.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{sub.name}</span>
                                                </label>
                                            ))}
                                            {submenus.length === 0 && <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>-</span>}
                                        </div>

                                        {/* Permissions Column */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                                            {permissions.map(perm => (
                                                <label key={perm.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permission_ids.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>{perm.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
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

