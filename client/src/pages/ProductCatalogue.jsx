import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PageTitle from '../components/PageTitle';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export default function ProductCatalogue() {
    const { state } = useAuth();
    const { settings } = useSettings();
    const { addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

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

    return (
        <div style={{ padding: '2rem' }}>
            <PageTitle title="Product Catalogue" />

            {loading ? (
                <p>Loading products...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {products.map((product) => (
                        <div key={product.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', backgroundColor: 'white' }}>
                            <div style={{ height: '100px', backgroundColor: '#f1f5f9', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                Placeholder Image
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{product.name}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{product.part_number}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>TZS {product.price}</span>
                                <button
                                    onClick={() => addToCart(product)}
                                    style={{
                                        backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem',
                                        padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    <ShoppingCart size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
