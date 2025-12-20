
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
    // The Tally Bridge (running locally on the user's machine) handles the actual sync.
    // This endpoint acts as a placeholder or a remote trigger if we implemented 2-way comms.
    // For now, we simply confirm the request so the UI doesn't show an error.
    res.json({
        message: 'Sync is handled by the Tally Bridge. Data will appear automatically when the Bridge is running.',
        count: 0
    });
}

export async function syncOrders(req, res) {
    // The Tally Bridge (running locally) automatically polls for "Pending" orders.
    // This button can serve as a confirmation or trigger for the user to check their bridge.
    res.json({
        message: 'Order Sync is active! The Tally Bridge will pick up pending orders automatically.',
        count: 0
    });
}
