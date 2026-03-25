-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'parent', 'attendant')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Routes table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transportation Systems table (formerly vans)
CREATE TABLE transportation_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE REFERENCES users(id),
    name TEXT NOT NULL,
    plate_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    max_seats INTEGER,
    join_code TEXT UNIQUE NOT NULL,
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    route_id UUID REFERENCES routes(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES users(id),
    system_id UUID REFERENCES transportation_systems(id),
    grade TEXT,
    pickup_location TEXT,
    dropoff_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. System Parents join table
CREATE TABLE system_parents (
    system_id UUID REFERENCES transportation_systems(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (system_id, parent_id)
);

-- 6. Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id),
    date DATE DEFAULT CURRENT_DATE,
    pickup BOOLEAN DEFAULT FALSE,
    drop_off BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 7. Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE TRIGGER for transportation_systems.updated_at
-- This ensures every time the driver's lat/lng is changed,
-- the updated_at column is automatically set to NOW().
-- The parent map screen sorts by updated_at to find the
-- most recently active driver — this trigger makes that work.
-- ============================================================

-- Step 1: Create the trigger function (runs before each UPDATE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Attach the trigger to the transportation_systems table
CREATE TRIGGER set_transportation_systems_updated_at
BEFORE UPDATE ON transportation_systems
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();