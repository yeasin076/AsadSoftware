# MySQL Password Reset Guide

## Steps to Reset MySQL Password on Windows

1. **Stop MySQL Service:**
   ```powershell
   Stop-Service MySQL80
   # Or try: Stop-Service MySQL
   ```

2. **Start MySQL without password:**
   ```powershell
   mysqld --console --skip-grant-tables --shared-memory
   ```

3. **In a NEW terminal, connect to MySQL:**
   ```powershell
   mysql -u root
   ```

4. **Reset password:**
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword123';
   exit;
   ```

5. **Stop mysqld and restart service normally:**
   ```powershell
   Stop-Service MySQL80
   Start-Service MySQL80
   ```

## Option 2: Fresh MySQL Installation

Download from: https://dev.mysql.com/downloads/installer/

During installation, set root password: `root123`

## Option 3: Use XAMPP (Easiest)

1. Download XAMPP: https://www.apachefriends.org/
2. Install and start MySQL from control panel
3. Default: no password (leave DB_PASSWORD empty)
4. Access phpMyAdmin at http://localhost/phpmyadmin

---

**After resetting password, update the .env file with your new password!**
