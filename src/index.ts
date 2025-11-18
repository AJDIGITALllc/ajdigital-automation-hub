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
