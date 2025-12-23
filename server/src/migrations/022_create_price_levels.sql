CREATE TABLE IF NOT EXISTS price_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    is_standard BOOLEAN DEFAULT FALSE,
    sync_status VARCHAR(50) DEFAULT 'Pending',
    tally_guid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_name_user UNIQUE (name, user_id)
);

-- Determine if Standard price level exists for central users, if not, create it generally? 
-- Actually, let's just ensure the table exists. The Application logic will handle defaults.
