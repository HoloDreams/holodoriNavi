@echo off
setlocal
chcp 65001 >nul

set "REPO=G:\holodoriNavi"

echo [1/4] Git を探しています...
for /f "delims=" %%G in ('powershell -NoProfile -Command "Get-ChildItem \"$env:LOCALAPPDATA\GitHubDesktop\" -Recurse -Filter git.exe | Where-Object { $_.FullName -like \"*\\cmd\\git.exe\" } | Select-Object -First 1 -ExpandProperty FullName"') do set "GIT=%%G"

if not defined GIT (
  echo GitHub Desktop の Git が見つかりませんでした。
  echo GitHub Desktop がインストールされているか確認してください。
  pause
  exit /b 1
)

echo Git: %GIT%
echo Repo: %REPO%
echo.

echo [2/4] GitHub 側の更新を取り込んでいます...
"%GIT%" -C "%REPO%" pull --rebase origin main
if errorlevel 1 (
  echo.
  echo 取り込みに失敗しました。
  echo 競合が起きている可能性があります。この画面をCodexに見せてください。
  pause
  exit /b 1
)

echo.
echo [3/4] GitHub へ送信しています...
"%GIT%" -C "%REPO%" push origin main
if errorlevel 1 (
  echo.
  echo 送信に失敗しました。
  echo 認証や権限、または別の更新が入った可能性があります。この画面をCodexに見せてください。
  pause
  exit /b 1
)

echo.
echo [4/4] 完了しました。
echo GitHub Pages の反映には少し時間がかかる場合があります。
pause
