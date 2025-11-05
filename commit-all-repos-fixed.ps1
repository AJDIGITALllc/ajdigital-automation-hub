param(
    [string]$CommitMessage = "sync: automated multi-repo update",
    [switch]$DryRun,
    [switch]$Verbose
)

# AJDIGITAL Multi-Repository Synchronization Script
# Orchestrates git operations across the entire AUDIOJONES.COM infrastructure

Write-Host "🚀 AJDIGITAL Multi-Repo Sync Tool" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Load repository configuration
$configPath = ".\.ajdlink.yaml"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Configuration file not found: $configPath" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the automation hub directory" -ForegroundColor Yellow
    exit 1
}

# Parse YAML config (simple approach for our structure)
$yamlContent = Get-Content $configPath -Raw
$repositories = @()

# Extract repository names from YAML
$yamlContent -split "`n" | ForEach-Object {
    if ($_ -match '^\s*-\s*name:\s*(.+)$') {
        $repositories += $matches[1].Trim()
    }
}

if ($repositories.Count -eq 0) {
    Write-Host "❌ No repositories found in configuration" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Found $($repositories.Count) repositories to process:" -ForegroundColor Green
$repositories | ForEach-Object { Write-Host "   • $_" -ForegroundColor Gray }
Write-Host ""

if ($DryRun) {
    Write-Host "🧪 DRY RUN MODE - No actual changes will be made" -ForegroundColor Magenta
    Write-Host ""
}

$successCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($repoName in $repositories) {
    Write-Host "📁 Processing: $repoName" -ForegroundColor White
    
    # Navigate to parent directory to find repository
    $parentDir = Split-Path (Get-Location) -Parent
    $repoPath = Join-Path $parentDir $repoName
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "   ⚠️  Repository directory not found: $repoPath" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    # Check if it's a git repository
    $gitDir = Join-Path $repoPath ".git"
    if (-not (Test-Path $gitDir)) {
        Write-Host "   ⚠️  Not a git repository: $repoPath" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    # Navigate to repository
    Push-Location $repoPath
    
    try {
        # Check for changes
        $statusOutput = git status --porcelain 2>$null
        
        if (-not $statusOutput) {
            Write-Host "   ✅ No changes to commit" -ForegroundColor Green
            $skippedCount++
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
        Write-Host "   📦 Staging changes..." -ForegroundColor Blue
        git add . 2>$null
        
        # Commit changes
        Write-Host "   💾 Committing: $CommitMessage" -ForegroundColor Blue
        $commitResult = git commit -m $CommitMessage 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Commit failed: $commitResult" -ForegroundColor Red
            $errorCount++
            Pop-Location
            continue
        }
        
        # Push changes
        Write-Host "   🚀 Pushing to remote..." -ForegroundColor Blue
        $pushResult = git push 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Push failed: $pushResult" -ForegroundColor Red
            $errorCount++
        } else {
            Write-Host "   ✅ Successfully synced!" -ForegroundColor Green
            $successCount++
        }
        
    } catch {
        Write-Host "   ❌ Error processing repository: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

# Summary
Write-Host "📊 Sync Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Successful: $successCount" -ForegroundColor Green
Write-Host "   ⚠️  Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "   ❌ Errors: $errorCount" -ForegroundColor Red
Write-Host ""

if (-not $DryRun) {
    Write-Host "🎉 Multi-repo sync complete!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "💡 Usage examples:" -ForegroundColor Cyan
Write-Host "   .\commit-all-repos.ps1" -ForegroundColor Gray
Write-Host "   .\commit-all-repos.ps1 -CommitMessage 'feat: add new features'" -ForegroundColor Gray
Write-Host "   .\commit-all-repos.ps1 -DryRun -Verbose" -ForegroundColor Gray