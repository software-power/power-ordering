-- 020_add_sales_ledger.sql
ALTER TABLE users ADD COLUMN tally_sales_ledger VARCHAR(255) DEFAULT 'Sales';
