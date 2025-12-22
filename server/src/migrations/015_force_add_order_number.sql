-- This will work if your runner supports multiple statements or if you run them separately
SET @dbname = DATABASE();
SET @tablename = 'orders';
SET @columnname = 'order_number';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) AFTER id'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;