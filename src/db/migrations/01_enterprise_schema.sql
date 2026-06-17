-- ====================================================================
-- LAKNEXUS ENTERPRISE OMS - POSTGRESQL DATABASE MIGRATION SCRIPT
-- Version: 1.0.0
-- Created: 2026-06-11
-- Description: Database Schema definitions for high-throughput ERP and multi-branch sellers.
-- ====================================================================

-- Enable UUID Extension for enterprise-grade clustering
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PERMISSIONS (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    can_create BOOLEAN DEFAULT FALSE,
    can_read BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT unique_module_role UNIQUE (module_name, role_id)
);

-- Seed initial basic roles
INSERT INTO roles (name, description) VALUES
('Super Admin', 'Full control over all branches, financial records, configurations, and employees.'),
('Branch Manager', 'Manages branch operations, order approval, local inventory, and team members.'),
('Sales Staff', 'Creates and processes orders, manages customer queries, tracks pending payments.'),
('Warehouse Staff', 'Manages physical stocks, packages orders, handles returns, and records inventory movements.'),
('Finance Staff', 'Manages courier remittances, COD collections, expenses ledger, and financial reporting.');

-- Seed permissions matrix for roles (Sample placeholder)
-- Super Admin gets full CRUD across all modules.

-- 2. WAREHOUSES & LOCATIONS
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial warehoused branches
INSERT INTO warehouses (name, code, address, phone) VALUES
('Colombo Central Depot', 'COL-DEP-01', 'Pettah, Colombo 11, Sri Lanka', '0771234567'),
('Kandy Distribution Hub', 'KND-HUB-02', 'William Gopallawa Mawatha, Kandy, Sri Lanka', '0772345678'),
('Galle Coastal Depot', 'GAL-DEP-03', 'Matara Road, Galle, Sri Lanka', '0773456789');

-- 3. INTERMEDIATE STOCK TRACKING & ALERT SYSTEMS
CREATE TABLE IF NOT EXISTS product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(100) NOT NULL, -- references external product key or barcode
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_product_warehouse UNIQUE (product_id, warehouse_id)
);

-- 4. INVENTORY STOCK TRANSACTION HISTORY
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(100) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'DEDUCTION', 'RESTORATION', 'RESTOCK', 'MANUAL_ADJUSTMENT'
    quantity INT NOT NULL,
    balance_after INT NOT NULL,
    notes TEXT,
    created_by_user VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. COURIERS & CARRIER REGISTRATION
CREATE TABLE IF NOT EXISTS couriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) UNIQUE,
    contact_phone VARCHAR(50),
    base_wp_rate NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
    base_outstation_rate NUMERIC(10, 2) NOT NULL DEFAULT 450.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed primary Sri Lankan logistics
INSERT INTO couriers (name, code, contact_phone, base_wp_rate, base_outstation_rate) VALUES
('Koombiyo Logistics', 'KOOMBIYO', '0115999555', 350.00, 450.00),
('Domex express', 'DOMEX', '0117555666', 320.00, 430.00),
('Pronto Lanka', 'PRONTO', '0112575454', 380.00, 480.00),
('Fardar Express', 'FARDAR', '0114000300', 340.00, 440.00);

-- 6. SHIPMENTS & TRACKING METRIC TIMELINE
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) NOT NULL UNIQUE, -- references external OMS order text id
    courier_id UUID REFERENCES couriers(id),
    tracking_number VARCHAR(100),
    shipping_cost NUMERIC(10, 2) DEFAULT 0.00,
    shipping_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'
    dispatch_date DATE,
    delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CASH-ON-DELIVERY (COD) FINANCE MANAGERS
CREATE TABLE IF NOT EXISTS cod_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) NOT NULL UNIQUE,
    cod_amount NUMERIC(10, 2) NOT NULL,
    amount_collected NUMERIC(10, 2) DEFAULT 0.00,
    remittance_status VARCHAR(50) DEFAULT 'PENDING_REMITTANCE', -- 'PENDING_REMITTANCE', 'PARTIALLY_REMITTED', 'FULLY_REMITTED'
    courier_reference_no VARCHAR(100),
    remitted_at TIMESTAMP WITH TIME ZONE,
    reconciliation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. RETURN WORKFLOWS & CUSTOMER Refund tracker
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) NOT NULL UNIQUE,
    return_reason VARCHAR(255) NOT NULL,
    return_status VARCHAR(50) DEFAULT 'REQUESTED', -- 'REQUESTED', 'APPROVED', 'RECEIVED_AND_RESTOCKED', 'REJECTED'
    refund_status VARCHAR(50) DEFAULT 'NOT_REFUNDED', -- 'NOT_REFUNDED', 'PENDING_APPROVAL', 'REFUNDED'
    refund_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_by_user VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    is_restocked BOOLEAN DEFAULT FALSE,
    restocked_warehouse_id UUID REFERENCES warehouses(id)
);

-- 9. CHRONOLOGICAL ORDER TIMELINE EVENT SYSTEM
CREATE TABLE IF NOT EXISTS order_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'CREATED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED'
    event_description TEXT NOT NULL,
    logged_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SYSTEM ALERTS & EVENT NOTIFICATION CENTER
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'NEW_ORDER', 'LOW_STOCK', 'PAYMENT_RECEIVED', 'DELAYED_ORDER', 'RETURN_REQUEST'
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT LOGS FOR OPERATIONS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(150) NOT NULL,
    user_role VARCHAR(50),
    action_type VARCHAR(100) NOT NULL, -- 'CREATE_ORDER', 'APPROVE_RETURN', 'ADJUST_STOCK', 'LOGIN'
    module_name VARCHAR(100) NOT NULL,
    action_details TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Build quick operational indexes
CREATE INDEX idx_product_stock_prod_id ON product_stock(product_id);
CREATE INDEX idx_inventory_transactions_prod_id ON inventory_transactions(product_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_cod_collections_order_id ON cod_collections(order_id);
CREATE INDEX idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX idx_notifications_resolved ON notifications(resolved);
CREATE INDEX idx_audit_logs_user_email ON audit_logs(user_email);
