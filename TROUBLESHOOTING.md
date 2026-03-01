# Troubleshooting Guide

Common issues and their solutions for Asad's Inventory.

---

## 🔴 Database Issues

### Issue: Database Connection Failed

**Error:**
```
✗ Database connection failed: connect ECONNREFUSED
```

**Solutions:**

1. **Verify MySQL is running:**
   ```bash
   # Check MySQL status
   mysql --version
   
   # Try connecting manually
   mysql -u root -p
   ```

2. **Check database credentials in `.env`:**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_actual_password
   DB_NAME=phone_inventory
   ```

3. **Verify database exists:**
   ```sql
   SHOW DATABASES;
   ```
   If `phone_inventory` doesn't exist, run:
   ```bash
   mysql -u root -p < backend/config/database.sql
   ```

4. **Check MySQL is listening on correct port:**
   - Default MySQL port is 3306
   - Update `DB_HOST` if using custom port: `localhost:3307`

---

### Issue: Access Denied for User

**Error:**
```
ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```

**Solutions:**

1. **Reset MySQL password:**
   ```bash
   # Stop MySQL
   # Start in safe mode
   # Reset password
   ```

2. **Create new MySQL user:**
   ```sql
   CREATE USER 'phoneadmin'@'localhost' IDENTIFIED BY 'password123';
   GRANT ALL PRIVILEGES ON phone_inventory.* TO 'phoneadmin'@'localhost';
   FLUSH PRIVILEGES;
   ```
   
   Then update `.env`:
   ```env
   DB_USER=phoneadmin
   DB_PASSWORD=password123
   ```

---

### Issue: Table Doesn't Exist

**Error:**
```
ER_NO_SUCH_TABLE: Table 'phone_inventory.users' doesn't exist
```

**Solution:**

Run the database setup script:
```bash
mysql -u root -p phone_inventory < backend/config/database.sql
```

Or manually execute the SQL:
```bash
mysql -u root -p
USE phone_inventory;
SOURCE backend/config/database.sql
```

---

## 🔴 Backend Issues

### Issue: Port 5000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

1. **Kill process on port 5000:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Or use npx
   npx kill-port 5000
   ```

2. **Change port in `.env`:**
   ```env
   PORT=5001
   ```

---

### Issue: Module Not Found

**Error:**
```
Error: Cannot find module 'express'
```

**Solution:**

Install dependencies:
```bash
cd backend
npm install
```

If issue persists:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue: JWT Secret Not Set

**Error:**
```
JWT_SECRET is not defined
```

**Solution:**

1. Copy environment template:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and set JWT_SECRET:
   ```env
   JWT_SECRET=your_very_secure_random_secret_key_here
   ```

---

### Issue: CORS Error

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

1. **Verify backend is running on correct port (5000)**

2. **Check CORS configuration in `server.js`:**
   ```javascript
   app.use(cors());
   ```

3. **If using custom frontend URL, update CORS:**
   ```javascript
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true
   }));
   ```

---

## 🔴 Frontend Issues

### Issue: Port 3000 Already in Use

**Error:**
```
Port 3000 is already in use
```

**Solutions:**

1. **Kill process on port 3000:**
   ```bash
   # Windows
   npx kill-port 3000
   ```

2. **Use different port:**
   - Vite will automatically suggest next available port
   - Press 'y' to use suggested port

---

### Issue: Module Not Found (Frontend)

**Error:**
```
Cannot find module 'react'
```

**Solution:**

```bash
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

---

### Issue: Blank White Screen

**Possible Causes & Solutions:**

1. **Check browser console for errors**
   - Press F12 to open DevTools
   - Look for error messages

2. **Verify backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Clear browser cache:**
   - Ctrl + Shift + Del
   - Clear cached files

4. **Check API URL in frontend:**
   - Verify proxy in `vite.config.js`
   - Check API base URL in `src/utils/api.js`

---

### Issue: API Calls Failing

**Error in console:**
```
Network Error / 404 Not Found / 500 Internal Server Error
```

**Solutions:**

1. **Verify backend is running:**
   ```bash
   # Should see: Server running on port 5000
   ```

2. **Check API URL:**
   - Default: `http://localhost:5000/api`
   - Verify in `src/utils/api.js`

3. **Check token is being sent:**
   - Open DevTools → Network tab
   - Click on request
   - Check Headers → Authorization

4. **Verify endpoint exists:**
   - Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## 🔴 Authentication Issues

### Issue: Cannot Login

**Error:**
```
Invalid credentials
```

**Solutions:**

1. **Use correct default credentials:**
   - Username: `admin`
   - Password: `admin123`

2. **Verify user exists in database:**
   ```sql
   USE phone_inventory;
   SELECT * FROM users WHERE username = 'admin';
   ```

3. **If user doesn't exist, re-run database setup:**
   ```bash
   mysql -u root -p < backend/config/database.sql
   ```

---

### Issue: Token Expired

**Error:**
```
Token expired
```

**Solution:**

1. **Login again to get new token**
   - Token expires after 7 days by default

2. **Change expiration in `.env`:**
   ```env
   JWT_EXPIRE=30d  # 30 days
   ```

---

### Issue: Unauthorized (401)

**Error:**
```
Access denied. No token provided.
```

**Solutions:**

1. **Login again**
   - Token might have expired
   - Token might be invalid

2. **Clear localStorage and login:**
   - Open DevTools → Application → Local Storage
   - Clear all data
   - Login again

---

## 🔴 Installation Issues

### Issue: Node.js Not Found

**Error:**
```
'node' is not recognized as an internal or external command
```

**Solution:**

1. **Install Node.js:**
   - Download from [nodejs.org](https://nodejs.org)
   - Install LTS version (v16 or higher)
   - Restart terminal

2. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

---

### Issue: MySQL Not Found

**Error:**
```
'mysql' is not recognized as an internal or external command
```

**Solution:**

1. **Install MySQL:**
   - Download from [mysql.com](https://dev.mysql.com/downloads/installer/)
   - Install MySQL Server 8.0+
   
2. **Add MySQL to PATH:**
   - Windows: Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to PATH
   - Restart terminal

3. **Verify installation:**
   ```bash
   mysql --version
   ```

---

### Issue: npm install Fails

**Error:**
```
npm ERR! code EACCES
```

**Solutions:**

1. **Run as administrator (Windows)**

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   npm install
   ```

3. **Delete node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 🔴 Build/Production Issues

### Issue: Build Fails

**Error:**
```
Build failed with errors
```

**Solutions:**

1. **Check for TypeScript/ESLint errors:**
   - Fix all code errors first

2. **Clear build cache:**
   ```bash
   cd frontend
   rm -rf dist .vite
   npm run build
   ```

3. **Verify all dependencies installed:**
   ```bash
   npm install
   ```

---

### Issue: Environment Variables Not Working

**Problem:**
Environment variables not loading in production

**Solutions:**

1. **For backend (.env):**
   - Ensure `.env` file exists
   - Verify `dotenv` is loaded: `require('dotenv').config()`

2. **For frontend (Vite):**
   - Use `VITE_` prefix: `VITE_API_URL`
   - Access with `import.meta.env.VITE_API_URL`

---

## 🔴 Common Errors

### Issue: Duplicate Entry (IMEI)

**Error:**
```
Duplicate entry. Record already exists.
```

**Solution:**

Each phone must have a unique IMEI number. Use a different IMEI or update the existing record.

---

### Issue: Foreign Key Constraint Failed

**Error:**
```
Cannot add or update a child row: a foreign key constraint fails
```

**Solution:**

Ensure the phone exists before creating a sale. Check `phone_id` is valid.

---

### Issue: Cannot Sell Already Sold Phone

**Error:**
```
Phone not found or already sold
```

**Solution:**

The phone status is already "Sold". You can only sell phones with status "In Stock".

---

## 🔧 Debugging Tips

### Enable Debug Mode

**Backend:**
```javascript
// In server.js, add:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

**Frontend:**
```javascript
// In src/utils/api.js, add:
api.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});
```

---

### Check Logs

**Backend Logs:**
- Console output from `npm run dev`
- Look for error stack traces

**Frontend Logs:**
- Browser DevTools → Console
- Look for React errors, API errors

**Database Logs:**
- MySQL error logs
- Check query syntax

---

### Test API with Postman/Insomnia

1. Import API endpoints
2. Test each endpoint individually
3. Check request/response

---

### Verify Database Data

```sql
USE phone_inventory;

-- Check users
SELECT * FROM users;

-- Check phones
SELECT * FROM phones;

-- Check sales
SELECT * FROM sales;

-- Check relations
SELECT s.*, p.brand, p.model 
FROM sales s 
JOIN phones p ON s.phone_id = p.id;
```

---

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the logs** for detailed error messages
2. **Review [README.md](README.md)** for setup instructions
3. **Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)** for API details
4. **Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** for architecture

---

## 🔄 Fresh Install

If all else fails, start fresh:

```bash
# 1. Drop database
mysql -u root -p
DROP DATABASE phone_inventory;
EXIT;

# 2. Recreate database
mysql -u root -p < backend/config/database.sql

# 3. Reinstall backend
cd backend
rm -rf node_modules package-lock.json
npm install

# 4. Reinstall frontend
cd ../frontend
rm -rf node_modules package-lock.json dist
npm install

# 5. Start servers
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev
```

---

**Last Updated:** March 1, 2026
