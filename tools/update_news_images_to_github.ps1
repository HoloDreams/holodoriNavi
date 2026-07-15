Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$Owner = "HoloDreams"
$Repo = "holidoriNavi"
$Branch = "main"
$RepoNewsPath = "code/news_img"
$LocalNewsDir = "G:\holidoriNavi\code\news_img"
$CommitMessage = "Update news images"
$LogFile = Join-Path $env:TEMP "holodori-news-github-upload.log"

function Write-Log($text) {
    $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $text
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
}

function Show-Message($text, $title = "ニュース画像更新") {
    [System.Windows.Forms.MessageBox]::Show($text, $title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}

function Show-Error($text) {
    [System.Windows.Forms.MessageBox]::Show($text, "エラー", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

function Read-Token {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "GitHub token"
    $form.Width = 560
    $form.Height = 180
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false

    $label = New-Object System.Windows.Forms.Label
    $label.Text = "GitHub Personal Access Token を入力してください。`r`n権限は Contents: Read and write が必要です。"
    $label.Left = 14
    $label.Top = 12
    $label.Width = 510
    $label.Height = 42
    $form.Controls.Add($label)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Left = 14
    $box.Top = 62
    $box.Width = 510
    $box.UseSystemPasswordChar = $true
    $form.Controls.Add($box)

    $ok = New-Object System.Windows.Forms.Button
    $ok.Text = "OK"
    $ok.Left = 342
    $ok.Top = 98
    $ok.Width = 84
    $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.Controls.Add($ok)

    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = "キャンセル"
    $cancel.Left = 440
    $cancel.Top = 98
    $cancel.Width = 84
    $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($cancel)

    $form.AcceptButton = $ok
    $form.CancelButton = $cancel
    if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK -or [string]::IsNullOrWhiteSpace($box.Text)) {
        throw "GitHub token が入力されませんでした。"
    }
    return $box.Text.Trim()
}

function Select-Image($number) {
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = "ニュース画像 $number を選択"
    $dialog.Filter = "画像ファイル|*.jpg;*.jpeg;*.png;*.webp;*.bmp|すべてのファイル|*.*"
    $dialog.Multiselect = $false
    if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        throw "ニュース画像 $number が選択されませんでした。"
    }
    return $dialog.FileName
}

function Convert-ToNewsJpeg($source, $target) {
    $src = [System.Drawing.Image]::FromFile($source)
    try {
        $targetW = 1280
        $targetH = 720
        $targetRatio = $targetW / $targetH
        $srcRatio = $src.Width / $src.Height

        if ($srcRatio -gt $targetRatio) {
            $cropH = $src.Height
            $cropW = [int]($src.Height * $targetRatio)
            $cropX = [int](($src.Width - $cropW) / 2)
            $cropY = 0
        } else {
            $cropW = $src.Width
            $cropH = [int]($src.Width / $targetRatio)
            $cropX = 0
            $cropY = [int](($src.Height - $cropH) / 2)
        }

        $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bmp)
            try {
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $targetW, $targetH)), (New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)), [System.Drawing.GraphicsUnit]::Pixel)
            } finally {
                $graphics.Dispose()
            }

            $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
            $encoder = [System.Drawing.Imaging.Encoder]::Quality
            $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [int64]88)
            $bmp.Save($target, $codec, $params)
        } finally {
            if ($bmp) { $bmp.Dispose() }
        }
    } finally {
        $src.Dispose()
    }
}

function Invoke-GitHubApi($method, $uri, $token, $body = $null) {
    $headers = @{
        Authorization = "Bearer $token"
        Accept = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
        "User-Agent" = "hololive-dreams-news-updater"
    }
    Write-Log "$method $uri"
    try {
        if ($body -eq $null) {
            return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers
        }
        $jsonBody = $body | ConvertTo-Json -Depth 20
        Write-Log $jsonBody
        return Invoke-RestMethod -Method $method -Uri $uri -Headers $headers -Body $jsonBody -ContentType "application/json; charset=utf-8"
    } catch {
        $detail = $_.Exception.Message
        $responseText = $null
        try {
            if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
                $responseText = $_.ErrorDetails.Message
            }
        } catch {}
        try {
            if (-not $responseText -and $_.Exception.Response) {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseText = $reader.ReadToEnd()
                }
            }
        } catch {}
        if ($responseText) {
            $detail += "`r`n`r`nGitHub response:`r`n$responseText"
        }
        Write-Log "ERROR: $detail"
        throw $detail
    }
}

function Get-ExistingFileSha($repoPath, $token) {
    $encodedPath = ($repoPath -split "/" | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
    $contentUri = "https://api.github.com/repos/${Owner}/${Repo}/contents/${encodedPath}?ref=${Branch}"
    try {
        $existing = Invoke-GitHubApi GET $contentUri $token
        if ($existing.sha) { return $existing.sha }
    } catch {
        Write-Log "Contents API sha lookup failed for ${repoPath}: $($_.Exception.Message)"
    }

    $refUri = "https://api.github.com/repos/${Owner}/${Repo}/git/ref/heads/${Branch}"
    $refInfo = Invoke-GitHubApi GET $refUri $token
    $commitSha = $refInfo.object.sha
    if (-not $commitSha) {
        throw "ブランチ情報からcommit shaを取得できませんでした。"
    }
    Write-Log "Branch ${Branch} commit sha: $commitSha"

    $commitUri = "https://api.github.com/repos/${Owner}/${Repo}/git/commits/${commitSha}"
    $commitInfo = Invoke-GitHubApi GET $commitUri $token
    $treeSha = $commitInfo.tree.sha
    if (-not $treeSha) {
        throw "commit情報からtree shaを取得できませんでした。"
    }
    Write-Log "Commit tree sha: $treeSha"

    $treeUri = "https://api.github.com/repos/${Owner}/${Repo}/git/trees/${treeSha}?recursive=1"
    $tree = Invoke-GitHubApi GET $treeUri $token
    $match = $tree.tree | Where-Object { $_.path -eq $repoPath } | Select-Object -First 1
    if ($match -and $match.sha) { return $match.sha }
    return $null
}

function Upload-File($localFile, $repoPath, $token) {
    $encodedPath = ($repoPath -split "/" | ForEach-Object { [uri]::EscapeDataString($_) }) -join "/"
    $sha = Get-ExistingFileSha $repoPath $token
    if (-not $sha) {
        throw "GitHub上の既存ファイルIDを取得できませんでした。`r`n$repoPath`r`nリポジトリ名・ブランチ名・トークンの対象リポジトリを確認してください。"
    }
    Write-Log "Existing file sha for ${repoPath}: $sha"

    $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes($localFile))
    $body = @{
        message = $CommitMessage
        content = $content
        branch = $Branch
        sha = $sha
    }
    $putUri = "https://api.github.com/repos/${Owner}/${Repo}/contents/${encodedPath}"
    Invoke-GitHubApi PUT $putUri $token $body | Out-Null
}

try {
    Remove-Item -LiteralPath $LogFile -Force -ErrorAction SilentlyContinue
    Show-Message "これから 01.jpg から 05.jpg に使う画像を順番に選びます。`r`n選んだ画像は 1280x720 に整えてから GitHub に送ります。"

    $selected = @()
    for ($i = 1; $i -le 5; $i++) {
        $selected += Select-Image ("{0:D2}" -f $i)
    }

    $confirmText = "この順番で更新します。`r`n`r`n"
    for ($i = 0; $i -lt 5; $i++) {
        $confirmText += ("{0:D2}.jpg  ←  {1}`r`n" -f ($i + 1), [IO.Path]::GetFileName($selected[$i]))
    }
    $answer = [System.Windows.Forms.MessageBox]::Show($confirmText, "確認", [System.Windows.Forms.MessageBoxButtons]::OKCancel, [System.Windows.Forms.MessageBoxIcon]::Question)
    if ($answer -ne [System.Windows.Forms.DialogResult]::OK) { throw "キャンセルしました。" }

    $token = Read-Token
    New-Item -ItemType Directory -Force -Path $LocalNewsDir | Out-Null
    $tempDir = Join-Path ([IO.Path]::GetTempPath()) ("holodori-news-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

    for ($i = 0; $i -lt 5; $i++) {
        $name = "{0:D2}.jpg" -f ($i + 1)
        $tempFile = Join-Path $tempDir $name
        $localFile = Join-Path $LocalNewsDir $name
        Convert-ToNewsJpeg $selected[$i] $tempFile
        Copy-Item -LiteralPath $tempFile -Destination $localFile -Force
        Upload-File $tempFile "$RepoNewsPath/$name" $token
    }

    Remove-Item -LiteralPath $tempDir -Recurse -Force
    Show-Message "GitHubへの更新が完了しました。`r`n少し待って GitHub Pages の公開処理が終わったら、ページを Ctrl+F5 で更新してください。"
} catch {
    Show-Error ($_.Exception.Message + "`r`n`r`n詳細ログ: " + $LogFile)
    exit 1
}









