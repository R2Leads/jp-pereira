@echo off
cd /d "%~dp0"
if not exist ".next\BUILD_ID" (
  echo Compile esta copia com npm.cmd run build antes de iniciar a apresentacao.
  pause
  exit /b 1
)
call npm.cmd run db:up
if errorlevel 1 (
  echo Abra o Docker Desktop e tente novamente.
  pause
  exit /b 1
)
echo Demonstracao em http://localhost:3218/onde-comprar
echo Mantenha esta janela aberta durante a apresentacao. Use Ctrl+C para encerrar.
call npm.cmd run demo:start
if errorlevel 1 pause

