-- ============================================
-- FUNDSROOM ERP DATABASE SCHEMA
-- ============================================

-- ============================================
-- 1. USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 2. CUSTOMERS
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),

    business_name VARCHAR(150),
    gst_number VARCHAR(50),

    customer_type VARCHAR(20) NOT NULL
        CHECK (
            customer_type IN (
                'RETAIL',
                'WHOLESALE',
                'DISTRIBUTOR'
            )
        ),

    address TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'LEAD'
        CHECK (
            status IN (
                'LEAD',
                'ACTIVE',
                'INACTIVE'
            )
        ),

    follow_up_date DATE,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 3. FOLLOW UPS
-- ============================================

CREATE TABLE IF NOT EXISTS follow_ups (
    id SERIAL PRIMARY KEY,

    customer_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    follow_up_date DATE,

    created_by INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_followup_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_followup_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);


-- ============================================
-- 4. PRODUCTS
-- ============================================

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),

    unit_price DECIMAL(12,2) NOT NULL
        CHECK (unit_price >= 0),

    current_stock INTEGER NOT NULL DEFAULT 0
        CHECK (current_stock >= 0),

    minimum_stock INTEGER NOT NULL DEFAULT 0
        CHECK (minimum_stock >= 0),

    location VARCHAR(150),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- 5. STOCK MOVEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    movement_type VARCHAR(10) NOT NULL
        CHECK (
            movement_type IN (
                'IN',
                'OUT'
            )
        ),

    reason VARCHAR(255),

    created_by INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT fk_stock_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);


-- ============================================
-- 6. CHALLANS
-- ============================================

CREATE TABLE IF NOT EXISTS challans (
    id SERIAL PRIMARY KEY,

    challan_number VARCHAR(50) UNIQUE NOT NULL,

    customer_id INTEGER NOT NULL,

    total_quantity INTEGER NOT NULL DEFAULT 0,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (
            status IN (
                'DRAFT',
                'CONFIRMED',
                'CANCELLED'
            )
        ),

    created_by INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_challan_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    CONSTRAINT fk_challan_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
);


-- ============================================
-- 7. CHALLAN ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS challan_items (
    id SERIAL PRIMARY KEY,

    challan_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    -- Product snapshot
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    CONSTRAINT fk_challan_item_challan
        FOREIGN KEY (challan_id)
        REFERENCES challans(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_challan_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customers_name
ON customers(name);

CREATE INDEX IF NOT EXISTS idx_customers_mobile
ON customers(mobile);

CREATE INDEX IF NOT EXISTS idx_products_name
ON products(name);

CREATE INDEX IF NOT EXISTS idx_products_sku
ON products(sku);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product
ON stock_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_challans_customer
ON challans(customer_id);

CREATE INDEX IF NOT EXISTS idx_challan_items_challan
ON challan_items(challan_id);


-- ============================================
-- DONE
-- ============================================