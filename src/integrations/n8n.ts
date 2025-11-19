/**
 * N8N Webhook Emitter
 * 
 * Optional helper for emitting events to n8n workflows
 * Only active when N8N_WEBHOOK_URL is configured
 */

import type { BaseEvent } from '../types/events.js';

export interface N8nEmitterOptions {
  /** n8n webhook URL (defaults to N8N_WEBHOOK_URL env var) */
  webhookUrl?: string;
  
  /** Request timeout in milliseconds (default: 5000) */
  timeoutMs?: number;
}

/**
 * N8N Webhook Emitter
 * 
 * Sends events to n8n workflows via webhook
 * Gracefully handles missing configuration and errors
 */
export class N8nEmitter {
  private readonly webhookUrl?: string;
  private readonly timeoutMs: number;
  
  constructor(options: N8nEmitterOptions = {}) {
    this.webhookUrl = options.webhookUrl ?? process.env.N8N_WEBHOOK_URL;
    this.timeoutMs = options.timeoutMs ?? 5000;
  }
  
  /**
   * Check if emitter is configured and enabled
   */
  get isEnabled(): boolean {
    return !!this.webhookUrl;
  }
  
  /**
   * Emit event to n8n webhook
   * 
   * @param event - Event to send
   * @returns Promise that resolves when webhook call completes
   */
  async emit(event: BaseEvent): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('[n8n] N8N_WEBHOOK_URL not configured; skipping emit.');
      return;
    }
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!res.ok) {
        const text = await res.text();
        console.error(
          `[n8n] Webhook responded with non-OK status: ${res.status}`,
          text.slice(0, 200)
        );
      } else {
        console.log(`[n8n] Successfully emitted event: ${event.name} (${event.id})`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error(`[n8n] Webhook request timed out after ${this.timeoutMs}ms`);
      } else {
        console.error(
          '[n8n] Failed to emit event:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  }
  
  /**
   * Emit multiple events in batch
   * 
   * @param events - Array of events to send
   * @returns Promise that resolves when all webhook calls complete
   */
  async emitBatch(events: BaseEvent[]): Promise<void> {
    if (!this.isEnabled) {
      console.warn('[n8n] N8N_WEBHOOK_URL not configured; skipping batch emit.');
      return;
    }
    
    await Promise.all(events.map(event => this.emit(event)));
  }
}
