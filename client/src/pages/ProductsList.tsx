import { usePermission } from '../rbac/usePermission';
import DataTableComponent from '../components/DataTable';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function ProductsList() {
  const canAdd = usePermission('product.add');
  const canEdit = usePermission('product.edit');
  const canDelete = usePermission('product.delete');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Define columns even if empty for now
  const columns = [
    { name: 'ID', selector: (row: any) => row.id, sortable: true },
    { name: 'Name', selector: (row: any) => row.name, sortable: true },
    { name: 'Price', selector: (row: any) => row.price, sortable: true },
    { name: 'Category', selector: (row: any) => row.category, sortable: true },
    { name: 'Actions', cell: (row: any) => <span>Coming Soon</span> }
  ];

  return (
    <div style={{ padding: '2rem', color: '#e2e8f0' }}>
      <DataTableComponent
        title="Products"
        columns={columns}
        data={products}
        loading={loading}
        actions={
          canAdd && (
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem',
                borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                fontWeight: 500, outline: 'none'
              }}
            >
              <Plus size={18} /> Add Product
            </button>
          )
        }
      />
    </div>
  );
}
