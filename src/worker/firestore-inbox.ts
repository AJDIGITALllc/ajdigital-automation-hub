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
    const half = Math.max(1, Math.floor(limit / 2));
    const events: BaseEvent[] = [];
    
    // Poll from portalEvents
    try {
      const portalSnapshot = await this.db
        .collection('portalEvents')
        .where('processed', '!=', true)
        .where('failed', '!=', true)
        .orderBy('occurredAt', 'asc')
        .limit(half)
        .get();
      
      for (const doc of portalSnapshot.docs) {
        const event = this.mapDocToEvent(doc.id, doc.data() as FirestoreEventDoc, 'portalEvents');
        if (event) {
          events.push(event);
        }
      }
    } catch (error) {
      console.error(
        '[FirestoreInbox] Error polling portalEvents:',
        error instanceof Error ? error.message : String(error)
      );
    }
    
    // Poll from adminEvents
    try {
      const adminSnapshot = await this.db
        .collection('adminEvents')
        .where('processed', '!=', true)
        .where('failed', '!=', true)
        .orderBy('occurredAt', 'asc')
        .limit(half)
        .get();
      
      for (const doc of adminSnapshot.docs) {
        const event = this.mapDocToEvent(doc.id, doc.data() as FirestoreEventDoc, 'adminEvents');
        if (event) {
          events.push(event);
        }
      }
    } catch (error) {
      console.error(
        '[FirestoreInbox] Error polling adminEvents:',
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
      const collections = ['portalEvents', 'adminEvents'];
      
      for (const collectionName of collections) {
        try {
          const docRef = this.db.collection(collectionName).doc(eventId);
          const doc = await docRef.get();
          
          if (doc.exists) {
            await docRef.update({
              processed: true,
              processedAt: new Date().toISOString(),
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
      const collections = ['portalEvents', 'adminEvents'];
      
      for (const collectionName of collections) {
        try {
          const docRef = this.db.collection(collectionName).doc(eventId);
          const doc = await docRef.get();
          
          if (doc.exists) {
            await docRef.update({
              failed: true,
              failedAt: new Date().toISOString(),
              failureMessage: error.message?.slice(0, 500),
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
