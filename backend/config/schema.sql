-- ==========================================================
-- foodBridge-AI Enterprise Database Schema
-- Award-Winning Real-Time Food Donation & Rescue Platform
-- ==========================================================

-- 1. PLATFORM USERS
CREATE TABLE IF NOT EXISTS platform_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Pune',
    role VARCHAR(20) NOT NULL CHECK (role IN ('DONOR', 'VOLUNTEER', 'RECEIVER', 'ADMIN')),
    avatar VARCHAR(255),
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DONOR PROFILES
CREATE TABLE IF NOT EXISTS donor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    organization_name VARCHAR(200),
    donor_type VARCHAR(50) DEFAULT 'RESTAURANT',
    fssai_license VARCHAR(100),
    operating_hours VARCHAR(100),
    contact_person VARCHAR(150),
    total_donations_count INTEGER DEFAULT 0,
    total_kg_donated NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VOLUNTEER PROFILES
CREATE TABLE IF NOT EXISTS volunteer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50) DEFAULT 'MOTORCYCLE',
    vehicle_number VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    current_latitude NUMERIC(10, 7) DEFAULT 18.5204,
    current_longitude NUMERIC(10, 7) DEFAULT 73.8567,
    deliveries_completed INTEGER DEFAULT 0,
    badge_level VARCHAR(50) DEFAULT 'BRONZE',
    volunteer_hours NUMERIC(10, 2) DEFAULT 0.00,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. RECEIVER PROFILES
CREATE TABLE IF NOT EXISTS receiver_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    organization_name VARCHAR(200),
    receiver_type VARCHAR(50) DEFAULT 'NGO',
    capacity_people INTEGER DEFAULT 50,
    dietary_preferences VARCHAR(100) DEFAULT 'ALL',
    operating_license VARCHAR(100),
    total_meals_received INTEGER DEFAULT 0,
    total_kg_received NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. FOOD DONATIONS
CREATE TABLE IF NOT EXISTS food_donations (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    requested_by INTEGER REFERENCES platform_users(id) ON DELETE SET NULL,
    requested_at TIMESTAMP WITH TIME ZONE,
    food_name VARCHAR(200) NOT NULL,
    food_type VARCHAR(50) NOT NULL,
    quantity_display VARCHAR(100) NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    servings_estimate INTEGER NOT NULL DEFAULT 1,
    storage_type VARCHAR(50) DEFAULT 'Room Temperature',
    cooked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_location TEXT NOT NULL,
    latitude NUMERIC(10, 7) DEFAULT 18.5204,
    longitude NUMERIC(10, 7) DEFAULT 73.8567,
    description TEXT,
    dietary_type VARCHAR(50) DEFAULT 'Vegetarian',
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (status IN ('AVAILABLE', 'REQUESTED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'EXPIRED', 'CANCELLED')),
    freshness_score NUMERIC(5, 2) DEFAULT 95.00,
    spoilage_risk VARCHAR(30) DEFAULT 'LOW' 
        CHECK (spoilage_risk IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    shelf_life_hours NUMERIC(6, 2) DEFAULT 12.00,
    ai_recommendation TEXT,
    urgency_level VARCHAR(20) DEFAULT 'NORMAL' 
        CHECK (urgency_level IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. VOLUNTEER PICKUPS
CREATE TABLE IF NOT EXISTS volunteer_pickups (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES food_donations(id) ON DELETE CASCADE,
    volunteer_id INTEGER NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    pickup_scheduled_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    pickup_status VARCHAR(30) NOT NULL DEFAULT 'ACCEPTED' 
        CHECK (pickup_status IN ('ACCEPTED', 'IN_TRANSIT', 'PICKED_UP', 'CANCELLED')),
    pickup_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. FOOD DELIVERIES
CREATE TABLE IF NOT EXISTS food_deliveries (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER NOT NULL REFERENCES food_donations(id) ON DELETE CASCADE,
    volunteer_id INTEGER NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    delivery_address TEXT NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    otp_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    otp_verified BOOLEAN DEFAULT false,
    otp_attempts INTEGER DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED' 
        CHECK (status IN ('DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery_at TIMESTAMP WITH TIME ZONE,
    proof_image_url VARCHAR(255),
    receiver_feedback TEXT,
    receiver_rating INTEGER CHECK (receiver_rating BETWEEN 1 AND 5),
    co2_saved_kg NUMERIC(10, 2) DEFAULT 0.00,
    water_saved_liters NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE food_donations
    ADD COLUMN IF NOT EXISTS requested_by INTEGER REFERENCES platform_users(id) ON DELETE SET NULL;
ALTER TABLE food_donations
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE food_deliveries
    ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMP WITH TIME ZONE;

-- 8. PLATFORM NOTIFICATIONS
CREATE TABLE IF NOT EXISTS platform_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    related_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CONTACT INQUIRIES & CITIZEN MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) DEFAULT 'General inquiry',
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'NEW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OPTIMIZED PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_platform_users_email ON platform_users(email);
CREATE INDEX IF NOT EXISTS idx_platform_users_role ON platform_users(role);
CREATE INDEX IF NOT EXISTS idx_food_donations_status ON food_donations(status);
CREATE INDEX IF NOT EXISTS idx_food_donations_donor ON food_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_food_donations_requested_by ON food_donations(requested_by);
CREATE INDEX IF NOT EXISTS idx_food_donations_urgency ON food_donations(urgency_level);
CREATE INDEX IF NOT EXISTS idx_food_donations_created ON food_donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_pickups_volunteer ON volunteer_pickups(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_pickups_donation ON volunteer_pickups(donation_id);
CREATE INDEX IF NOT EXISTS idx_food_deliveries_receiver ON food_deliveries(receiver_id);
CREATE INDEX IF NOT EXISTS idx_food_deliveries_volunteer ON food_deliveries(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_food_deliveries_donation ON food_deliveries(donation_id);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_user ON platform_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

