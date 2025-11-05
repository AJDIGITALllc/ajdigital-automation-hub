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

## Modules

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