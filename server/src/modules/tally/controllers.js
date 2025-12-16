
import { pool } from '../../config/db.js';
import { testTallyConnection, fetchProductsFromTally, getTallyConfig } from './service.js';

export async function testConnection(req, res) {
    const { tally_url, tally_port } = req.body;
    if (!tally_url || !tally_port) return res.status(400).json({ message: 'URL and Port required' });

    try {
        await testTallyConnection(tally_url, tally_port);
        res.json({ message: 'Connection Successful' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Could not connect to Tally. Ensure Tally is open and ODBC port is active.' });
    }
}

export async function syncProducts(req, res) {
    try {
        const userId = req.user.sub;
        const config = await getTallyConfig(userId);

        if (!config.tally_url || !config.tally_port) {
            return res.status(400).json({ message: 'Tally configuration not found. Please configure Tally settings first.' });
        }

        // Fetch products from Tally
        const products = await fetchProductsFromTally(config.tally_url, config.tally_port);

        // TODO: Parse XML and insert/update products in database
        // For now, return success
        res.json({ message: 'Products sync initiated', count: 0 });
    } catch (error) {
        console.error('Sync products error:', error);
        res.status(500).json({ message: 'Failed to sync products from Tally' });
    }
}

export async function syncOrders(req, res) {
    try {
        const userId = req.user.sub;
        const config = await getTallyConfig(userId);

        if (!config.tally_url || !config.tally_port) {
            return res.status(400).json({ message: 'Tally configuration not found. Please configure Tally settings first.' });
        }

        // TODO: Fetch pending orders from database and push to Tally
        // For now, return success
        res.json({ message: 'Orders sync to Tally initiated', count: 0 });
    } catch (error) {
        console.error('Sync orders error:', error);
        res.status(500).json({ message: 'Failed to sync orders to Tally' });
    }
}
