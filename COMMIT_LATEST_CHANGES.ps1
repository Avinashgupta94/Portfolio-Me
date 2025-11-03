# PowerShell script to commit and push portfolio updates safely
# Run this script from the Portfolio-Me folder
param(
    [switch]$ConfigureGit = $false
)

# Stop on first error
$ErrorActionPreference = "Stop"

function Write-Step {
    param($Message)
    Write-Host "`n→ $Message" -ForegroundColor Cyan
}

function Test-Git {
    try {
        $null = git --version
        return $true
    } catch {
        return $false
    }
}

function Initialize-Git {
    Write-Step "Checking git configuration..."
    
    # Check if git is installed
    if (-not (Test-Git)) {
        Write-Host "Git is not installed or not in PATH. Please install Git from https://git-scm.com/" -ForegroundColor Red
        exit 1
    }

    # Configure git if requested
    if ($ConfigureGit) {
        $name = Read-Host "Enter your Git username"
        $email = Read-Host "Enter your Git email"
        
        git config --global user.name $name
        git config --global user.email $email
        Write-Host "Git configured with user: $name <$email>" -ForegroundColor Green
    }

    # Verify git config
    $configName = git config --global user.name
    if (-not $configName) {
        Write-Host "Git username not configured. Run this script with -ConfigureGit to set it up." -ForegroundColor Yellow
        exit 1
    }
}

function Test-FileExists {
    param($Path, $Description)
    
    if (-not (Test-Path $Path)) {
        Write-Host "Error: $Description not found at: $Path" -ForegroundColor Red
        return $false
    }
    return $true
}

try {
    # Ensure we're in the correct directory
    Set-Location -Path $PSScriptRoot
    
    # Initialize git configuration
    Initialize-Git

    # Verify files exist
    Write-Step "Verifying files..."
    $filesToCheck = @{
        "RESUME.pdf" = "Resume PDF"
        "images/Pic.jpg" = "Profile picture"
        "index.html" = "Main HTML file"
    }
    
    $allFilesExist = $true
    foreach ($file in $filesToCheck.GetEnumerator()) {
        if (-not (Test-FileExists -Path $file.Key -Description $file.Value)) {
            $allFilesExist = $false
        }
    }
    
    if (-not $allFilesExist) {
        throw "Some required files are missing. Please check the errors above."
    }

    # Stage changes
    Write-Step "Staging changes..."
    git add RESUME.pdf index.html images/Pic.jpg
    git add .gitignore

    # Show what's being committed
    Write-Step "Changes to be committed:"
    git status --short

    # Confirm before committing
    $confirm = Read-Host "`nReady to commit and push these changes? (y/n)"
    if ($confirm -ne 'y') {
        Write-Host "Operation cancelled by user" -ForegroundColor Yellow
        exit 0
    }

    # Create commit
    Write-Step "Creating commit..."
    git commit -m "Update portfolio assets:
- Replace resume with new version
- Use uploaded profile picture
- Fix hero image path
- Add .gitignore for cleaner repo"

    # Push to remote
    Write-Step "Pushing to remote..."
    git push origin main

    Write-Host "`n✅ Success! Changes pushed to GitHub." -ForegroundColor Green
    Write-Host "Note: Wait a few minutes for Netlify/GitHub Pages to deploy your changes."

} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nFor help with git setup, run: .\COMMIT_LATEST_CHANGES.ps1 -ConfigureGit" -ForegroundColor Yellow
    exit 1
}