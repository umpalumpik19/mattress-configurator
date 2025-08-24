-- Создание таблиц для конфигуратора матрасов

-- Таблица слоев матрасов (прямое отражение layers-config.json)
CREATE TABLE mattress_layers (
    id SERIAL PRIMARY KEY,
    layer_id TEXT NOT NULL,
    layer_name TEXT NOT NULL,
    size TEXT NOT NULL,
    price INTEGER NOT NULL,
    available_heights INTEGER[] NOT NULL,
    icon_path TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица чехлов (прямое отражение covers из layers-config.json)
CREATE TABLE mattress_covers (
    id SERIAL PRIMARY KEY,
    cover_id TEXT NOT NULL,
    cover_name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    slug TEXT NOT NULL,
    icon_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_method TEXT NOT NULL DEFAULT 'pickup',
    payment_method TEXT NOT NULL DEFAULT 'card',
    delivery_address TEXT,
    delivery_city TEXT,
    delivery_postal_code TEXT,
    delivery_notes TEXT,
    mattress_configuration JSONB NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_mattress_layers_layer_id ON mattress_layers(layer_id);
CREATE INDEX idx_mattress_layers_size ON mattress_layers(size);
CREATE INDEX idx_mattress_covers_cover_id ON mattress_covers(cover_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Таблица администраторов
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- bcrypt хеш
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Создание администратора по умолчанию (пароль: 123)
-- Хеш для пароля '123': $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO admin_users (username, password, full_name, email) VALUES 
('123', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'admin@mattress-configurator.com');

-- Таблица истории изменения статусов заказов
CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by_admin_id INTEGER REFERENCES admin_users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_mattress_layers_updated_at BEFORE UPDATE ON mattress_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mattress_covers_updated_at BEFORE UPDATE ON mattress_covers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();