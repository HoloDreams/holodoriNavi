$ErrorActionPreference = "Continue"

$Repo = "G:\holodoriNavi"
$LogPath = Join-Path $env:TEMP "holodori-github-update.log"

function Write-Step($message) {
    Write-Host ""
    Write-Host $message -ForegroundColor Cyan
}

function Invoke-GitCommand([string[]]$Arguments, [string]$FailureMessage) {
    Write-Host ("> git " + ($Arguments -join " ")) -ForegroundColor DarkGray
    $output = & $Git -C $Repo @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    if ($output) {
        $output | Tee-Object -FilePath $LogPath -Append
    }
    if ($exitCode -ne 0) {
        throw $FailureMessage
    }
    return $output
}

try {
    "=== holodoriNavi GitHub update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File -LiteralPath $LogPath -Encoding UTF8

    Write-Step "[1/5] Searching Git..."
    $Git = Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop" -Recurse -Filter git.exe |
        Where-Object { $_.FullName -like "*\cmd\git.exe" } |
        Select-Object -First 1 -ExpandProperty FullName

    if (!$Git -or !(Test-Path -LiteralPath $Git)) {
        throw "Git was not found in GitHub Desktop."
    }
    if (!(Test-Path -LiteralPath (Join-Path $Repo ".git"))) {
        throw "Git repository was not found: $Repo"
    }

    Write-Host "Git: $Git"
    Write-Host "Repo: $Repo"

    Write-Step "[2/5] Checking local changes..."
    $status = & $Git -C $Repo status --porcelain
    if ($status) {
        Write-Host "Local changes found. Creating commit..."
        Invoke-GitCommand @("add", "-A") "git add failed."

        $message = "Update site files $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        Invoke-GitCommand @("commit", "-m", $message) "git commit failed."
    } else {
        Write-Host "No local changes."
    }

    Write-Step "[3/5] Pulling GitHub changes..."
    Invoke-GitCommand @("pull", "--rebase", "origin", "main") "Pull failed. There may be conflicts."

    Write-Step "[4/5] Pushing to GitHub..."
    Invoke-GitCommand @("push", "origin", "main") "Push failed. Authentication, permission, or remote changes may be the cause."

    Write-Step "[5/5] Done."
    Write-Host "GitHub Pages may take a little time to update." -ForegroundColor Green
    Write-Host "Log: $LogPath" -ForegroundColor DarkGray
} catch {
    Write-Host ""
    Write-Host "Error occurred." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Please show this screen or the log file to Codex." -ForegroundColor Yellow
    Write-Host "Log: $LogPath" -ForegroundColor Yellow
    exit 1
}
