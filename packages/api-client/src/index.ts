export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const apiRoutes = {
  meta: "/api/v1/meta",
  register: "/api/v1/auth/register",
  login: "/api/v1/auth/login",
  creators: "/api/v1/creators",
  services: "/api/v1/services",
  bookings: "/api/v1/bookings"
} as const;
