const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...\n');
    
    // Prompt for password if not provided
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    let password = process.env.DB_PASSWORD || '';
    
    if (!password && !process.argv[2]) {
      password = await new Promise(resolve => {
        readline.question('Enter MySQL root password (press Enter if none): ', answer => {
          readline.close();
          resolve(answer);
        });
      });
    } else if (process.argv[2]) {
      password = process.argv[2];
    }

    // Connect without database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: password,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✓ Connected to MySQL server');

    // Read SQL file
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'config', 'database.sql'),
      'utf8'
    );

    // Execute SQL file
    await connection.query(sqlFile);
    console.log('✓ Database and tables created successfully');
    console.log('✓ Sample data inserted\n');

    console.log('✅ Database setup complete!\n');
    console.log('Default admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
