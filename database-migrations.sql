-- Database Schema Updates for Admin Panel
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Add status and delivery date tracking to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'processing',
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(50),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_updated_by VARCHAR(100);

-- 2. Create order_status_history table for audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_notes TEXT
);

-- 3. Create admin_users table for authentication
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

-- 4. Insert test admin user (username: 123, password: 123)
-- Password hash for '123' using bcrypt
INSERT INTO admin_users (username, password_hash, full_name, email)
VALUES ('123', '$2b$10$rOzJJgROUJqGK4TlQ.Q8WOK1hwQ.qVT2V2E2PHuKJeO8RHqBiZxSu', 'Test Admin', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at);

-- 6. Update existing orders to have 'processing' status if they have 'pending'
UPDATE orders SET status = 'processing' WHERE status = 'pending' OR status IS NULL;

-- 7. Add RLS (Row Level Security) policies for admin access
-- Enable RLS on tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Admin users can access all orders" ON orders;
CREATE POLICY "Admin users can access all orders" ON orders
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin users can access order history" ON order_status_history;
CREATE POLICY "Admin users can access order history" ON order_status_history
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin users can access own records" ON admin_users;
CREATE POLICY "Admin users can access own records" ON admin_users
    FOR SELECT USING (auth.uid()::text = id::text);

-- 8. Create view for order statistics
CREATE OR REPLACE VIEW order_statistics AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_price) as total_value,
    AVG(total_price) as avg_value
FROM orders 
GROUP BY status;

-- 9. Create function to update order status with history tracking
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id INTEGER,
    p_new_status VARCHAR(50),
    p_admin_username VARCHAR(100),
    p_admin_notes TEXT DEFAULT NULL,
    p_delivery_date DATE DEFAULT NULL,
    p_delivery_time_slot VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_customer_email VARCHAR(255);
    v_customer_name VARCHAR(255);
    v_delivery_method VARCHAR(50);
BEGIN
    -- Get current status and customer info
    SELECT status, customer_email, customer_name, delivery_method 
    INTO v_old_status, v_customer_email, v_customer_name, v_delivery_method
    FROM orders 
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- Update order status
    UPDATE orders 
    SET 
        status = p_new_status,
        status_updated_at = NOW(),
        status_updated_by = p_admin_username,
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        delivery_date = COALESCE(p_delivery_date, delivery_date),
        delivery_time_slot = COALESCE(p_delivery_time_slot, delivery_time_slot)
    WHERE id = p_order_id;
    
    -- Insert history record
    INSERT INTO order_status_history (
        order_id, 
        old_status, 
        new_status, 
        changed_by, 
        admin_notes
    ) VALUES (
        p_order_id, 
        v_old_status, 
        p_new_status, 
        p_admin_username, 
        p_admin_notes
    );
    
    RETURN TRUE;
END;
$$;