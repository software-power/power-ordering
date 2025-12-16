import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import DataTableComponent from '../components/DataTable';
import PageTitle from '../components/PageTitle';
import { useSettings } from '../context/SettingsContext';
import { usePermission } from '../rbac/usePermission';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsList() {
  const { state } = useAuth();
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const isAdmin = state.user?.role_id === 1;
  const canViewStock = usePermission('product.view_stock');
  const canSync = usePermission('product.sync_from_tally');

  useEffect(() => {
    if (state.accessToken) fetchProducts();
  }, [state.accessToken]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${settings.apiBaseUrl}/products`, {
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSyncFromTally = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${settings.apiBaseUrl}/tally/products/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.accessToken}` }
      });
      if (res.ok) {
        toast.success('Products synced from Tally successfully');
        fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to sync products');
      }
    } catch (e) {
      toast.error('Error syncing products from Tally');
    } finally {
      setSyncing(false);
    }
  };

  const columns: any[] = [
    { name: 'Name', selector: (row: any) => row.name, sortable: true },
    { name: 'Part Number', selector: (row: any) => row.part_number, sortable: true },
  ];

  // Only show stock if user has permission
  if (canViewStock || isAdmin) {
    columns.push({ name: 'Stock', selector: (row: any) => row.stock, sortable: true });
  }

  columns.push({ name: 'Price', selector: (row: any) => row.price, sortable: true });

  if (isAdmin) {
    columns.push({ name: 'Owner', selector: (row: any) => row.owner_name, sortable: true });
  }

  columns.push({ name: 'Tally GUID', selector: (row: any) => row.tally_guid || '-', sortable: true });

  return (
    <div style={{ padding: '2rem' }}>
      <PageTitle title="Products" />
      <DataTableComponent
        title="Products"
        columns={columns}
        data={products}
        loading={loading}
        actions={
          canSync && (
            <button
              onClick={handleSyncFromTally}
              disabled={syncing}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem',
                borderRadius: '0.375rem', border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
                fontWeight: 500, outline: 'none', opacity: syncing ? 0.6 : 1
              }}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync from Tally'}
            </button>
          )
        }
      />
    </div>
  );
}
