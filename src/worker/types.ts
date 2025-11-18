/**
 * Worker Type Definitions
 * 
 * Defines interfaces for the event processing worker
 */

import { BaseEvent, ModuleId } from '../types/events.js';
import { RouterConfig } from '../types/router.js';

/**
 * Context provided to module handlers
 */
export interface ModuleHandlerContext {
  /** The event being processed */
  event: BaseEvent;
  
  /** Which module is handling this event */
  moduleId: ModuleId;
  
  /** Full router configuration */
  routerConfig: RouterConfig;
}

/**
 * Module handler function signature
 * 
 * Each module implements a handler that processes events routed to it
 */
export type ModuleHandler = (ctx: ModuleHandlerContext) => Promise<void>;

/**
 * Inbox adapter interface
 * 
 * Abstracts the event source (Firestore, Pub/Sub, n8n, etc.)
 * Implementations can poll different sources and mark processing status
 */
export interface WorkerInboxAdapter {
  /**
   * Poll for new events to process
   * 
   * @param limit - Maximum number of events to return
   * @returns Array of events ready for processing
   */
  pollEvents(limit: number): Promise<BaseEvent[]>;
  
  /**
   * Mark an event as successfully processed
   * 
   * @param eventId - Event ID to mark as processed
   */
  markProcessed(eventId: string): Promise<void>;
  
  /**
   * Mark an event as failed
   * 
   * @param eventId - Event ID that failed
   * @param error - Error that caused the failure
   */
  markFailed(eventId: string, error: Error): Promise<void>;
}
