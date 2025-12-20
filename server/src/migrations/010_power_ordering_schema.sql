-- 010_power_ordering_schema.sql

-- Update Users Table (Missing field for Tally Integration)
-- ALTER TABLE users ADD COLUMN tally_ledger_name VARCHAR(255) DEFAULT NULL;

-- Update Products Table
-- ALTER TABLE products 
-- ADD COLUMN description TEXT,
-- ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.00,
-- ADD COLUMN tally_stock_item_name VARCHAR(255);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Update Orders Table
ALTER TABLE orders
ADD COLUMN order_number VARCHAR(50);
-- ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0.00,
-- ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00,
-- ADD COLUMN net_amount DECIMAL(10,2) DEFAULT 0.00,
-- ADD COLUMN tally_voucher_number VARCHAR(100),
-- ADD COLUMN tally_voucher_date DATE,
-- ADD COLUMN payment_mode VARCHAR(50) DEFAULT 'Cash',
-- MODIFY COLUMN status VARCHAR(50) DEFAULT 'Pending';

-- Optional: Add indexes for performance
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
