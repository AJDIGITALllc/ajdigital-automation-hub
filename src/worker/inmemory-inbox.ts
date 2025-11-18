/**
 * In-Memory Inbox Adapter
 * 
 * Simple in-memory queue for local testing
 * NOT for production use - just for development/testing
 */

import { BaseEvent } from '../types/events.js';
import { WorkerInboxAdapter } from './types.js';

export class InMemoryInboxAdapter implements WorkerInboxAdapter {
  private queue: BaseEvent[] = [];
  private processed: Set<string> = new Set();
  private failed: Map<string, Error> = new Map();
  
  /**
   * Add events to the in-memory queue
   * Useful for testing
   */
  addEvents(events: BaseEvent[]): void {
    this.queue.push(...events);
  }
  
  /**
   * Poll for events from the queue
   */
  async pollEvents(limit: number): Promise<BaseEvent[]> {
    const batch = this.queue.splice(0, limit);
    return batch;
  }
  
  /**
   * Mark event as processed (just logs and tracks)
   */
  async markProcessed(eventId: string): Promise<void> {
    this.processed.add(eventId);
    console.log(`[InMemoryInbox] Marked event ${eventId} as processed`);
  }
  
  /**
   * Mark event as failed (logs error and tracks)
   */
  async markFailed(eventId: string, error: Error): Promise<void> {
    this.failed.set(eventId, error);
    console.error(`[InMemoryInbox] Event ${eventId} failed:`, error.message);
  }
  
  /**
   * Get processing stats (useful for testing)
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      processedCount: this.processed.size,
      failedCount: this.failed.size,
    };
  }
  
  /**
   * Clear all state (useful for testing)
   */
  clear(): void {
    this.queue = [];
    this.processed.clear();
    this.failed.clear();
  }
}
