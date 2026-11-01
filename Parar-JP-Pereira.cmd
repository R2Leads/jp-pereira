@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0JP-Pereira-Demo.ps1" stop
if errorlevel 1 (
  echo.
  echo Nao foi possivel encerrar tudo. Leia o erro acima e pressione uma tecla para fechar.
  pause >nul
  exit /b 1
)
endlocal
