#!/usr/bin/env node
/**
 * Router Configuration Validator
 * 
 * Validates modules-router.yaml against the schema
 */

import { getRouterConfig } from '../src/lib/router.js';
import { safeValidateRouterConfig } from '../src/types/router.js';
import { loadModulesRouter } from '../src/lib/config-loader.js';

async function main() {
  console.log('🔍 Validating modules-router.yaml...\n');
  
  try {
    // Load raw config
    const raw = await loadModulesRouter();
    
    // Validate
    const result = safeValidateRouterConfig(raw);
    
    if (!result.success) {
      console.error('❌ Router config validation FAILED\n');
      console.error('Validation errors:');
      
      for (const error of result.errors.issues) {
        console.error(`  - ${error.path.join('.')}: ${error.message}`);
      }
      
      console.error('\nFull error details:');
      console.error(JSON.stringify(result.errors.format(), null, 2));
      
      process.exit(1);
    }
    
    // Success - print summary
    console.log('✅ Router config is valid!\n');
    
    const config = result.data;
    const eventCount = Object.keys(config.events).length;
    
    console.log('Summary:');
    console.log(`  - Version: ${config.version || 'not specified'}`);
    console.log(`  - Events configured: ${eventCount}`);
    console.log(`  - Dead letter queue: ${config.deadLetter.enabled ? 'enabled' : 'disabled'}`);
    
    if (config.deadLetter.enabled) {
      console.log(`  - DLQ retention: ${config.deadLetter.retentionDays} days`);
    }
    
    // List all configured events
    if (eventCount > 0) {
      console.log('\nConfigured events:');
      
      for (const [eventName, eventConfig] of Object.entries(config.events)) {
        const moduleCount = eventConfig.modules.length;
        const moduleList = eventConfig.modules.join(', ');
        console.log(`  - ${eventName}`);
        console.log(`    Modules (${moduleCount}): ${moduleList}`);
        console.log(`    Priority: ${eventConfig.priority} | Retries: ${eventConfig.retries} | Timeout: ${eventConfig.timeoutMs}ms`);
      }
    }
    
    console.log('\n✨ Validation complete!');
    
  } catch (error) {
    console.error('❌ Validation failed with error:\n');
    
    if (error instanceof Error) {
      console.error(error.message);
      
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }
    
    process.exit(1);
  }
}

main();
