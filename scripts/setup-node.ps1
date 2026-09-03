# scripts/setup-node.ps1
$ErrorActionPreference = "Stop"

$nodeVersion = "v20.17.0"
$baseDir = "$env:LOCALAPPDATA\Programs"
$extractedFolder = "$baseDir\node-$nodeVersion-win-x64"
$finalDir = "$baseDir\nodejs"
$zipFile = "$env:TEMP\node-$nodeVersion-win-x64.zip"

if (!(Test-Path $baseDir)) {
    New-Item -ItemType Directory -Path $baseDir -Force | Out-Null
}

if (!(Test-Path $zipFile)) {
    Write-Host "Downloading Node.js archive..."
    & curl.exe -L "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip" -o $zipFile
}

Write-Host "Extracting archive using Expand-Archive..."
Expand-Archive -LiteralPath $zipFile -DestinationPath $baseDir -Force

if (Test-Path $finalDir) {
    Remove-Item -LiteralPath $finalDir -Recurse -Force
}

Write-Host "Renaming folder to $finalDir..."
Rename-Item -LiteralPath $extractedFolder -NewName "nodejs" -Force

$nodeExe = "$finalDir\node.exe"
$npmCmd = "$finalDir\npm.cmd"

Write-Host "Checking binaries..."
if (Test-Path $nodeExe) {
    $nodeVer = & $nodeExe -v
    Write-Host "Node.js successfully verified: $nodeVer"
} else {
    Write-Error "node.exe not found at $nodeExe"
}

if (Test-Path $npmCmd) {
    $npmVer = & $npmCmd -v
    Write-Host "npm successfully verified: $npmVer"
}

# Update User PATH permanently
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$finalDir*") {
    $newPath = "$finalDir;$userPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Permanently added $finalDir to User PATH."
}

# Also update process environment PATH for immediate use
$env:PATH = "$finalDir;$env:PATH"

Write-Host "ALL SET! Node and npm are ready."
