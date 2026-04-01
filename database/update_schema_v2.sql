-- SQL Migration Script: Sync Database Schema with Backend Logic
-- Run this in your Supabase SQL Editor

-- 1. Update 'users' table
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT;

-- 2. Create 'vehicles' table if it doesn't exist
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plate_number TEXT UNIQUE NOT NULL,
    model TEXT,
    color TEXT,
    max_seats INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update 'transportation_systems' table
ALTER TABLE IF EXISTS transportation_systems 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id),
ADD COLUMN IF NOT EXISTS start_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS start_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS start_location_name TEXT,
ADD COLUMN IF NOT EXISTS end_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS end_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS end_location_name TEXT,
ADD COLUMN IF NOT EXISTS route_polyline TEXT;

-- 4. Update 'system_parents' table
ALTER TABLE IF EXISTS system_parents 
ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8);

-- 5. Create 'system_attendants' table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_attendants (
    system_id UUID REFERENCES transportation_systems(id) ON DELETE CASCADE,
    attendant_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_present BOOLEAN DEFAULT FALSE,
    has_control BOOLEAN DEFAULT FALSE,
    can_view_activities BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (system_id, attendant_id)
);

-- 6. Update 'notifications' table
ALTER TABLE IF EXISTS notifications 
ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES transportation_systems(id) ON DELETE CASCADE;
