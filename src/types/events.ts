/**
 * Core Event Types for ajdigital-automation-hub
 * 
 * These types define the canonical event structure for cross-portal communication.
 * All events flow through the router which maps them to appropriate modules.
 */

/**
 * Supported module identifiers matching config/modules/*.yaml
 */
export type ModuleId = 
  | "client-delivery" 
  | "marketing-automation" 
  | "ai-optimization" 
  | "data-intelligence";

/**
 * Event name follows a {domain}.{action} pattern
 * 
 * Canonical examples:
 * - booking.created
 * - booking.status_updated
 * - booking.approved
 * - booking.cancelled
 * - asset.uploaded
 * - asset.processed
 * - payment.intent_created
 * - payment.completed
 * - payment.failed
 * - tenant.config_updated
 * - reporting.snapshot_generated
 */
export type EventName = string;

/**
 * Event source identifies which system originated the event
 */
export type EventSource = "client-portal" | "admin-portal" | "system" | "worker";

/**
 * Base event structure - all events must conform to this shape
 */
export interface BaseEvent {
  /** Unique event identifier (UUID v4) */
  id: string;
  
  /** Event name following {domain}.{action} pattern */
  name: EventName;
  
  /** System that originated this event */
  source: EventSource;
  
  /** Optional module routing hints (router will populate if not set) */
  moduleIds?: ModuleId[];
  
  /** Tenant context for multi-tenant events */
  tenantId?: string;
  
  /** User context (client or admin) */
  userId?: string;
  
  /** ISO 8601 timestamp when event occurred */
  occurredAt: string;
  
  /** Event-specific payload (strongly typed in specialized events) */
  payload: Record<string, unknown>;
}

/**
 * Booking-related events
 * 
 * Used for: booking.created, booking.status_updated, booking.approved, etc.
 */
export interface BookingEvent extends BaseEvent {
  name: string;
  payload: {
    bookingId: string;
    serviceId?: string;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    priceCents?: number;
    currency?: string;
    billingProvider?: string;
    [key: string]: unknown;
  };
}

/**
 * Asset-related events
 * 
 * Used for: asset.uploaded, asset.processed, asset.approved, etc.
 */
export interface AssetEvent extends BaseEvent {
  name: string;
  payload: {
    assetId: string;
    bookingId?: string;
    type?: string;
    size?: number;
    filename?: string;
    url?: string;
    [key: string]: unknown;
  };
}

/**
 * Payment-related events
 * 
 * Used for: payment.intent_created, payment.completed, payment.failed, etc.
 */
export interface PaymentEvent extends BaseEvent {
  name: string;
  payload: {
    paymentId?: string;
    bookingId?: string;
    amountCents?: number;
    currency?: string;
    status?: string;
    billingProvider?: string;
    paymentUrl?: string;
    [key: string]: unknown;
  };
}

/**
 * Type guard to check if an event is a BookingEvent
 */
export function isBookingEvent(event: BaseEvent): event is BookingEvent {
  return 'bookingId' in event.payload;
}

/**
 * Type guard to check if an event is an AssetEvent
 */
export function isAssetEvent(event: BaseEvent): event is AssetEvent {
  return 'assetId' in event.payload;
}

/**
 * Type guard to check if an event is a PaymentEvent
 */
export function isPaymentEvent(event: BaseEvent): event is PaymentEvent {
  return 'paymentId' in event.payload || 
         ('bookingId' in event.payload && 'amountCents' in event.payload);
}
