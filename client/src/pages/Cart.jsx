import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import PageTitle from '../components/PageTitle';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
    const { cartItems, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
    const { state } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState(state.user?.fullname || '');
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (cartItems.length === 0) return toast.error("Cart is empty");

        setLoading(true);
        try {
            const payload = {
                customer_name: customerName,
                items: cartItems.map(item => ({
                    product_id: item.id,
                    qty: item.qty,
                    rate: item.price,
                    tax_rate: item.tax_rate || 0
                })),
                payment_mode: 'Online' // Default for now
            };

            const res = await fetch(`${settings.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Order Placed! ID: ${data.orderNumber}`);
                clearCart();
                navigate('/my-orders');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Checkout failed');
            }
        } catch (e) {
            toast.error('Checkout error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <PageTitle title="Shopping Cart" />

            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Product</th>
                                    <th style={{ padding: '1rem' }}>Price</th>
                                    <th style={{ padding: '1rem' }}>Qty</th>
                                    <th style={{ padding: '1rem' }}>Total</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>{item.name}</td>
                                        <td style={{ padding: '1rem' }}>TZS {item.price}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={e => updateQty(item.id, parseInt(e.target.value))}
                                                style={{ width: '60px', padding: '0.25rem' }}
                                            />
                                        </td>
                                        <td style={{ padding: '1rem' }}>TZS {(item.price * item.qty).toFixed(2)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button onClick={() => removeFromCart(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ flex: 1, backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Summary</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal</span>
                            <span>TZS {cartTotal.toFixed(2)}</span>
                        </div>
                        <hr style={{ margin: '1rem 0', borderColor: '#e2e8f0' }} />
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Customer Name</label>
                            <input
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                            />
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            style={{
                                width: '100%', backgroundColor: '#10b981', color: 'white', padding: '0.75rem',
                                border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Processing...' : 'Checkout'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
