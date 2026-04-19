CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    is_age_verified INTEGER NOT NULL DEFAULT 0,
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creator_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT NOT NULL,
    country TEXT NOT NULL,
    service_region TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    payout_status TEXT NOT NULL,
    average_rating REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL,
    fulfillment_type TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    moderation_status TEXT NOT NULL DEFAULT 'pending_review',
    compliance_score INTEGER NOT NULL DEFAULT 0,
    compliance_notes TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availability_slots (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    is_reserved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    slot_id TEXT REFERENCES availability_slots(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    scheduled_start TEXT,
    scheduled_end TEXT,
    fulfillment_type TEXT NOT NULL,
    release_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_events (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_payment_id TEXT NOT NULL,
    gross_amount INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL,
    creator_amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS held_funds (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    account_type TEXT NOT NULL,
    account_id TEXT NOT NULL,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL,
    risk_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    opened_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    resolution TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moderation_rules (
    id TEXT PRIMARY KEY,
    pattern TEXT NOT NULL,
    label TEXT NOT NULL,
    action TEXT NOT NULL DEFAULT 'hold',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_creator_id ON services (creator_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services (category);
CREATE INDEX IF NOT EXISTS idx_services_fulfillment_type ON services (fulfillment_type);
CREATE INDEX IF NOT EXISTS idx_slots_service_id ON availability_slots (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer_id ON bookings (buyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator_id ON bookings (creator_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_held_funds_booking_id ON held_funds (booking_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_booking_id ON ledger_entries (booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages (booking_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes (booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_rules_active ON moderation_rules (is_active);
