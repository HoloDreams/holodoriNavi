Add-Type -AssemblyName System.Windows.Forms

$ErrorActionPreference = "Stop"

$SiteRoot = "G:\holodoriNavi"
$DefaultWatermark = "G:\Download\透かし.png"
$Python = "C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$LogPath = Join-Path $env:TEMP "holodori-watermark-tool.log"

function Show-Info($message) {
    [System.Windows.Forms.MessageBox]::Show($message, "画像透かし追加", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}

function Show-Error($message) {
    [System.Windows.Forms.MessageBox]::Show($message, "エラー", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

try {
    if (!(Test-Path -LiteralPath $Python)) {
        throw "Python が見つかりません。`n$Python"
    }

    $watermark = $DefaultWatermark
    if (!(Test-Path -LiteralPath $watermark)) {
        $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
        $fileDialog.Title = "透かし画像を選択してください"
        $fileDialog.Filter = "画像ファイル|*.png;*.webp;*.jpg;*.jpeg|すべてのファイル|*.*"
        if ($fileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
        $watermark = $fileDialog.FileName
    }

    $choice = [System.Windows.Forms.MessageBox]::Show(
        "サイト内のキャラクターカード・楽曲ジャケット・アイテム画像に透かしを入れますか？`n`n「いいえ」を選ぶと、好きなフォルダを選んで処理できます。",
        "処理対象を選択",
        [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )

    if ($choice -eq [System.Windows.Forms.DialogResult]::Cancel) { exit }

    $mode = "site"
    $customFolder = ""
    if ($choice -eq [System.Windows.Forms.DialogResult]::No) {
        $folderDialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $folderDialog.Description = "透かしを入れたい画像フォルダを選択してください"
        if ($folderDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
        $mode = "folder"
        $customFolder = $folderDialog.SelectedPath
    }

    $confirm = [System.Windows.Forms.MessageBox]::Show(
        "透かしを左下に透明度50%で追加します。`n処理前の画像はバックアップされます。`n`n開始しますか？",
        "確認",
        [System.Windows.Forms.MessageBoxButtons]::OKCancel,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )
    if ($confirm -ne [System.Windows.Forms.DialogResult]::OK) { exit }

    $tempScript = Join-Path $env:TEMP "holodori_add_watermark.py"
    $pythonCode = @'
from pathlib import Path
import shutil, sys, datetime
from PIL import Image

site_root = Path(sys.argv[1])
watermark_path = Path(sys.argv[2])
mode = sys.argv[3]
custom_folder = Path(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] else None

exts = {'.png', '.jpg', '.jpeg', '.webp'}
if not watermark_path.exists():
    raise SystemExit('透かし画像が見つかりません: ' + str(watermark_path))

if mode == 'site':
    target_dirs = [
        site_root / 'code' / 'character_card',
        site_root / 'code' / 'img' / 'cover_art',
        site_root / 'code' / 'img' / 'item img',
    ]
    backup_root = site_root.parent / (site_root.name + '_watermark_backup_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
    base_root = site_root
else:
    if custom_folder is None or not custom_folder.exists():
        raise SystemExit('対象フォルダが見つかりません。')
    target_dirs = [custom_folder]
    backup_root = custom_folder.parent / (custom_folder.name + '_watermark_backup_' + datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
    base_root = custom_folder.parent

files = []
for d in target_dirs:
    if d.exists():
        files.extend([p for p in d.rglob('*') if p.is_file() and p.suffix.lower() in exts])
files = sorted(set(files), key=lambda p: str(p).lower())
if not files:
    raise SystemExit('対象画像が見つかりませんでした。')

backup_root.mkdir(parents=True, exist_ok=True)
for p in files:
    rel = p.relative_to(base_root)
    dest = backup_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, dest)

wm_src = Image.open(watermark_path).convert('RGBA')
processed = 0
for p in files:
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
    processed += 1

print('処理画像数: ' + str(processed))
print('バックアップ: ' + str(backup_root))
'@

    Set-Content -LiteralPath $tempScript -Value $pythonCode -Encoding UTF8

    $output = & $Python $tempScript $SiteRoot $watermark $mode $customFolder 2>&1
    $output | Out-File -LiteralPath $LogPath -Encoding UTF8

    if ($LASTEXITCODE -ne 0) {
        throw ($output -join "`n")
    }

    Show-Info("透かしの追加が完了しました。`n`n$output")
} catch {
    $detail = $_.Exception.Message
    $detail | Out-File -LiteralPath $LogPath -Encoding UTF8
    Show-Error("処理に失敗しました。`n`n$detail`n`n詳細ログ:`n$LogPath")
}
