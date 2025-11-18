#!/usr/bin/env node
/**
 * Worker Runner Script
 * 
 * Runs the event router worker with sample events for testing
 */

import { randomUUID } from 'crypto';
import { InMemoryInboxAdapter } from '../src/worker/inmemory-inbox.js';
import { runOnce } from '../src/worker/runner.js';
import { BaseEvent, BookingEvent, AssetEvent } from '../src/types/events.js';

/**
 * Create sample events for testing
 */
function createSampleEvents(): BaseEvent[] {
  const now = new Date().toISOString();
  
  // Sample booking.created event
  const bookingCreated: BookingEvent = {
    id: randomUUID(),
    name: 'booking.created',
    source: 'client-portal',
    tenantId: 'tenant-demo',
    userId: 'user-123',
    occurredAt: now,
    payload: {
      bookingId: 'booking-abc123',
      serviceId: 'service-xyz',
      status: 'pending',
      priceCents: 50000,
      currency: 'USD',
      billingProvider: 'whop',
    },
  };
  
  // Sample asset.uploaded event
  const assetUploaded: AssetEvent = {
    id: randomUUID(),
    name: 'asset.uploaded',
    source: 'client-portal',
    tenantId: 'tenant-demo',
    userId: 'user-456',
    occurredAt: now,
    payload: {
      assetId: 'asset-def456',
      bookingId: 'booking-abc123',
      type: 'audio/wav',
      size: 15728640, // 15MB
      filename: 'demo-track.wav',
    },
  };
  
  // Sample payment.completed event
  const paymentCompleted: BaseEvent = {
    id: randomUUID(),
    name: 'payment.completed',
    source: 'system',
    tenantId: 'tenant-demo',
    occurredAt: now,
    payload: {
      paymentId: 'pay-ghi789',
      bookingId: 'booking-abc123',
      amountCents: 50000,
      currency: 'USD',
      status: 'completed',
      billingProvider: 'whop',
    },
  };
  
  return [bookingCreated, assetUploaded, paymentCompleted];
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Event Router Worker - Test Run\n');
  console.log('=' .repeat(60));
  
  // Create in-memory inbox and seed with sample events
  const inbox = new InMemoryInboxAdapter();
  const sampleEvents = createSampleEvents();
  
  console.log('\n📥 Seeding inbox with sample events:');
  for (const event of sampleEvents) {
    console.log(`  - ${event.name} (${event.id})`);
  }
  
  inbox.addEvents(sampleEvents);
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Run worker once
  try {
    await runOnce(inbox);
    
    // Print stats
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Processing Stats:');
    const stats = inbox.getStats();
    console.log(`  - Queue remaining: ${stats.queueSize}`);
    console.log(`  - Processed: ${stats.processedCount}`);
    console.log(`  - Failed: ${stats.failedCount}`);
    
    console.log('\n✨ Test run complete!\n');
    
  } catch (error) {
    console.error('\n❌ Worker run failed:');
    
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(`  ${String(error)}`);
    }
    
    process.exit(1);
  }
}

main();
