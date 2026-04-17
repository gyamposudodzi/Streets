export type UserRole = "user" | "creator" | "admin";

export type FulfillmentType =
  | "video"
  | "audio_call"
  | "chat"
  | "custom_request"
  | "in_person";

export type BookingStatus =
  | "draft"
  | "pending_payment"
  | "paid_pending_acceptance"
  | "accepted"
  | "cancelled";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected";

export type CreatorSummary = {
  user_id: string;
  display_name: string;
  country: string;
  service_region: string;
  verification_status: VerificationStatus;
  average_rating: number;
};

export type CreatorProfile = CreatorSummary & {
  bio: string;
  payout_status: VerificationStatus;
  created_at: string;
};

export type Service = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  price: number;
  currency: string;
  fulfillment_type: FulfillmentType;
  is_active: boolean;
  created_at: string;
};

export type AvailabilitySlot = {
  id: string;
  creator_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  is_reserved: boolean;
};

export type Booking = {
  id: string;
  buyer_id: string;
  creator_id: string;
  service_id: string;
  slot_id: string | null;
  status: BookingStatus;
  scheduled_start: string | null;
  scheduled_end: string | null;
  fulfillment_type: FulfillmentType;
  release_at: string | null;
  created_at: string;
};

export type BookingEvent = {
  id: string;
  booking_id: string;
  event_type: string;
  actor_user_id: string;
  detail: string;
  created_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: string;
  is_age_verified: boolean;
  email_verified: boolean;
  created_at: string;
};

export type AuthSession = {
  access_token: string;
  token_type: "bearer";
  user: AppUser;
};

export type AdminOverview = {
  total_users: number;
  total_creators: number;
  total_services: number;
  total_bookings: number;
};

export type AdminDashboard = {
  overview: AdminOverview;
  users: AppUser[];
  creators: CreatorSummary[];
  services: Service[];
  bookings: Booking[];
};
