/**
 * Event Router Worker
 * 
 * Main processing loop that:
 * 1. Polls events from inbox
 * 2. Routes events to appropriate modules
 * 3. Executes module handlers
 * 4. Marks events as processed or failed
 */

import { routeEvent, getRouterConfig } from '../lib/router.js';
import { moduleHandlers } from './module-handlers.js';
import { WorkerInboxAdapter } from './types.js';
import { InMemoryInboxAdapter } from './inmemory-inbox.js';
import { FirestoreInboxAdapter } from './firestore-inbox.js';

/**
 * Get inbox adapter based on INBOX_DRIVER environment variable
 * 
 * @returns Configured inbox adapter
 */
function getInboxAdapter(): WorkerInboxAdapter {
  const driver = process.env.INBOX_DRIVER || 'memory';
  
  if (driver === 'firestore') {
    console.log('[Worker] Using Firestore inbox adapter');
    return new FirestoreInboxAdapter();
  }
  
  console.log('[Worker] Using in-memory inbox adapter');
  return new InMemoryInboxAdapter();
}

/**
 * Process a batch of events from the inbox
 * 
 * @param inbox - Inbox adapter to poll events from
 * @param batchSize - Maximum number of events to process in this batch
 */
export async function processBatch(
  inbox: WorkerInboxAdapter,
  batchSize = 10
): Promise<void> {
  const config = await getRouterConfig();
  
  // Poll events from inbox
  const events = await inbox.pollEvents(batchSize);
  
  if (events.length === 0) {
    console.log('[Worker] No events to process');
    return;
  }
  
  console.log(`[Worker] Processing batch of ${events.length} events`);
  
  // Process each event
  for (const event of events) {
    try {
      console.log(`\n[Worker] Processing event: ${event.name} (${event.id})`);
      
      // Route event to determine which modules should handle it
      const moduleIds = await routeEvent(event);
      
      if (moduleIds.length === 0) {
        console.warn(`[Worker] No modules configured for event: ${event.name}`);
        await inbox.markProcessed(event.id);
        continue;
      }
      
      console.log(`[Worker] Routing to modules: ${moduleIds.join(', ')}`);
      
      // Execute each module handler
      const handlerPromises = moduleIds.map(async (moduleId) => {
        const handler = moduleHandlers[moduleId];
        
        if (!handler) {
          console.error(`[Worker] No handler found for module: ${moduleId}`);
          return;
        }
        
        try {
          await handler({
            event,
            moduleId,
            routerConfig: config,
          });
        } catch (error) {
          console.error(
            `[Worker] Handler failed for module ${moduleId}:`,
            error instanceof Error ? error.message : String(error)
          );
          throw error; // Re-throw to fail the whole event
        }
      });
      
      // Wait for all handlers to complete
      await Promise.all(handlerPromises);
      
      // Mark event as successfully processed
      await inbox.markProcessed(event.id);
      console.log(`[Worker] ✓ Event ${event.id} processed successfully`);
      
    } catch (error) {
      // Mark event as failed
      const err = error instanceof Error ? error : new Error(String(error));
      await inbox.markFailed(event.id, err);
      console.error(`[Worker] ✗ Event ${event.id} failed:`, err.message);
    }
  }
}

/**
 * Run worker once (process one batch and exit)
 * Useful for testing and cron-style invocation
 * 
 * @param inbox - Optional inbox adapter (defaults to env-based selection)
 * @param batchSize - Maximum events to process
 */
export async function runOnce(
  inbox?: WorkerInboxAdapter,
  batchSize = 10
): Promise<void> {
  const adapter = inbox || getInboxAdapter();
  
  console.log('[Worker] Starting single run...\n');
  
  try {
    await processBatch(adapter, batchSize);
    console.log('\n[Worker] Single run complete');
  } catch (error) {
    console.error(
      '[Worker] Run failed:',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Run worker in continuous loop
 * Processes batches until stopped
 * 
 * @param inbox - Optional inbox adapter (defaults to env-based selection)
 * @param options - Worker configuration
 */
export async function runContinuous(
  inbox?: WorkerInboxAdapter,
  options: {
    batchSize?: number;
    pollIntervalMs?: number;
  } = {}
): Promise<void> {
  const adapter = inbox || getInboxAdapter();
  const { batchSize = 10, pollIntervalMs = 5000 } = options;
  
  console.log('[Worker] Starting continuous mode...');
  console.log(`[Worker] Batch size: ${batchSize}, Poll interval: ${pollIntervalMs}ms\n`);
  
  let running = true;
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Worker] Received SIGINT, shutting down gracefully...');
    running = false;
  });
  
  process.on('SIGTERM', () => {
    console.log('\n[Worker] Received SIGTERM, shutting down gracefully...');
    running = false;
  });
  
  // Main processing loop
  while (running) {
    try {
      await processBatch(adapter, batchSize);
    } catch (error) {
      console.error(
        '[Worker] Batch processing error:',
        error instanceof Error ? error.message : String(error)
      );
    }
    
    // Wait before next poll
    if (running) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }
  
  console.log('[Worker] Shutdown complete');
}
