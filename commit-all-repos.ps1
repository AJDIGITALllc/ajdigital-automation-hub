# AJDIGITAL Multi-Repo Commit Script
# Automatically commits and pushes changes across all repositories

param(
    [string]$CommitMessage = "chore: sync updates across repositories",
    [switch]$DryRun,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Continue"

Write-Host "🚀 AJDIGITAL Multi-Repo Sync" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Load repository map
$repoMapPath = ".ajdlink.yaml"
if (-not (Test-Path $repoMapPath)) {
    Write-Host "❌ Repository map not found: $repoMapPath" -ForegroundColor Red
    exit 1
}

# Parse YAML (basic parsing for our simple structure)
$yamlContent = Get-Content $repoMapPath -Raw
$repoNames = @()
$yamlContent -split "`n" | ForEach-Object {
    if ($_ -match '^\s*(\w+):\s*https://github\.com/.*?/(.+?)(?:\.git)?$') {
        $repoNames += $matches[2]
    }
}

# Define repository directories (relative to parent directory)
$parentDir = Split-Path $PWD -Parent
$repositories = @(
    "audiojones-system-modules",
    "audiojones-brand-repo", 
    "billing-and-payments-repo",
    "ajd-contract-library",
    "ajdigital-automation-hub"
)

Write-Host "📁 Found $($repositories.Count) repositories to process" -ForegroundColor Yellow
Write-Host ""

foreach ($repo in $repositories) {
    $repoPath = Join-Path $parentDir $repo
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "⚠️  Repository not found: $repo" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "🔄 Processing: $repo" -ForegroundColor Cyan
    
    # Navigate to repository
    Push-Location $repoPath
    
    try {
        # Check if it's a git repository
        if (-not (Test-Path ".git")) {
            Write-Host "   ❌ Not a git repository" -ForegroundColor Red
            Pop-Location
            continue
        }
        
        # Check git status
        $gitStatus = git status --porcelain 2>$null
        
        if (-not $gitStatus) {
            Write-Host "   ✅ No changes to commit" -ForegroundColor Green
            Pop-Location
            continue
        }
        
        # Show changes if verbose
        if ($Verbose) {
            Write-Host "   📝 Changes detected:" -ForegroundColor Yellow
            git status --short | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
        }
        
        if ($DryRun) {
            Write-Host "   🧪 DRY RUN: Would commit and push changes" -ForegroundColor Magenta
            Pop-Location
            continue
        }
        
        # Stage all changes
        Write-Host "   📦 Staging changes..." -ForegroundColor Yellow
        git add . 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Failed to stage changes" -ForegroundColor Red
            Pop-Location
            continue
        }
        
        # Commit changes
        Write-Host "   💾 Committing changes..." -ForegroundColor Yellow
        git commit -m $CommitMessage 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Failed to commit changes" -ForegroundColor Red
            Pop-Location
            continue
        }
        
        # Push changes
        Write-Host "   🚀 Pushing to remote..." -ForegroundColor Yellow
        git push 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Successfully synced" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to push changes" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "   ❌ Error processing repository: $($_.Exception.Message)" -ForegroundColor Red
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "🎉 Multi-repo sync complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Usage examples:" -ForegroundColor Cyan
Write-Host "   .\commit-all-repos.ps1" -ForegroundColor Gray
Write-Host "   .\commit-all-repos.ps1 -CommitMessage 'feat: add new features'" -ForegroundColor Gray
Write-Host "   .\commit-all-repos.ps1 -DryRun -Verbose" -ForegroundColor Gray