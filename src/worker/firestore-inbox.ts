/**
 * Firestore Inbox Adapter
 * 
 * Reads events from Firestore collections populated by portals:
 * - portalEvents (from audiojones-client)
 * - adminEvents (from audiojones-admin)
 */

import { db } from '../lib/firebase-admin.js';
import { BaseEvent, EventName, EventSource } from '../types/events.js';
import { WorkerInboxAdapter } from './types.js';

/**
 * Firestore document shape from portal/admin events
 */
interface FirestoreEventDoc {
  id?: string;
  name: string;
  source: string;
  tenantId?: string;
  userId?: string;
  adminId?: string;
  moduleIds?: string[];
  occurredAt?: string;
  payload?: Record<string, unknown>;
  processed?: boolean;
  failed?: boolean;
  processedAt?: string;
  failedAt?: string;
  failureMessage?: string;
}

/**
 * Firestore-backed inbox adapter
 * 
 * Reads from portalEvents and adminEvents collections
 * Marks documents as processed or failed after handling
 */
export class FirestoreInboxAdapter implements WorkerInboxAdapter {
  private readonly portalCollectionName: string;
  private readonly adminCollectionName: string;
  private readonly maxBatchSize: number;
  
  constructor(options?: {
    portalCollectionName?: string;
    adminCollectionName?: string;
    maxBatchSize?: number;
  }) {
    this.portalCollectionName = options?.portalCollectionName ?? 'portalEvents';
    this.adminCollectionName = options?.adminCollectionName ?? 'adminEvents';
    this.maxBatchSize = options?.maxBatchSize ?? 20;
    
    // Lazy validation - will throw when db() is called if creds missing
    try {
      db();
    } catch (error) {
      throw new Error(
        `FirestoreInboxAdapter initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  private get db() {
    return db();
  }
  
  /**
   * Poll events from both portal and admin collections
   * 
   * @param limit - Maximum number of events to return
   * @returns Array of BaseEvent ready for processing
   */
  async pollEvents(limit: number): Promise<BaseEvent[]> {
    const effectiveLimit = Math.min(limit, this.maxBatchSize);
    const half = Math.max(1, Math.floor(effectiveLimit / 2));
    const events: BaseEvent[] = [];
    
    // Poll from portalEvents
    try {
      const portalSnapshot = await this.db
        .collection(this.portalCollectionName)
        .where('processed', '!=', true)
        .where('failed', '!=', true)
        .orderBy('occurredAt', 'asc')
        .limit(half)
        .get();
      
      for (const doc of portalSnapshot.docs) {
        const event = this.mapDocToEvent(doc.id, doc.data() as FirestoreEventDoc, this.portalCollectionName);
        if (event) {
          events.push(event);
        }
      }
    } catch (error) {
      console.error(
        `[FirestoreInbox] Error polling ${this.portalCollectionName}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
    
    // Poll from adminEvents
    try {
      const adminSnapshot = await this.db
        .collection(this.adminCollectionName)
        .where('processed', '!=', true)
        .where('failed', '!=', true)
        .orderBy('occurredAt', 'asc')
        .limit(half)
        .get();
      
      for (const doc of adminSnapshot.docs) {
        const event = this.mapDocToEvent(doc.id, doc.data() as FirestoreEventDoc, this.adminCollectionName);
        if (event) {
          events.push(event);
        }
      }
    } catch (error) {
      console.error(
        `[FirestoreInbox] Error polling ${this.adminCollectionName}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
    
    return events;
  }
  
  /**
   * Map Firestore document to BaseEvent
   * 
   * @param docId - Firestore document ID
   * @param data - Document data
   * @param collection - Collection name
   * @returns BaseEvent or null if mapping fails
   */
  private mapDocToEvent(
    docId: string,
    data: FirestoreEventDoc,
    collection: string
  ): BaseEvent | null {
    try {
      const event: BaseEvent = {
        id: docId,
        name: data.name as EventName,
        source: (data.source as EventSource) || 'system',
        tenantId: data.tenantId,
        userId: data.userId || data.adminId,
        moduleIds: data.moduleIds as any,
        occurredAt: data.occurredAt || new Date().toISOString(),
        payload: {
          ...(data.payload || {}),
          _inbox: {
            collection,
            docId,
          },
        },
      };
      
      return event;
    } catch (error) {
      console.error(
        `[FirestoreInbox] Failed to map doc ${docId} from ${collection}:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }
  
  /**
   * Mark event as successfully processed
   * 
   * @param eventId - Event ID to mark
   */
  async markProcessed(eventId: string): Promise<void> {
    try {
      // Try to find the event in either collection
      const collections = [this.portalCollectionName, this.adminCollectionName];
      
      for (const collectionName of collections) {
        try {
          const docRef = this.db.collection(collectionName).doc(eventId);
          const doc = await docRef.get();
          
          if (doc.exists) {
            await docRef.update({
              processed: true,
              processedAt: new Date().toISOString(),
              status: 'processed',
            });
            
            console.log(`[FirestoreInbox] Marked ${eventId} as processed in ${collectionName}`);
            return;
          }
        } catch (err) {
          // Continue to next collection
        }
      }
      
      console.warn(`[FirestoreInbox] Event ${eventId} not found in any collection`);
    } catch (error) {
      console.error(
        `[FirestoreInbox] Error marking ${eventId} as processed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Mark event as failed
   * 
   * @param eventId - Event ID that failed
   * @param error - Error that caused the failure
   */
  async markFailed(eventId: string, error: Error): Promise<void> {
    try {
      // Try to find the event in either collection
      const collections = [this.portalCollectionName, this.adminCollectionName];
      
      for (const collectionName of collections) {
        try {
          const docRef = this.db.collection(collectionName).doc(eventId);
          const doc = await docRef.get();
          
          if (doc.exists) {
            await docRef.update({
              failed: true,
              failedAt: new Date().toISOString(),
              status: 'failed',
              lastError: {
                message: error.message?.slice(0, 500),
                stack: error.stack?.slice(0, 1000),
                timestamp: new Date().toISOString(),
              },
            });
            
            console.error(`[FirestoreInbox] Marked ${eventId} as failed in ${collectionName}: ${error.message}`);
            return;
          }
        } catch (err) {
          // Continue to next collection
        }
      }
      
      console.warn(`[FirestoreInbox] Event ${eventId} not found in any collection`);
    } catch (error) {
      console.error(
        `[FirestoreInbox] Error marking ${eventId} as failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
