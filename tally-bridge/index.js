import 'dotenv/config';
import axios from 'axios';
import xml2js from 'xml2js';

// Config
const TALLY_URL = process.env.TALLY_URL || 'http://localhost:9000';
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000'; // Base URL (e.g. http://localhost:3000)
// We will append /integration or /auth as needed
const USERNAME = process.env.API_USERNAME || 'admin';
const PASSWORD = process.env.API_PASSWORD || 'password';

console.log("Starting Tally Bridge...");
console.log(`Tally: ${TALLY_URL}`);
console.log(`Backend: ${BACKEND_BASE_URL}`);

let API_TOKEN = "";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function login() {
    try {
        console.log(`Logging in as ${USERNAME}...`);
        const res = await axios.post(`${BACKEND_BASE_URL}/auth/login`, {
            username: USERNAME,
            password: PASSWORD
        });
        if (res.data && res.data.accessToken) {
            API_TOKEN = res.data.accessToken;
            console.log("Login Successful! Token acquired.");
            return true;
        }
    } catch (error) {
        console.error("Login Failed:", error.response?.data?.message || error.message);
    }
    return false;
}


async function sendToTally(xml) {
    try {
        const response = await axios.post(TALLY_URL, xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        return response.data;
    } catch (error) {
        console.error("Tally Connection Error:", error.message);
        return null;
    }
}

async function syncPriceLevels() {
    try {
        const res = await axios.get(`${BACKEND_BASE_URL}/integration/pending-price-levels`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        const levels = res.data;

        for (const level of levels) {
            console.log(`Syncing Price Level '${level.name}' to Tally...`);

            // Mock Tally Check/Export
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

            await sendToTally(checkXml); // Just to verify connectivity

            // Mark as Synced
            await axios.post(`${BACKEND_BASE_URL}/integration/update-price-level-status`, {
                id: level.id,
                status: 'Synced'
            }, { headers: { Authorization: `Bearer ${API_TOKEN}` } });

            console.log(`Price Level '${level.name}' marked as Synced.`);
        }
    } catch (error) {
        console.error('Error syncing price levels:', error.message);
    }
}

async function syncProducts() {
    console.log("Syncing Products from Tally...");
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

    const responseXml = await sendToTally(xml);
    if (!responseXml) return;

    // console.log("Received Tally Data");

    try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(responseXml);
        const body = result.ENVELOPE?.BODY?.[0];
        const messages = body?.IMPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE || body?.DATA?.[0]?.TALLYMESSAGE;

        if (!messages) {
            console.log("No TALLYMESSAGE found in response.");
            return;
        }

        const products = [];

        for (const msg of messages) {
            if (msg.STOCKITEM) {
                const item = msg.STOCKITEM[0];
                const name = item.$.NAME;

                // ... (Existing extraction logic) ... 
                const stock = parseFloat(item.OPENINGBALANCE?.[0] || 0) || 0;

                let price = 0;
                if (item.OPENINGRATE && item.OPENINGRATE[0]) {
                    const rateStr = item.OPENINGRATE[0];
                    const match = rateStr.match(/([\d,.]+)/);
                    if (match) price = parseFloat(match[1].replace(/,/g, ''));
                }
                if (price === 0) price = 100.00; // Mock fallback

                // Extract Multiple Prices (Mock logic as Tally XML for Price List is different)
                // In a real scenario, we would request "Price List" report. 
                // Here we will simulate generating prices based on the base price for the demo.
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

        if (products.length > 0) {
            console.log(`Extracted ${products.length} products. Syncing to backend...`);
            await axios.post(`${BACKEND_BASE_URL}/integration/sync-products`, {
                products
            }, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
            console.log("Products synced successfully.");
        }

    } catch (e) {
        console.error("Error parsing Tally XML:", e.message);
    }
}

async function checkAndCreateLedger(ledgerName) {
    // Check if ledger exists in Tally (Mock check or simple Export)
    // For Tally, usually we just try to Export it. If empty, it doesn't exist.
    // Or we just try to CREATE it with IGNORE_DUPLICATE logic (Tally generally updates or ignores).

    console.log(`Ensuring Data for Client: ${ledgerName} in Tally...`);

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
    </ENVELOPE>
    `;

    const res = await sendToTally(xml);
    // Tally returns <CREATED>1</CREATED> or <ERRORS>...
    if (res && res.includes("<CREATED>1</CREATED>")) {
        console.log(`Ledger ${ledgerName} created/updated.`);
    } else if (res && res.includes('Errors')) {
        console.log(`Note: Ledger ${ledgerName} might already exist or error:`, res);
    }
}

async function processPendingOrders() {
    try {
        const res = await axios.get(`${BACKEND_BASE_URL}/integration/pending-orders`, {
            headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        const orders = res.data;

        if (orders.length === 0) return;

        console.log(`Found ${orders.length} pending orders.`);

        for (const order of orders) {
            console.log(`Processing Order #${order.id}...`);

            // Ensure Customer Ledger Exists
            if (order.customer_name) {
                await checkAndCreateLedger(order.customer_name);
            }

            // Use specific Sales Ledger if mapped, else valid default?
            // "Parties" > "Sundry Debtors" usually.
            // "Sales" ledger for items.
            // Tally Voucher XML structure typically:
            // Header > Voucher > PartyLedger (Customer)
            // Inventory Entries > Ledger (Sales Account)

            const salesLedger = order.tally_sales_ledger || 'Sales';

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
                                    <DATE>${new Date(order.order_date).toISOString().split('T')[0].replace(/-/g, '')}</DATE>
                                    <VOUCHERNUMBER>${order.order_number}</VOUCHERNUMBER>
                                    <PARTYLEDGERNAME>${order.customer_name}</PARTYLEDGERNAME>
                                    <PRICELEVEL>${order.price_level || 'Standard'}</PRICELEVEL>
                                    <NARRATION>Online Order ID: ${order.id}</NARRATION>
                                    <EFFECTIVEDATE>${new Date(order.order_date).toISOString().split('T')[0].replace(/-/g, '')}</EFFECTIVEDATE>
                                    
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
            </ENVELOPE>
            `;

            const tallyRes = await sendToTally(voucherXml);

            if (tallyRes && !tallyRes.includes('Errors')) {
                // Success
                console.log(`Order #${order.id} posted to Tally.`);
                await axios.post(`${BACKEND_BASE_URL}/integration/update-order-status`, {
                    order_id: order.id,
                    status: 'Posted to Tally',
                    tally_voucher_number: order.order_number,
                    tally_voucher_date: new Date()
                }, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
            } else {
                console.error(`Failed to post Order #${order.id}. Response:`, tallyRes);
            }
        }

    } catch (error) {
        console.error("Error processing orders:", error.message);
    }
}

async function run() {
    if (!await login()) {
        console.error("Critical: Could not log in. Exiting.");
        return;
    }

    while (true) {
        await syncPriceLevels();
        await syncProducts();
        await processPendingOrders();
        console.log("Waiting 60s...");
        await sleep(60000);
    }
}

run();
