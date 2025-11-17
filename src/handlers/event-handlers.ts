/**
 * Event Handlers for Booking and Payment Events
 * Core automation logic triggered by status changes
 */

import { config } from '../lib/config';
import { webhookLogger } from '../lib/webhook-logger';
import type { BookingStatusChangeEvent } from '../types/platform';

/**
 * Handle APPROVED booking status
 * Triggers onboarding workflows
 */
export async function handleApprovedBooking(
  event: BookingStatusChangeEvent
): Promise<void> {
  webhookLogger.info(
    'automation.approved',
    `Starting onboarding workflow for booking ${event.bookingId}`,
    {
      bookingId: event.bookingId,
      metadata: { moduleId: event.moduleId },
    }
  );

  // TODO: Implement actual n8n webhook trigger or job queue
  if (config.n8n?.webhookBase) {
    try {
      const webhookUrl = `${config.n8n.webhookBase}/booking-approved`;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.n8n.apiKey && { Authorization: `Bearer ${config.n8n.apiKey}` }),
        },
        body: JSON.stringify({
          bookingId: event.bookingId,
          moduleId: event.moduleId,
          timestamp: event.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }

      webhookLogger.info(
        'automation.approved.success',
        `Onboarding workflow triggered for ${event.bookingId}`,
        { bookingId: event.bookingId }
      );
    } catch (error) {
      webhookLogger.error(
        'automation.approved.error',
        `Failed to trigger onboarding workflow for ${event.bookingId}`,
        {
          bookingId: event.bookingId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  } else {
    webhookLogger.warn(
      'automation.approved.skipped',
      'N8N_WEBHOOK_BASE not configured, skipping automation trigger',
      { bookingId: event.bookingId }
    );
  }
}

/**
 * Handle PAYMENT_FAILED booking status
 * Triggers payment recovery workflows
 */
export async function handlePaymentFailed(
  event: BookingStatusChangeEvent
): Promise<void> {
  webhookLogger.warn(
    'automation.payment_failed',
    `Payment failed for booking ${event.bookingId}`,
    {
      bookingId: event.bookingId,
      metadata: { paymentStatus: event.paymentStatus },
    }
  );

  // TODO: Implement payment recovery automation
  if (config.n8n?.webhookBase) {
    try {
      const webhookUrl = `${config.n8n.webhookBase}/payment-failed`;
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.n8n.apiKey && { Authorization: `Bearer ${config.n8n.apiKey}` }),
        },
        body: JSON.stringify({
          bookingId: event.bookingId,
          paymentStatus: event.paymentStatus,
          timestamp: event.timestamp,
        }),
      });

      webhookLogger.info(
        'automation.payment_failed.recovery_started',
        `Payment recovery workflow triggered for ${event.bookingId}`,
        { bookingId: event.bookingId }
      );
    } catch (error) {
      webhookLogger.error(
        'automation.payment_failed.error',
        `Failed to trigger payment recovery for ${event.bookingId}`,
        {
          bookingId: event.bookingId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }
}

/**
 * Handle COMPLETED booking status
 * Triggers post-delivery workflows
 */
export async function handleCompletedBooking(
  event: BookingStatusChangeEvent
): Promise<void> {
  webhookLogger.info(
    'automation.completed',
    `Booking ${event.bookingId} completed`,
    {
      bookingId: event.bookingId,
      metadata: { moduleId: event.moduleId },
    }
  );

  // TODO: Implement post-delivery automation
  // - Send feedback request
  // - Trigger review sequence
  // - Update analytics
  if (config.n8n?.webhookBase) {
    try {
      const webhookUrl = `${config.n8n.webhookBase}/booking-completed`;
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.n8n.apiKey && { Authorization: `Bearer ${config.n8n.apiKey}` }),
        },
        body: JSON.stringify({
          bookingId: event.bookingId,
          moduleId: event.moduleId,
          timestamp: event.timestamp,
        }),
      });

      webhookLogger.info(
        'automation.completed.success',
        `Post-delivery workflow triggered for ${event.bookingId}`,
        { bookingId: event.bookingId }
      );
    } catch (error) {
      webhookLogger.error(
        'automation.completed.error',
        `Failed to trigger post-delivery workflow for ${event.bookingId}`,
        {
          bookingId: event.bookingId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }
}

/**
 * Handle IN_PROGRESS booking status
 * Triggers project management workflows
 */
export async function handleInProgressBooking(
  event: BookingStatusChangeEvent
): Promise<void> {
  webhookLogger.info(
    'automation.in_progress',
    `Booking ${event.bookingId} now in progress`,
    {
      bookingId: event.bookingId,
      metadata: { moduleId: event.moduleId },
    }
  );

  // TODO: Implement in-progress automation
  // - Set up project tracking
  // - Schedule check-ins
  // - Initialize deliverables tracking
}

/**
 * Main event dispatcher
 * Routes events to appropriate handlers based on status
 */
export async function dispatchBookingEvent(
  event: BookingStatusChangeEvent
): Promise<void> {
  const { newStatus } = event;

  try {
    switch (newStatus) {
      case 'APPROVED':
        await handleApprovedBooking(event);
        break;
      case 'PAYMENT_FAILED':
        await handlePaymentFailed(event);
        break;
      case 'COMPLETED':
        await handleCompletedBooking(event);
        break;
      case 'IN_PROGRESS':
        await handleInProgressBooking(event);
        break;
      default:
        webhookLogger.info(
          'automation.status_change',
          `Booking ${event.bookingId} status changed to ${newStatus}`,
          {
            bookingId: event.bookingId,
            metadata: { newStatus, previousStatus: event.previousStatus },
          }
        );
    }
  } catch (error) {
    webhookLogger.error(
      'automation.dispatch_error',
      `Failed to dispatch event for booking ${event.bookingId}`,
      {
        bookingId: event.bookingId,
        error: error instanceof Error ? error.message : String(error),
        metadata: { newStatus, previousStatus: event.previousStatus },
      }
    );
    throw error;
  }
}
