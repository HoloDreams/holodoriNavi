@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0add-watermark.ps1" %*
pause

