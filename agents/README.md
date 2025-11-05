# AJDIGITAL Copilot Agent Configuration

This directory contains configuration files that enable GitHub Copilot's coding agents to understand and operate within the AJDIGITAL multi-repository infrastructure.

## Configuration Files

### `copilot-config.json`
Primary configuration for the **ajdigital-orchestrator** agent that manages the entire AUDIOJONES.COM infrastructure ecosystem.

## Agent Capabilities

The **ajdigital-orchestrator** agent can:

- **🔄 Cross-Repository Sync** → Execute `sync-all.ps1` to commit/push across all repos
- **✅ Infrastructure Validation** → Run validation scripts against repo structures  
- **🎯 Orchestrated Operations** → Coordinate changes across multiple repositories
- **🎨 Brand Consistency** → Enforce brand guidelines from `audiojones-brand-repo`
- **📋 System Coordination** → Manage module dependencies and integrations

## Repository Network

The agent understands these connected repositories:
- `audiojones-system-modules` → Core business logic modules
- `audiojones-brand-repo` → Brand DNA and consistency framework
- `billing-and-payments-repo` → Financial infrastructure
- `ajd-contract-library` → Legal agreements and templates

## Integration Points

### Automation Tools
- **Sync Tool**: `sync-all.ps1` → One-command multi-repo synchronization
- **Validation**: `scripts/validate_repos.py` → Repository structure validation
- **CI/CD**: `.github/workflows/validate-repos.yml` → Automated validation

### Configuration Management
- **Repository Map**: `.ajdlink.yaml` → Cross-repo linking configuration
- **Agent Config**: `agents/copilot-config.json` → This configuration file

## Usage Context

When working with Copilot agents in this infrastructure:

1. **Multi-Repo Operations** → Agent understands repo relationships and dependencies
2. **Automated Workflows** → Can trigger validation and sync operations
3. **Infrastructure Awareness** → Knows about cross-repository integration points
4. **Brand Consistency** → Enforces brand guidelines across all repositories

## Task Automation

Available automated tasks:
```json
{
  "validate": "python scripts/validate_repos.py",
  "sync": "powershell ./sync-all.ps1"
}
```

The agent can execute these tasks to maintain infrastructure health and synchronization.