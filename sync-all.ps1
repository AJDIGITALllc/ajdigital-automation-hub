param(
    [string]$CommitMessage = "sync: automated multi-repo update",
    [switch]$DryRun,
    [switch]$Verbose
)

Write-Host "AJDIGITAL Multi-Repo Sync Tool" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Load repository configuration
$configPath = ".\.ajdlink.yaml"
if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: Configuration file not found: $configPath" -ForegroundColor Red
    exit 1
}

# Parse YAML config
$yamlContent = Get-Content $configPath -Raw
$repositories = @()

# Extract repository names from YAML links section
$yamlContent -split "`n" | ForEach-Object {
    if ($_ -match '^\s*\w+:\s*https://github\.com/[^/]+/(.+)$') {
        $repoName = $matches[1].Trim()
        $repositories += $repoName
    }
}

if ($repositories.Count -eq 0) {
    Write-Host "ERROR: No repositories found in configuration" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($repositories.Count) repositories to process:" -ForegroundColor Green
$repositories | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Magenta
    Write-Host ""
}

$successCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($repoName in $repositories) {
    Write-Host "Processing: $repoName" -ForegroundColor White
    
    $parentDir = Split-Path (Get-Location) -Parent
    $repoPath = Join-Path $parentDir $repoName
    
    if (-not (Test-Path $repoPath)) {
        Write-Host "  WARNING: Repository directory not found" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    $gitDir = Join-Path $repoPath ".git"
    if (-not (Test-Path $gitDir)) {
        Write-Host "  WARNING: Not a git repository" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    Push-Location $repoPath
    
    $statusOutput = git status --porcelain 2>$null
    
    if (-not $statusOutput) {
        Write-Host "  SUCCESS: No changes to commit" -ForegroundColor Green
        $skippedCount++
        Pop-Location
        continue
    }
    
    if ($Verbose) {
        Write-Host "  Changes detected:" -ForegroundColor Yellow
        git status --short | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
    
    if ($DryRun) {
        Write-Host "  DRY RUN: Would commit and push changes" -ForegroundColor Magenta
        Pop-Location
        continue
    }
    
    Write-Host "  Staging changes..." -ForegroundColor Blue
    git add . 2>$null
    
    Write-Host "  Committing..." -ForegroundColor Blue
    git commit -m $CommitMessage 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Commit failed" -ForegroundColor Red
        $errorCount++
        Pop-Location
        continue
    }
    
    Write-Host "  Pushing to remote..." -ForegroundColor Blue
    git push 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Push failed" -ForegroundColor Red
        $errorCount++
    } else {
        Write-Host "  SUCCESS: Repository synced!" -ForegroundColor Green
        $successCount++
    }
    
    Pop-Location
    Write-Host ""
}

Write-Host "Sync Summary:" -ForegroundColor Cyan
Write-Host "  Successful: $successCount" -ForegroundColor Green
Write-Host "  Skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "  Errors: $errorCount" -ForegroundColor Red
Write-Host ""

if (-not $DryRun) {
    Write-Host "Multi-repo sync complete!" -ForegroundColor Green
}