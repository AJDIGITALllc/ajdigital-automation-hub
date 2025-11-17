# Cross-Repo Integration Guide

This document explains how the Audio Jones ecosystem applications should consume configuration files from the `ajdigital-automation-hub` repository.

## Overview

The `ajdigital-automation-hub` repository serves as the **single source of truth** for:
- System module definitions and metadata
- Shared vocabulary (statuses, personas, service categories)
- Environment variable schemas and governance

This ensures consistency across all Audio Jones applications without duplicating configuration or introducing drift.

---

## Repository Structure

```
config/
├── systems/
│   ├── modules.json        # Module definitions for all systems
│   └── vocabulary.json     # Shared terminology and status codes
└── env/
    ├── firebase.schema.json  # Firebase env variable schema
    └── payments.schema.json  # Payment provider env schemas
```

---

## Integration by Application

### 1. audiojones.com (Marketing Site)

**Purpose:** Display systems/modules on marketing pages, explain features to prospects.

#### How to Consume `modules.json`

```typescript
// lib/config/modules.ts
import modulesConfig from '@ajdigital/automation-hub/config/systems/modules.json';

export type Module = typeof modulesConfig.modules[0];
export type FunnelStage = typeof modulesConfig.funnelStages[0];

export function getModulesByPersona(persona: 'creator' | 'business') {
  return modulesConfig.modules.filter(module => 
    module.suggestedPersonas.includes(persona) || 
    module.suggestedPersonas.includes('both')
  );
}

export function getModulesByFunnelStage(stage: string) {
  return modulesConfig.modules.filter(module => 
    module.funnelStage === stage
  );
}
```

**Example Usage:**
- `/systems` page: Render all modules with descriptions
- `/systems/[moduleId]` pages: Dynamic pages per module
- Landing pages: Filter modules by persona (creator vs business)

#### How to Consume `vocabulary.json`

```typescript
// lib/config/vocabulary.ts
import vocabulary from '@ajdigital/automation-hub/config/systems/vocabulary.json';

export const PERSONAS = vocabulary.personas;
export const SERVICE_CATEGORIES = vocabulary.serviceCategories;

// Use for filtering/displaying service offerings
export function getServiceCategoryLabel(code: string) {
  return vocabulary.serviceCategories.find(cat => cat.code === code)?.label;
}
```

#### Environment Variables

Reference `firebase.schema.json` to understand what Firebase config is needed for analytics/contact forms. Marketing site typically only needs:
- `NEXT_PUBLIC_FIREBASE_*` variables (public config)
- No admin SDK variables needed

---

### 2. audiojones-client (Client Portal)

**Purpose:** Client-facing dashboard for managing bookings, viewing project status, and accessing deliverables.

#### How to Consume `modules.json`

```typescript
// lib/modules.ts
import modulesConfig from '@ajdigital/automation-hub/config/systems/modules.json';

// Map service.module field to module metadata
export function getModuleForService(moduleId: string) {
  return modulesConfig.modules.find(m => m.id === moduleId);
}

// Display module badges/tags on service cards
export function renderModuleTag(moduleId: string) {
  const module = getModuleForService(moduleId);
  return module ? { name: module.name, stage: module.funnelStage } : null;
}
```

**Database Schema Alignment:**

Ensure your Firestore `services` collection includes:
```typescript
interface Service {
  id: string;
  name: string;
  module: string; // References modules.json ID (e.g., "client-delivery")
  status: string; // References vocabulary.json bookingStatuses
  // ... other fields
}
```

#### How to Consume `vocabulary.json`

```typescript
// lib/status.ts
import vocabulary from '@ajdigital/automation-hub/config/systems/vocabulary.json';

export function getStatusLabel(statusCode: string) {
  const status = vocabulary.bookingStatuses.find(s => s.code === statusCode);
  return status?.label || statusCode;
}

export function getStatusDescription(statusCode: string) {
  const status = vocabulary.bookingStatuses.find(s => s.code === statusCode);
  return status?.description || '';
}

// Use for status badges, timelines, notifications
export const BOOKING_STATUSES = vocabulary.bookingStatuses;
```

**UI Examples:**
- Project cards: Show status badge with label from vocabulary
- Timeline view: Map status codes to human-readable milestones
- Filters: Let users filter projects by status/module

#### Environment Variables

Reference both `firebase.schema.json` and `payments.schema.json`:
- **Firebase:** Full auth + Firestore (all `NEXT_PUBLIC_FIREBASE_*` + admin SDK for server routes)
- **Payments:** Stripe publishable key for checkout UI, secret key for server-side payment processing

---

### 3. audiojones-admin (Admin Portal)

**Purpose:** Internal admin dashboard for managing clients, bookings, modules, and analytics.

#### How to Consume `modules.json`

```typescript
// lib/modules.ts
import modulesConfig from '@ajdigital/automation-hub/config/systems/modules.json';

// Filter bookings/services by module
export function getModuleOptions() {
  return modulesConfig.modules.map(m => ({
    value: m.id,
    label: m.name,
    description: m.shortDescription
  }));
}

// Analytics: Group revenue/metrics by module
export function groupByModule(bookings: Booking[]) {
  return modulesConfig.modules.map(module => ({
    module: module.name,
    count: bookings.filter(b => b.module === module.id).length,
    revenue: calculateRevenue(bookings, module.id)
  }));
}
```

#### How to Consume `vocabulary.json`

```typescript
// lib/filters.ts
import vocabulary from '@ajdigital/automation-hub/config/systems/vocabulary.json';

// Admin filters for searching bookings
export const STATUS_FILTERS = vocabulary.bookingStatuses.map(s => ({
  value: s.code,
  label: s.label
}));

export const MODULE_FILTERS = vocabulary.modules.map(m => ({
  value: m.id,
  label: m.name
}));

// Bulk status updates
export function getAvailableStatusTransitions(currentStatus: string) {
  // Logic to determine valid next statuses
  return vocabulary.bookingStatuses.filter(/* ... */);
}
```

**Admin-Specific Features:**
- Module management: View all modules, their usage stats, and associated bookings
- Status workflows: Visual status pipelines based on vocabulary
- Reporting: Revenue by module, status distribution analytics

#### Environment Variables

Reference all schemas for full backend access:
- **Firebase:** Both public and admin SDK variables for full Firestore/Auth control
- **Payments:** All Whop + Stripe variables for managing transactions, refunds, webhooks

---

## Environment Variable Schema Usage

Each repo should maintain its own `.env.schema.json` or `.env.example` file, but **reference** the schemas in this repo for documentation.

### Example `.env.schema.json` in Client Portal

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Audio Jones Client Portal Environment Variables",
  "description": "See ajdigital-automation-hub/config/env/ for detailed schema documentation",
  "type": "object",
  "required": [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "FIREBASE_ADMIN_PRIVATE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY"
  ],
  "properties": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": {
      "$ref": "https://raw.githubusercontent.com/AJDIGITALllc/ajdigital-automation-hub/main/config/env/firebase.schema.json#/variables/NEXT_PUBLIC_FIREBASE_API_KEY"
    }
    // ... other references
  }
}
```

### Validation Scripts

Create validation scripts that check:
1. All required env vars are present
2. Naming matches schema definitions
3. Server-only vars aren't exposed to client

```typescript
// scripts/validate-env.ts
import firebaseSchema from '@ajdigital/automation-hub/config/env/firebase.schema.json';
import paymentsSchema from '@ajdigital/automation-hub/config/env/payments.schema.json';

function validateEnv() {
  const allVars = { ...firebaseSchema.variables, ...paymentsSchema.variables };
  
  Object.entries(allVars).forEach(([key, config]) => {
    if (config.required && !process.env[key]) {
      console.error(`Missing required env var: ${key}`);
    }
    if (config.serverOnly && key.startsWith('NEXT_PUBLIC_')) {
      console.error(`Server-only var exposed to client: ${key}`);
    }
  });
}
```

---

## Syncing Updates

When this repo is updated:

### Option 1: Git Submodule (Recommended)
```bash
# In each consuming repo
git submodule add https://github.com/AJDIGITALllc/ajdigital-automation-hub.git config/automation-hub
git submodule update --init --recursive

# Import in code
import modules from '../config/automation-hub/config/systems/modules.json';
```

### Option 2: NPM Package
Publish this repo as an npm package:
```json
{
  "name": "@ajdigital/automation-hub",
  "version": "1.0.0",
  "main": "index.js",
  "exports": {
    "./modules": "./config/systems/modules.json",
    "./vocabulary": "./config/systems/vocabulary.json",
    "./firebase-schema": "./config/env/firebase.schema.json",
    "./payments-schema": "./config/env/payments.schema.json"
  }
}
```

Install in each repo:
```bash
npm install @ajdigital/automation-hub
```

### Option 3: Copy on Build
Add a build step to fetch latest config:
```bash
# In package.json scripts
"prebuild": "curl https://raw.githubusercontent.com/AJDIGITALllc/ajdigital-automation-hub/main/config/systems/modules.json -o config/modules.json"
```

---

## Best Practices

### 1. Never Duplicate Config
❌ **Don't** copy config values into individual repos
✅ **Do** import directly from this repo

### 2. Validate at Build Time
Add TypeScript type generation:
```bash
# Generate types from JSON schemas
npx json-schema-to-typescript config/systems/modules.json > types/modules.d.ts
```

### 3. Version Control
- Use semantic versioning for breaking changes
- Document migration paths when schemas change
- Add CI checks to ensure consuming repos are up to date

### 4. Keep This Repo Lightweight
- No secrets or real values
- Only shapes, schemas, and metadata
- Plain JSON/YAML for maximum compatibility

---

## Questions?

For questions or proposed changes to shared config:
1. Open an issue in `ajdigital-automation-hub`
2. Discuss impact on all consuming applications
3. Update this integration guide when schemas change

**Remember:** This repo is the contract between all Audio Jones applications. Changes here affect the entire ecosystem.

---

## Module Playbooks and Funnel Map Integration

### New Configuration Files

The hub now includes machine-readable playbooks and funnel governance:

```
config/
├── module-playbooks.json  # Detailed module workflows, KPIs, tools
└── funnel-map.json        # Complete funnel stages and cadence
```

### Using Module Playbooks

**TypeScript Library:**
```typescript
// Install the hub as a dependency or use git submodule
import {
  getModulePlaybook,
  loadModulePlaybooks,
  validateModuleReferences
} from '@ajdigital/automation-hub/lib/playbooks';

// Load a specific playbook
const clientDelivery = getModulePlaybook('client-delivery');
console.log(clientDelivery.objective);
console.log(clientDelivery.kpis);
console.log(clientDelivery.workflow_steps);

// Load all playbooks
const allPlaybooks = loadModulePlaybooks();
```

**Use Cases by Repo:**

1. **audiojones.com (Marketing Site)**
   - Display detailed module workflows on `/systems/[module]` pages
   - Show KPIs and success metrics to prospects
   - Render tool integrations (Whop, MailerLite, n8n)
   
   ```typescript
   const module = getModulePlaybook('marketing-automation');
   // Render: module.workflow_steps as a visual flow
   // Display: module.kpis as "What you can expect"
   // Show: module.tools for integration badges
   ```

2. **audiojones-client (Client Portal)**
   - Show project workflow progress based on `workflow_steps`
   - Display relevant KPIs for client's active services
   - Render maintenance cadence (when to expect updates)
   
   ```typescript
   const playbook = getModulePlaybook(service.module);
   // Timeline: Map service.status to playbook.workflow_steps
   // Expectations: Show playbook.maintenance_cadence to clients
   ```

3. **audiojones-admin (Admin Portal)**
   - Use playbooks for project planning and resource allocation
   - Track internal checks and client inputs
   - Monitor KPI compliance across all projects
   
   ```typescript
   const playbook = getModulePlaybook(project.module);
   // Checklist: Display playbook.internal_checks
   // Client forms: Generate from playbook.client_inputs
   // Analytics: Compare actual vs target KPIs
   ```

4. **Automation/Agents (n8n, AI)**
   - Validate automation workflows against defined flows
   - Trigger maintenance tasks based on cadence
   - Monitor KPI thresholds and alert on deviations
   
   ```typescript
   const playbook = getModulePlaybook('ai-optimization');
   // Scheduler: Set up playbook.maintenance_cadence tasks
   // Validation: Check playbook.automations are active
   ```

### Using Funnel Map

```typescript
import {
  getFunnelStage,
  getCadenceTasks,
  getModulesForStage,
  getStagesForModule
} from '@ajdigital/automation-hub/lib/playbooks';

// Load funnel stages
const discoverStage = getFunnelStage('discover');
console.log(discoverStage.primary_module_ids); // ['marketing-automation', 'data-intelligence']

// Get weekly maintenance tasks
const weeklyTasks = getCadenceTasks('weekly');
// weeklyTasks.forEach(task => scheduleTask(task));

// Find which stages use a specific module
const stages = getStagesForModule('client-delivery');
// stages: [{ id: 'book', ... }, { id: 'deliver', ... }, { id: 'retain', ... }]
```

**Use Cases:**

1. **Status Dashboard** (Admin Portal)
   - Visualize the complete customer journey
   - Show stage-by-stage conversion metrics
   - Display cross-stage integrations and automations
   
   ```typescript
   const funnel = loadFunnelMap();
   // Render: funnel.funnel.stages as a visual pipeline
   // Track: conversion rates between stages
   // Monitor: funnel.funnel.cross_stage_integrations health
   ```

2. **Task Scheduling** (Admin/Automation)
   - Schedule recurring tasks based on cadence
   - Assign deliverables to appropriate module owners
   - Automate weekly/monthly/quarterly reviews
   
   ```typescript
   const quarterlyTasks = getCadenceTasks('quarterly');
   quarterlyTasks.forEach(task => {
     scheduleTask({
       name: task.task,
       assignee: task.owner,
       deliverable: task.deliverable,
       recurrence: 'quarterly'
     });
   });
   ```

3. **Automation Health** (n8n, Monitoring)
   - Validate that all cross-stage automations are active
   - Monitor integration points between stages
   - Alert when automations fail or metrics drop
   
   ```typescript
   const integrations = funnel.funnel.cross_stage_integrations;
   integrations.forEach(integration => {
     validateAutomation(integration.automation);
   });
   ```

### JSON Schema Validation

Validate configuration files programmatically:

```bash
# Run validation script
npm run validate:configs
```

Or in CI/CD:
```yaml
# .github/workflows/validate.yml
- name: Validate configs
  run: npm run validate:configs
```

### TypeScript Types

Build the library to generate TypeScript types:

```bash
npm install
npm run build
```

This creates `dist/lib/playbooks.d.ts` with full type definitions for:
- `ModulePlaybook`
- `FunnelStage`
- `CadenceTask`
- All helper functions

### Migration Guide

When updating from the previous config format:

1. **Module metadata remains in `config/systems/modules.json`**
   - Use for basic module info (id, name, description, personas)
   
2. **Detailed workflows now in `config/module-playbooks.json`**
   - Use for KPIs, tools, workflow steps, automations
   
3. **Import both where needed:**
   ```typescript
   import modules from './config/systems/modules.json';
   import { getModulePlaybook } from './lib/playbooks';
   
   // Basic info from modules.json
   const moduleInfo = modules.modules.find(m => m.id === 'client-delivery');
   
   // Detailed workflow from playbooks
   const playbook = getModulePlaybook('client-delivery');
   ```

### Example: Complete Integration

```typescript
// In audiojones-client/lib/modules.ts

import modulesConfig from '@ajdigital/automation-hub/config/systems/modules.json';
import { getModulePlaybook } from '@ajdigital/automation-hub/lib/playbooks';

export function getCompleteModuleInfo(moduleId: string) {
  const basicInfo = modulesConfig.modules.find(m => m.id === moduleId);
  const playbook = getModulePlaybook(moduleId);
  
  return {
    // From modules.json
    id: basicInfo.id,
    name: basicInfo.name,
    description: basicInfo.longDescription,
    personas: basicInfo.suggestedPersonas,
    funnelStage: basicInfo.funnelStage,
    
    // From module-playbooks.json
    objective: playbook.objective,
    kpis: playbook.kpis,
    workflow: playbook.workflow_steps,
    tools: playbook.tools,
    maintenance: playbook.maintenance_cadence,
    automations: playbook.automations
  };
}
```
