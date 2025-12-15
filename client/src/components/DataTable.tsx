import DataTable, { TableStyles } from 'react-data-table-component';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

// Light Theme Styles
const customStyles: TableStyles = {
    table: {
        style: {
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#f1f5f9', // Slate-100
            color: '#475569',           // Slate-600
            borderBottom: '1px solid #e2e8f0',
            minHeight: '52px',
        },
    },
    headCells: {
        style: {
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            paddingLeft: '16px',
            paddingRight: '16px',
            letterSpacing: '0.05em',
        },
    },
    rows: {
        style: {
            backgroundColor: '#ffffff',
            color: '#1e293b',           // Slate-800
            borderBottom: '1px solid #f1f5f9',
            minHeight: '60px',
            fontSize: '0.875rem',
            '&:hover': {
                backgroundColor: '#f8fafc', // Slate-50
                cursor: 'pointer',
                transition: 'all 0.2s',
            },
        },
    },
    pagination: {
        style: {
            backgroundColor: '#ffffff',
            color: '#64748b',
            fontSize: '0.875rem',
            borderTop: '1px solid #e2e8f0',
        },
        pageButtonsStyle: {
            color: '#64748b',
            fill: '#64748b',
            '&:disabled': {
                cursor: 'not-allowed',
                color: '#cbd5e1',
                fill: '#cbd5e1',
            },
            '&:hover:not(:disabled)': {
                backgroundColor: '#f1f5f9',
            },
        },
    },
    noData: {
        style: {
            backgroundColor: '#ffffff',
            color: '#94a3b8',
            padding: '24px',
        },
    },
    progress: {
        style: {
            backgroundColor: '#ffffff',
            color: '#3b82f6',
        }
    }
};

interface DataTableProps {
    columns: any[];
    data: any[];
    title?: string;
    loading?: boolean;
    actions?: React.ReactNode;
}

export default function DataTableComponent({ columns, data, title, loading, actions }: DataTableProps) {
    const [filterText, setFilterText] = useState('');
    const [filteredItems, setFilteredItems] = useState(data);

    useEffect(() => {
        setFilteredItems(
            data.filter(item =>
                JSON.stringify(item).toLowerCase().includes(filterText.toLowerCase())
            )
        );
    }, [data, filterText]);

    const subHeaderComponent = (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                    type="text"
                    placeholder="Search..."
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    style={{
                        padding: '0.6rem 1rem 0.6rem 2.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0', // Light border
                        backgroundColor: '#ffffff',   // White bg
                        color: '#1e293b',             // Dark text
                        width: '100%',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
            </div>
            {actions && <div>{actions}</div>}
        </div>
    );

    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            padding: '1.5rem',
            border: '1px solid #e2e8f0'
        }}>
            {title && <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0f172a' }}>{title}</h2>}

            <DataTable
                columns={columns}
                data={filteredItems}
                pagination
                customStyles={customStyles}
                progressPending={loading}
                subHeader
                subHeaderComponent={subHeaderComponent}
                persistTableHead
                noHeader={!title} // If title is present, we render it manually, so disable internal header? No, 'noHeader' hides the DataTable header.
                // We are rendering title manually above.
                subHeaderAlign="left"
                subHeaderWrap
            />
        </div>
    );
}
