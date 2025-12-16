import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../rbac/usePermission';
import Modal from '../components/Modal';
import DataTableComponent from '../components/DataTable';
import toast from 'react-hot-toast';
import { Edit2, Trash2, UserPlus } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSettings } from '../context/SettingsContext';

export default function UsersList() {
  const { state } = useAuth();
  const { settings } = useSettings();
  const confirm = useConfirm();
  const canView = usePermission('user.view');
  const canAdd = usePermission('user.add');
  const canEdit = usePermission('user.edit');
  const canDelete = usePermission('user.delete');

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form State
  const initialFormState = {
    fullname: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role_id: '',
    status: 'active',
    tally_url: 'http://localhost',
    tally_port: '9000'
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (canView) {
      fetchUsers();
      fetchRoles();
    }
  }, [canView, state.accessToken]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${settings.apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (e) {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoles() {
    try {
      const res = await fetch(`${settings.apiBaseUrl}/roles`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (e) {
      console.error('Failed to load roles', e);
    }
  }

  const handleAdd = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    const roleId = roles.find(r => r.name === user.role)?.id || '';

    setFormData({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role_id: roleId,
      status: user.status,
      tally_url: user.tally_url || 'http://localhost',
      tally_port: user.tally_port || '9000'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    // UPDATED: Use global confirm
    if (!await confirm({ title: 'Delete User', message: 'Are you sure you want to delete this user?', danger: true })) return;
    try {
      const res = await fetch(`${settings.apiBaseUrl}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      if (res.ok) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (e) {
      toast.error('Error deleting user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullname || !formData.username || !formData.email || !formData.role_id) {
      return toast.error('Please fill in all required fields');
    }
    if (!editingUser && !formData.password) {
      return toast.error('Password is required for new users');
    }

    const url = editingUser
      ? `${settings.apiBaseUrl}/users/${editingUser.id}`
      : `${settings.apiBaseUrl}/users`;

    const method = editingUser ? 'PUT' : 'POST';

    const payload: any = { ...formData };
    if (editingUser && !payload.password) delete payload.password;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`User ${editingUser ? 'updated' : 'created'}`);
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Operation failed');
      }
    } catch (e) {
      toast.error('Error saving user');
    }
  };

  const columns = [
    {
      name: 'Name',
      selector: (row: any) => row.fullname,
      sortable: true,
      cell: (row: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.fullname}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.phone}</div>
        </div>
      )
    },
    {
      name: 'Username / Email',
      selector: (row: any) => row.username,
      sortable: true,
      cell: (row: any) => (
        <div>
          <div>{row.username}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.email}</div>
        </div>
      )
    },
    {
      name: 'Role',
      selector: (row: any) => row.role,
      sortable: true,
      cell: (row: any) => (
        <div>
          <div style={{
            padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem',
            backgroundColor: '#334155', color: '#e2e8f0', display: 'inline-block'
          }}>
            {row.role}
          </div>
          {row.role_owner_name && (
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              by {row.role_owner_name}
            </div>
          )}
        </div>
      )
    },
  ];

  // Add Parent column for Admin users only
  const isAdmin = state.user?.role_id === 1;
  if (isAdmin) {
    columns.push({
      name: 'Parent',
      selector: (row: any) => row.parent_name || '-',
      sortable: true,
      cell: (row: any) => (
        <span style={{ fontSize: '0.875rem', color: row.parent_name ? '#64748b' : '#94a3b8' }}>
          {row.parent_name || '-'}
        </span>
      )
    } as any);
  }

  columns.push(
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
          {canEdit && (
            <button
              onClick={() => handleEdit(row)}
              style={{ padding: '0.5rem', borderRadius: '0.375rem', backgroundColor: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete && row.id !== state.user?.id && (
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
  );

  if (!canView) return <div style={{ padding: '2rem', color: 'white' }}>Permission denied</div>;

  return (
    <div style={{ padding: '2rem', color: '#e2e8f0' }}>
      <DataTableComponent
        title="Users"
        columns={columns}
        data={users}
        loading={loading}
        actions={
          canAdd && (
            <button
              onClick={handleAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
                borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <UserPlus size={18} /> Create User
            </button>
          )
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name *</label>
              <input
                type="text"
                value={formData.fullname}
                onChange={e => setFormData({ ...formData, fullname: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>{editingUser ? 'Password (leave blank to keep current)' : 'Password *'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none' }}
              required={!editingUser}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Role *</label>
              <select
                value={formData.role_id}
                onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                required
                disabled={editingUser?.id === state.user?.id}
              >
                <option value="">Select Role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {editingUser?.id === state.user?.id && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  You cannot change your own role
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                disabled={editingUser?.id === state.user?.id}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {editingUser?.id === state.user?.id && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  You cannot change your own status
                </div>
              )}
            </div>
          </div>

          {/* Tally Configuration - Show only for Tally User role (role_id === 2 or role name === "Tally User") */}
          {(formData.role_id === '2' || roles.find(r => r.id === parseInt(formData.role_id))?.name === 'Tally User') && (
            <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#0369a1', fontWeight: 500 }}>Tally Configuration</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Tally URL</label>
                  <input
                    type="text"
                    value={formData.tally_url}
                    onChange={e => setFormData({ ...formData, tally_url: e.target.value })}
                    placeholder="http://localhost"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 500 }}>Tally Port</label>
                  <input
                    type="text"
                    value={formData.tally_port}
                    onChange={e => setFormData({ ...formData, tally_port: e.target.value })}
                    placeholder="9000"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.375rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                User can update these settings later from their Settings page.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.375rem', backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '0.75rem 1.5rem', borderRadius: '0.375rem', backgroundColor: '#3b82f6', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 500 }}
            >
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
