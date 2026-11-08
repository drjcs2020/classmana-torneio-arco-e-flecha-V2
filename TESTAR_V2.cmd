@echo off
chcp 65001 > nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node.js 22 ou superior para executar as verificacoes.
  pause
  exit /b 1
)
node scripts/qa-static.mjs && node scripts/qa-media.mjs && node scripts/qa-v2.mjs && node scripts/qa-duel-endtoend.mjs
if errorlevel 1 (
 echo Uma verificacao apresentou erro.
) else (
 echo Todas as verificacoes foram concluidas com sucesso.
)
pause
