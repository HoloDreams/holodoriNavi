param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Targets)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$logPath = Join-Path $env:TEMP "holodori-watermark-tool.log"
$python = "C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$defaultWatermark = "G:\Download\透かし.png"

function Show-Error($message) {
    [System.Windows.Forms.MessageBox]::Show($message, "エラー", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

try {
    if (-not (Test-Path -LiteralPath $python)) {
        throw "Python が見つかりません: $python"
    }

    if (-not (Test-Path -LiteralPath $defaultWatermark)) {
        $watermarkDialog = New-Object System.Windows.Forms.OpenFileDialog
        $watermarkDialog.Title = "透かし画像を選択してください"
        $watermarkDialog.Filter = "画像ファイル|*.png;*.webp;*.jpg;*.jpeg|すべてのファイル|*.*"
        if ($watermarkDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
        $watermarkPath = $watermarkDialog.FileName
    } else {
        $watermarkPath = $defaultWatermark
    }

    $mode = ""
    $customTarget = ""

    if ($Targets -and $Targets.Count -gt 0) {
        $validTargets = @($Targets | Where-Object { Test-Path -LiteralPath $_ })
        if ($validTargets.Count -eq 0) { throw "ドラッグされた画像が見つかりません。" }
        $mode = "files"
        $fileListPath = Join-Path $env:TEMP "holodori_watermark_files.txt"
        [System.IO.File]::WriteAllLines($fileListPath, [string[]]$validTargets, [System.Text.UTF8Encoding]::new($false))
        $customTarget = $fileListPath
    } else {
        $choice = [System.Windows.Forms.MessageBox]::Show(
            "サイト内のキャラクターカード・楽曲ジャケット・アイテム画像に透かしを入れますか？`n`n「いいえ」を選ぶと、フォルダまたは画像ファイルを選んで処理できます。",
            "透かし追加",
            [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
            [System.Windows.Forms.MessageBoxIcon]::Question
        )
        if ($choice -eq [System.Windows.Forms.DialogResult]::Cancel) { exit }
        if ($choice -eq [System.Windows.Forms.DialogResult]::Yes) {
            $mode = "site"
        } else {
            $targetChoice = [System.Windows.Forms.MessageBox]::Show(
                "フォルダをまとめて処理しますか？`n`n「いいえ」を選ぶと、画像ファイルを複数選択できます。",
                "処理対象",
                [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
                [System.Windows.Forms.MessageBoxIcon]::Question
            )
            if ($targetChoice -eq [System.Windows.Forms.DialogResult]::Cancel) { exit }
            if ($targetChoice -eq [System.Windows.Forms.DialogResult]::Yes) {
                $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
                $folderDialog.Description = "透かしを入れたい画像フォルダを選択してください"
                if ($folderDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
                $mode = "folder"
                $customTarget = $folderDialog.SelectedPath
            } else {
                $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
                $fileDialog.Title = "透かしを入れたい画像ファイルを選択してください"
                $fileDialog.Filter = "画像ファイル|*.png;*.webp;*.jpg;*.jpeg|すべてのファイル|*.*"
                $fileDialog.Multiselect = $true
                if ($fileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
                $mode = "files"
                $fileListPath = Join-Path $env:TEMP "holodori_watermark_files.txt"
                [System.IO.File]::WriteAllLines($fileListPath, [string[]]$fileDialog.FileNames, [System.Text.UTF8Encoding]::new($false))
                $customTarget = $fileListPath
            }
        }
    }

    $confirm = [System.Windows.Forms.MessageBox]::Show(
        "元画像を上書きします。処理前にバックアップを作成します。`n続行しますか？",
        "確認",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Warning
    )
    if ($confirm -ne [System.Windows.Forms.DialogResult]::Yes) { exit }

    $py = @"
import datetime
import os
import shutil
import sys
import traceback
from pathlib import Path
from PIL import Image

repo = Path(sys.argv[1])
watermark_path = Path(sys.argv[2])
mode = sys.argv[3]
custom_arg = sys.argv[4] if len(sys.argv) > 4 else ''
custom_target = Path(custom_arg) if custom_arg else None
exts = {'.png', '.webp', '.jpg', '.jpeg'}

try:
    if not watermark_path.exists():
        raise SystemExit('透かし画像が見つかりません: ' + str(watermark_path))

    backup_root = repo.parent / (repo.name + '_watermark_backup_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
    base_root = repo

    if mode == 'site':
        target_dirs = [
            repo / 'code' / 'character_card',
            repo / 'code' / 'character_card_thumb',
            repo / 'code' / 'img' / 'cover_art',
            repo / 'code' / 'img' / 'item img',
        ]
        files = []
        for d in target_dirs:
            if d.exists():
                files.extend([p for p in d.rglob('*') if p.is_file() and p.suffix.lower() in exts])
    elif mode == 'folder':
        if custom_target is None or not custom_target.exists() or not custom_target.is_dir():
            raise SystemExit('対象フォルダが見つかりません。')
        backup_root = custom_target.parent / (custom_target.name + '_watermark_backup_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
        base_root = custom_target.parent
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
        backup_root = common.parent / (common.name + '_watermark_backup_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
        base_root = common
    else:
        raise SystemExit('不明な処理モードです: ' + mode)

    files = sorted(set(files), key=lambda p: str(p).lower())
    if not files:
        raise SystemExit('対象画像が見つかりませんでした。')

    backup_root.mkdir(parents=True, exist_ok=True)
    for p in files:
        try:
            rel = p.relative_to(base_root)
        except ValueError:
            rel = Path(p.name)
        dest = backup_root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, dest)

    wm_src = Image.open(watermark_path).convert('RGBA')
    processed = 0
    for p in files:
        print('処理: ' + str(p))
        with Image.open(p) as img:
            img = img.convert('RGBA')
            max_w = max(1, int(img.width * 0.32))
            max_h = max(1, int(img.height * 0.16))
            scale = min(max_w / wm_src.width, max_h / wm_src.height, 1.0)
            wm_w = max(1, int(wm_src.width * scale))
            wm_h = max(1, int(wm_src.height * scale))
            wm = wm_src.resize((wm_w, wm_h), Image.Resampling.LANCZOS)
            alpha = wm.getchannel('A').point(lambda a: int(a * 0.5))
            wm.putalpha(alpha)
            margin = max(8, int(min(img.width, img.height) * 0.025))
            img.alpha_composite(wm, (margin, img.height - wm.height - margin))
            suffix = p.suffix.lower()
            if suffix in {'.jpg', '.jpeg'}:
                img.convert('RGB').save(p, quality=92, optimize=True)
            elif suffix == '.webp':
                img.save(p, quality=92, method=4)
            else:
                img.save(p, optimize=True)
        print('完了: ' + str(p))
        processed += 1

    print('処理画像数: ' + str(processed))
    print('バックアップ: ' + str(backup_root))
except Exception:
    traceback.print_exc()
    raise
"@

    Set-Content -LiteralPath $logPath -Value "" -Encoding UTF8
    $arguments = @($repoRoot, $watermarkPath, $mode, $customTarget)
    $output = & $python -c $py @arguments 2>&1
    $output | Set-Content -LiteralPath $logPath -Encoding UTF8
    if ($LASTEXITCODE -ne 0) {
        throw "処理に失敗しました。`n`n$output`n`n詳細ログ:`n$logPath"
    }

    [System.Windows.Forms.MessageBox]::Show("透かしの追加が完了しました。`n`n$output", "完了", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
} catch {
    $msg = $_.Exception.Message
    $msg | Set-Content -LiteralPath $logPath -Encoding UTF8
    Show-Error "処理に失敗しました。`n`n$msg`n`n詳細ログ:`n$logPath"
}
