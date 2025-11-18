/**
 * Router Configuration Types and Validation
 * 
 * Defines the structure of modules-router.yaml and provides validation
 */

import { z } from 'zod';
import { ModuleId, EventName } from './events.js';

/**
 * Priority levels for event processing
 */
const PrioritySchema = z.enum(['high', 'medium', 'low']);

/**
 * Module identifier schema
 */
const ModuleIdSchema = z.enum([
  'client-delivery',
  'marketing-automation',
  'ai-optimization',
  'data-intelligence'
]);

/**
 * Event routing configuration schema
 */
const EventConfigSchema = z.object({
  /** List of modules that should process this event */
  modules: z.array(ModuleIdSchema),
  
  /** Processing priority */
  priority: PrioritySchema,
  
  /** Number of retry attempts on failure */
  retries: z.number().int().min(0).max(10),
  
  /** Timeout in milliseconds */
  timeoutMs: z.number().int().min(100).max(300000), // 100ms to 5 minutes
});

/**
 * Dead letter queue configuration
 */
const DeadLetterSchema = z.object({
  /** Whether dead letter queue is enabled */
  enabled: z.boolean(),
  
  /** How many days to retain failed events */
  retentionDays: z.number().int().min(1).max(365),
});

/**
 * Complete router configuration schema
 */
export const RouterConfigSchema = z.object({
  /** Version of the router config format */
  version: z.string().optional(),
  
  /** Mapping of event names to routing configuration */
  events: z.record(z.string(), EventConfigSchema),
  
  /** Dead letter queue configuration */
  deadLetter: DeadLetterSchema,
  
  /** Global defaults (optional) */
  defaults: z.object({
    priority: PrioritySchema.optional(),
    retries: z.number().int().optional(),
    timeoutMs: z.number().int().optional(),
  }).optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type RouterConfig = z.infer<typeof RouterConfigSchema>;
export type EventConfig = z.infer<typeof EventConfigSchema>;
export type Priority = z.infer<typeof PrioritySchema>;

/**
 * Validate router configuration against schema
 * 
 * @param raw - Raw parsed YAML object
 * @returns Validated and typed RouterConfig
 * @throws ZodError if validation fails
 */
export function validateRouterConfig(raw: unknown): RouterConfig {
  return RouterConfigSchema.parse(raw);
}

/**
 * Safely validate router config and return result with detailed errors
 * 
 * @param raw - Raw parsed YAML object
 * @returns Success result with data or error result with issues
 */
export function safeValidateRouterConfig(raw: unknown): 
  | { success: true; data: RouterConfig }
  | { success: false; errors: z.ZodError } 
{
  const result = RouterConfigSchema.safeParse(raw);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}
