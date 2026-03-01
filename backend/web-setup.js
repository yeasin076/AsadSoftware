const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve setup page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Database Setup</title>
      <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
        button { background: #4CAF50; color: white; padding: 15px; border: none; width: 100%; cursor: pointer; font-size: 16px; }
        button:hover { background: #45a049; }
        .success { color: green; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; margin: 10px 0; }
        .error { color: red; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; margin: 10px 0; }
        label { font-weight: bold; display: block; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>📦 Phone Inventory - Database Setup</h1>
      <p>Enter your MySQL credentials to set up the database:</p>
      
      <form id="setupForm">
        <label>MySQL Host:</label>
        <input type="text" name="host" value="localhost" required>
        
        <label>MySQL Port:</label>
        <input type="number" name="port" value="3306" required>
        
        <label>MySQL Username:</label>
        <input type="text" name="user" value="root" required>
        
        <label>MySQL Password:</label>
        <input type="password" name="password" placeholder="Leave empty if no password">
        
        <button type="submit">🚀 Setup Database</button>
      </form>
      
      <div id="result"></div>
      
      <script>
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = Object.fromEntries(formData);
          
          document.getElementById('result').innerHTML = '<p>⏳ Setting up database...</p>';
          
          try {
            const response = await fetch('/setup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
              document.getElementById('result').innerHTML = \`
                <div class="success">
                  <h3>✅ Database Setup Complete!</h3>
                  <p>\${result.message}</p>
                  <p><strong>Default Login:</strong></p>
                  <p>Username: admin<br>Password: admin123</p>
                  <p><strong>Your .env file has been updated!</strong></p>
                  <p>Now run: <code>npm run dev</code> in the backend folder</p>
                </div>
              \`;
            } else {
              document.getElementById('result').innerHTML = \`
                <div class="error">
                  <h3>❌ Setup Failed</h3>
                  <p>\${result.message}</p>
                  <p>Please check your credentials and try again.</p>
                </div>
              \`;
            }
          } catch (error) {
            document.getElementById('result').innerHTML = \`
              <div class="error">
                <h3>❌ Connection Error</h3>
                <p>\${error.message}</p>
              </div>
            \`;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Setup endpoint
app.post('/setup', async (req, res) => {
  const { host, port, user, password } = req.body;
  
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: host || 'localhost',
      user: user || 'root',
      password: password || '',
      port: parseInt(port) || 3306,
      multipleStatements: true
    });

    console.log('✓ Connected to MySQL');

    // Read and execute SQL file
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'config', 'database.sql'),
      'utf8'
    );

    await connection.query(sqlFile);
    console.log('✓ Database created');

    // Update .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = envContent.replace(/DB_HOST=.*/g, `DB_HOST=${host}`);
    envContent = envContent.replace(/DB_USER=.*/g, `DB_USER=${user}`);
    envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${password}`);
    envContent = envContent.replace(/DB_PORT=.*/g, `DB_PORT=${port}`);
    
    fs.writeFileSync(envPath, envContent);
    console.log('✓ .env file updated');

    await connection.end();

    res.json({
      success: true,
      message: 'Database setup completed successfully! You can now start the backend server.'
    });

  } catch (error) {
    console.error('Setup failed:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`\n🌐 Database Setup Page: http://localhost:${PORT}`);
  console.log('Open this URL in your browser to complete setup\n');
});
