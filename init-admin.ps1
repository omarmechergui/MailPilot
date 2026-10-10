# MailPilot — Safe Admin Initialization Script
# Run this directly in PowerShell. Secrets never leave your terminal.

$ErrorActionPreference = "Stop"
$backendUrl = "http://localhost:5000/api/v1"

Write-Host ""
Write-Host "=== MailPilot Admin Initialization ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify backend is running and database is connected
Write-Host "[1/6] Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -Method GET
    if ($health.data.database -ne "connected") {
        Write-Host "FAILED: Database is not connected." -ForegroundColor Red
        exit 1
    }
    Write-Host "  Backend running, database connected." -ForegroundColor Green
} catch {
    Write-Host "FAILED: Cannot reach backend at $backendUrl" -ForegroundColor Red
    Write-Host "  Make sure the backend is running: node src/server.js" -ForegroundColor Gray
    exit 1
}

# Step 2: Read ADMIN_INIT_TOKEN from backend/.env
Write-Host "[2/6] Reading init token from backend/.env..." -ForegroundColor Yellow
if ($PSScriptRoot) {
    $envPath = Join-Path $PSScriptRoot "backend\.env"
} else {
    # Fallback if script is pasted directly into terminal
    $envPath = Join-Path (Get-Location) "backend\.env"
}
if (-not (Test-Path $envPath)) {
    Write-Host "FAILED: Cannot find backend\.env at $envPath" -ForegroundColor Red
    exit 1
}

$initToken = $null
foreach ($line in Get-Content $envPath) {
    if ($line -match '^\s*ADMIN_INIT_TOKEN\s*=\s*"?([^"]+)"?\s*$') {
        $initToken = $matches[1]
    }
}
if (-not $initToken) {
    Write-Host "FAILED: ADMIN_INIT_TOKEN not found in backend\.env" -ForegroundColor Red
    exit 1
}
Write-Host "  Init token loaded (not displayed)." -ForegroundColor Green

# Step 3: Collect admin credentials securely
Write-Host "[3/6] Enter your admin credentials below." -ForegroundColor Yellow
Write-Host ""

$email = Read-Host "  Admin email"
if (-not $email) { Write-Host "FAILED: Email is required." -ForegroundColor Red; exit 1 }

$username = Read-Host "  Admin username"
if (-not $username) { Write-Host "FAILED: Username is required." -ForegroundColor Red; exit 1 }

$securePass = Read-Host "  Admin password (min 8 chars)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
$password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ($password.Length -lt 8) {
    Write-Host "FAILED: Password must be at least 8 characters." -ForegroundColor Red
    exit 1
}

# Step 4: Confirm before proceeding
Write-Host ""
Write-Host "  Email:    $email" -ForegroundColor White
Write-Host "  Username: $username" -ForegroundColor White
Write-Host "  Password: ********" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Create this admin account? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled. No account was created." -ForegroundColor Yellow
    exit 0
}

# Step 5: Send initialization request
Write-Host "[4/6] Creating admin account..." -ForegroundColor Yellow
$body = @{
    email     = $email
    username  = $username
    password  = $password
    initToken = $initToken
} | ConvertTo-Json

# Clear password from memory
$password = $null
$initToken = $null

try {
    $initResult = Invoke-RestMethod -Uri "$backendUrl/auth/init" -Method POST -ContentType "application/json" -Body $body
    Write-Host "  Admin account created successfully!" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $errBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "FAILED (HTTP $status): $($errBody.message)" -ForegroundColor Red
    exit 1
} finally {
    $body = $null
}

# Step 6: Verify login and /me
Write-Host "[5/6] Verifying login..." -ForegroundColor Yellow

# Re-read password securely for login verification
$securePass2 = Read-Host "  Re-enter password to verify login" -AsSecureString
$bstr2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass2)
$loginPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr2)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr2)

$loginBody = @{
    identifier = $email
    password   = $loginPass
} | ConvertTo-Json
$loginPass = $null

try {
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $loginResponse = Invoke-WebRequest -Uri "$backendUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -WebSession $session -UseBasicParsing
    
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "  Login successful!" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Login returned HTTP $($loginResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "FAILED: Login returned HTTP $status" -ForegroundColor Red
    exit 1
} finally {
    $loginBody = $null
}

# Test /me with the session cookie
Write-Host "[6/6] Verifying authenticated session (GET /auth/me)..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Uri "$backendUrl/auth/me" -Method GET -WebSession $session
    Write-Host "  Authenticated as: $($meResponse.data.email) ($($meResponse.data.username))" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "FAILED: /auth/me returned HTTP $status" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Admin initialization complete ===" -ForegroundColor Cyan
Write-Host "You can now proceed to the next development phase." -ForegroundColor Gray
Write-Host ""
