-- Add Tally configuration and Central User flag to users table
ALTER TABLE users 
ADD COLUMN is_centraluser BOOLEAN DEFAULT FALSE,
ADD COLUMN tally_url VARCHAR(255) DEFAULT 'http://localhost',
ADD COLUMN tally_port VARCHAR(10) DEFAULT '9000';

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tally_guid VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100),
    stock DECIMAL(10, 2) DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0,
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tally_product (user_id, tally_guid)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tally_voucher_number VARCHAR(255),
    customer_name VARCHAR(255),
    amount DECIMAL(10, 2) DEFAULT 0,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Synced', 'Failed') DEFAULT 'Pending',
    sync_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
