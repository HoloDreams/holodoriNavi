param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Targets)

Add-Type -AssemblyName System.Windows.Forms

$ErrorActionPreference = "Stop"
$logPath = Join-Path $env:TEMP "holodori-webp-resize-tool.log"
$python = "C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

function Show-Error($message) {
    [System.Windows.Forms.MessageBox]::Show($message, "エラー", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

try {
    if (-not (Test-Path -LiteralPath $python)) {
        throw "Python が見つかりません: $python"
    }

    $mode = ""
    $customTarget = ""

    if ($Targets -and $Targets.Count -gt 0) {
        $validTargets = @($Targets | Where-Object { Test-Path -LiteralPath $_ })
        if ($validTargets.Count -eq 0) { throw "ドラッグされた画像が見つかりません。" }
        $mode = "files"
        $fileListPath = Join-Path $env:TEMP "holodori_webp_resize_files.txt"
        [System.IO.File]::WriteAllLines($fileListPath, [string[]]$validTargets, [System.Text.UTF8Encoding]::new($false))
        $customTarget = $fileListPath
    } else {
        $choice = [System.Windows.Forms.MessageBox]::Show(
            "フォルダをまとめて処理しますか？`n`n「いいえ」を選ぶと、画像ファイルを複数選択できます。",
            "720x405 webp圧縮",
            [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($choice -eq [System.Windows.Forms.DialogResult]::Cancel) { exit }
        if ($choice -eq [System.Windows.Forms.DialogResult]::Yes) {
            $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
            $folderDialog.Description = "720x405 webp に圧縮したい画像フォルダを選択してください"
            if ($folderDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
            $mode = "folder"
            $customTarget = $folderDialog.SelectedPath
        } else {
            $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
            $fileDialog.Title = "720x405 webp に圧縮したい画像ファイルを選択してください"
            $fileDialog.Filter = "画像ファイル|*.png;*.webp;*.jpg;*.jpeg|すべてのファイル|*.*"
            $fileDialog.Multiselect = $true
            if ($fileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
            $mode = "files"
            $fileListPath = Join-Path $env:TEMP "holodori_webp_resize_files.txt"
            [System.IO.File]::WriteAllLines($fileListPath, [string[]]$fileDialog.FileNames, [System.Text.UTF8Encoding]::new($false))
            $customTarget = $fileListPath
        }
    }

    $confirm = [System.Windows.Forms.MessageBox]::Show(
        "画像を 720x405 の webp に変換します。`nバックアップは作成せず、選択した画像を置き換えます。`n`n続行しますか？",
        "確認",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Warning
    )
    if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) { exit }

    $py = @"
import datetime
import os
import sys
import traceback
from pathlib import Path
from PIL import Image, ImageOps

mode = sys.argv[1]
custom_arg = sys.argv[2] if len(sys.argv) > 2 else ''
custom_target = Path(custom_arg) if custom_arg else None
exts = {'.png', '.webp', '.jpg', '.jpeg'}
size = (720, 405)
quality = 82

try:
    if mode == 'folder':
        if custom_target is None or not custom_target.exists() or not custom_target.is_dir():
            raise SystemExit('対象フォルダが見つかりません。')
        files = [p for p in custom_target.rglob('*') if p.is_file() and p.suffix.lower() in exts]
    elif mode == 'files':
        if custom_target is None or not custom_target.exists() or not custom_target.is_file():
            raise SystemExit('対象ファイル一覧が見つかりません。')
        selected = [Path(line.strip().lstrip('\\ufeff')) for line in custom_target.read_text(encoding='utf-8-sig').splitlines() if line.strip()]
        print('選択ファイル数: ' + str(len(selected)))
        files = [p for p in selected if p.exists() and p.is_file() and p.suffix.lower() in exts]
        print('対象ファイル数: ' + str(len(files)))
        if files:
            common = Path(os.path.commonpath([str(p.parent) for p in files]))
        else:
            common = custom_target.parent
    else:
        raise SystemExit('不明な処理モードです: ' + mode)

    files = sorted(set(files), key=lambda p: str(p).lower())
    if not files:
        raise SystemExit('対象画像が見つかりませんでした。')

    processed = 0
    created = []

    for p in files:
        print('処理: ' + str(p))
        out_path = p.with_suffix('.webp')
        with Image.open(p) as img:
            img = ImageOps.exif_transpose(img).convert('RGBA')
            img = ImageOps.fit(img, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
            img.save(out_path, 'WEBP', quality=quality, method=6)

        if out_path != p and p.exists():
            p.unlink()

        print('完了: ' + str(out_path))
        created.append(out_path)
        processed += 1

    print('処理画像数: ' + str(processed))
    print('サイズ: 720x405')
    print('形式: webp')
except Exception:
    traceback.print_exc()
    raise
"@

    Set-Content -LiteralPath $logPath -Value "" -Encoding UTF8
    $arguments = @($mode, $customTarget)
    $output = & $python -c $py @arguments 2>&1
    $output | Set-Content -LiteralPath $logPath -Encoding UTF8
    if ($LASTEXITCODE -ne 0) {
        throw "処理に失敗しました。`n`n$output`n`n詳細ログ:`n$logPath"
    }

    [System.Windows.Forms.MessageBox]::Show("圧縮が完了しました。`n`n$output", "完了", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
} catch {
    $msg = $_.Exception.Message
    $msg | Set-Content -LiteralPath $logPath -Encoding UTF8
    Show-Error "処理に失敗しました。`n`n$msg`n`n詳細ログ:`n$logPath"
}

