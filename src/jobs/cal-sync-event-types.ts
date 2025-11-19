/**
 * Cal.com Event Type Sync Job
 * 
 * Syncs event types from config to Cal.com
 * Run via CLI or scheduled worker
 */

import { CAL_EVENT_TYPES } from '../config/cal-event-types.js';
import { CalApi } from '../integrations/cal/client.js';

/**
 * Sync all event types from config to Cal.com
 * 
 * - Creates new event types that don't exist
 * - Updates existing event types with config changes
 * - Logs all operations for observability
 */
export async function syncCalEventTypes(): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ slug: string; error: string }>;
}> {
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as Array<{ slug: string; error: string }>,
  };

  console.log(`[Cal Sync] Starting sync of ${CAL_EVENT_TYPES.length} event types...`);

  for (const cfg of CAL_EVENT_TYPES) {
    try {
      console.log(`[Cal Sync] Processing: ${cfg.slug}`);

      // 1) Try to find existing event type by slug
      const existing = await CalApi.getEventTypeBySlug(cfg.slug);

      // 2) Build payload from config
      const payload = {
        title: cfg.title,
        slug: cfg.slug,
        description: cfg.description ?? '',
        lengthInMinutes: cfg.lengthInMinutes,
        lengthInMinutesOptions: cfg.lengthInMinutesOptions,
        metadata: cfg.metadata ?? {},
        hidden: cfg.hidden ?? false,
      };

      // 3) Create or update
      if (!existing) {
        await CalApi.createEventType(payload);
        console.log(`[Cal Sync] ✓ Created: ${cfg.slug}`);
        stats.created++;
      } else {
        // Check if update needed (simple comparison)
        const needsUpdate =
          existing.title !== payload.title ||
          existing.description !== payload.description ||
          existing.lengthInMinutes !== payload.lengthInMinutes ||
          existing.hidden !== payload.hidden;

        if (needsUpdate) {
          await CalApi.updateEventType(existing.id, payload);
          console.log(`[Cal Sync] ✓ Updated: ${cfg.slug}`);
          stats.updated++;
        } else {
          console.log(`[Cal Sync] → Skipped (no changes): ${cfg.slug}`);
          stats.skipped++;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Cal Sync] ✗ Error syncing ${cfg.slug}:`, errorMsg);
      stats.errors.push({ slug: cfg.slug, error: errorMsg });
    }
  }

  console.log('[Cal Sync] Complete:', {
    created: stats.created,
    updated: stats.updated,
    skipped: stats.skipped,
    errors: stats.errors.length,
  });

  return stats;
}

/**
 * CLI entry point
 * 
 * Run via: npm run cal:sync-event-types
 * Or: tsx src/jobs/cal-sync-event-types.ts
 */
if (require.main === module) {
  syncCalEventTypes()
    .then(stats => {
      if (stats.errors.length > 0) {
        console.error('\nErrors occurred:');
        stats.errors.forEach(e => console.error(`  - ${e.slug}: ${e.error}`));
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('[Cal Sync] Fatal error:', err);
      process.exit(1);
    });
}
