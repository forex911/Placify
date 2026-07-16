-- ============================================================
-- Placify v2 Enterprise Upgrade â€” Database Migration Script
-- Run ONCE before deploying the new backend
-- ============================================================

-- 1. Rename old Application status values
UPDATE applications SET status = 'OA_Cleared'          WHERE status = 'Online_Assessment';
UPDATE applications SET status = 'Interview_Scheduled' WHERE status = 'Interview';

-- 2. Add audit columns to applications (if not exists)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Backfill existing rows
UPDATE applications SET created_at = NOW(), updated_at = NOW() WHERE created_at IS NULL;

-- 3. Add new columns to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Backfill
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

-- 4. Add new columns to dsa_tracker (if not exists)
ALTER TABLE dsa_tracker ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 100;
ALTER TABLE dsa_tracker ADD COLUMN IF NOT EXISTS solved_questions INTEGER DEFAULT 0;
ALTER TABLE dsa_tracker ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'MIXED';
ALTER TABLE dsa_tracker ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE dsa_tracker ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE dsa_tracker ADD COLUMN IF NOT EXISTS last_updated_date DATE;

-- Migrate old last_practiced_date to last_updated_date if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='dsa_tracker' AND column_name='last_practiced_date') THEN
        UPDATE dsa_tracker SET last_updated_date = last_practiced_date WHERE last_updated_date IS NULL;
    END IF;
END
$$;

-- Backfill created_at
UPDATE dsa_tracker SET created_at = NOW() WHERE created_at IS NULL;

-- 5. New tables (Hibernate ddl=update handles creation, but listed for reference)
-- CREATE TABLE IF NOT EXISTS subject_progress (...)
-- CREATE TABLE IF NOT EXISTS daily_reports (...)
-- CREATE TABLE IF NOT EXISTS leetcode_profiles (...)
-- CREATE TABLE IF NOT EXISTS notifications (...)
-- These will be auto-created by Hibernate on first deploy.

-- ============================================================
-- END OF MIGRATION
-- ============================================================
