/**
 * Cal.com Webhook Handler
 * 
 * Processes webhooks from Cal.com for booking lifecycle events
 * Integrates with automation hub module router
 */

import type { BaseEvent } from '../types/events.js';
import { routeEvent } from '../lib/router.js';

/**
 * Cal.com webhook event types
 */
export type CalWebhookEventType =
  | 'booking.created'
  | 'booking.rescheduled'
  | 'booking.cancelled'
  | 'booking.rejected'
  | 'meeting.started'
  | 'meeting.ended';

/**
 * Cal.com webhook payload (simplified)
 */
export interface CalWebhookPayload {
  type: CalWebhookEventType;
  data: {
    id: number;
    uid: string;
    eventTypeId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    status: string;
    attendees: Array<{
      name: string;
      email: string;
      timeZone: string;
    }>;
    organizer?: {
      name: string;
      email: string;
    };
    metadata?: Record<string, any>;
    responses?: Record<string, any>;
    [key: string]: any;
  };
  triggerEvent: string;
}

/**
 * Handle Cal.com webhook
 * 
 * @param payload - Webhook payload from Cal.com
 * @returns Promise that resolves when processing completes
 */
export async function handleCalWebhook(payload: CalWebhookPayload): Promise<void> {
  const { type, data } = payload;

  console.log(`[Cal Webhook] Received: ${type} for booking ${data.uid}`);

  try {
    switch (type) {
      case 'booking.created':
        await handleBookingCreated(data);
        break;

      case 'booking.rescheduled':
        await handleBookingRescheduled(data);
        break;

      case 'booking.cancelled':
        await handleBookingCancelled(data);
        break;

      case 'booking.rejected':
        await handleBookingRejected(data);
        break;

      case 'meeting.started':
        await handleMeetingStarted(data);
        break;

      case 'meeting.ended':
        await handleMeetingEnded(data);
        break;

      default:
        console.log(`[Cal Webhook] Unhandled event type: ${type}`);
    }

    console.log(`[Cal Webhook] ✓ Processed: ${type} for ${data.uid}`);
  } catch (err) {
    console.error(
      `[Cal Webhook] ✗ Error processing ${type}:`,
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }
}

/**
 * Handle booking.created event
 */
async function handleBookingCreated(data: CalWebhookPayload['data']): Promise<void> {
  // Map to internal event
  const event: BaseEvent = {
    id: `cal_booking_${data.uid}`,
    name: 'booking.created',
    source: 'cal',
    occurredAt: new Date(data.startTime).toISOString(),
    payload: {
      bookingId: data.id,
      bookingUid: data.uid,
      eventTypeId: data.eventTypeId,
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      attendees: data.attendees,
      metadata: data.metadata,
      responses: data.responses,
      calEventType: data.eventTypeId,
      module: data.metadata?.module,
      segment: data.metadata?.segment,
    },
  };

  // Route through automation hub
  await routeEvent(event);

  // TODO: Additional automation based on module metadata
  // - Client Delivery: Create project, add to Basecamp, send onboarding
  // - Marketing: Update lead status, trigger nurture sequence
  // - Data Intelligence: Log booking for analytics
}

/**
 * Handle booking.rescheduled event
 */
async function handleBookingRescheduled(data: CalWebhookPayload['data']): Promise<void> {
  const event: BaseEvent = {
    id: `cal_booking_rescheduled_${data.uid}`,
    name: 'booking.rescheduled',
    source: 'cal',
    occurredAt: new Date().toISOString(),
    payload: {
      bookingId: data.id,
      bookingUid: data.uid,
      eventTypeId: data.eventTypeId,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      attendees: data.attendees,
      metadata: data.metadata,
      calEventType: data.eventTypeId,
    },
  };

  await routeEvent(event);

  // TODO: Update internal records
  // - Update project timelines
  // - Notify team members
  // - Update calendar integrations
}

/**
 * Handle booking.cancelled event
 */
async function handleBookingCancelled(data: CalWebhookPayload['data']): Promise<void> {
  const event: BaseEvent = {
    id: `cal_booking_cancelled_${data.uid}`,
    name: 'booking.cancelled',
    source: 'cal',
    occurredAt: new Date().toISOString(),
    payload: {
      bookingId: data.id,
      bookingUid: data.uid,
      eventTypeId: data.eventTypeId,
      title: data.title,
      attendees: data.attendees,
      metadata: data.metadata,
      calEventType: data.eventTypeId,
    },
  };

  await routeEvent(event);

  // TODO: Handle cancellation
  // - Mark internal booking as cancelled
  // - Trigger refund if applicable
  // - Update project status
  // - Send follow-up automation
}

/**
 * Handle booking.rejected event
 */
async function handleBookingRejected(data: CalWebhookPayload['data']): Promise<void> {
  console.log(`[Cal Webhook] Booking rejected: ${data.uid}`);
  
  // TODO: Handle rejection
  // - Log for analytics
  // - Notify admin if needed
}

/**
 * Handle meeting.started event
 */
async function handleMeetingStarted(data: CalWebhookPayload['data']): Promise<void> {
  console.log(`[Cal Webhook] Meeting started: ${data.uid}`);
  
  // TODO: Handle meeting start
  // - Update status in CRM
  // - Log for time tracking
  // - Trigger any pre-meeting automation
}

/**
 * Handle meeting.ended event
 */
async function handleMeetingEnded(data: CalWebhookPayload['data']): Promise<void> {
  const event: BaseEvent = {
    id: `cal_meeting_ended_${data.uid}`,
    name: 'meeting.ended',
    source: 'cal',
    occurredAt: new Date().toISOString(),
    payload: {
      bookingId: data.id,
      bookingUid: data.uid,
      eventTypeId: data.eventTypeId,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      attendees: data.attendees,
      metadata: data.metadata,
      calEventType: data.eventTypeId,
      module: data.metadata?.module,
    },
  };

  await routeEvent(event);

  // TODO: Post-meeting automation
  // - Send follow-up email
  // - Create project tasks
  // - Request feedback/review
  // - Update client status
  // - Log for analytics
}

/**
 * Verify Cal.com webhook signature (optional but recommended)
 * 
 * @param payload - Raw webhook payload
 * @param signature - Signature from webhook header
 * @param secret - CAL_WEBHOOK_SECRET env var
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: Implement signature verification if Cal.com provides it
  // This depends on Cal.com's webhook signing mechanism
  // Check their docs for the exact algorithm (HMAC-SHA256, etc.)
  
  console.warn('[Cal Webhook] Signature verification not implemented');
  return true;
}
