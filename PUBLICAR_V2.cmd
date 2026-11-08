@echo off
chcp 65001 > nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0PUBLICAR_V2.ps1"
if errorlevel 1 (
  echo.
  echo Publicacao nao concluida. Confira a mensagem de erro acima.
) else (
  echo.
  echo ClassMana V2 - processo finalizado.
)
pause
