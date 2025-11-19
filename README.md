# AJDIGITAL Automation Hub

Central orchestration platform for the AUDIOJONES.COM multi-repository infrastructure.

## Overview

This automation hub provides centralized management and coordination tools for the entire AJDIGITAL ecosystem, enabling one-command synchronization and validation across all connected repositories.

## Repository Network

The automation hub orchestrates these repositories:
- **audiojones-system-modules** → Core business logic and module framework
- **audiojones-brand-repo** → Brand DNA and consistency guidelines  
- **billing-and-payments-repo** → Financial infrastructure and payment processing
- **ajd-contract-library** → Legal agreements and contract templates

## System Modules

The Audio Jones system consists of 5 core modules for comprehensive business automation:

### 🎯 [Marketing Automation Module](docs/marketing-automation-module.md)
Orchestrates marketing campaigns, lead nurturing, and customer engagement workflows across multiple channels.

### 🚀 [Client Delivery Module](docs/client-delivery-module.md)
Manages end-to-end client project delivery from onboarding through completion with consistent quality.

### 📊 [Data Intelligence Module](docs/data-intelligence-module.md)
Collects, processes, and analyzes business data to provide actionable insights for optimization.

### 🤖 [AI Optimization Module](docs/ai-optimization-module.md)
Leverages AI and machine learning to continuously optimize business processes and efficiency.

### 📈 [Funnel Governance Module](docs/funnel-governance.md)
Monitors and optimizes conversion funnels across all client touchpoints for consistent performance.

## Key Features

### 🚀 Multi-Repository Synchronization
- **One-Command Sync** → `sync-all.ps1` handles staging, commits, and pushes across all repos
- **Intelligent Processing** → Only commits repositories with actual changes
- **Error Isolation** → Failed operations in one repo don't affect others
- **Dry Run Mode** → Preview changes before execution

### ✅ Automated Validation
- **Repository Structure Validation** → Ensures consistent organization
- **Cross-Repository Integration** → Validates dependencies and links
- **GitHub Actions Workflows** → Automated CI/CD validation
- **Schedule-Based Monitoring** → Regular health checks

### 🤖 Copilot Agent Integration
- **Smart Orchestration** → GitHub Copilot agents understand the full infrastructure
- **Context-Aware Operations** → Agents know repository relationships and dependencies
- **Automated Task Execution** → Can trigger validation and sync operations
- **Brand Consistency Enforcement** → Maintains guidelines across all repositories

## Quick Start

### Sync All Repositories
```powershell
# Basic sync with default message
.\sync-all.ps1

# Custom commit message
.\sync-all.ps1 -CommitMessage "feat: implement new features"

# Preview changes (dry run)
.\sync-all.ps1 -DryRun -Verbose
```

### Run Validation
```powershell
# Validate repository structures
python scripts/validate_repos.py

# Check specific repository
python scripts/validate_repos.py --repo audiojones-system-modules
```

### Cal.com Integration
```powershell
# Sync event types to Cal.com (one-time or scheduled)
npm run cal:sync-event-types

# Start automation hub server (handles Cal.com webhooks)
npm start

# Or in development with hot reload
npm run dev
```

## Directory Structure

```
ajdigital-automation-hub/
├── agents/                     # Copilot agent configurations
│   ├── copilot-config.json    # Main agent config
│   └── README.md               # Agent documentation
├── scripts/                    # Automation scripts
│   └── validate_repos.py       # Repository validation
├── .github/workflows/          # GitHub Actions
│   └── validate-repos.yml      # Automated validation
├── .ajdlink.yaml              # Repository configuration map
└── sync-all.ps1               # Multi-repo sync tool
```

## Configuration Files

### `.ajdlink.yaml`
Central configuration mapping all connected repositories and their GitHub URLs.

### `agents/copilot-config.json` 
Configuration for GitHub Copilot agents to understand the infrastructure context and available automation tasks.

## Integration Points

### Cross-Repository Links
- **System Modules** → Consumed by all other repositories for core functionality
- **Brand Repository** → Provides consistent branding across all systems
- **Billing System** → Integrates with contract library and system modules
- **Contract Library** → Legal foundation for billing and client operations

### Automation Workflows
- **Scheduled Validation** → Daily repository health checks
- **Change Detection** → Automatic validation on pushes
- **Cross-Repo Sync** → Coordinated updates across the ecosystem

## Usage Examples

### Multi-Repository Operations
```powershell
# Sync all repositories with a feature update
.\sync-all.ps1 -CommitMessage "feat: add new customer portal features"

# Preview what would be synchronized
.\sync-all.ps1 -DryRun -Verbose

# Validate all repositories
python scripts/validate_repos.py --all
```

### Copilot Agent Tasks
The configured Copilot agent can execute:
- **Infrastructure Validation** → `python scripts/validate_repos.py`
- **Multi-Repo Sync** → `powershell ./sync-all.ps1`
- **Context-Aware Development** → Understanding of cross-repository dependencies

## Monitoring and Maintenance

### Health Checks
- Repository structure validation runs daily via GitHub Actions
- Cross-repository link validation ensures connectivity
- Automated dependency checking maintains integration health

### Error Handling
- Individual repository failures don't impact other operations
- Detailed logging and error reporting for troubleshooting
- Rollback capabilities for failed sync operations

## Contributing

When working within this infrastructure:
1. Use the automation hub for all multi-repository operations
2. Validate changes using the provided scripts before committing
3. Leverage Copilot agents for context-aware development
4. Follow the established patterns for cross-repository integration

For detailed development guidelines, see the individual repository documentation.
## Module Automation Configs

### Overview

The config/modules/ directory contains declarative YAML specifications for each Audio Jones system module. These configs define event-driven automation workflows without implementing actual API integrations.

### Module Configuration Files

Each module config file (*.yaml) includes:

- **Entry Triggers**: Events from portals that activate the module (e.g., ooking.created, sset.uploaded)
- **Actions**: High-level automation steps executed in response to triggers
- **Dependencies**: External systems referenced (Firebase, Whop, Stripe, MailerLite, n8n, OpenAI, etc.)
- **Outputs**: Data structures returned by actions

### Available Modules

#### 1. Client Delivery (client-delivery.yaml)
Manages end-to-end project delivery workflow from booking to asset delivery.

**Key Triggers**:
- ooking.created  Create onboarding checklist, send confirmation
- ooking.status_updated  Trigger status notifications
- sset.uploaded  Process and index assets
- payment.completed  Enable delivery workflow

**Dependencies**: Firebase, MailerLite, Slack, n8n

#### 2. Marketing Automation (marketing-automation.yaml)
Automated marketing workflows, email sequences, and audience engagement.

**Key Triggers**:
- user.registered  Welcome email sequence
- ooking.status_changed_to_pending_payment  Payment reminder (24h delay)
- ooking.completed  Post-delivery survey (48h delay)

**Dependencies**: MailerLite, Firebase, Analytics Engine, n8n

#### 3. AI Optimization (i-optimization.yaml)
AI-powered content analysis, optimization, and recommendations.

**Key Triggers**:
- sset.uploaded  Audio analysis, quality metrics
- ooking.created  Predict delivery timeline
- content.submitted_for_review  Generate improvement recommendations

**Dependencies**: OpenAI (GPT-4, Whisper, DALL-E), Firebase Storage, n8n

#### 4. Data Intelligence (data-intelligence.yaml)
Business intelligence, reporting, and data analytics.

**Key Triggers**:
- ooking.completed  Revenue tracking, CLV calculation
- payment.completed  Financial reporting
- Daily schedule  Generate revenue reports, export to warehouse

**Dependencies**: Firebase, Redis, BigQuery, Slack, n8n

### Global Router (modules-router.yaml)

The router config maps portal events to module actions:

**Event Routing Logic**:
`yaml
booking.created  [client-delivery, marketing-automation, data-intelligence]
asset.uploaded  [client-delivery, ai-optimization, data-intelligence]
payment.completed  [client-delivery, data-intelligence]
`

**Priority Levels**:
- **High**: Payment events, booking completion (5 retries, 30s timeout)
- **Medium**: Status updates, asset uploads (3 retries, 60s timeout)
- **Low**: Analytics, scheduled tasks (1 retry, 120s timeout)

**Error Handling**:
- Dead letter queue for failed events (30-day retention)
- Admin alerts on high-priority failures
- Observability via Firebase tracing and metrics

### How to Use These Configs

#### For n8n Workflow Development

1. Reference event trigger names from module configs
2. Use specified payload structures for workflow inputs
3. Map dependencies to actual n8n credentials/nodes
4. Follow action output schemas for data flow

Example n8n workflow structure:
`
Webhook (booking.created) 
   Firebase Node (fetch booking data)
   MailerLite Node (send confirmation)
   Firebase Node (update status)
`

#### For Custom Worker Implementation

1. Parse YAML configs to understand event  module  action mappings
2. Subscribe to Firebase event collections or Pub/Sub topics
3. Route events to module handlers based on modules-router.yaml
4. Use action specs to implement processing logic

#### Environment Variables

**Never store credentials in this repo.** Reference env var names only:

- FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
- MAILERLITE_API_KEY, MAILERLITE_GROUP_ID
- OPENAI_API_KEY, OPENAI_ORG_ID
- N8N_API_KEY, N8N_WEBHOOK_URL
- SLACK_WEBHOOK_URL
- BIGQUERY_PROJECT_ID, BIGQUERY_CREDENTIALS

Actual credentials should be managed via:
- Vercel environment variables (for Next.js portals)
- n8n credential vault (for workflows)
- Firebase Admin SDK service account (for backend)

### Validation

To validate module configs:

`powershell
# Check YAML syntax
Get-Content config/modules/*.yaml | ConvertFrom-Yaml

# Validate against schema (when available)
python scripts/validate_modules.py
`

## Integrations

### Cal.com Scheduling

The automation hub is the **single source of truth** for Cal.com scheduling automation. Frontend applications (audiojones.com, client/admin portals) only use embeds and links.

#### Event Type Management

All Cal.com booking types are defined in `src/config/cal-event-types.ts`:

```typescript
import { CAL_EVENT_TYPES, getEventTypeBySlug } from '@ajdigital/automation-hub';

// 15+ booking types covering:
// - Discovery calls and consultations
// - Client onboarding (standard + VIP)
// - Project delivery sessions
// - Support and training
// - Strategic planning
// - Marketing and optimization reviews
```

**Sync to Cal.com**:
```powershell
npm run cal:sync-event-types
```

This job creates/updates event types on Cal.com to match your config. Run on-demand or via cron.

#### Webhook Processing

Cal.com webhooks are received at `POST /api/webhooks/cal` and automatically:
- Map to internal events (`booking.created`, `booking.rescheduled`, etc.)
- Route through module handlers via `modules-router.yaml`
- Trigger downstream automation (CRM updates, email, project creation)

**Webhook Configuration** (in Cal.com dashboard):
- URL: `https://your-automation-hub.com/api/webhooks/cal`
- Events: `booking.created`, `booking.rescheduled`, `booking.cancelled`, `meeting.ended`
- Optional: Set `CAL_WEBHOOK_SECRET` for signature verification

**Environment Variables**:
- `CAL_API_KEY` → Cal.com API key (required)
- `CAL_API_BASE_URL` → API base URL (default: `https://api.cal.com`)
- `CAL_API_VERSION` → API version (default: `2024-01-01`)
- `CAL_WEBHOOK_SECRET` → Webhook signature secret (optional)

#### Programmatic Booking

Create bookings from Whop purchases or other triggers:

```typescript
import { createBookingFromPurchase } from '@ajdigital/automation-hub';

await createBookingFromPurchase({
  eventTypeId: 123,
  start: '2025-11-20T14:00:00Z',
  end: '2025-11-20T15:00:00Z',
  name: 'John Doe',
  email: 'john@example.com',
  timeZone: 'America/New_York',
});
```

#### Frontend Usage

In `audiojones.com` or portals, embed Cal.com booking links:

```tsx
// React/Next.js component
<iframe
  src={`https://cal.com/audiojones/${slug}`}
  style={{ width: '100%', height: '700px', border: 0 }}
  allow="camera; microphone; clipboard-read; clipboard-write"
/>
```

Slugs come from `CAL_EVENT_TYPES` config (e.g., `"discovery-call-15"`, `"client-onboarding-audiojones"`).

---

## Worker & Integrations

### Inbox Drivers

The worker supports pluggable inbox adapters for event consumption:

#### In-Memory Driver (Development)
```powershell
# Default for local testing
npm run worker:run
# or
$env:INBOX_DRIVER="memory"; npm run worker:run
```

#### Firestore Driver (Production)
```powershell
# Production mode with Firestore collections
$env:INBOX_DRIVER="firestore"
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
$env:FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

npm run worker:run
```

**Firestore Configuration**:
- `portalEvents` collection → Events from client-facing portals
- `adminEvents` collection → Internal admin operations
- Each event document requires `status: 'pending'` to be processed
- Worker marks events as `processed` or `failed` with timestamps

**Environment Variables**:
- `INBOX_DRIVER` → `"memory"` or `"firestore"` (default: `"memory"`)
- `FIREBASE_PROJECT_ID` → Firebase project identifier
- `FIREBASE_CLIENT_EMAIL` → Service account email
- `FIREBASE_PRIVATE_KEY` → Service account private key (with newlines)

### N8N Webhook Integration

Optional helper for emitting events to n8n workflows:

```typescript
import { N8nEmitter } from '@ajdigital/automation-hub';

const emitter = new N8nEmitter({
  webhookUrl: 'https://n8n.example.com/webhook/abc123',
  timeoutMs: 5000,
});

// Check if configured
if (emitter.isEnabled) {
  await emitter.emit(event);
}

// Batch emit
await emitter.emitBatch([event1, event2, event3]);
```

**Environment Variables**:
- `N8N_WEBHOOK_URL` → n8n webhook endpoint (optional)

**Features**:
- Graceful fallback when webhook URL not configured
- Configurable timeout (default: 5s)
- Best-effort delivery with error logging
- Batch emit support

### Maintenance

When adding new modules:

1. Create config/modules/{module-id}.yaml following the established schema
2. Add event routes to config/modules-router.yaml
3. Document dependencies and env vars
4. Update this README with module description

When adding new event types:

1. Define event structure in module config entryTriggers
2. Add routing rules to modules-router.yaml
3. Update dependent modules that should respond to the event

