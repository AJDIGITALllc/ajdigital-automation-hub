/**
 * Inbox Factory
 * 
 * Creates the appropriate inbox adapter based on INBOX_DRIVER env var
 */

import { WorkerInboxAdapter } from './types.js';
import { InMemoryInboxAdapter } from './inmemory-inbox.js';
import { FirestoreInboxAdapter } from './firestore-inbox.js';

export type InboxDriver = 'memory' | 'firestore';

/**
 * Create inbox adapter based on environment configuration
 * 
 * Reads INBOX_DRIVER env var:
 * - "memory" (default): In-memory queue for testing
 * - "firestore": Reads from Firestore collections
 * 
 * Falls back to in-memory if Firestore initialization fails
 * 
 * @returns Configured WorkerInboxAdapter
 */
export function createInboxAdapter(): WorkerInboxAdapter {
  const driver = (process.env.INBOX_DRIVER as InboxDriver) ?? 'memory';
  
  if (driver === 'firestore') {
    try {
      console.log('[inbox-factory] Creating Firestore inbox adapter');
      return new FirestoreInboxAdapter();
    } catch (err) {
      console.error(
        '[inbox-factory] Failed to init FirestoreInboxAdapter, falling back to InMemoryInboxAdapter:',
        err instanceof Error ? err.message : String(err)
      );
      console.error('[inbox-factory] Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set');
      return new InMemoryInboxAdapter();
    }
  }
  
  console.log('[inbox-factory] Creating in-memory inbox adapter');
  return new InMemoryInboxAdapter();
}
