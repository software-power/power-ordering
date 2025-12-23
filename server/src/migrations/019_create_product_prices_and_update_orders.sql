-- 019_create_product_prices_and_update_orders.sql

-- Create product_prices table for storing multiple price levels (e.g. Wholesale, Retail)
CREATE TABLE IF NOT EXISTS product_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    price_level VARCHAR(100) NOT NULL, -- e.g. 'Standard', 'Wholesale', 'Retail'
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_price (product_id, price_level)
);

-- Update users table to store default Tally settings for Customers
-- tally_ledger_name already exists based on debug check, so only adding default_price_level
ALTER TABLE users 
ADD COLUMN default_price_level VARCHAR(100) DEFAULT 'Standard';

-- Update orders table to store the price level used for the order
ALTER TABLE orders
ADD COLUMN price_level VARCHAR(100) DEFAULT 'Standard';
