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
