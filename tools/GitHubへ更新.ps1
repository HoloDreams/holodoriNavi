$ErrorActionPreference = "Stop"

$Repo = "G:\holodoriNavi"
$LogPath = Join-Path $env:TEMP "holodori-github-update.log"

function Write-Step($message) {
    Write-Host ""
    Write-Host $message -ForegroundColor Cyan
}

function Run-Git($arguments) {
    Write-Host "> git $arguments" -ForegroundColor DarkGray
    $output = & $Git -C $Repo @($arguments -split " ") 2>&1
    $output | Tee-Object -FilePath $LogPath -Append
    if ($LASTEXITCODE -ne 0) {
        throw "git $arguments に失敗しました。"
    }
    return $output
}

try {
    "=== holodoriNavi GitHub update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File -LiteralPath $LogPath -Encoding UTF8

    Write-Step "[1/5] Git を探しています..."
    $Git = Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop" -Recurse -Filter git.exe |
        Where-Object { $_.FullName -like "*\cmd\git.exe" } |
        Select-Object -First 1 -ExpandProperty FullName

    if (!$Git -or !(Test-Path -LiteralPath $Git)) {
        throw "GitHub Desktop の Git が見つかりませんでした。"
    }
    if (!(Test-Path -LiteralPath (Join-Path $Repo ".git"))) {
        throw "Git リポジトリが見つかりません: $Repo"
    }

    Write-Host "Git: $Git"
    Write-Host "Repo: $Repo"

    Write-Step "[2/5] 変更を確認しています..."
    $status = & $Git -C $Repo status --porcelain
    if ($status) {
        Write-Host "変更があるため、自動でコミットします。"
        & $Git -C $Repo add -A
        if ($LASTEXITCODE -ne 0) { throw "git add に失敗しました。" }

        $message = "Update site files $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        & $Git -C $Repo commit -m $message
        if ($LASTEXITCODE -ne 0) { throw "git commit に失敗しました。" }
    } else {
        Write-Host "未コミットの変更はありません。"
    }

    Write-Step "[3/5] GitHub 側の更新を取り込んでいます..."
    & $Git -C $Repo pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
        throw "取り込みに失敗しました。競合が起きている可能性があります。"
    }

    Write-Step "[4/5] GitHub へ送信しています..."
    & $Git -C $Repo push origin main
    if ($LASTEXITCODE -ne 0) {
        throw "送信に失敗しました。認証、権限、またはリモート更新が原因の可能性があります。"
    }

    Write-Step "[5/5] 完了しました。"
    Write-Host "GitHub Pages の反映には少し時間がかかる場合があります。" -ForegroundColor Green
    Write-Host "ログ: $LogPath" -ForegroundColor DarkGray
} catch {
    Write-Host ""
    Write-Host "エラーが発生しました。" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "この画面、または下のログをCodexに見せてください。" -ForegroundColor Yellow
    Write-Host "ログ: $LogPath" -ForegroundColor Yellow
    exit 1
}
