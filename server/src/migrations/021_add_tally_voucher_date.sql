-- 021_add_tally_voucher_date.sql
ALTER TABLE orders ADD COLUMN tally_voucher_date DATETIME DEFAULT NULL;
