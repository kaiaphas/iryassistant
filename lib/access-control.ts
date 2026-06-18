export type AppRole = "admin" | "staff";

const staffAllowedPaths = [
  "/",
  "/reservations",
  "/restaurants",
  "/hotels",
  "/refunds",
  "/api/reservations",
  "/api/masters/restaurants",
  "/api/masters/hotels",
  "/api/refunds",
  "/api/refund-payments",
];

export function normalizeAppRole(role?: string | null): AppRole {
  if (role === "admin" || role === "관리자" || role === "최고관리자") return "admin";
  return "staff";
}

export function canAccessPath(pathname: string, role: AppRole) {
  if (role === "admin") return true;
  return staffAllowedPaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

export function getRoleFromEmail(email?: string | null): AppRole {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (email && adminEmails.includes(email.toLowerCase())) return "admin";
  return "staff";
}
