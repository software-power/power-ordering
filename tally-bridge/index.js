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

async function syncProducts() {
    console.log("Syncing Products from Tally...");
    // Minimal XML to get stock items (this is a simplification)
    // Tally XML is verbose. For MVP, we use a basic 'List of Accounts' or 'Stock Summary' request.
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

    // Parse XML
    // This part depends heavily on Tally's exact output structure.
    // We'll mock the parsing for now or do a best-effort text extraction.

    // Example: extracting name and bal
    // In real implementation, use xml2js.parseStringPromise(responseXml)

    // Generating dummy data if Tally not reachable (for dev verification)
    // But since user has Tally, let's try to simulate what we'd do.

    // For MVP, if we can't parse real Tally data without being there, 
    // we'll disable the actual PUSH to backend unless we get data.
    console.log("Received Tally Data (Length):", responseXml.length);

    try {
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(responseXml);

        // This structure depends on Tally version, but typically:
        // ENVELOPE.BODY[0].IMPORTDATA[0].REQUESTDATA[0].TALLYMESSAGE...
        // For EXPORT/List of Accounts, it might be simpler.
        // Let's assume a simplified structure or try to find TALLYMESSAGE

        // A robust way is to look for relevant tags.
        // For 'List of Accounts' export, Tally returns ENVELOPE > BODY > DATA > TALLYMESSAGE (one per item)
        // Or sometimes directly inside BODY.
        // Let's inspect the object structure in a real app, but here we'll assume standard TALLYMESSAGE list.

        const body = result.ENVELOPE?.BODY?.[0];
        // Note: Tally XML varies. This is a best-effort MVP parser.
        // We will try to find any TALLYMESSAGE that has STOCKITEM

        // If we can't find exact path, we might return.
        // But for this MVP, let's construct a payload if we find TALLYMESSAGE

        // Mocking the extraction for MVP if complex parsing fails, but let's try deep traverse
        // In List of Accounts: TALLYMESSAGE contains STOCKITEM

        // Accessing deep property safely
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
                // Rate and Closing Balance are often in sub-tags like OPENINGBALANCE or CLOSINGBALANCE
                // Tally XML is notoriously hard to parse perfectly without schema.
                // We'll extract basic Name and assume price/stock from standard fields or defaulting.

                const stock = parseFloat(item.OPENINGBALANCE?.[0] || 0) || 0;
                // Note: Opening Balance is negative for Credit, positive for Debit? Tally uses specific formatting.
                // We'll trust the number for now.

                let price = 0;

                // Try to get Rate from OPENINGRATE (e.g., "1200.00/Pcs")
                if (item.OPENINGRATE && item.OPENINGRATE[0]) {
                    const rateStr = item.OPENINGRATE[0];
                    // Extract number from "1200.00/Pcs" or "1200.00"
                    const match = rateStr.match(/([\d,.]+)/);
                    if (match) {
                        price = parseFloat(match[1].replace(/,/g, ''));
                    }
                }

                // If no rate, try calculating from Value and Quantity
                if (price === 0 && item.OPENINGVALUE && item.OPENINGVALUE[0] && stock !== 0) {
                    const valStr = item.OPENINGVALUE[0];
                    const valMatch = valStr.match(/([\d,.]+)/);
                    if (valMatch) {
                        const totalValue = parseFloat(valMatch[1].replace(/,/g, ''));
                        price = Math.abs(totalValue / stock);
                    }
                }

                // Fallback for demo if still 0 (User might not have set opening balance)
                if (price === 0) price = 100.00;

                products.push({
                    name: name,
                    stock: Math.abs(stock),
                    price: price,
                    guid: item.$.GUID || name // Use GUID or Name as key
                });
            }
        }

        if (products.length > 0) {
            console.log(`Extracted ${products.length} products. Syncing to backend...`);
            await axios.post(`${BACKEND_BASE_URL}/integration/sync-products`, {
                products
            }, { headers: { Authorization: `Bearer ${API_TOKEN}` } });
            console.log("Products synced successfully.");
        } else {
            console.log("No Stock Items found in Tally response.");
        }

    } catch (e) {
        console.error("Error parsing Tally XML:", e.message);
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

            // Create XML for Tally Import
            // This is a minimal Sales Voucher XML
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
                                    <NARRATION>Online Order ID: ${order.id}</NARRATION>
                                    
                                    ${order.items.map(item => `
                                    <ALLINVENTORYENTRIES.LIST>
                                        <STOCKITEMNAME>${item.tally_stock_item_name || 'Unknown Item'}</STOCKITEMNAME>
                                        <RATE>${item.rate}/Pcs</RATE>
                                        <ACTUALQTY>${item.qty} Pcs</ACTUALQTY>
                                        <BILLEDQTY>${item.qty} Pcs</BILLEDQTY>
                                        <AMOUNT>-${item.amount}</AMOUNT>
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
                    tally_voucher_number: order.order_number, // Tally doesn't always return ID easily in import, we assume success uses our ref
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
        await syncProducts();
        await processPendingOrders();
        console.log("Waiting 60s...");
        await sleep(60000);
    }
}

run();
