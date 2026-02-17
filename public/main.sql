-- ============================================================================
-- SAAS ECOMMERCE MULTI-TENANT - SCHEMA CORE
-- ============================================================================
-- Author: Julio
-- Description: Core schema for multi-tenant ecommerce platform
-- Version: 1.0.0
-- ============================================================================

-- NOTE: Extensions should be created first using 00_setup_extensions.sql
-- Or run this in Supabase SQL Editor which has proper permissions

-- Enable necessary extensions (will skip if already exist)
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Extensions already exist or insufficient privileges. Continuing...';
    WHEN duplicate_object THEN
        RAISE NOTICE 'Extensions already exist. Continuing...';
END $$;

-- ============================================================================
-- ENUMS - Type Safety
-- ============================================================================

-- Subscription plans
CREATE TYPE subscription_plan AS ENUM (
    'free',
    'basic',
    'professional',
    'enterprise'
);

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
    'active',
    'cancelled',
    'suspended',
    'expired',
    'trial'
);

-- Tenant status
CREATE TYPE tenant_status AS ENUM (
    'active',
    'suspended',
    'pending',
    'cancelled'
);

-- Order status
CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'paid',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded',
    'partially_refunded'
);

-- Payment method
CREATE TYPE payment_method AS ENUM (
    'credit_card',
    'debit_card',
    'paypal',
    'stripe',
    'bank_transfer',
    'cash_on_delivery'
);

-- Product status
CREATE TYPE product_status AS ENUM (
    'draft',
    'active',
    'archived',
    'out_of_stock'
);

-- Discount type
CREATE TYPE discount_type AS ENUM (
    'percentage',
    'fixed_amount',
    'free_shipping'
);

-- Audit action type
CREATE TYPE audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'payment',
    'refund',
    'status_change'
);

-- ============================================================================
-- CORE TABLES - Tenant Management
-- ============================================================================

-- Tenants (Merchants/Stores)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Business Information
    business_name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- For subdomain: {slug}.yourplatform.com
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    
    -- Owner Information
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    
    -- Subscription
    plan subscription_plan DEFAULT 'free' NOT NULL,
    plan_status subscription_status DEFAULT 'trial' NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Status & Settings
    status tenant_status DEFAULT 'pending' NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    
    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#ffffff',
    accent_color VARCHAR(7) DEFAULT '#3b82f6',
    
    -- Business Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2), -- ISO 3166-1 alpha-2
    
    -- Settings JSON
    settings JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- Tenant Members (Multi-user support per tenant)
CREATE TABLE tenant_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role & Permissions
    role VARCHAR(50) DEFAULT 'member' NOT NULL,
    permissions JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, user_id)
);

-- Subscription History
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Subscription Details
    plan subscription_plan NOT NULL,
    status subscription_status NOT NULL,
    
    -- Billing
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Payment
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Category Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    
    -- Media
    image_url TEXT,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, slug)
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2), -- Original price for showing discount
    cost_price DECIMAL(10,2), -- For profit calculations
    
    -- Inventory
    track_inventory BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    allow_backorder BOOLEAN DEFAULT false,
    
    -- Physical Properties
    weight DECIMAL(10,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    dimensions JSONB, -- {length, width, height, unit}
    
    -- Status & Visibility
    status product_status DEFAULT 'draft' NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(tenant_id, slug),
    UNIQUE(tenant_id, sku)
);

-- Product Categories (Many-to-Many)
CREATE TABLE product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (product_id, category_id)
);

-- Product Images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Image Information
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    
    -- Image Properties
    width INTEGER,
    height INTEGER,
    size_bytes INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants (e.g., sizes, colors)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Variant Information
    name VARCHAR(255) NOT NULL, -- e.g., "Red / Large"
    sku VARCHAR(100),
    
    -- Pricing Override
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    
    -- Variant Options (stored as JSON for flexibility)
    options JSONB NOT NULL, -- e.g., {"color": "Red", "size": "Large"}
    
    -- Media
    image_url TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, sku)
);

-- Product Tags
CREATE TABLE product_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, slug)
);

-- Product Tags Association
CREATE TABLE product_tag_associations (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (product_id, tag_id)
);

COMMENT ON TABLE tenants IS 'Core tenant/merchant table - each store is a tenant';
COMMENT ON TABLE products IS 'Product catalog with full ecommerce features';
COMMENT ON TABLE product_variants IS 'Product variations (size, color, etc)';
COMMENT ON COLUMN tenants.slug IS 'URL-safe identifier for subdomain routing';
COMMENT ON COLUMN products.compare_at_price IS 'Original price to show discounts';

-- ============================================================================
-- ORDERS, CUSTOMERS & PAYMENTS
-- ============================================================================

-- Customers (Buyers)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- User Account (optional - can be guest)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Personal Information
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    
    -- Marketing
    accepts_marketing BOOLEAN DEFAULT false,
    
    -- Statistics
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, email)
);

-- Customer Addresses
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Address Details
    label VARCHAR(50), -- 'Home', 'Work', etc.
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
    phone VARCHAR(50),
    
    -- Flags
    is_default BOOLEAN DEFAULT false,
    is_billing_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Order Identification
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Order Details
    status order_status DEFAULT 'pending' NOT NULL,
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Currency
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    
    -- Customer Information Snapshot
    customer_email VARCHAR(255) NOT NULL,
    customer_first_name VARCHAR(100),
    customer_last_name VARCHAR(100),
    customer_phone VARCHAR(50),
    
    -- Shipping Address Snapshot
    shipping_first_name VARCHAR(100),
    shipping_last_name VARCHAR(100),
    shipping_company VARCHAR(255),
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(2),
    shipping_phone VARCHAR(50),
    
    -- Billing Address Snapshot
    billing_first_name VARCHAR(100),
    billing_last_name VARCHAR(100),
    billing_company VARCHAR(255),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(2),
    billing_phone VARCHAR(50),
    
    -- Shipping Details
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    tracking_url TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    customer_note TEXT,
    internal_note TEXT,
    
    -- IP & Browser
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Product Reference
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Product Snapshot (in case product is deleted)
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    variant_name VARCHAR(255),
    
    -- Pricing
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Product Snapshot Details
    product_snapshot JSONB, -- Full product details at time of purchase
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Status History
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Status Change
    old_status order_status,
    new_status order_status NOT NULL,
    
    -- Context
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    note TEXT,
    
    -- Notification
    customer_notified BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Payment Details
    payment_method payment_method NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    status payment_status DEFAULT 'pending' NOT NULL,
    
    -- Payment Gateway
    gateway VARCHAR(50), -- 'stripe', 'paypal', etc.
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Payment Method Details (encrypted card info, etc.)
    payment_details JSONB,
    
    -- Metadata
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Refund Details
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    
    -- Processing
    status payment_status DEFAULT 'pending' NOT NULL,
    gateway_refund_id VARCHAR(255),
    
    -- Authorization
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DISCOUNTS & COUPONS
-- ============================================================================

-- Discount Codes
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Code Information
    code VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Discount Configuration
    type discount_type NOT NULL,
    value DECIMAL(10,2) NOT NULL, -- Percentage (0-100) or fixed amount
    
    -- Usage Limits
    usage_limit INTEGER, -- Total uses allowed
    usage_count INTEGER DEFAULT 0,
    per_customer_limit INTEGER, -- Uses per customer
    minimum_purchase_amount DECIMAL(10,2),
    
    -- Applicability
    applies_to_products UUID[], -- Specific product IDs
    applies_to_categories UUID[], -- Specific category IDs
    
    -- Validity Period
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, code)
);

-- Discount Usage History
CREATE TABLE discount_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Usage Details
    discount_amount DECIMAL(10,2) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

-- Product Reviews
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review TEXT,
    
    -- Verification
    is_verified_purchase BOOLEAN DEFAULT false,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, product_id, customer_id, order_id)
);

COMMENT ON TABLE orders IS 'Customer orders with full snapshots of data at purchase time';
COMMENT ON TABLE order_items IS 'Individual line items in orders with price snapshots';
COMMENT ON TABLE discount_codes IS 'Coupon codes and promotional discounts';
COMMENT ON COLUMN orders.order_number IS 'Human-readable order number shown to customers';


-- ============================================================================
-- ANALYTICS, MEDIA & AUDIT LOGS
-- ============================================================================

-- ============================================================================
-- ANALYTICS
-- ============================================================================

-- Analytics Events (For tracking user behavior)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', etc.
    event_data JSONB,
    
    -- User Context
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Request Context
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    
    -- Product Context (if applicable)
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Sales Summary (Aggregated for performance)
CREATE TABLE daily_sales_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Date
    date DATE NOT NULL,
    
    -- Sales Metrics
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_items_sold INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    
    -- Customer Metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, date)
);

-- Product Performance (Top sellers, etc.)
CREATE TABLE product_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    views INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    units_sold INTEGER DEFAULT 0,
    
    -- Conversion Rates
    conversion_rate DECIMAL(5,2), -- Percentage
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, product_id, period_start, period_end)
);

-- ============================================================================
-- MEDIA MANAGEMENT
-- ============================================================================

-- Media Library
CREATE TABLE media_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- File Information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- File Properties
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL, -- bytes
    width INTEGER,
    height INTEGER,
    
    -- Organization
    folder VARCHAR(255) DEFAULT 'general',
    tags TEXT[],
    alt_text VARCHAR(255),
    
    -- Usage Tracking
    used_in JSONB, -- Track where this media is used
    
    -- Uploader
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

-- Email Templates (Per tenant customization)
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Template Information
    template_key VARCHAR(100) NOT NULL, -- 'order_confirmation', 'shipping_notification', etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Email Content
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    
    -- Variables (documentation of available variables)
    available_variables JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, template_key)
);

-- Email Logs
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Email Details
    template_key VARCHAR(100),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
    error_message TEXT,
    
    -- Context
    related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    related_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Email Provider Response
    provider VARCHAR(50), -- 'sendgrid', 'ses', 'mailgun', etc.
    provider_message_id VARCHAR(255),
    
    -- Metadata
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

-- Webhook Endpoints
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Endpoint Configuration
    url TEXT NOT NULL,
    secret_key VARCHAR(255) NOT NULL, -- For HMAC signature
    
    -- Event Subscriptions
    subscribed_events TEXT[] NOT NULL, -- ['order.created', 'order.updated', etc.]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Delivery Logs
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Delivery Attempt
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    http_status_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    
    -- Retry Logic
    attempt_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

-- Audit Logs (Track all important actions)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Actor
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Action Details
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'product', 'order', 'customer', etc.
    resource_id UUID,
    
    -- Changes (for update actions)
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SHIPPING & TAX
-- ============================================================================

-- Shipping Zones
CREATE TABLE shipping_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Zone Information
    name VARCHAR(255) NOT NULL,
    
    -- Countries/Regions
    countries VARCHAR(2)[], -- ISO codes
    states TEXT[], -- State/province names or codes
    postal_codes TEXT[], -- Specific postal codes or ranges
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping Rates
CREATE TABLE shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Rate Information
    name VARCHAR(255) NOT NULL, -- 'Standard Shipping', 'Express', etc.
    description TEXT,
    
    -- Pricing
    rate_type VARCHAR(50) NOT NULL, -- 'flat_rate', 'weight_based', 'price_based'
    rate_amount DECIMAL(10,2) NOT NULL,
    
    -- Conditions
    min_order_amount DECIMAL(10,2),
    max_order_amount DECIMAL(10,2),
    min_weight DECIMAL(10,2),
    max_weight DECIMAL(10,2),
    
    -- Delivery Time
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax Rates
CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Tax Information
    name VARCHAR(255) NOT NULL, -- 'VAT', 'Sales Tax', etc.
    rate DECIMAL(5,4) NOT NULL, -- Percentage in decimal (0.0825 = 8.25%)
    
    -- Applicability
    country VARCHAR(2), -- ISO code
    state VARCHAR(100),
    postal_codes TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS & PREFERENCES
-- ============================================================================

-- Tenant Settings (Key-Value Store for flexible settings)
CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Setting
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, setting_key)
);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all important actions';
COMMENT ON TABLE webhook_endpoints IS 'Webhook configurations for third-party integrations';
COMMENT ON TABLE email_templates IS 'Customizable email templates per tenant';
COMMENT ON TABLE daily_sales_summary IS 'Pre-aggregated daily sales data for fast analytics';


-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- ============================================================================
-- TENANTS & MEMBERS
-- ============================================================================

CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan ON tenants(plan);
CREATE INDEX idx_tenants_deleted_at ON tenants(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_role ON tenant_members(tenant_id, role);

CREATE INDEX idx_subscription_history_tenant_id ON subscription_history(tenant_id);
CREATE INDEX idx_subscription_history_created_at ON subscription_history(tenant_id, created_at DESC);

-- ============================================================================
-- PRODUCTS & CATEGORIES
-- ============================================================================

CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_categories_slug ON categories(tenant_id, slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(tenant_id, is_active);

CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_status ON products(tenant_id, status);
CREATE INDEX idx_products_featured ON products(tenant_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_published ON products(tenant_id, published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_products_stock ON products(tenant_id, stock_quantity) WHERE track_inventory = true;
CREATE INDEX idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NOT NULL;

-- Full-text search on products
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX idx_products_description_search ON products USING gin(to_tsvector('english', description));

CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_tenant ON product_images(tenant_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_tenant ON product_variants(tenant_id);
CREATE INDEX idx_product_variants_sku ON product_variants(tenant_id, sku);
CREATE INDEX idx_product_variants_active ON product_variants(tenant_id, is_active) WHERE is_active = true;

-- GIN index for JSONB options search
CREATE INDEX idx_product_variants_options ON product_variants USING gin(options);

CREATE INDEX idx_product_tags_tenant ON product_tags(tenant_id);
CREATE INDEX idx_product_tags_slug ON product_tags(tenant_id, slug);

CREATE INDEX idx_product_tag_assoc_product ON product_tag_associations(product_id);
CREATE INDEX idx_product_tag_assoc_tag ON product_tag_associations(tag_id);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(tenant_id, email);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_stats ON customers(tenant_id, total_spent DESC);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_tenant ON customer_addresses(tenant_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(customer_id, is_default) WHERE is_default = true;

-- ============================================================================
-- ORDERS
-- ============================================================================

CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_payment_status ON orders(tenant_id, payment_status);
CREATE INDEX idx_orders_created_at ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_customer_email ON orders(tenant_id, customer_email);
CREATE INDEX idx_orders_tracking ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_orders_tenant_status_created ON orders(tenant_id, status, created_at DESC);
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_tenant ON order_items(tenant_id);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id, created_at DESC);
CREATE INDEX idx_order_status_history_tenant ON order_status_history(tenant_id);

-- ============================================================================
-- PAYMENTS & REFUNDS
-- ============================================================================

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(tenant_id, status);
CREATE INDEX idx_payments_gateway_id ON payments(gateway_transaction_id);
CREATE INDEX idx_payments_created_at ON payments(tenant_id, created_at DESC);

CREATE INDEX idx_refunds_tenant_id ON refunds(tenant_id);
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(tenant_id, status);

-- ============================================================================
-- DISCOUNTS
-- ============================================================================

CREATE INDEX idx_discount_codes_tenant ON discount_codes(tenant_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(tenant_id, code);
CREATE INDEX idx_discount_codes_active ON discount_codes(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX idx_discount_codes_dates ON discount_codes(tenant_id, starts_at, ends_at);

-- GIN indexes for array columns
CREATE INDEX idx_discount_codes_products ON discount_codes USING gin(applies_to_products);
CREATE INDEX idx_discount_codes_categories ON discount_codes USING gin(applies_to_categories);

CREATE INDEX idx_discount_usage_discount ON discount_usage(discount_code_id);
CREATE INDEX idx_discount_usage_customer ON discount_usage(customer_id);
CREATE INDEX idx_discount_usage_tenant ON discount_usage(tenant_id);

-- ============================================================================
-- REVIEWS
-- ============================================================================

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_customer ON product_reviews(customer_id);
CREATE INDEX idx_product_reviews_tenant ON product_reviews(tenant_id);
CREATE INDEX idx_product_reviews_approved ON product_reviews(product_id, is_approved) WHERE is_approved = true;
CREATE INDEX idx_product_reviews_rating ON product_reviews(product_id, rating);
CREATE INDEX idx_product_reviews_created ON product_reviews(product_id, created_at DESC);

-- ============================================================================
-- ANALYTICS
-- ============================================================================

CREATE INDEX idx_analytics_events_tenant ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON analytics_events(tenant_id, event_type, created_at DESC);
CREATE INDEX idx_analytics_events_customer ON analytics_events(customer_id, created_at DESC);
CREATE INDEX idx_analytics_events_product ON analytics_events(product_id, created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id, created_at);

-- Partial index for product views
CREATE INDEX idx_analytics_product_views ON analytics_events(tenant_id, product_id, created_at) 
    WHERE event_type = 'product_view';

CREATE INDEX idx_daily_sales_tenant_date ON daily_sales_summary(tenant_id, date DESC);

CREATE INDEX idx_product_performance_tenant ON product_performance(tenant_id, period_start DESC);
CREATE INDEX idx_product_performance_product ON product_performance(product_id, period_start DESC);

-- ============================================================================
-- MEDIA
-- ============================================================================

CREATE INDEX idx_media_library_tenant ON media_library(tenant_id);
CREATE INDEX idx_media_library_folder ON media_library(tenant_id, folder);
CREATE INDEX idx_media_library_mime ON media_library(tenant_id, mime_type);
CREATE INDEX idx_media_library_uploaded_by ON media_library(uploaded_by);
CREATE INDEX idx_media_library_created ON media_library(tenant_id, created_at DESC);

-- GIN index for tags array
CREATE INDEX idx_media_library_tags ON media_library USING gin(tags);

-- ============================================================================
-- EMAIL & WEBHOOKS
-- ============================================================================

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_key ON email_templates(tenant_id, template_key);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id, created_at DESC);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(tenant_id, status);
CREATE INDEX idx_email_logs_order ON email_logs(related_order_id);

CREATE INDEX idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);
CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX idx_webhook_deliveries_endpoint ON webhook_deliveries(webhook_endpoint_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_tenant ON webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status, next_retry_at) WHERE status = 'failed';

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(tenant_id, resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(tenant_id, action, created_at DESC);

-- ============================================================================
-- SHIPPING & TAX
-- ============================================================================

CREATE INDEX idx_shipping_zones_tenant ON shipping_zones(tenant_id);
CREATE INDEX idx_shipping_zones_active ON shipping_zones(tenant_id, is_active) WHERE is_active = true;

-- GIN indexes for array columns
CREATE INDEX idx_shipping_zones_countries ON shipping_zones USING gin(countries);
CREATE INDEX idx_shipping_zones_states ON shipping_zones USING gin(states);

CREATE INDEX idx_shipping_rates_zone ON shipping_rates(shipping_zone_id);
CREATE INDEX idx_shipping_rates_tenant ON shipping_rates(tenant_id);
CREATE INDEX idx_shipping_rates_active ON shipping_rates(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX idx_tax_rates_tenant ON tax_rates(tenant_id);
CREATE INDEX idx_tax_rates_location ON tax_rates(tenant_id, country, state);
CREATE INDEX idx_tax_rates_active ON tax_rates(tenant_id, is_active) WHERE is_active = true;

-- ============================================================================
-- SETTINGS
-- ============================================================================

CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);
CREATE INDEX idx_tenant_settings_key ON tenant_settings(tenant_id, setting_key);

COMMENT ON INDEX idx_products_name_search IS 'Full-text search index for product names';
COMMENT ON INDEX idx_products_stock IS 'Partial index for inventory tracking queries';
COMMENT ON INDEX idx_discount_codes_products IS 'GIN index for product applicability array searches';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This ensures complete data isolation between tenants
-- Users can only access data belonging to their tenant(s)
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Get current user's tenant ID(s)
CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS UUID[] AS $$
    SELECT ARRAY_AGG(DISTINCT tenant_id)
    FROM tenant_members
    WHERE user_id = auth.uid()
    AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is tenant owner
CREATE OR REPLACE FUNCTION public.is_tenant_owner(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM tenants 
        WHERE id = check_tenant_id 
        AND owner_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'superadmin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Get user role in tenant
CREATE OR REPLACE FUNCTION public.user_tenant_role(check_tenant_id UUID)
RETURNS TEXT AS $$
    SELECT role
    FROM tenant_members
    WHERE tenant_id = check_tenant_id
    AND user_id = auth.uid()
    AND is_active = true
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tag_associations ENABLE ROW LEVEL SECURITY;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_performance ENABLE ROW LEVEL SECURITY;

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================

-- Superadmins can see all tenants
CREATE POLICY "Superadmins can view all tenants"
    ON tenants FOR SELECT
    TO authenticated
    USING (public.is_superadmin());

-- Users can view their own tenants
CREATE POLICY "Users can view their tenants"
    ON tenants FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid() 
        OR id = ANY(public.user_tenant_ids())
    );

-- Users can update their owned tenants
CREATE POLICY "Owners can update their tenants"
    ON tenants FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Users can create tenants (become owners)
CREATE POLICY "Authenticated users can create tenants"
    ON tenants FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- TENANT MEMBERS POLICIES
-- ============================================================================

CREATE POLICY "View tenant members"
    ON tenant_members FOR SELECT
    TO authenticated
    USING (
        tenant_id = ANY(public.user_tenant_ids())
        OR public.is_superadmin()
    );

CREATE POLICY "Tenant owners can manage members"
    ON tenant_members FOR ALL
    TO authenticated
    USING (public.is_tenant_owner(tenant_id))
    WITH CHECK (public.is_tenant_owner(tenant_id));

-- ============================================================================
-- PRODUCTS & CATALOG POLICIES
-- ============================================================================

-- Public read for active products (storefront)
CREATE POLICY "Public can view active products"
    ON products FOR SELECT
    TO anon, authenticated
    USING (
        status = 'active' 
        AND deleted_at IS NULL
    );

-- Tenant members can manage their products
CREATE POLICY "Tenant members can manage products"
    ON products FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

-- Similar policies for related tables
CREATE POLICY "Public can view active categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Tenant members manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Public can view product images"
    ON product_images FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Tenant members manage product images"
    ON product_images FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Public can view active variants"
    ON product_variants FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Tenant members manage variants"
    ON product_variants FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Public can view product tags"
    ON product_tags FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Tenant members manage tags"
    ON product_tags FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Public view tag associations"
    ON product_tag_associations FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Tenant members manage tag associations"
    ON product_tag_associations FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_tag_associations.product_id 
            AND tenant_id = ANY(public.user_tenant_ids())
        )
    );

CREATE POLICY "Public view product categories"
    ON product_categories FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Tenant members manage product categories"
    ON product_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_categories.product_id 
            AND tenant_id = ANY(public.user_tenant_ids())
        )
    );

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

CREATE POLICY "Customers can view their own data"
    ON customers FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR tenant_id = ANY(public.user_tenant_ids())
    );

CREATE POLICY "Tenant members can manage customers"
    ON customers FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

-- Allow anonymous customer creation during checkout
CREATE POLICY "Allow customer creation"
    ON customers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Customers manage their addresses"
    ON customer_addresses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = customer_addresses.customer_id 
            AND user_id = auth.uid()
        )
        OR tenant_id = ANY(public.user_tenant_ids())
    );

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================

-- Customers can view their own orders
CREATE POLICY "Customers view their orders"
    ON orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE id = orders.customer_id 
            AND user_id = auth.uid()
        )
        OR tenant_id = ANY(public.user_tenant_ids())
    );

-- Tenant members can manage all orders
CREATE POLICY "Tenant members manage orders"
    ON orders FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

-- Allow order creation during checkout
CREATE POLICY "Allow order creation"
    ON orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Order items follow order permissions
CREATE POLICY "View order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_items.order_id 
            AND (
                customer_id IN (
                    SELECT id FROM customers WHERE user_id = auth.uid()
                )
                OR tenant_id = ANY(public.user_tenant_ids())
            )
        )
    );

CREATE POLICY "Tenant members manage order items"
    ON order_items FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Allow order item creation"
    ON order_items FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "View order status history"
    ON order_status_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_status_history.order_id 
            AND (
                customer_id IN (
                    SELECT id FROM customers WHERE user_id = auth.uid()
                )
                OR tenant_id = ANY(public.user_tenant_ids())
            )
        )
    );

CREATE POLICY "Tenant members manage status history"
    ON order_status_history FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

-- ============================================================================
-- PAYMENTS & REFUNDS POLICIES
-- ============================================================================

CREATE POLICY "View payments"
    ON payments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = payments.order_id 
            AND (
                customer_id IN (
                    SELECT id FROM customers WHERE user_id = auth.uid()
                )
                OR tenant_id = ANY(public.user_tenant_ids())
            )
        )
    );

CREATE POLICY "Tenant members manage payments"
    ON payments FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Allow payment creation"
    ON payments FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "View refunds"
    ON refunds FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = refunds.order_id 
            AND (
                customer_id IN (
                    SELECT id FROM customers WHERE user_id = auth.uid()
                )
                OR tenant_id = ANY(public.user_tenant_ids())
            )
        )
    );

CREATE POLICY "Tenant members manage refunds"
    ON refunds FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

-- ============================================================================
-- DISCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Public can view active discounts"
    ON discount_codes FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Tenant members manage discounts"
    ON discount_codes FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Tenant members view discount usage"
    ON discount_usage FOR SELECT
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Allow discount usage tracking"
    ON discount_usage FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================

CREATE POLICY "Public can view approved reviews"
    ON product_reviews FOR SELECT
    TO anon, authenticated
    USING (is_approved = true);

CREATE POLICY "Customers can create reviews"
    ON product_reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can update their reviews"
    ON product_reviews FOR UPDATE
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Tenant members manage reviews"
    ON product_reviews FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

-- ============================================================================
-- ANALYTICS & MEDIA POLICIES
-- ============================================================================

CREATE POLICY "Tenant members view analytics"
    ON analytics_events FOR SELECT
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Allow analytics tracking"
    ON analytics_events FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Tenant members view sales summary"
    ON daily_sales_summary FOR SELECT
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Tenant members view performance"
    ON product_performance FOR SELECT
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Tenant members manage media"
    ON media_library FOR ALL
    TO authenticated
    USING (tenant_id = ANY(public.user_tenant_ids()))
    WITH CHECK (tenant_id = ANY(public.user_tenant_ids()));

CREATE POLICY "Public can view media"
    ON media_library FOR SELECT
    TO anon, authenticated
    USING (true);

-- ============================================================================
-- REMAINING TENANT-SCOPED TABLES
-- ============================================================================

-- Simple tenant-scoped policies for remaining tables
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'subscription_history',
            'email_templates',
            'email_logs',
            'webhook_endpoints',
            'webhook_deliveries',
            'audit_logs',
            'shipping_zones',
            'shipping_rates',
            'tax_rates',
            'tenant_settings'
        ])
    LOOP
        EXECUTE format('
            CREATE POLICY "Tenant members access %I"
            ON %I FOR ALL
            TO authenticated
            USING (tenant_id = ANY(public.user_tenant_ids()))
            WITH CHECK (tenant_id = ANY(public.user_tenant_ids()))
        ', tbl, tbl);
    END LOOP;
END $$;

COMMENT ON FUNCTION public.user_tenant_ids IS 'Returns array of tenant IDs the current user has access to';
COMMENT ON FUNCTION public.is_tenant_owner IS 'Checks if current user owns the specified tenant';
COMMENT ON FUNCTION public.is_superadmin IS 'Checks if current user is a superadmin';


-- ============================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- ============================================================================
-- TIMESTAMP TRIGGERS
-- ============================================================================

-- Función que crea el tenant automáticamente con manejo de colisiones
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    business_name TEXT;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Obtener el nombre del negocio de metadata o usar uno por defecto
    business_name := COALESCE(new.raw_user_meta_data->>'business_name', 'My Store');
    
    -- Generar slug base (solo a-z, 0-9 y -)
    base_slug := lower(trim(both '-' from regexp_replace(business_name, '[^a-zA-Z0-9]+', '-', 'g')));
    
    -- Si el slug queda vacío (ej. solo símbolos), usar 'store'
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'store';
    END IF;
    
    final_slug := base_slug;
    
    -- Manejar colisiones de slug/subdomain (añadir sufijo numérico)
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = final_slug OR subdomain = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    -- Insertar el nuevo tenant
    INSERT INTO public.tenants (
        business_name, 
        slug, 
        subdomain, 
        owner_id, 
        contact_email, 
        status, 
        plan
    )
    VALUES (
        business_name, 
        final_slug, 
        final_slug, 
        new.id, 
        new.email, 
        'active', 
        'free'
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- En caso de error, permitir que el usuario se cree pero registrar el error (o fallar según prefieras)
    -- Por ahora fallamos para que el registro sea atómico
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Asegurarse de que el trigger exista
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tablename 
            AND column_name = 'updated_at'
        )
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
        ', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- PRODUCT INVENTORY MANAGEMENT
-- ============================================================================

-- Function to check and update stock on order
CREATE OR REPLACE FUNCTION check_and_reserve_stock()
RETURNS TRIGGER AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    -- Check if product tracks inventory
    IF NEW.variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO available_stock
        FROM product_variants
        WHERE id = NEW.variant_id;
        
        IF available_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for variant. Available: %, Requested: %', 
                available_stock, NEW.quantity;
        END IF;
        
        -- Reserve stock
        UPDATE product_variants
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.variant_id;
        
    ELSE
        SELECT stock_quantity, track_inventory INTO available_stock
        FROM products
        WHERE id = NEW.product_id;
        
        IF available_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product. Available: %, Requested: %', 
                available_stock, NEW.quantity;
        END IF;
        
        -- Reserve stock
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id
        AND track_inventory = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reserve stock when order item is created
CREATE TRIGGER reserve_stock_on_order
    AFTER INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION check_and_reserve_stock();

-- Function to restore stock on order cancellation
CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Restore stock for all items in the order
        UPDATE products p
        SET stock_quantity = stock_quantity + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND oi.product_id = p.id
        AND oi.variant_id IS NULL
        AND p.track_inventory = true;
        
        UPDATE product_variants pv
        SET stock_quantity = stock_quantity + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
        AND oi.variant_id = pv.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restore_stock_on_order_cancel
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')
    EXECUTE FUNCTION restore_stock_on_cancel();

-- ============================================================================
-- ORDER CALCULATIONS
-- ============================================================================

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    items_subtotal DECIMAL(10,2);
BEGIN
    -- Calculate subtotal from order items
    SELECT COALESCE(SUM(total_amount), 0) INTO items_subtotal
    FROM order_items
    WHERE order_id = NEW.id;
    
    -- Update order with calculated values
    NEW.subtotal = items_subtotal;
    NEW.total_amount = items_subtotal + 
                      COALESCE(NEW.tax_amount, 0) + 
                      COALESCE(NEW.shipping_amount, 0) - 
                      COALESCE(NEW.discount_amount, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This would need to be called manually or via application logic
-- since we need order items to be inserted first

-- ============================================================================
-- CUSTOMER STATISTICS
-- ============================================================================

-- Update customer statistics on order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount
        WHERE id = NEW.customer_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Recalculate if order status changes
        IF OLD.status != NEW.status THEN
            UPDATE customers c
            SET 
                total_orders = (
                    SELECT COUNT(*) 
                    FROM orders 
                    WHERE customer_id = c.id 
                    AND status NOT IN ('cancelled', 'refunded')
                ),
                total_spent = (
                    SELECT COALESCE(SUM(total_amount), 0) 
                    FROM orders 
                    WHERE customer_id = c.id 
                    AND status NOT IN ('cancelled', 'refunded')
                )
            WHERE id = NEW.customer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_order_stats
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- ============================================================================
-- ORDER NUMBER GENERATION
-- ============================================================================

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    sequence_num INTEGER;
    new_order_number TEXT;
BEGIN
    -- Get tenant prefix (first 3 chars of slug, uppercase)
    SELECT UPPER(SUBSTRING(slug FROM 1 FOR 3)) INTO prefix
    FROM tenants
    WHERE id = NEW.tenant_id;
    
    -- Get next sequence number for this tenant
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1 INTO sequence_num
    FROM orders
    WHERE tenant_id = NEW.tenant_id;
    
    -- Format: PREFIX-YYYYMMDD-NNNN
    new_order_number = prefix || '-' || 
                       TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                       LPAD(sequence_num::TEXT, 4, '0');
    
    NEW.order_number = new_order_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- Generic audit log function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    tenant_id_val UUID;
    action_val audit_action;
BEGIN
    -- Determine tenant_id from the table
    IF TG_TABLE_NAME IN ('tenants') THEN
        tenant_id_val = COALESCE(NEW.id, OLD.id);
    ELSE
        tenant_id_val = COALESCE(NEW.tenant_id, OLD.tenant_id);
    END IF;
    
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        action_val = 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        action_val = 'update';
    ELSIF TG_OP = 'DELETE' THEN
        action_val = 'delete';
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        user_email,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        description
    ) VALUES (
        tenant_id_val,
        auth.uid(),
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        action_val,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        inet_client_addr(),
        TG_OP || ' on ' || TG_TABLE_NAME
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'orders',
            'products',
            'discount_codes',
            'tenants',
            'payments',
            'refunds'
        ])
    LOOP
        EXECUTE format('
            CREATE TRIGGER audit_%I
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION create_audit_log()
        ', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- ORDER STATUS HISTORY
-- ============================================================================

-- Automatically log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (
            order_id,
            tenant_id,
            old_status,
            new_status,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.tenant_id,
            OLD.status,
            NEW.status,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_order_status_changes
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_order_status_change();

-- ============================================================================
-- PRODUCT STATUS AUTO-UPDATE
-- ============================================================================

-- Automatically set product status to out_of_stock when stock reaches 0
CREATE OR REPLACE FUNCTION auto_update_product_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.track_inventory = true AND NEW.stock_quantity <= 0 THEN
        NEW.status = 'out_of_stock';
    ELSIF NEW.track_inventory = true AND NEW.stock_quantity > 0 AND OLD.status = 'out_of_stock' THEN
        NEW.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_status_on_stock_change
    BEFORE UPDATE ON products
    FOR EACH ROW
    WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
    EXECUTE FUNCTION auto_update_product_status();

-- ============================================================================
-- DISCOUNT CODE VALIDATION
-- ============================================================================

-- Validate discount code before usage
CREATE OR REPLACE FUNCTION validate_discount_code(
    p_tenant_id UUID,
    p_code VARCHAR,
    p_customer_id UUID,
    p_cart_total DECIMAL
) RETURNS TABLE (
    is_valid BOOLEAN,
    discount_id UUID,
    discount_amount DECIMAL,
    error_message TEXT
) AS $$
DECLARE
    v_discount discount_codes%ROWTYPE;
    v_usage_count INTEGER;
    v_customer_usage INTEGER;
    v_calculated_discount DECIMAL;
BEGIN
    -- Find the discount code
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE tenant_id = p_tenant_id
    AND code = p_code
    AND is_active = true;
    
    -- Check if code exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Invalid discount code';
        RETURN;
    END IF;
    
    -- Check validity period
    IF v_discount.starts_at IS NOT NULL AND NOW() < v_discount.starts_at THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Discount code not yet active';
        RETURN;
    END IF;
    
    IF v_discount.ends_at IS NOT NULL AND NOW() > v_discount.ends_at THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Discount code has expired';
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_discount.usage_limit IS NOT NULL THEN
        SELECT usage_count INTO v_usage_count FROM discount_codes WHERE id = v_discount.id;
        IF v_usage_count >= v_discount.usage_limit THEN
            RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Discount code usage limit reached';
            RETURN;
        END IF;
    END IF;
    
    -- Check per-customer limit
    IF v_discount.per_customer_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_customer_usage
        FROM discount_usage
        WHERE discount_code_id = v_discount.id
        AND customer_id = p_customer_id;
        
        IF v_customer_usage >= v_discount.per_customer_limit THEN
            RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'You have already used this discount code';
            RETURN;
        END IF;
    END IF;
    
    -- Check minimum purchase amount
    IF v_discount.minimum_purchase_amount IS NOT NULL AND p_cart_total < v_discount.minimum_purchase_amount THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 
            format('Minimum purchase of %s required', v_discount.minimum_purchase_amount);
        RETURN;
    END IF;
    
    -- Calculate discount amount
    IF v_discount.type = 'percentage' THEN
        v_calculated_discount = p_cart_total * (v_discount.value / 100);
    ELSIF v_discount.type = 'fixed_amount' THEN
        v_calculated_discount = v_discount.value;
    ELSIF v_discount.type = 'free_shipping' THEN
        v_calculated_discount = 0; -- Handled separately
    END IF;
    
    -- Return valid result
    RETURN QUERY SELECT true, v_discount.id, v_calculated_discount, ''::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ANALYTICS AGGREGATION
-- ============================================================================

-- Function to aggregate daily sales (run via cron)
CREATE OR REPLACE FUNCTION aggregate_daily_sales(p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS VOID AS $$
BEGIN
    INSERT INTO daily_sales_summary (
        tenant_id,
        date,
        total_orders,
        total_revenue,
        total_items_sold,
        average_order_value,
        new_customers,
        returning_customers
    )
    SELECT 
        o.tenant_id,
        p_date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_revenue,
        SUM(oi.quantity) as total_items_sold,
        AVG(o.total_amount) as average_order_value,
        COUNT(DISTINCT CASE WHEN c.created_at::DATE = p_date THEN c.id END) as new_customers,
        COUNT(DISTINCT CASE WHEN c.created_at::DATE < p_date THEN c.id END) as returning_customers
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.created_at::DATE = p_date
    AND o.status NOT IN ('cancelled', 'refunded')
    GROUP BY o.tenant_id
    ON CONFLICT (tenant_id, date) 
    DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_revenue = EXCLUDED.total_revenue,
        total_items_sold = EXCLUDED.total_items_sold,
        average_order_value = EXCLUDED.average_order_value,
        new_customers = EXCLUDED.new_customers,
        returning_customers = EXCLUDED.returning_customers,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_discount_code IS 'Validates discount code and calculates discount amount';
COMMENT ON FUNCTION aggregate_daily_sales IS 'Aggregates sales data for analytics - run daily via cron';

-- ============================================================================
-- DATABASE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- ============================================================================
-- PRODUCT VIEWS
-- ============================================================================

-- Complete product view with all relationships
CREATE OR REPLACE VIEW vw_products_complete AS
SELECT 
    p.*,
    t.business_name as tenant_name,
    t.slug as tenant_slug,
    
    -- Primary image
    (SELECT url FROM product_images 
     WHERE product_id = p.id AND is_primary = true 
     LIMIT 1) as primary_image_url,
    
    -- All images as JSON array
    (SELECT json_agg(json_build_object(
        'id', id,
        'url', url,
        'alt_text', alt_text,
        'sort_order', sort_order
    ) ORDER BY sort_order)
     FROM product_images 
     WHERE product_id = p.id) as images,
    
    -- Categories as JSON array
    (SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug
    ))
     FROM categories c
     INNER JOIN product_categories pc ON c.id = pc.category_id
     WHERE pc.product_id = p.id) as categories,
    
    -- Tags as JSON array
    (SELECT json_agg(json_build_object(
        'id', pt.id,
        'name', pt.name,
        'slug', pt.slug
    ))
     FROM product_tags pt
     INNER JOIN product_tag_associations pta ON pt.id = pta.tag_id
     WHERE pta.product_id = p.id) as tags,
    
    -- Variants as JSON array
    (SELECT json_agg(json_build_object(
        'id', pv.id,
        'name', pv.name,
        'sku', pv.sku,
        'price', pv.price,
        'stock_quantity', pv.stock_quantity,
        'options', pv.options,
        'is_active', pv.is_active
    ))
     FROM product_variants pv
     WHERE pv.product_id = p.id AND pv.is_active = true) as variants,
    
    -- Review statistics
    (SELECT COUNT(*) FROM product_reviews 
     WHERE product_id = p.id AND is_approved = true) as review_count,
    (SELECT AVG(rating)::DECIMAL(3,2) FROM product_reviews 
     WHERE product_id = p.id AND is_approved = true) as average_rating,
    
    -- Stock status
    CASE 
        WHEN p.track_inventory = false THEN 'available'
        WHEN p.stock_quantity > p.low_stock_threshold THEN 'in_stock'
        WHEN p.stock_quantity > 0 THEN 'low_stock'
        WHEN p.allow_backorder THEN 'backorder'
        ELSE 'out_of_stock'
    END as stock_status

FROM products p
INNER JOIN tenants t ON p.tenant_id = t.id
WHERE p.deleted_at IS NULL;

-- ============================================================================
-- ORDER VIEWS
-- ============================================================================

-- Orders with customer and item details
CREATE OR REPLACE VIEW vw_orders_complete AS
SELECT 
    o.*,
    
    -- Order items as JSON
    (SELECT json_agg(json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'product_sku', oi.product_sku,
        'variant_name', oi.variant_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_amount', oi.total_amount
    ))
     FROM order_items oi
     WHERE oi.order_id = o.id) as items,
    
    -- Item count
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
    
    -- Total items quantity
    (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) as total_items,
    
    -- Payment info
    (SELECT json_build_object(
        'id', p.id,
        'method', p.payment_method,
        'status', p.status,
        'gateway', p.gateway,
        'processed_at', p.processed_at
    )
     FROM payments p
     WHERE p.order_id = o.id
     ORDER BY p.created_at DESC
     LIMIT 1) as payment_info,
    
    -- Tenant info
    t.business_name as tenant_name,
    t.slug as tenant_slug

FROM orders o
INNER JOIN tenants t ON o.tenant_id = t.id;

-- Recent orders summary
CREATE OR REPLACE VIEW vw_recent_orders AS
SELECT 
    o.id,
    o.tenant_id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total_amount,
    o.currency,
    o.customer_email,
    o.customer_first_name,
    o.customer_last_name,
    o.created_at,
    
    -- Customer name
    CONCAT(o.customer_first_name, ' ', o.customer_last_name) as customer_name,
    
    -- Item count
    (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
    
    -- Days since order
    EXTRACT(DAY FROM NOW() - o.created_at) as days_ago

FROM orders o
WHERE o.created_at >= NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC;

-- ============================================================================
-- CUSTOMER VIEWS
-- ============================================================================

-- Customer lifetime value and statistics
CREATE OR REPLACE VIEW vw_customer_analytics AS
SELECT 
    c.*,
    
    -- Order statistics
    COUNT(DISTINCT o.id) as lifetime_orders,
    COALESCE(SUM(o.total_amount), 0) as lifetime_value,
    COALESCE(AVG(o.total_amount), 0) as average_order_value,
    
    -- First and last order dates
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date,
    
    -- Days since last order
    EXTRACT(DAY FROM NOW() - MAX(o.created_at)) as days_since_last_order,
    
    -- Customer segment
    CASE 
        WHEN COUNT(DISTINCT o.id) >= 10 THEN 'VIP'
        WHEN COUNT(DISTINCT o.id) >= 5 THEN 'Loyal'
        WHEN COUNT(DISTINCT o.id) >= 2 THEN 'Repeat'
        WHEN COUNT(DISTINCT o.id) = 1 THEN 'New'
        ELSE 'Prospect'
    END as customer_segment,
    
    -- Reviews given
    (SELECT COUNT(*) FROM product_reviews pr 
     WHERE pr.customer_id = c.id) as reviews_count

FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id 
    AND o.status NOT IN ('cancelled', 'refunded')
GROUP BY c.id;

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Daily dashboard metrics
CREATE OR REPLACE VIEW vw_daily_dashboard AS
SELECT 
    tenant_id,
    
    -- Today's metrics
    COALESCE(SUM(CASE WHEN created_at::DATE = CURRENT_DATE THEN total_amount END), 0) as today_revenue,
    COUNT(CASE WHEN created_at::DATE = CURRENT_DATE THEN id END) as today_orders,
    
    -- Yesterday's metrics
    COALESCE(SUM(CASE WHEN created_at::DATE = CURRENT_DATE - 1 THEN total_amount END), 0) as yesterday_revenue,
    COUNT(CASE WHEN created_at::DATE = CURRENT_DATE - 1 THEN id END) as yesterday_orders,
    
    -- This week
    COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN total_amount END), 0) as week_revenue,
    COUNT(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN id END) as week_orders,
    
    -- This month
    COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total_amount END), 0) as month_revenue,
    COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN id END) as month_orders,
    
    -- Last month
    COALESCE(SUM(CASE 
        WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
        THEN total_amount END), 0) as last_month_revenue,
    COUNT(CASE 
        WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
        THEN id END) as last_month_orders,
    
    -- Average order value
    AVG(CASE WHEN created_at >= CURRENT_DATE - 30 THEN total_amount END) as avg_order_value_30d

FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY tenant_id;

-- Top selling products
CREATE OR REPLACE VIEW vw_top_products AS
SELECT 
    p.id as product_id,
    p.tenant_id,
    p.name as product_name,
    p.sku,
    p.price,
    
    -- Sales in last 30 days
    COUNT(oi.id) as orders_count_30d,
    SUM(oi.quantity) as units_sold_30d,
    SUM(oi.total_amount) as revenue_30d,
    
    -- All time
    (SELECT COUNT(*) FROM order_items WHERE product_id = p.id) as orders_count_all_time,
    (SELECT SUM(quantity) FROM order_items WHERE product_id = p.id) as units_sold_all_time,
    (SELECT SUM(total_amount) FROM order_items WHERE product_id = p.id) as revenue_all_time,
    
    -- Current stock
    p.stock_quantity,
    
    -- Last sold
    MAX(o.created_at) as last_sold_at

FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id 
    AND o.status NOT IN ('cancelled', 'refunded')
    AND o.created_at >= CURRENT_DATE - 30
WHERE p.deleted_at IS NULL
GROUP BY p.id
ORDER BY units_sold_30d DESC NULLS LAST;

-- Low stock alerts
CREATE OR REPLACE VIEW vw_low_stock_alerts AS
SELECT 
    p.id,
    p.tenant_id,
    p.name,
    p.sku,
    p.stock_quantity,
    p.low_stock_threshold,
    
    -- Days of stock remaining (based on 30-day average)
    CASE 
        WHEN p.stock_quantity = 0 THEN 0
        WHEN COALESCE(sales.avg_daily_sales, 0) = 0 THEN 999
        ELSE (p.stock_quantity / NULLIF(sales.avg_daily_sales, 0))::INTEGER
    END as days_of_stock_remaining,
    
    -- Sales velocity
    COALESCE(sales.total_sales_30d, 0) as sales_last_30_days,
    COALESCE(sales.avg_daily_sales, 0) as average_daily_sales,
    
    -- Primary image
    (SELECT url FROM product_images 
     WHERE product_id = p.id AND is_primary = true 
     LIMIT 1) as image_url

FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        SUM(quantity) as total_sales_30d,
        AVG(quantity) as avg_daily_sales
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    WHERE o.created_at >= CURRENT_DATE - 30
    AND o.status NOT IN ('cancelled', 'refunded')
    GROUP BY product_id
) sales ON p.id = sales.product_id
WHERE p.track_inventory = true
AND p.deleted_at IS NULL
AND (
    p.stock_quantity <= p.low_stock_threshold
    OR p.stock_quantity = 0
)
ORDER BY 
    CASE WHEN p.stock_quantity = 0 THEN 0 ELSE 1 END,
    days_of_stock_remaining ASC;

-- ============================================================================
-- DISCOUNT VIEWS
-- ============================================================================

-- Active discount codes with usage stats
CREATE OR REPLACE VIEW vw_active_discounts AS
SELECT 
    dc.*,
    
    -- Usage statistics
    (SELECT COUNT(*) FROM discount_usage WHERE discount_code_id = dc.id) as times_used,
    (SELECT COUNT(DISTINCT customer_id) FROM discount_usage WHERE discount_code_id = dc.id) as unique_customers,
    (SELECT SUM(discount_amount) FROM discount_usage WHERE discount_code_id = dc.id) as total_discount_given,
    
    -- Remaining uses
    CASE 
        WHEN dc.usage_limit IS NULL THEN NULL
        ELSE dc.usage_limit - dc.usage_count
    END as remaining_uses,
    
    -- Status
    CASE 
        WHEN dc.ends_at IS NOT NULL AND dc.ends_at < NOW() THEN 'expired'
        WHEN dc.starts_at IS NOT NULL AND dc.starts_at > NOW() THEN 'scheduled'
        WHEN dc.usage_limit IS NOT NULL AND dc.usage_count >= dc.usage_limit THEN 'used_up'
        WHEN dc.is_active = false THEN 'inactive'
        ELSE 'active'
    END as discount_status

FROM discount_codes dc
WHERE dc.is_active = true
ORDER BY dc.created_at DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW vw_products_complete IS 'Complete product view with images, categories, tags, variants, and reviews';
COMMENT ON VIEW vw_orders_complete IS 'Orders with full customer and items detail';
COMMENT ON VIEW vw_customer_analytics IS 'Customer lifetime value and segmentation';
COMMENT ON VIEW vw_top_products IS 'Best selling products with sales metrics';
COMMENT ON VIEW vw_low_stock_alerts IS 'Products that need restocking';

-- ============================================================================
-- SEED DATA & INITIAL SETUP
-- ============================================================================

-- ============================================================================
-- DEFAULT EMAIL TEMPLATES
-- ============================================================================

-- Function to create default email templates for a tenant
CREATE OR REPLACE FUNCTION create_default_email_templates(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Order Confirmation
    INSERT INTO email_templates (tenant_id, template_key, name, subject, body_html, body_text, available_variables)
    VALUES (
        p_tenant_id,
        'order_confirmation',
        'Order Confirmation',
        'Order Confirmation - {{order_number}}',
        '<h1>Thank you for your order!</h1>
        <p>Hi {{customer_name}},</p>
        <p>Your order <strong>{{order_number}}</strong> has been received and is being processed.</p>
        <h2>Order Details</h2>
        <p>Order Total: {{order_total}}</p>
        <p>You can track your order at: {{order_url}}</p>
        <p>Thank you for shopping with us!</p>',
        'Thank you for your order!
        
        Hi {{customer_name}},
        
        Your order {{order_number}} has been received and is being processed.
        Order Total: {{order_total}}
        
        Track your order: {{order_url}}',
        '{"customer_name": "Customer full name", "order_number": "Order reference", "order_total": "Total amount", "order_url": "Order tracking URL"}'::jsonb
    );
    
    -- Shipping Notification
    INSERT INTO email_templates (tenant_id, template_key, name, subject, body_html, body_text, available_variables)
    VALUES (
        p_tenant_id,
        'shipping_notification',
        'Shipping Notification',
        'Your order {{order_number}} has been shipped!',
        '<h1>Your order is on its way!</h1>
        <p>Hi {{customer_name}},</p>
        <p>Great news! Your order <strong>{{order_number}}</strong> has been shipped.</p>
        <p>Tracking Number: <strong>{{tracking_number}}</strong></p>
        <p>Track your shipment: <a href="{{tracking_url}}">{{tracking_url}}</a></p>',
        'Your order is on its way!
        
        Hi {{customer_name}},
        
        Your order {{order_number}} has been shipped.
        Tracking Number: {{tracking_number}}
        
        Track shipment: {{tracking_url}}',
        '{"customer_name": "Customer full name", "order_number": "Order reference", "tracking_number": "Shipment tracking code", "tracking_url": "Tracking URL"}'::jsonb
    );
    
    -- Order Cancelled
    INSERT INTO email_templates (tenant_id, template_key, name, subject, body_html, body_text, available_variables)
    VALUES (
        p_tenant_id,
        'order_cancelled',
        'Order Cancelled',
        'Order {{order_number}} has been cancelled',
        '<h1>Order Cancelled</h1>
        <p>Hi {{customer_name}},</p>
        <p>Your order <strong>{{order_number}}</strong> has been cancelled.</p>
        <p>Reason: {{cancellation_reason}}</p>
        <p>If you have any questions, please contact us.</p>',
        'Order Cancelled
        
        Hi {{customer_name}},
        
        Your order {{order_number}} has been cancelled.
        Reason: {{cancellation_reason}}',
        '{"customer_name": "Customer full name", "order_number": "Order reference", "cancellation_reason": "Reason for cancellation"}'::jsonb
    );
    
    -- Refund Processed
    INSERT INTO email_templates (tenant_id, template_key, name, subject, body_html, body_text, available_variables)
    VALUES (
        p_tenant_id,
        'refund_processed',
        'Refund Processed',
        'Refund processed for order {{order_number}}',
        '<h1>Refund Processed</h1>
        <p>Hi {{customer_name}},</p>
        <p>A refund of <strong>{{refund_amount}}</strong> has been processed for order {{order_number}}.</p>
        <p>The refund should appear in your account within 5-10 business days.</p>',
        'Refund Processed
        
        Hi {{customer_name}},
        
        A refund of {{refund_amount}} has been processed for order {{order_number}}.
        The refund should appear in your account within 5-10 business days.',
        '{"customer_name": "Customer full name", "order_number": "Order reference", "refund_amount": "Refunded amount"}'::jsonb
    );
    
    -- Welcome Email
    INSERT INTO email_templates (tenant_id, template_key, name, subject, body_html, body_text, available_variables)
    VALUES (
        p_tenant_id,
        'customer_welcome',
        'Welcome Email',
        'Welcome to {{store_name}}!',
        '<h1>Welcome to {{store_name}}!</h1>
        <p>Hi {{customer_name}},</p>
        <p>Thank you for creating an account with us.</p>
        <p>Start shopping now and enjoy exclusive benefits!</p>
        <p><a href="{{shop_url}}">Visit Our Store</a></p>',
        'Welcome to {{store_name}}!
        
        Hi {{customer_name}},
        
        Thank you for creating an account with us.
        Visit our store: {{shop_url}}',
        '{"customer_name": "Customer full name", "store_name": "Store name", "shop_url": "Store URL"}'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT TENANT SETTINGS
-- ============================================================================

-- Function to create default settings for a tenant
CREATE OR REPLACE FUNCTION create_default_tenant_settings(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    -- General Settings
    INSERT INTO tenant_settings (tenant_id, setting_key, setting_value, setting_type)
    VALUES 
        (p_tenant_id, 'currency', '"USD"', 'string'),
        (p_tenant_id, 'timezone', '"America/New_York"', 'string'),
        (p_tenant_id, 'weight_unit', '"kg"', 'string'),
        (p_tenant_id, 'dimension_unit', '"cm"', 'string'),
        
        -- Checkout Settings
        (p_tenant_id, 'allow_guest_checkout', 'true', 'boolean'),
        (p_tenant_id, 'require_account', 'false', 'boolean'),
        (p_tenant_id, 'auto_fulfill_digital_orders', 'true', 'boolean'),
        
        -- Inventory Settings
        (p_tenant_id, 'low_stock_threshold', '10', 'number'),
        (p_tenant_id, 'track_inventory_by_default', 'true', 'boolean'),
        
        -- Email Settings
        (p_tenant_id, 'send_order_confirmation', 'true', 'boolean'),
        (p_tenant_id, 'send_shipping_notification', 'true', 'boolean'),
        
        -- Tax Settings
        (p_tenant_id, 'tax_included_in_prices', 'false', 'boolean'),
        (p_tenant_id, 'charge_tax', 'true', 'boolean'),
        
        -- Shipping Settings
        (p_tenant_id, 'free_shipping_threshold', '50', 'number')
    ON CONFLICT (tenant_id, setting_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Create a demo tenant (only for development/testing)
DO $$
DECLARE
    demo_tenant_id UUID;
    demo_user_id UUID;
    demo_customer_id UUID;
    demo_product_id UUID;
    demo_category_id UUID;
    demo_order_id UUID;
BEGIN
    -- Note: In production, this should not be run
    -- This is just for testing purposes
    
    -- Check if we're in a test environment
    -- IF current_database() NOT LIKE '%_test%' THEN
    --     RETURN;
    -- END IF;
    
    -- Create demo user (would normally come from auth.users)
    -- INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'demo@example.com')
    -- RETURNING id INTO demo_user_id;
    
    -- For now, just use a UUID
    demo_user_id := gen_random_uuid();
    demo_tenant_id := gen_random_uuid();
    
    -- Create demo tenant
    -- INSERT INTO tenants (
    --     id,
    --     owner_id,
    --     business_name,
    --     slug,
    --     subdomain,
    --     contact_email,
    --     status,
    --     plan,
    --     is_verified
    -- ) VALUES (
    --     demo_tenant_id,
    --     demo_user_id,
    --     'Demo Store',
    --     'demo-store',
    --     'demo-store',
    --     'demo@example.com',
    --     'active',
    --     'professional',
    --     true
    -- );
    
    -- Create default email templates
    -- PERFORM create_default_email_templates(demo_tenant_id);
    
    -- Create default settings
    -- PERFORM create_default_tenant_settings(demo_tenant_id);
    
    RAISE NOTICE 'Sample data creation commented out. Uncomment in test environments only.';
END $$;

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- ============================================================================

-- Get or create customer by email
CREATE OR REPLACE FUNCTION get_or_create_customer(
    p_tenant_id UUID,
    p_email VARCHAR,
    p_first_name VARCHAR DEFAULT NULL,
    p_last_name VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- Try to find existing customer
    SELECT id INTO v_customer_id
    FROM customers
    WHERE tenant_id = p_tenant_id
    AND email = p_email;
    
    -- If not found, create new customer
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (
            tenant_id,
            user_id,
            email,
            first_name,
            last_name,
            phone
        ) VALUES (
            p_tenant_id,
            p_user_id,
            p_email,
            p_first_name,
            p_last_name,
            p_phone
        )
        RETURNING id INTO v_customer_id;
    END IF;
    
    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Search products (full-text search)
CREATE OR REPLACE FUNCTION search_products(
    p_tenant_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    price DECIMAL,
    stock_quantity INTEGER,
    primary_image_url TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock_quantity,
        (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image_url,
        ts_rank(
            to_tsvector('english', p.name || ' ' || COALESCE(p.description, '')),
            plainto_tsquery('english', p_query)
        ) as rank
    FROM products p
    WHERE p.tenant_id = p_tenant_id
    AND p.status = 'active'
    AND p.deleted_at IS NULL
    AND (
        to_tsvector('english', p.name || ' ' || COALESCE(p.description, ''))
        @@ plainto_tsquery('english', p_query)
    )
    ORDER BY rank DESC, p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Get tenant by subdomain or custom domain
CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain VARCHAR)
RETURNS TABLE (
    id UUID,
    business_name VARCHAR,
    slug VARCHAR,
    subdomain VARCHAR,
    custom_domain VARCHAR,
    status tenant_status,
    logo_url TEXT,
    primary_color VARCHAR,
    secondary_color VARCHAR,
    accent_color VARCHAR,
    settings JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.business_name,
        t.slug,
        t.subdomain,
        t.custom_domain,
        t.status,
        t.logo_url,
        t.primary_color,
        t.secondary_color,
        t.accent_color,
        t.settings
    FROM tenants t
    WHERE t.subdomain = p_domain
    OR t.custom_domain = p_domain
    AND t.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_default_email_templates IS 'Creates default email templates for a new tenant';
COMMENT ON FUNCTION create_default_tenant_settings IS 'Creates default settings for a new tenant';
COMMENT ON FUNCTION get_or_create_customer IS 'Finds existing customer or creates new one';
COMMENT ON FUNCTION search_products IS 'Full-text search for products';
COMMENT ON FUNCTION get_tenant_by_domain IS 'Resolves tenant by subdomain or custom domain';