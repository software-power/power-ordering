import cron from 'node-cron';
import * as tallyService from '../services/tallyService.js';
import { pool } from '../config/db.js';

let syncJob = null;

/**
 * Process pending orders for all users
 */
async function processPendingOrders() {
    try {
        // Get all pending orders with user's Tally config
        const [orders] = await pool.query(`
            SELECT o.*, u.tally_url, u.tally_port, u.tally_sales_ledger, u.fullname as customer_name
            FROM orders o
            JOIN users u ON u.id = o.user_id
            WHERE o.status = 'Pending' AND u.tally_url IS NOT NULL
            ORDER BY o.order_date ASC
            LIMIT 50
        `);

        if (orders.length === 0) return;

        console.log(`[Tally Jobs] Found ${orders.length} pending orders to process`);

        // Fetch items for all orders
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

        // Process each order
        for (const order of orders) {
            const tallyEndpoint = `${order.tally_url}:${order.tally_port}`;
            const posted = await tallyService.postOrderToTally(order, tallyEndpoint);

            if (posted) {
                await pool.query(
                    `UPDATE orders SET status = ?, tally_voucher_number = ?, tally_voucher_date = ? WHERE id = ?`,
                    ['Posted to Tally', order.order_number, new Date(), order.id]
                );
                console.log(`[Tally Jobs] Order #${order.id} posted successfully`);
            }
        }

    } catch (error) {
        console.error('[Tally Jobs] Error processing pending orders:', error.message);
    }
}

/**
 * Sync pending price levels to Tally
 */
async function syncPendingPriceLevels() {
    try {
        // Get all pending price levels with user's Tally config
        const [levels] = await pool.query(`
            SELECT pl.*, u.tally_url, u.tally_port
            FROM price_levels pl
            JOIN users u ON u.id = pl.user_id
            WHERE pl.sync_status = 'Pending Sync' AND u.tally_url IS NOT NULL
            LIMIT 20
        `);

        if (levels.length === 0) return;

        console.log(`[Tally Jobs] Found ${levels.length} pending price levels to sync`);

        for (const level of levels) {
            const tallyEndpoint = `${level.tally_url}:${level.tally_port}`;
            const synced = await tallyService.syncPriceLevelToTally(level, tallyEndpoint);

            if (synced) {
                await pool.query(
                    'UPDATE price_levels SET sync_status = ? WHERE id = ?',
                    ['Synced', level.id]
                );
                console.log(`[Tally Jobs] Price Level '${level.name}' synced successfully`);
            }
        }

    } catch (error) {
        console.error('[Tally Jobs] Error syncing price levels:', error.message);
    }
}

/**
 * Main sync function that runs all background tasks
 */
async function runTallySync() {
    console.log('[Tally Jobs] Running sync cycle...');

    try {
        // Run all sync tasks
        await Promise.all([
            processPendingOrders(),
            syncPendingPriceLevels()
        ]);

        console.log('[Tally Jobs] Sync cycle completed');
    } catch (error) {
        console.error('[Tally Jobs] Error in sync cycle:', error.message);
    }
}

/**
 * Start the background job scheduler
 * @param {number} intervalSeconds - Sync interval in seconds (default: 60)
 */
export function startTallyJobs(intervalSeconds = 60) {
    if (syncJob) {
        console.log('[Tally Jobs] Jobs already running');
        return;
    }

    console.log(`[Tally Jobs] Starting background sync (every ${intervalSeconds}s)...`);

    // Run immediately on start
    runTallySync();

    // Schedule periodic sync using cron
    // Every N seconds: */N * * * * *
    const cronExpression = `*/${intervalSeconds} * * * * *`;

    syncJob = cron.schedule(cronExpression, runTallySync, {
        scheduled: true,
        timezone: "Africa/Nairobi" // Adjust to your timezone
    });

    console.log('[Tally Jobs] Background sync started successfully');
}

/**
 * Stop the background job scheduler
 */
export function stopTallyJobs() {
    if (syncJob) {
        syncJob.stop();
        syncJob = null;
        console.log('[Tally Jobs] Background sync stopped');
    }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown() {
    const shutdown = () => {
        console.log('[Tally Jobs] Shutting down gracefully...');
        stopTallyJobs();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
