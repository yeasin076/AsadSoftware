@echo off
echo ========================================
echo    MySQL Password Reset for MySQL80
echo ========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/5] Stopping MySQL service...
net stop MySQL80
if %errorLevel% neq 0 (
    echo Warning: Could not stop MySQL80 service
)
timeout /t 2 >nul

echo [2/5] Creating password reset file...
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpass123'; > "%TEMP%\mysql-reset.sql"
echo FLUSH PRIVILEGES; >> "%TEMP%\mysql-reset.sql"

echo [3/5] Starting MySQL with init-file...
start /B "MySQL Reset" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --init-file="%TEMP%\mysql-reset.sql" --console

echo [4/5] Waiting for MySQL to process reset file...
timeout /t 10

echo [5/5] Stopping temporary MySQL and starting service...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 2 >nul
net start MySQL80

del "%TEMP%\mysql-reset.sql"

echo.
echo ========================================
echo    Password Reset Complete!
echo ========================================
echo.
echo New MySQL root password: newpass123
echo.
echo Now testing connection...
pause

cd /d "%~dp0"
powershell -Command "$body = @{host='localhost'; port=3306; user='root'; password='newpass123'} | ConvertTo-Json; Invoke-RestMethod -Uri 'http://localhost:8080/setup' -Method Post -Body $body -ContentType 'application/json'"

pause
