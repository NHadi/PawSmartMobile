-- ============================================================================
-- PawSmart Database Schema (PostgreSQL)
-- Version: 1.0
-- Last Updated: 2025-10-08
-- Database: PostgreSQL 14+
-- ============================================================================

-- Drop existing database if needed (uncomment to use)
-- DROP DATABASE IF EXISTS pawsmart;
-- CREATE DATABASE pawsmart;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SEQUENCES
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS order_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS appointment_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS grooming_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS hotel_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

-- ============================================================================
-- SECTION 1: USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    provider VARCHAR(50), -- 'local', 'google', 'facebook', 'apple'
    social_id VARCHAR(255),
    partner_id INTEGER,
    company_id INTEGER,
    role VARCHAR(50) DEFAULT 'customer', -- 'customer', 'admin', 'tenant'
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_social ON users(provider, social_id);

-- ============================================================================

CREATE TABLE user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL, -- 'access', 'refresh', 'reset', 'verification'
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_user ON user_tokens(user_id);
CREATE INDEX idx_tokens_token ON user_tokens(token);
CREATE INDEX idx_tokens_type ON user_tokens(token_type);

-- ============================================================================

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    device_type VARCHAR(50), -- 'ios', 'android', 'web'
    device_token TEXT, -- For push notifications
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_device ON user_sessions(device_id);

-- ============================================================================

CREATE TABLE otp_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    email VARCHAR(255),
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'login', 'register', 'reset_password'
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_user ON otp_codes(user_id);
CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_code ON otp_codes(code);

-- ============================================================================
-- SECTION 2: PARTNERS & COMPANIES
-- ============================================================================

CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    postal_code VARCHAR(10),
    partner_type VARCHAR(50), -- 'customer', 'supplier', 'tenant'
    tax_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partners_email ON partners(email);

-- ============================================================================

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Indonesia',
    postal_code VARCHAR(10),
    tax_id VARCHAR(50),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys to users table
ALTER TABLE users
    ADD CONSTRAINT fk_users_partner FOREIGN KEY (partner_id) REFERENCES partners(id),
    ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id);

-- ============================================================================
-- SECTION 3: INDONESIA ADDRESS DATA
-- ============================================================================

CREATE TABLE indonesia_provinces (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE INDEX idx_provinces_code ON indonesia_provinces(code);

-- ============================================================================

CREATE TABLE indonesia_cities (
    id SERIAL PRIMARY KEY,
    province_id INTEGER REFERENCES indonesia_provinces(id),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) -- 'Kota', 'Kabupaten'
);

CREATE INDEX idx_cities_province ON indonesia_cities(province_id);
CREATE INDEX idx_cities_code ON indonesia_cities(code);

-- ============================================================================

CREATE TABLE indonesia_districts (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES indonesia_cities(id),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE INDEX idx_districts_city ON indonesia_districts(city_id);

-- ============================================================================

CREATE TABLE indonesia_subdistricts (
    id SERIAL PRIMARY KEY,
    district_id INTEGER REFERENCES indonesia_districts(id),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10)
);

CREATE INDEX idx_subdistricts_district ON indonesia_subdistricts(district_id);

-- ============================================================================

CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id),
    label VARCHAR(100), -- 'Home', 'Office', etc
    recipient_name VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    district VARCHAR(100), -- Kecamatan
    subdistrict VARCHAR(100), -- Kelurahan
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL, -- Province
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'Indonesia',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_partner ON addresses(partner_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);
CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_state ON addresses(state);

-- ============================================================================
-- SECTION 4: DOCTORS & APPOINTMENTS
-- ============================================================================

CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    qualification TEXT,
    experience_years INTEGER,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    photo VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    location VARCHAR(255),
    consultation_fee DECIMAL(12, 2),
    home_service_fee DECIMAL(12, 2),
    is_available BOOLEAN DEFAULT TRUE,
    available_days JSONB, -- ['monday', 'tuesday', ...]
    working_hours JSONB, -- {start: '09:00', end: '17:00'}
    languages JSONB, -- ['Indonesian', 'English']
    certifications JSONB, -- [{name, issuer, year}]
    offers_walk_in BOOLEAN DEFAULT TRUE,
    offers_home_service BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctors_user ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_available ON doctors(is_available, is_active);
CREATE INDEX idx_doctors_recommended ON doctors(is_recommended);

-- ============================================================================

CREATE TABLE doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc
    date DATE, -- Specific date override
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30, -- in minutes
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX idx_schedules_date ON doctor_schedules(date);
CREATE INDEX idx_schedules_day ON doctor_schedules(day_of_week);

-- ============================================================================
-- SECTION 5: PETS
-- ============================================================================

CREATE TABLE pets (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'other'
    breed VARCHAR(100),
    age INTEGER,
    weight DECIMAL(10, 2),
    color VARCHAR(100),
    gender VARCHAR(10), -- 'male', 'female'
    microchip_id VARCHAR(100),
    birth_date DATE,
    photo VARCHAR(500),
    medical_history TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_microchip ON pets(microchip_id);

-- ============================================================================

CREATE TABLE pet_vaccinations (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    veterinarian VARCHAR(255),
    clinic VARCHAR(255),
    batch_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vaccinations_pet ON pet_vaccinations(pet_id);
CREATE INDEX idx_vaccinations_date ON pet_vaccinations(next_due_date);

-- ============================================================================

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    appointment_number VARCHAR(100) UNIQUE NOT NULL,
    doctor_id INTEGER REFERENCES doctors(id),
    user_id INTEGER REFERENCES users(id),
    partner_id INTEGER REFERENCES partners(id),
    pet_id INTEGER REFERENCES pets(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR(50), -- 'walk-in', 'home-service'
    reason TEXT,
    symptoms TEXT,
    state VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, done, cancelled, no_show
    additional_services JSONB, -- [{service_name, price}]
    consultation_fee DECIMAL(12, 2),
    service_fee DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, paid, refunded
    has_prescription BOOLEAN DEFAULT FALSE,
    has_medical_record BOOLEAN DEFAULT FALSE,
    address_id INTEGER REFERENCES addresses(id), -- For home service
    notes TEXT,
    cancelled_reason TEXT,
    cancelled_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_pet ON appointments(pet_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_state ON appointments(state);
CREATE INDEX idx_appointments_number ON appointments(appointment_number);

-- ============================================================================

CREATE TABLE pet_medical_records (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id),
    doctor_id INTEGER REFERENCES doctors(id),
    record_date DATE NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    treatment TEXT,
    prescriptions JSONB, -- [{name, dosage, frequency, duration}]
    vital_signs JSONB, -- {weight, temperature, heart_rate, etc}
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    attachments JSONB, -- [{filename, url, type}]
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_records_pet ON pet_medical_records(pet_id);
CREATE INDEX idx_medical_records_doctor ON pet_medical_records(doctor_id);
CREATE INDEX idx_medical_records_date ON pet_medical_records(record_date);

-- ============================================================================

CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id),
    doctor_id INTEGER REFERENCES doctors(id),
    prescription_date DATE NOT NULL,
    medications JSONB NOT NULL, -- [{name, dosage, frequency, duration, notes}]
    instructions TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_pet ON prescriptions(pet_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);

-- ============================================================================
-- SECTION 6: PRODUCTS
-- ============================================================================

CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    parent_id INTEGER REFERENCES product_categories(id),
    description TEXT,
    image VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent ON product_categories(parent_id);
CREATE INDEX idx_categories_active ON product_categories(is_active);

-- ============================================================================

CREATE TABLE product_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    logo VARCHAR(500),
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_name ON product_brands(name);

-- ============================================================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    description_sale TEXT,
    category_id INTEGER REFERENCES product_categories(id),
    brand_id INTEGER REFERENCES product_brands(id),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    list_price DECIMAL(12, 2) NOT NULL,
    standard_price DECIMAL(12, 2), -- Cost price
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IDR',
    uom_name VARCHAR(50) DEFAULT 'Unit',
    qty_available INTEGER DEFAULT 0,
    virtual_available INTEGER DEFAULT 0,
    weight DECIMAL(10, 2), -- in kg
    volume DECIMAL(10, 2), -- in m3
    image_1920 TEXT, -- Base64 or URL
    image_128 TEXT, -- Thumbnail
    is_active BOOLEAN DEFAULT TRUE,
    sale_ok BOOLEAN DEFAULT TRUE,
    purchase_ok BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_active ON products(is_active, sale_ok);
CREATE INDEX idx_products_price ON products(list_price);
CREATE INDEX idx_products_recommended ON products(is_recommended);

-- ============================================================================

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL, -- Original/full resolution image
    thumbnail_url VARCHAR(500), -- Small thumbnail (128x128)
    medium_url VARCHAR(500), -- Medium size (512x512)
    large_url VARCHAR(500), -- Large size (1024x1024)
    image_type VARCHAR(50), -- 'main', 'gallery', 'thumbnail'
    is_primary BOOLEAN DEFAULT FALSE, -- Main product image flag
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- ============================================================================

CREATE TABLE product_stock_moves (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    move_type VARCHAR(50), -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reference VARCHAR(255), -- Order ID, etc
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_moves_product ON product_stock_moves(product_id);
CREATE INDEX idx_stock_moves_type ON product_stock_moves(move_type);

-- ============================================================================
-- SECTION 7: SHOPPING CART
-- ============================================================================

CREATE TABLE shopping_carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For guest users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_carts_user ON shopping_carts(user_id);
CREATE INDEX idx_carts_session ON shopping_carts(session_id);

-- ============================================================================

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES shopping_carts(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE UNIQUE INDEX idx_cart_items_unique ON cart_items(cart_id, product_id);

-- ============================================================================
-- SECTION 8: ORDERS
-- ============================================================================

CREATE TABLE sale_orders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- Order number
    user_id INTEGER REFERENCES users(id),
    partner_id INTEGER REFERENCES partners(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state VARCHAR(50) DEFAULT 'draft', -- draft, sent, sale, done, cancel
    custom_status VARCHAR(50), -- waiting_payment, payment_confirmed, admin_review, approved, processing, shipped, delivered, inspecting, return_approved
    amount_untaxed DECIMAL(12, 2) DEFAULT 0,
    amount_tax DECIMAL(12, 2) DEFAULT 0,
    amount_total DECIMAL(12, 2) DEFAULT 0,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    amount_residual DECIMAL(12, 2) DEFAULT 0,
    currency_id VARCHAR(3) DEFAULT 'IDR',
    payment_term_id INTEGER,
    payment_method VARCHAR(50),
    pricelist_id INTEGER,
    delivery_address_id INTEGER REFERENCES addresses(id),
    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    voucher_code VARCHAR(50),
    notes TEXT,
    invoice_status VARCHAR(50), -- 'to_invoice', 'invoiced', 'no'
    delivery_count INTEGER DEFAULT 0,
    xendit_payment_id VARCHAR(255),
    xendit_payment_method VARCHAR(50),
    xendit_payment_status VARCHAR(50),
    cancelled_reason TEXT,
    cancelled_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON sale_orders(user_id);
CREATE INDEX idx_orders_partner ON sale_orders(partner_id);
CREATE INDEX idx_orders_state ON sale_orders(state);
CREATE INDEX idx_orders_custom_status ON sale_orders(custom_status);
CREATE INDEX idx_orders_date ON sale_orders(order_date);
CREATE INDEX idx_orders_name ON sale_orders(name);

-- ============================================================================

CREATE TABLE sale_order_lines (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sale_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    uom_name VARCHAR(50) DEFAULT 'Unit',
    price_unit DECIMAL(12, 2) NOT NULL,
    price_subtotal DECIMAL(12, 2) NOT NULL,
    price_total DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_lines_order ON sale_order_lines(order_id);
CREATE INDEX idx_order_lines_product ON sale_order_lines(product_id);

-- ============================================================================

CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sale_orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    changed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_order ON order_status_history(order_id);

-- ============================================================================
-- SECTION 9: PAYMENTS
-- ============================================================================

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sale_orders(id),
    user_id INTEGER REFERENCES users(id),
    payment_reference VARCHAR(255) UNIQUE NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'va', 'ewallet', 'qr', 'credit_card', 'bank_transfer'
    payment_provider VARCHAR(50), -- 'xendit', 'midtrans', 'manual'
    payment_channel VARCHAR(100), -- 'BCA', 'MANDIRI', 'OVO', 'GOPAY', etc
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, success, failed, expired, cancelled
    external_id VARCHAR(255), -- From payment gateway
    virtual_account_number VARCHAR(100),
    qr_code_url VARCHAR(500),
    payment_url VARCHAR(500),
    expires_at TIMESTAMP,
    paid_at TIMESTAMP,
    callback_data JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_external ON payments(external_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================

CREATE TABLE payment_webhooks (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    payload JSONB NOT NULL,
    signature TEXT,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX idx_webhooks_processed ON payment_webhooks(processed);

-- ============================================================================
-- SECTION 10: GROOMING SERVICES
-- ============================================================================

CREATE TABLE grooming_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'basic', 'premium', 'spa'
    pet_type VARCHAR(50), -- 'dog', 'cat', 'all'
    price DECIMAL(12, 2) NOT NULL,
    duration INTEGER, -- in minutes
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grooming_services_category ON grooming_services(category);
CREATE INDEX idx_grooming_services_pet_type ON grooming_services(pet_type);

-- ============================================================================

CREATE TABLE grooming_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    services JSONB, -- [service_ids]
    price DECIMAL(12, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================

CREATE TABLE grooming_stylists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    experience_years INTEGER,
    rating DECIMAL(3, 2) DEFAULT 0,
    photo VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stylists_available ON grooming_stylists(is_available, is_active);

-- ============================================================================

CREATE TABLE grooming_bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    pet_id INTEGER REFERENCES pets(id),
    service_id INTEGER REFERENCES grooming_services(id),
    package_id INTEGER REFERENCES grooming_packages(id),
    stylist_id INTEGER REFERENCES grooming_stylists(id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    service_type VARCHAR(50), -- 'walk-in', 'home-service'
    address_id INTEGER REFERENCES addresses(id),
    state VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, in_progress, done, cancelled
    service_fee DECIMAL(12, 2),
    transport_fee DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    notes TEXT,
    cancelled_reason TEXT,
    cancelled_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grooming_bookings_user ON grooming_bookings(user_id);
CREATE INDEX idx_grooming_bookings_pet ON grooming_bookings(pet_id);
CREATE INDEX idx_grooming_bookings_date ON grooming_bookings(booking_date);
CREATE INDEX idx_grooming_bookings_state ON grooming_bookings(state);

-- ============================================================================
-- SECTION 11: HOTEL (PET BOARDING)
-- ============================================================================

CREATE TABLE hotel_rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    room_type VARCHAR(100), -- 'standard', 'deluxe', 'vip'
    pet_type VARCHAR(50), -- 'dog', 'cat', 'small', 'medium', 'large'
    capacity INTEGER DEFAULT 1,
    size_sqm DECIMAL(10, 2),
    daily_rate DECIMAL(12, 2) NOT NULL,
    facilities JSONB, -- ['ac', 'camera', 'playground']
    description TEXT,
    images JSONB, -- [image_urls]
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_type ON hotel_rooms(room_type);
CREATE INDEX idx_rooms_pet_type ON hotel_rooms(pet_type);
CREATE INDEX idx_rooms_available ON hotel_rooms(is_available, is_active);

-- ============================================================================

CREATE TABLE hotel_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    includes JSONB, -- ['grooming', 'vet_checkup', 'photos']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================

CREATE TABLE hotel_bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    pet_id INTEGER REFERENCES pets(id),
    room_id INTEGER REFERENCES hotel_rooms(id),
    package_id INTEGER REFERENCES hotel_packages(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    state VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, checked_in, checked_out, cancelled
    daily_rate DECIMAL(12, 2),
    additional_services JSONB, -- [{service_name, price}]
    total_amount DECIMAL(12, 2),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    special_requests TEXT,
    notes TEXT,
    cancelled_reason TEXT,
    cancelled_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hotel_bookings_user ON hotel_bookings(user_id);
CREATE INDEX idx_hotel_bookings_pet ON hotel_bookings(pet_id);
CREATE INDEX idx_hotel_bookings_room ON hotel_bookings(room_id);
CREATE INDEX idx_hotel_bookings_dates ON hotel_bookings(check_in_date, check_out_date);
CREATE INDEX idx_hotel_bookings_state ON hotel_bookings(state);

-- ============================================================================

CREATE TABLE hotel_pet_activities (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES hotel_bookings(id) ON DELETE CASCADE,
    pet_id INTEGER REFERENCES pets(id),
    activity_date DATE NOT NULL,
    activity_time TIME,
    activity_type VARCHAR(100), -- 'meal', 'playtime', 'walk', 'checkup'
    description TEXT,
    photos JSONB, -- [photo_urls]
    staff_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pet_activities_booking ON hotel_pet_activities(booking_id);
CREATE INDEX idx_pet_activities_pet ON hotel_pet_activities(pet_id);
CREATE INDEX idx_pet_activities_date ON hotel_pet_activities(activity_date);

-- ============================================================================
-- SECTION 12: PROMOTIONS & VOUCHERS
-- ============================================================================

CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    promo_type VARCHAR(50), -- 'discount', 'cashback', 'free_shipping'
    discount_type VARCHAR(50), -- 'percentage', 'fixed'
    discount_value DECIMAL(12, 2),
    max_discount_amount DECIMAL(12, 2),
    min_purchase_amount DECIMAL(12, 2),
    applicable_to VARCHAR(50), -- 'all', 'products', 'services'
    applicable_ids JSONB, -- Product/Service IDs
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    usage_per_user INTEGER DEFAULT 1,
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_active ON promotions(is_active);

-- ============================================================================

CREATE TABLE vouchers (
    id SERIAL PRIMARY KEY,
    promotion_id INTEGER REFERENCES promotions(id),
    user_id INTEGER REFERENCES users(id),
    code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, used, expired
    used_at TIMESTAMP,
    order_id INTEGER REFERENCES sale_orders(id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vouchers_user ON vouchers(user_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);

-- ============================================================================
-- SECTION 13: REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reviewable_type VARCHAR(50), -- 'product', 'service', 'doctor', 'grooming', 'hotel'
    reviewable_id INTEGER NOT NULL,
    order_id INTEGER REFERENCES sale_orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images JSONB, -- [image_urls]
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_reviewable ON reviews(reviewable_type, reviewable_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_approved ON reviews(is_approved, is_visible);

-- ============================================================================

CREATE TABLE review_responses (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    response TEXT NOT NULL,
    is_official BOOLEAN DEFAULT FALSE, -- Response from business
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_responses_review ON review_responses(review_id);

-- ============================================================================
-- SECTION 14: NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'order', 'payment', 'promo', 'appointment', etc
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data
    image VARCHAR(500),
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================================

CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    order_updates BOOLEAN DEFAULT TRUE,
    payment_updates BOOLEAN DEFAULT TRUE,
    promo_updates BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    newsletter BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_notification_settings_user ON notification_settings(user_id);

-- ============================================================================
-- SECTION 15: LOYALTY & POINTS
-- ============================================================================

CREATE TABLE loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    lifetime_earned INTEGER DEFAULT 0,
    lifetime_spent INTEGER DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    tier_expires_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_points_tier ON loyalty_points(tier);

-- ============================================================================

CREATE TABLE loyalty_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50), -- 'earn', 'redeem', 'expire', 'adjust'
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'review', 'referral'
    reference_id INTEGER,
    description TEXT,
    expires_at DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loyalty_trans_user ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_trans_type ON loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_trans_reference ON loyalty_transactions(reference_type, reference_id);

-- ============================================================================

CREATE TABLE loyalty_rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50), -- 'discount', 'voucher', 'product'
    reward_value DECIMAL(12, 2),
    stock_quantity INTEGER,
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_active ON loyalty_rewards(is_active);
CREATE INDEX idx_rewards_points ON loyalty_rewards(points_required);

-- ============================================================================
-- SECTION 16: FAQ & SUPPORT
-- ============================================================================

CREATE TABLE faq_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================

CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES faq_categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faqs_category ON faqs(category_id);
CREATE INDEX idx_faqs_active ON faqs(is_active);

-- ============================================================================

CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

-- ============================================================================

CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    attachments JSONB, -- [file_urls]
    is_staff_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);

-- ============================================================================
-- SECTION 17: TENANTS
-- ============================================================================

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tenant_type VARCHAR(50), -- 'grooming', 'hotel', 'doctor'
    owner_id INTEGER REFERENCES users(id),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    logo VARCHAR(500),
    description TEXT,
    license_number VARCHAR(100),
    tax_id VARCHAR(50),
    bank_account VARCHAR(100),
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_type ON tenants(tenant_type);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
CREATE INDEX idx_tenants_active ON tenants(is_active, is_verified);

-- ============================================================================

CREATE TABLE tenant_services (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    service_type VARCHAR(50), -- Links to grooming_services, hotel_rooms, doctors
    service_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_services_tenant ON tenant_services(tenant_id);
CREATE INDEX idx_tenant_services_type ON tenant_services(service_type, service_id);

-- ============================================================================
-- SECTION 18: SETTINGS & CONFIGURATION
-- ============================================================================

CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(50), -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_settings_key ON app_settings(key);
CREATE INDEX idx_settings_category ON app_settings(category);

-- ============================================================================

CREATE TABLE app_content (
    id SERIAL PRIMARY KEY,
    content_type VARCHAR(50) UNIQUE NOT NULL, -- 'terms', 'privacy', 'about'
    title VARCHAR(255),
    content TEXT NOT NULL,
    version VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_content_type ON app_content(content_type);

-- ============================================================================
-- SECTION 19: ACTIVITY LOGS & AUDIT
-- ============================================================================

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    changes JSONB, -- Before and after values
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================================
-- SECTION 20: MEDIA & FILES
-- ============================================================================

CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500),
    file_type VARCHAR(100), -- MIME type
    file_size INTEGER, -- in bytes
    category VARCHAR(50), -- 'product', 'pet', 'profile', 'document'
    entity_type VARCHAR(100),
    entity_id INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_user ON media_files(user_id);
CREATE INDEX idx_media_entity ON media_files(entity_type, entity_id);
CREATE INDEX idx_media_category ON media_files(category);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_vaccinations_updated_at BEFORE UPDATE ON pet_vaccinations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_medical_records_updated_at BEFORE UPDATE ON pet_medical_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_brands_updated_at BEFORE UPDATE ON product_brands
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON shopping_carts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_orders_updated_at BEFORE UPDATE ON sale_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_order_lines_updated_at BEFORE UPDATE ON sale_order_lines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grooming_services_updated_at BEFORE UPDATE ON grooming_services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grooming_packages_updated_at BEFORE UPDATE ON grooming_packages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grooming_stylists_updated_at BEFORE UPDATE ON grooming_stylists
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grooming_bookings_updated_at BEFORE UPDATE ON grooming_bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_rooms_updated_at BEFORE UPDATE ON hotel_rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_packages_updated_at BEFORE UPDATE ON hotel_packages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_bookings_updated_at BEFORE UPDATE ON hotel_bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_responses_updated_at BEFORE UPDATE ON review_responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_content_updated_at BEFORE UPDATE ON app_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Auto-generate order number function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name = 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('order_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_sale_order_number
BEFORE INSERT ON sale_orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- ============================================================================
-- Auto-generate appointment number function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number = 'APT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('appointment_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_appointment_num
BEFORE INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION generate_appointment_number();

-- ============================================================================
-- Auto-generate grooming booking number function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_grooming_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
        NEW.booking_number = 'GRM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('grooming_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_grooming_booking_num
BEFORE INSERT ON grooming_bookings
FOR EACH ROW
EXECUTE FUNCTION generate_grooming_booking_number();

-- ============================================================================
-- Auto-generate hotel booking number function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_hotel_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
        NEW.booking_number = 'HTL-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('hotel_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_hotel_booking_num
BEFORE INSERT ON hotel_bookings
FOR EACH ROW
EXECUTE FUNCTION generate_hotel_booking_number();

-- ============================================================================
-- Auto-generate support ticket number function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number = 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('ticket_sequence')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_support_ticket_num
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_number();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active orders view
CREATE OR REPLACE VIEW v_active_orders AS
SELECT
    o.*,
    u.name as user_name,
    u.email as user_email,
    p.name as partner_name,
    COUNT(ol.id) as item_count
FROM sale_orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN partners p ON o.partner_id = p.id
LEFT JOIN sale_order_lines ol ON o.id = ol.order_id
WHERE o.state NOT IN ('done', 'cancel')
GROUP BY o.id, u.name, u.email, p.name;

-- ============================================================================

-- Product with stock view
CREATE OR REPLACE VIEW v_products_with_stock AS
SELECT
    p.*,
    c.name as category_name,
    b.name as brand_name,
    COALESCE(p.qty_available, 0) as stock_quantity,
    CASE WHEN p.qty_available > 0 THEN TRUE ELSE FALSE END as in_stock
FROM products p
LEFT JOIN product_categories c ON p.category_id = c.id
LEFT JOIN product_brands b ON p.brand_id = b.id
WHERE p.is_active = TRUE AND p.sale_ok = TRUE;

-- ============================================================================

-- Upcoming appointments view
CREATE OR REPLACE VIEW v_upcoming_appointments AS
SELECT
    a.*,
    d.name as doctor_name,
    d.specialization as doctor_specialization,
    u.name as user_name,
    u.phone as user_phone,
    p.name as pet_name,
    p.type as pet_type
FROM appointments a
LEFT JOIN doctors d ON a.doctor_id = d.id
LEFT JOIN users u ON a.user_id = u.id
LEFT JOIN pets p ON a.pet_id = p.id
WHERE a.state IN ('draft', 'confirmed')
    AND a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.appointment_time;

-- ============================================================================

-- Available hotel rooms view
CREATE OR REPLACE VIEW v_available_hotel_rooms AS
SELECT
    r.*,
    COUNT(CASE WHEN b.state IN ('confirmed', 'checked_in')
        AND CURRENT_DATE BETWEEN b.check_in_date AND b.check_out_date
        THEN 1 END) as current_bookings,
    (r.capacity - COUNT(CASE WHEN b.state IN ('confirmed', 'checked_in')
        AND CURRENT_DATE BETWEEN b.check_in_date AND b.check_out_date
        THEN 1 END)) as available_capacity
FROM hotel_rooms r
LEFT JOIN hotel_bookings b ON r.id = b.room_id
WHERE r.is_active = TRUE AND r.is_available = TRUE
GROUP BY r.id;

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Default app settings
INSERT INTO app_settings (key, value, value_type, category, description, is_public) VALUES
('app_name', 'PawSmart', 'string', 'general', 'Application name', true),
('app_version', '1.0.0', 'string', 'general', 'Application version', true),
('currency', 'IDR', 'string', 'general', 'Default currency', true),
('tax_rate', '11', 'number', 'finance', 'Tax rate percentage (PPN)', false),
('min_order_amount', '50000', 'number', 'order', 'Minimum order amount', true),
('free_shipping_threshold', '250000', 'number', 'order', 'Free shipping threshold', true),
('points_per_rupiah', '1', 'number', 'loyalty', 'Loyalty points earned per rupiah spent', true),
('points_to_rupiah', '100', 'number', 'loyalty', 'Points to rupiah conversion rate', true)
ON CONFLICT (key) DO NOTHING;

-- Default FAQ categories
INSERT INTO faq_categories (name, sort_order, is_active) VALUES
('General', 1, true),
('Orders & Shipping', 2, true),
('Products', 3, true),
('Services', 4, true),
('Payments', 5, true),
('Returns & Refunds', 6, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON DATABASE pawsmart IS 'PawSmart - Pet Shop Management System';

COMMENT ON TABLE users IS 'User accounts for customers, admins, and tenants';
COMMENT ON TABLE partners IS 'Business partners including customers, suppliers, and tenants';
COMMENT ON TABLE pets IS 'Pet records owned by users';
COMMENT ON TABLE products IS 'Product catalog for pet supplies';
COMMENT ON TABLE sale_orders IS 'Customer orders';
COMMENT ON TABLE appointments IS 'Veterinary appointments';
COMMENT ON TABLE grooming_bookings IS 'Pet grooming service bookings';
COMMENT ON TABLE hotel_bookings IS 'Pet boarding/hotel bookings';
COMMENT ON TABLE payments IS 'Payment transactions';
COMMENT ON TABLE loyalty_points IS 'Customer loyalty points balance';
COMMENT ON TABLE reviews IS 'Product and service reviews';
COMMENT ON TABLE notifications IS 'User notifications';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'PawSmart Database Schema Installation Complete!';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Database: pawsmart';
    RAISE NOTICE 'Tables created: 60+';
    RAISE NOTICE 'Views created: 4';
    RAISE NOTICE 'Triggers created: 35+';
    RAISE NOTICE 'Sequences created: 5';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review and customize default settings in app_settings table';
    RAISE NOTICE '2. Import Indonesia address data (provinces, cities, districts)';
    RAISE NOTICE '3. Create initial admin user';
    RAISE NOTICE '4. Set up product categories and brands';
    RAISE NOTICE '============================================================================';
END $$;
