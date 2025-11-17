/**
 * Shared Platform Types
 * These types MUST match exactly with audiojones-client and audiojones.com
 * to ensure cross-repo type consistency
 */

// ============================================================================
// Module Types
// ============================================================================

export type ModuleId =
  | "client-delivery"
  | "marketing-automation"
  | "ai-optimization"
  | "data-intelligence";

export function isValidModuleId(value: unknown): value is ModuleId {
  return (
    typeof value === "string" &&
    ["client-delivery", "marketing-automation", "ai-optimization", "data-intelligence"].includes(value)
  );
}

// ============================================================================
// Booking Status Types
// ============================================================================

export type BookingStatus =
  | "DRAFT"
  | "PENDING"
  | "PENDING_PAYMENT"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | "DECLINED"
  | "PAYMENT_FAILED";

export function isValidBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === "string" &&
    [
      "DRAFT",
      "PENDING",
      "PENDING_PAYMENT",
      "PENDING_ADMIN",
      "APPROVED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELED",
      "DECLINED",
      "PAYMENT_FAILED",
    ].includes(value)
  );
}

// ============================================================================
// Payment Types
// ============================================================================

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "canceled";

export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    ["pending", "completed", "failed", "refunded", "canceled"].includes(value)
  );
}

export interface PaymentMetadata {
  provider: "whop" | "stripe" | "none";
  status: PaymentStatus;
  url?: string;
  externalId?: string;
  amount?: number;
  currency?: string;
  completedAt?: string;
}

// ============================================================================
// Preflight Types
// ============================================================================

export interface PreflightPayload {
  moduleId: ModuleId;
  checkedItemIds: string[];
  allRequiredCompleted: boolean;
  completedAt?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface BookingStatusChangeEvent {
  bookingId: string;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  moduleId?: ModuleId;
  paymentStatus?: PaymentStatus;
  preflight?: PreflightPayload;
  timestamp: string;
  triggeredBy: "user" | "webhook" | "admin" | "system";
}

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  bookingId?: string;
  payload: Record<string, unknown>;
  receivedAt: string;
  processedAt?: string;
  error?: string;
}

// ============================================================================
// Type Guards for Events
// ============================================================================

export function isBookingStatusChangeEvent(
  value: unknown
): value is BookingStatusChangeEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Partial<BookingStatusChangeEvent>;

  return (
    typeof event.bookingId === "string" &&
    isValidBookingStatus(event.previousStatus) &&
    isValidBookingStatus(event.newStatus) &&
    typeof event.timestamp === "string" &&
    (event.triggeredBy === "user" ||
      event.triggeredBy === "webhook" ||
      event.triggeredBy === "admin" ||
      event.triggeredBy === "system")
  );
}

export function isWebhookEvent(value: unknown): value is WebhookEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Partial<WebhookEvent>;

  return (
    typeof event.eventId === "string" &&
    typeof event.eventType === "string" &&
    typeof event.payload === "object" &&
    event.payload !== null &&
    typeof event.receivedAt === "string"
  );
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Status Transition Helpers
// ============================================================================

/**
 * Valid booking status transitions
 * Used for validation in automation workflows
 */
export const VALID_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["PENDING", "CANCELED"],
  PENDING: ["PENDING_PAYMENT", "PENDING_ADMIN", "DECLINED", "CANCELED"],
  PENDING_PAYMENT: ["APPROVED", "PAYMENT_FAILED", "CANCELED"],
  PENDING_ADMIN: ["APPROVED", "DECLINED", "CANCELED"],
  APPROVED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["COMPLETED", "CANCELED"],
  COMPLETED: [], // Terminal state
  CANCELED: [], // Terminal state
  DECLINED: [], // Terminal state
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELED"],
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid next statuses for a given status
 */
export function getValidNextStatuses(status: BookingStatus): BookingStatus[] {
  return VALID_STATUS_TRANSITIONS[status] || [];
}
