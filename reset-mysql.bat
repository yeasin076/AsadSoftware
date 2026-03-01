@echo off
echo Stopping MySQL service...
net stop MySQL80

echo Starting MySQL in safe mode...
start "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --shared-memory

timeout /t 5

echo Connecting to MySQL and resetting password...
echo FLUSH PRIVILEGES; > reset.sql
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpass123'; >> reset.sql
echo exit >> reset.sql

mysql -u root < reset.sql
del reset.sql

echo Restarting MySQL normally...
taskkill /F /IM mysqld.exe
net start MySQL80

echo.
echo Password reset complete!
echo New password: newpass123
echo.
echo Update your .env file:
echo DB_PASSWORD=newpass123
pause
