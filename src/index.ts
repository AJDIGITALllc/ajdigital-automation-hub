/**
 * ajdigital-automation-hub Event SDK
 * 
 * Public API for event types, routing, and configuration
 */

// Event Types
export type {
  BaseEvent,
  BookingEvent,
  AssetEvent,
  PaymentEvent,
  EventName,
  EventSource,
  ModuleId,
} from './types/events.js';

export {
  isBookingEvent,
  isAssetEvent,
  isPaymentEvent,
} from './types/events.js';

// Router Types
export type {
  RouterConfig,
  EventConfig,
  Priority,
} from './types/router.js';

export {
  RouterConfigSchema,
  validateRouterConfig,
  safeValidateRouterConfig,
} from './types/router.js';

// Configuration Loading
export {
  loadModuleConfigs,
  loadModulesRouter,
} from './lib/config-loader.js';

// Event Routing
export {
  getRouterConfig,
  routeEvent,
  getEventOptions,
  getEventOptionsAsync,
  isEventConfigured,
  getConfiguredEvents,
  clearRouterCache,
} from './lib/router.js';

// Worker Components
export type {
  WorkerInboxAdapter,
  ModuleHandler,
  ModuleHandlerContext,
} from './worker/types.js';

export { InMemoryInboxAdapter } from './worker/inmemory-inbox.js';
export { FirestoreInboxAdapter } from './worker/firestore-inbox.js';
export { createInboxAdapter } from './worker/inbox-factory.js';
export type { InboxDriver } from './worker/inbox-factory.js';

// Integrations
export { N8nEmitter } from './integrations/n8n.js';
export type { N8nEmitterOptions } from './integrations/n8n.js';

// Cal.com Integration
export type { CalEventTypeConfig } from './config/cal-event-types.js';
export {
  CAL_EVENT_TYPES,
  getEventTypeBySlug,
  getEventTypesByModule,
  getVisibleEventTypes,
} from './config/cal-event-types.js';

export {
  CalApi,
  createBookingFromPurchase,
} from './integrations/cal/client.js';
export type {
  CalEventType,
  CalBooking,
} from './integrations/cal/client.js';

export { syncCalEventTypes } from './jobs/cal-sync-event-types.js';

export {
  handleCalWebhook,
  verifyWebhookSignature,
} from './handlers/cal-webhook.js';
export type {
  CalWebhookEventType,
  CalWebhookPayload,
} from './handlers/cal-webhook.js';
