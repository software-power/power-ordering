import axios from 'axios';
import xml2js from 'xml2js';
import { pool } from '../config/db.js';

/**
 * Send XML request to Tally
 * @param {string} xml - XML content to send
 * @param {string} tallyUrl - Tally server URL (e.g., http://localhost:9000)
 * @returns {Promise<string|null>} - Response XML or null on error
 */
export async function sendToTally(xml, tallyUrl) {
    try {
        const response = await axios.post(tallyUrl, xml, {
            headers: { 'Content-Type': 'application/xml' },
            timeout: 10000 // 10 second timeout
        });
        return response.data;
    } catch (error) {
        console.error('Tally Connection Error:', error.message);
        return null;
    }
}

/**
 * Sync products from Tally for a specific user
 * @param {number} userId - User ID to sync products for
 * @returns {Promise<Object>} - Result with success status and product count
 */
export async function syncProductsFromTally(userId) {
    try {
        // Get user's Tally configuration
        const [users] = await pool.query(
            'SELECT tally_url, tally_port FROM users WHERE id = ?',
            [userId]
        );

        if (!users.length || !users[0].tally_url) {
            throw new Error('Tally configuration not found for user');
        }

        const { tally_url, tally_port } = users[0];
        const tallyEndpoint = `${tally_url}:${tally_port}`;

        console.log(`[User ${userId}] Syncing products from Tally at ${tallyEndpoint}...`);

        const xml = `
        <ENVELOPE>
            <HEADER>
                <TALLYREQUEST>Export Data</TALLYREQUEST>
            </HEADER>
            <BODY>
                <EXPORTDATA>
                    <REQUESTDESC>
                        <REPORTNAME>List of Accounts</REPORTNAME>
                        <STATICVARIABLES>
                            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                            <ACCOUNTTYPE>All Inventory Masters</ACCOUNTTYPE>
                        </STATICVARIABLES>
                    </REQUESTDESC>
                </EXPORTDATA>
            </BODY>
        </ENVELOPE>`;

        const responseXml = await sendToTally(xml, tallyEndpoint);
        if (!responseXml) {
            throw new Error('No response from Tally');
        }

        // Parse XML response
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(responseXml);
        const body = result.ENVELOPE?.BODY?.[0];
        const messages = body?.IMPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE ||
            body?.DATA?.[0]?.TALLYMESSAGE;

        if (!messages) {
            console.log(`[User ${userId}] No products found in Tally response`);
            return { success: true, count: 0 };
        }

        const products = [];

        for (const msg of messages) {
            if (msg.STOCKITEM) {
                const item = msg.STOCKITEM[0];
                const name = item.$.NAME;
                const stock = parseFloat(item.OPENINGBALANCE?.[0] || 0) || 0;

                let price = 0;
                if (item.OPENINGRATE && item.OPENINGRATE[0]) {
                    const rateStr = item.OPENINGRATE[0];
                    const match = rateStr.match(/([\d,.]+)/);
                    if (match) price = parseFloat(match[1].replace(/,/g, ''));
                }
                if (price === 0) price = 100.00; // Fallback

                // Mock multiple price levels (in real scenario, fetch from Tally Price List report)
                const prices = [
                    { level: 'Standard', price: price },
                    { level: 'Wholesale', price: price * 0.8 },
                    { level: 'Retail', price: price * 1.2 }
                ];

                products.push({
                    name: name,
                    stock: Math.abs(stock),
                    price: price,
                    guid: item.$.GUID || name,
                    prices: prices
                });
            }
        }

        console.log(`[User ${userId}] Extracted ${products.length} products from Tally`);
        return { success: true, count: products.length, products };

    } catch (error) {
        console.error(`[User ${userId}] Error syncing products:`, error.message);
        throw error;
    }
}

/**
 * Create or update a ledger (customer) in Tally
 * @param {string} ledgerName - Name of the ledger to create
 * @param {string} tallyUrl - Tally server URL
 * @returns {Promise<boolean>} - Success status
 */
export async function checkAndCreateLedger(ledgerName, tallyUrl) {
    console.log(`Ensuring ledger '${ledgerName}' exists in Tally...`);

    const xml = `
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <IMPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>All Masters</REPORTNAME>
                </REQUESTDESC>
                <REQUESTDATA>
                    <TALLYMESSAGE xmlns:UDF="TallyUDF">
                        <LEDGER NAME="${ledgerName}" ACTION="Create">
                            <NAME.LIST>
                                <NAME>${ledgerName}</NAME>
                            </NAME.LIST>
                            <PARENT>Sundry Debtors</PARENT>
                            <OPENINGBALANCE>0</OPENINGBALANCE>
                            <ISBILLWISEON>Yes</ISBILLWISEON>
                        </LEDGER>
                    </TALLYMESSAGE>
                </REQUESTDATA>
            </IMPORTDATA>
        </BODY>
    </ENVELOPE>`;

    const res = await sendToTally(xml, tallyUrl);

    if (res && res.includes("<CREATED>1</CREATED>")) {
        console.log(`Ledger '${ledgerName}' created/updated successfully`);
        return true;
    } else if (res && res.includes('Errors')) {
        console.log(`Note: Ledger '${ledgerName}' might already exist`);
        return true; // Consider it success if already exists
    }

    return false;
}

/**
 * Post an order to Tally as a Sales Order voucher
 * @param {Object} order - Order object with items and customer details
 * @param {string} tallyUrl - Tally server URL
 * @returns {Promise<boolean>} - Success status
 */
export async function postOrderToTally(order, tallyUrl) {
    try {
        console.log(`Posting Order #${order.id} to Tally...`);

        // Ensure customer ledger exists
        if (order.customer_name) {
            await checkAndCreateLedger(order.customer_name, tallyUrl);
        }

        const salesLedger = order.tally_sales_ledger || 'Sales';
        const orderDate = new Date(order.order_date).toISOString().split('T')[0].replace(/-/g, '');

        const voucherXml = `
        <ENVELOPE>
            <HEADER>
                <TALLYREQUEST>Import Data</TALLYREQUEST>
            </HEADER>
            <BODY>
                <IMPORTDATA>
                    <REQUESTDESC>
                        <REPORTNAME>Vouchers</REPORTNAME>
                    </REQUESTDESC>
                    <REQUESTDATA>
                        <TALLYMESSAGE xmlns:UDF="TallyUDF">
                            <VOUCHER VCHTYPE="Sales Order" ACTION="Create">
                                <DATE>${orderDate}</DATE>
                                <VOUCHERNUMBER>${order.order_number}</VOUCHERNUMBER>
                                <PARTYLEDGERNAME>${order.customer_name}</PARTYLEDGERNAME>
                                <PRICELEVEL>${order.price_level || 'Standard'}</PRICELEVEL>
                                <NARRATION>Online Order ID: ${order.id}</NARRATION>
                                <EFFECTIVEDATE>${orderDate}</EFFECTIVEDATE>
                                
                                ${order.items.map(item => `
                                <ALLINVENTORYENTRIES.LIST>
                                    <STOCKITEMNAME>${item.tally_stock_item_name || 'Unknown Item'}</STOCKITEMNAME>
                                    <RATE>${item.rate}/Pcs</RATE>
                                    <ACTUALQTY>${item.qty} Pcs</ACTUALQTY>
                                    <BILLEDQTY>${item.qty} Pcs</BILLEDQTY>
                                    <AMOUNT>-${item.amount}</AMOUNT>
                                    <ACCOUNTINGALLOCATIONS.LIST>
                                        <LEDGERNAME>${salesLedger}</LEDGERNAME>
                                        <AMOUNT>-${item.amount}</AMOUNT>
                                    </ACCOUNTINGALLOCATIONS.LIST>
                                </ALLINVENTORYENTRIES.LIST>
                                `).join('')}
                                
                            </VOUCHER>
                        </TALLYMESSAGE>
                    </REQUESTDATA>
                </IMPORTDATA>
            </BODY>
        </ENVELOPE>`;

        const tallyRes = await sendToTally(voucherXml, tallyUrl);

        if (tallyRes && !tallyRes.includes('Errors')) {
            console.log(`Order #${order.id} posted to Tally successfully`);
            return true;
        } else {
            console.error(`Failed to post Order #${order.id}. Response:`, tallyRes);
            return false;
        }

    } catch (error) {
        console.error(`Error posting order #${order.id} to Tally:`, error.message);
        return false;
    }
}

/**
 * Sync a price level to Tally (mock implementation)
 * @param {Object} priceLevel - Price level object
 * @param {string} tallyUrl - Tally server URL
 * @returns {Promise<boolean>} - Success status
 */
export async function syncPriceLevelToTally(priceLevel, tallyUrl) {
    console.log(`Syncing Price Level '${priceLevel.name}' to Tally...`);

    // Mock: Just verify connectivity
    const checkXml = `
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>EXPORT</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <REPORTNAME>List of Accounts</REPORTNAME>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>`;

    const res = await sendToTally(checkXml, tallyUrl);

    if (res) {
        console.log(`Price Level '${priceLevel.name}' sync verified (mock)`);
        return true;
    }

    return false;
}
