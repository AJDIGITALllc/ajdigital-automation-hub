# Phase 4 - Cross-Repo Integration

## Event Flow

This automation hub serves as the central event processor for the Audio Jones ecosystem.

### Event Sources

1. **audiojones-client** → Sends booking status changes
   - Endpoint: `POST /api/events/booking-updated`
   - Authentication: `x-api-key: ${INTERNAL_API_KEY}`
   - Payload: `BookingStatusChangeEvent`

2. **audiojones.com** → Sends lead/inquiry events (future)
   - Endpoint: TBD
   - Authentication: `x-api-key: ${INTERNAL_API_KEY}`

### Type Consistency

**CRITICAL**: The following types MUST match exactly across all repos:

- `ModuleId` (src/types/platform.ts)
- `BookingStatus` (src/types/platform.ts)
- `PaymentStatus` (src/types/platform.ts)
- `BookingStatusChangeEvent` (src/types/platform.ts)
- `WebhookEvent` (src/types/platform.ts)

Any changes to these types must be synchronized across:
- ajdigital-automation-hub
- audiojones-client
- audiojones.com

### Integration Checklist

#### From audiojones-client

When a booking status changes in the client portal:

```typescript
// In audiojones-client/src/lib/booking-service.ts
const event: BookingStatusChangeEvent = {
  bookingId: booking.id,
  previousStatus: booking.status,
  newStatus: newStatus,
  moduleId: booking.module,
  paymentStatus: booking.payment?.status,
  timestamp: new Date().toISOString(),
  triggeredBy: 'user',
};

// Send to automation hub
await fetch(`${HUB_URL}/api/events/booking-updated`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.INTERNAL_API_KEY!,
  },
  body: JSON.stringify(event),
});
```

#### From audiojones.com

Reserved for future lead generation events:

```typescript
// Future implementation
// Send qualified leads to automation hub for nurturing workflows
```

### Authentication Requirements

**TODO**: Implement proper authentication for all endpoints

Current authentication stub accepts:
- `x-api-key` header OR
- `Authorization: Bearer <token>` header

Required environment variables:
- `INTERNAL_API_KEY` - For inter-service communication
- `ADMIN_API_KEY` - For admin/governance endpoints
- `CRON_SECRET` - For scheduled job authentication

### Automation Workflows

When events are received, the hub triggers:

1. **APPROVED bookings** → Onboarding workflow
   - n8n webhook: `${N8N_WEBHOOK_BASE}/booking-approved`
   - Actions: Send welcome email, create project tracking

2. **PAYMENT_FAILED** → Recovery workflow
   - n8n webhook: `${N8N_WEBHOOK_BASE}/payment-failed`
   - Actions: Send payment reminder, alert admin

3. **COMPLETED** → Post-delivery workflow
   - n8n webhook: `${N8N_WEBHOOK_BASE}/booking-completed`
   - Actions: Request feedback, trigger review sequence

4. **IN_PROGRESS** → Project management workflow
   - Actions: Initialize tracking, schedule check-ins

### Monitoring & Observability

- **Webhook Logs**: `/api/admin/webhook-logs` (admin auth required)
- **Governance Report**: `/api/admin/governance` (admin auth required)
- **Health Check**: `/health` (public)
- **Notifications**: Slack/Discord alerts for errors and warnings

### Worker Modes

The automation hub worker can run in two modes:

#### 1. In-Memory Mode (Default - Testing)
```bash
npm run worker:run
# or
INBOX_DRIVER=memory npm run worker:run
```
Uses in-memory queue. Suitable for local testing with sample events.

#### 2. Firestore Mode (Production)
```bash
npm run worker:run:firestore
# or
INBOX_DRIVER=firestore npm run worker:run
```

Reads events from Firestore collections:
- **portalEvents**: Events from audiojones-client
- **adminEvents**: Events from audiojones-admin

**Required Environment Variables for Firestore Mode:**
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY`: Service account private key (with escaped newlines: `\\n`)

**Event Processing:**
- Polls both `portalEvents` and `adminEvents` collections
- Filters for unprocessed events (`processed != true && failed != true`)
- Routes events through `modules-router.yaml` configuration
- Marks events as `processed: true` on success
- Marks events as `failed: true` with error message on failure

### Environment Configuration

See `.env.schema.json` for complete variable documentation.

Key integrations:
- Firebase Admin: For Firestore inbox adapter (portal/admin events)
- n8n: Workflow automation engine
- Whop/Stripe: Payment provider webhooks (future)
- MailerLite: Email automation (future direct integration)
- Slack/Discord: Alert notifications
