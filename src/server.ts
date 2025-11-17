/**
 * Express Server for Automation Hub
 * Handles event intake and admin endpoints
 */

import express, { Request, Response, NextFunction } from 'express';
import { config } from './lib/config';
import {
  webhookLogger,
  logBookingStatusChange,
  logWebhookEvent,
} from './lib/webhook-logger';
import {
  isBookingStatusChangeEvent,
  isValidBookingStatus,
  type BookingStatusChangeEvent,
  type WebhookEvent,
  type ErrorResponse,
} from './types/platform';
import { dispatchBookingEvent } from './handlers/event-handlers';
import { runGovernanceChecks, type GovernanceReport } from './lib/governance';

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Validate internal API key
 * TODO: Implement proper authentication strategy
 */
function validateInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!config.admin.internalApiKey) {
    // If no key configured, allow in development
    if (config.nodeEnv === 'development') {
      return next();
    }
    res.status(500).json({ error: 'Internal API key not configured' });
    return;
  }

  if (apiKey !== config.admin.internalApiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

/**
 * Validate admin API key
 * TODO: Implement proper admin authentication
 */
function validateAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!config.admin.adminKey) {
    // If no key configured, allow in development
    if (config.nodeEnv === 'development') {
      return next();
    }
    res.status(500).json({ error: 'Admin API key not configured' });
    return;
  }

  if (apiKey !== config.admin.adminKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

/**
 * Validate cron secret
 */
function validateCronAuth(req: Request, res: Response, next: NextFunction): void {
  const cronSecret = req.headers['x-cron-secret'];

  if (!config.admin.cronSecret) {
    if (config.nodeEnv === 'development') {
      return next();
    }
    res.status(500).json({ error: 'Cron secret not configured' });
    return;
  }

  if (cronSecret !== config.admin.cronSecret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

// ============================================================================
// Event Intake Endpoints
// ============================================================================

/**
 * POST /api/events/booking-updated
 * Receives booking status change events from client portal
 */
app.post('/api/events/booking-updated', validateInternalAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Validate event structure
    if (!isBookingStatusChangeEvent(body)) {
      return res.status(400).json({
        error: 'Invalid booking status change event',
        details: 'Event must include bookingId, previousStatus, newStatus, timestamp, and triggeredBy',
      } as ErrorResponse);
    }

    const event: BookingStatusChangeEvent = body;

    // Log the event
    logBookingStatusChange(event);

    // Dispatch to automation handlers
    await dispatchBookingEvent(event);

    res.status(200).json({ success: true, eventId: `booking-${event.bookingId}-${Date.now()}` });
  } catch (error) {
    webhookLogger.error('api.booking_updated.error', 'Failed to process booking update', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to process event',
      details: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

/**
 * POST /api/events/booking-created
 * Receives new booking creation events
 */
app.post('/api/events/booking-created', validateInternalAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId, moduleId, timestamp, userId } = req.body;

    if (!bookingId || !moduleId || !timestamp) {
      return res.status(400).json({
        error: 'Invalid booking created event',
        details: 'Event must include bookingId, moduleId, and timestamp',
      } as ErrorResponse);
    }

    webhookLogger.info('booking.created', `New booking created: ${bookingId}`, {
      bookingId,
      metadata: { moduleId, userId },
    });

    // TODO: Implement booking creation automation
    // - Send confirmation email
    // - Create project tracking
    // - Notify admin team

    res.status(200).json({ success: true, eventId: `booking-created-${bookingId}` });
  } catch (error) {
    webhookLogger.error('api.booking_created.error', 'Failed to process booking creation', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to process event',
      details: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

/**
 * POST /api/events/payment-updated
 * Receives payment status change events
 */
app.post('/api/events/payment-updated', validateInternalAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentStatus, provider, externalId, timestamp } = req.body;

    if (!bookingId || !paymentStatus || !timestamp) {
      return res.status(400).json({
        error: 'Invalid payment updated event',
        details: 'Event must include bookingId, paymentStatus, and timestamp',
      } as ErrorResponse);
    }

    webhookLogger.info('payment.updated', `Payment updated for booking ${bookingId}: ${paymentStatus}`, {
      bookingId,
      metadata: { paymentStatus, provider, externalId },
    });

    // TODO: Implement payment automation
    // - Update booking status based on payment
    // - Send receipts
    // - Handle failed payments

    res.status(200).json({ success: true, eventId: `payment-${bookingId}-${Date.now()}` });
  } catch (error) {
    webhookLogger.error('api.payment_updated.error', 'Failed to process payment update', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Failed to process event',
      details: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// ============================================================================
// Admin Endpoints
// ============================================================================

/**
 * GET /api/admin/webhook-logs
 * Retrieve webhook logs
 */
app.get('/api/admin/webhook-logs', validateAdminAuth, (req: Request, res: Response) => {
  const { level, eventType, bookingId, since, limit } = req.query;

  let logs = webhookLogger.getFilteredLogs({
    level: level as any,
    eventType: eventType as string,
    bookingId: bookingId as string,
    since: since as string,
  });

  if (limit) {
    const limitNum = parseInt(limit as string, 10);
    logs = logs.slice(-limitNum);
  }

  res.json({
    success: true,
    data: {
      logs,
      total: webhookLogger.getLogCount(),
      filtered: logs.length,
    },
  });
});

/**
 * DELETE /api/admin/webhook-logs
 * Clear webhook logs
 */
app.delete('/api/admin/webhook-logs', validateAdminAuth, (req: Request, res: Response) => {
  webhookLogger.clearLogs();
  res.json({ success: true, message: 'Logs cleared' });
});

/**
 * GET /api/admin/governance
 * Run governance checks
 */
app.get('/api/admin/governance', validateAdminAuth, async (req: Request, res: Response) => {
  try {
    const report: GovernanceReport = await runGovernanceChecks();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({
      error: 'Governance check failed',
      details: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

/**
 * GET /api/cron/governance
 * Cron-triggered governance check with notification
 */
app.get('/api/cron/governance', validateCronAuth, async (req: Request, res: Response) => {
  try {
    const report: GovernanceReport = await runGovernanceChecks();

    // Send notification if there are failures
    if (report.overallStatus === 'fail' || report.summary.failed > 0) {
      webhookLogger.error('governance.check_failed', `Governance check failed: ${report.summary.failed} checks failed`, {
        metadata: report.summary,
      });
    } else if (report.summary.warnings > 0) {
      webhookLogger.warn('governance.check_warnings', `Governance check passed with warnings: ${report.summary.warnings} warnings`, {
        metadata: report.summary,
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    webhookLogger.error('governance.cron_error', 'Cron governance check failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      error: 'Governance check failed',
      details: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: config.nodeEnv === 'development' ? err.message : undefined,
  } as ErrorResponse);
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Automation Hub server running on port ${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Notifications: ${config.notifications.enabled ? 'enabled' : 'disabled'}`);
  console.log(`   n8n: ${config.n8n?.baseUrl || 'not configured'}`);
});

export { app };
