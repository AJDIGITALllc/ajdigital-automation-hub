#!/usr/bin/env node
/**
 * CLI script to run governance checks
 * Can be executed manually or via cron
 */

import { runGovernanceChecks } from '../lib/governance';

async function main() {
  console.log('🔍 Running governance checks...\n');

  try {
    const report = await runGovernanceChecks();

    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}\n`);

    // Group checks by category
    const categories = new Map<string, typeof report.checks>();
    for (const check of report.checks) {
      if (!categories.has(check.category)) {
        categories.set(check.category, []);
      }
      categories.get(check.category)!.push(check);
    }

    // Print checks by category
    for (const [category, checks] of categories) {
      console.log(`\n${category.toUpperCase()}:`);
      for (const check of checks) {
        const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
        const color =
          check.status === 'pass' ? '\x1b[32m' : check.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
        const reset = '\x1b[0m';

        console.log(`  ${color}${icon}${reset} ${check.name}`);
        console.log(`    ${check.message}`);

        if (check.details) {
          console.log(`    Details:`, JSON.stringify(check.details, null, 2));
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log(`  Total checks: ${report.summary.total}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Warnings: ${report.summary.warnings}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log('='.repeat(60) + '\n');

    // Exit with appropriate code
    if (report.overallStatus === 'fail') {
      console.error('❌ Governance checks FAILED');
      process.exit(1);
    } else if (report.overallStatus === 'warn') {
      console.warn('⚠️  Governance checks passed with WARNINGS');
      process.exit(0);
    } else {
      console.log('✅ Governance checks PASSED');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Governance check execution failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
