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
  | "in_progress"
  | "delivered"
  | "awaiting_release"
  | "disputed"
  | "cancelled"
  | "released"
  | "refunded";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected";

export type ServiceModerationStatus =
  | "pending_review"
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
  moderation_status: ServiceModerationStatus;
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

export type PaymentStatus =
  | "requires_action"
  | "succeeded"
  | "failed"
  | "refunded";

export type HeldFundsStatus = "held" | "released" | "refunded";

export type LedgerEntryType =
  | "payment_captured"
  | "funds_held"
  | "platform_fee"
  | "creator_credit"
  | "funds_released"
  | "refund_issued";

export type Payment = {
  id: string;
  booking_id: string;
  provider: string;
  provider_payment_id: string;
  gross_amount: number;
  platform_fee: number;
  creator_amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
};

export type PaymentIntent = {
  payment: Payment;
  checkout_reference: string;
  message: string;
};

export type HeldFunds = {
  id: string;
  booking_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: HeldFundsStatus;
  created_at: string;
};

export type LedgerEntry = {
  id: string;
  account_type: string;
  account_id: string;
  booking_id: string;
  entry_type: LedgerEntryType;
  amount: number;
  currency: string;
  created_at: string;
};

export type BookingPaymentState = {
  payments: Payment[];
  held_funds: HeldFunds[];
  ledger_entries: LedgerEntry[];
};

export type BookingMessage = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ReportTargetType = "user" | "creator" | "service" | "booking" | "message";

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  risk_score: number;
  created_at: string;
  resolved_at: string | null;
};

export type DisputeStatus = "open" | "reviewing" | "resolved";

export type DisputeResolution = "release" | "refund";

export type Dispute = {
  id: string;
  booking_id: string;
  opened_by_user_id: string;
  status: DisputeStatus;
  reason: string;
  details: string | null;
  resolution: DisputeResolution | null;
  created_at: string;
  resolved_at: string | null;
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
  open_reports: number;
  open_disputes: number;
};

export type AdminDashboard = {
  overview: AdminOverview;
  users: AppUser[];
  creators: CreatorSummary[];
  services: Service[];
  bookings: Booking[];
  reports: Report[];
  disputes: Dispute[];
};
