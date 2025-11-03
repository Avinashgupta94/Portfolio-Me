# PowerShell helper to commit and optionally push your Portfolio-Me changes
# Usage: Open PowerShell in this folder and run:
#    .\COMMIT_AND_PUSH_COMMANDS.ps1 -PushToRemote $true -RemoteUrl 'https://github.com/your-username/your-repo.git'

param(
    [switch]$PushToRemote = $false,
    [string]$RemoteUrl = ''
)

# Ensure we're in the script folder
Set-Location -Path $PSScriptRoot

# Initialize repo if not already
if (!(git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Host "Initializing a new git repository..."
    git init
} else {
    Write-Host "Already inside a git repository."
}

# Stage changes
Write-Host "Staging changed files..."
git add .

# Commit
Write-Host "Committing changes..."
$commitMessage = "Update About copy; split Skills into its own section; add icons & styles"
# If there are no changes to commit, git will return non-zero; ignore that safely
git commit -m $commitMessage 2>$null

if ($PushToRemote) {
    if (-not $RemoteUrl) {
        Write-Host "No RemoteUrl provided. Please provide the repo URL or add a remote manually."
        exit 1
    }
    Write-Host "Adding remote origin (or updating if it exists)..."
    if ((git remote) -match 'origin') {
        git remote remove origin
    }
    git remote add origin $RemoteUrl

    # Ensure branch name main
    git branch -M main

    Write-Host "Pushing to origin/main... You may be prompted for credentials."
    git push -u origin main
}

Write-Host "Done. If you didn't push, run the push step manually when ready."
