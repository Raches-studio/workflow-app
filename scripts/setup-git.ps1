# scripts/setup-git.ps1
$ErrorActionPreference = "Stop"

$gitDir = "$env:LOCALAPPDATA\Programs\git"
$gitExe = "$gitDir\cmd\git.exe"

if (Test-Path $gitExe) {
    Write-Host "Git already installed at $gitExe"
    & $gitExe --version
    exit 0
}

$zipUrl = "https://github.com/git-for-windows/git/releases/download/v2.46.0.windows.1/MinGit-2.46.0-64-bit.zip"
$tempZip = "$env:TEMP\mingit.zip"

Write-Host "Downloading MinGit..."
& curl.exe -L $zipUrl -o $tempZip

if (!(Test-Path $gitDir)) {
    New-Item -ItemType Directory -Path $gitDir -Force | Out-Null
}

Write-Host "Extracting MinGit to $gitDir..."
Expand-Archive -LiteralPath $tempZip -DestinationPath $gitDir -Force

if (Test-Path $tempZip) {
    Remove-Item -LiteralPath $tempZip -Force
}

# Update User PATH permanently
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$gitCmdDir = "$gitDir\cmd"
if ($userPath -notlike "*$gitCmdDir*") {
    $newPath = "$gitCmdDir;$userPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Added $gitCmdDir to User PATH."
}

if (Test-Path $gitExe) {
    $ver = & $gitExe --version
    Write-Host "MinGit successfully installed and verified: $ver"
} else {
    Write-Error "git.exe not found after extraction."
}
