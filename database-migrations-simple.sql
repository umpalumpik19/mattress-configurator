-- Simplified Database Schema Updates for Admin Panel
-- This is a simpler version that should work with existing tables

-- 1. Add status and delivery tracking columns to orders table (only if they don't exist)
DO $$ 
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
        ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'processing';
    END IF;
    
    -- Add delivery_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_date') THEN
        ALTER TABLE orders ADD COLUMN delivery_date DATE;
    END IF;
    
    -- Add delivery_time_slot column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_time_slot') THEN
        ALTER TABLE orders ADD COLUMN delivery_time_slot VARCHAR(50);
    END IF;
    
    -- Add admin_notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='admin_notes') THEN
        ALTER TABLE orders ADD COLUMN admin_notes TEXT;
    END IF;
    
    -- Add status_updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status_updated_at') THEN
        ALTER TABLE orders ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add status_updated_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status_updated_by') THEN
        ALTER TABLE orders ADD COLUMN status_updated_by VARCHAR(100);
    END IF;
END $$;

-- 2. Create order_status_history table for audit trail (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_notes TEXT
);

-- 3. Add foreign key constraint for order_status_history if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_status_history_order_id_fkey'
    ) THEN
        ALTER TABLE order_status_history 
        ADD CONSTRAINT order_status_history_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create admin_users table for authentication (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 5. Insert test admin user (only if it doesn't exist)
INSERT INTO admin_users (username, password_hash, full_name, email)
VALUES ('123', '$2b$10$rOzJJgROUJqGK4TlQ.Q8WOK1hwQ.qVT2V2E2PHuKJeO8RHqBiZxSu', 'Test Admin', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- 6. Create indexes for better performance (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
        CREATE INDEX idx_orders_status ON orders(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_created_at') THEN
        CREATE INDEX idx_orders_created_at ON orders(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_delivery_method') THEN
        CREATE INDEX idx_orders_delivery_method ON orders(delivery_method);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_status_history_order_id') THEN
        CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_status_history_changed_at') THEN
        CREATE INDEX idx_order_status_history_changed_at ON order_status_history(changed_at);
    END IF;
END $$;

-- 7. Update existing orders to have 'processing' status if they have 'pending' or NULL
UPDATE orders SET status = 'processing' WHERE status = 'pending' OR status IS NULL;

-- 8. Create view for order statistics
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_price) as total_value,
    AVG(total_price) as avg_value
FROM orders 
GROUP BY status;

-- Success message
SELECT 'Database migration completed successfully!' as message;