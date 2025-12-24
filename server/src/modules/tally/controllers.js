import axios from 'axios';
import * as tallyService from '../../services/tallyService.js';
import { pool } from '../../config/db.js';

export async function testConnection(req, res) {
    const { tally_url, tally_port } = req.body;
    if (!tally_url || !tally_port) {
        return res.status(400).json({ message: 'Missing tally_url or tally_port' });
    }

    const endpoint = `${tally_url}:${tally_port}`;

    // Simple test XML
    const testXml = `
    <ENVELOPE>
      <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
      <BODY>
        <EXPORTDATA>
          <REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC>
        </EXPORTDATA>
      </BODY>
    </ENVELOPE>`;

    try {
        const response = await tallyService.sendToTally(testXml, endpoint);
        if (response) {
            return res.json({ success: true, message: 'Connected to Tally successfully' });
        } else {
            return res.status(500).json({ success: false, message: 'No response from Tally' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function triggerSync(req, res) {
    // This is a placeholder - the actual sync is now handled by background jobs
    res.json({ message: 'Sync will be processed by background jobs' });
}

/**
 * Trigger immediate product sync from Tally
 */
export async function syncProductsNow(req, res) {
    const userId = req.user.sub;

    try {
        const result = await tallyService.syncProductsFromTally(userId);

        if (result.success && result.products) {
            // Save products to database via integration endpoint
            const saveRes = await axios.post(
                `http://localhost:${process.env.PORT || 3000}/integration/sync-products`,
                { products: result.products },
                { headers: { Authorization: req.headers.authorization } }
            );

            res.json({
                success: true,
                message: `Synced ${result.count} products from Tally`,
                count: result.count
            });
        } else {
            res.json({ success: true, message: 'No products found', count: 0 });
        }
    } catch (error) {
        console.error('Error in syncProductsNow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Trigger immediate order sync to Tally
 */
export async function syncOrdersNow(req, res) {
    const userId = req.user.sub;

    try {
        // Get user's Tally config
        const [users] = await pool.query(
            'SELECT tally_url, tally_port FROM users WHERE id = ?',
            [userId]
        );

        if (!users.length || !users[0].tally_url) {
            return res.status(400).json({ message: 'Tally configuration not found' });
        }

        const tallyEndpoint = `${users[0].tally_url}:${users[0].tally_port}`;

        // Get pending orders for this user
        const [orders] = await pool.query(`
      SELECT o.*, u.tally_sales_ledger, u.fullname as customer_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.user_id = ? AND o.status = 'Pending'
      ORDER BY o.order_date ASC
      LIMIT 10
    `, [userId]);

        if (orders.length === 0) {
            return res.json({ success: true, message: 'No pending orders', count: 0 });
        }

        // Fetch items for orders
        const orderIds = orders.map(o => o.id);
        const [items] = await pool.query(
            `SELECT oi.*, p.name as product_name, p.tally_stock_item_name 
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        // Attach items to orders
        orders.forEach(order => {
            order.items = items.filter(item => item.order_id === order.id);
        });

        let successCount = 0;
        for (const order of orders) {
            const posted = await tallyService.postOrderToTally(order, tallyEndpoint);

            if (posted) {
                // Update order status
                await pool.query(
                    `UPDATE orders SET status = ?, tally_voucher_number = ?, tally_voucher_date = ? WHERE id = ?`,
                    ['Posted to Tally', order.order_number, new Date(), order.id]
                );
                successCount++;
            }
        }

        res.json({
            success: true,
            message: `Posted ${successCount} of ${orders.length} orders to Tally`,
            count: successCount
        });

    } catch (error) {
        console.error('Error in syncOrdersNow:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}
