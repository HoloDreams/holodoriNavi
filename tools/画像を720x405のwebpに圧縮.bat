@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0resize-webp-720x405.ps1" %*
pause

