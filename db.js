const mysql = require('mysql2/promise');

// Create a reusable connection pool
const pool = mysql.createPool({
    host: 'mysql-320a721-rajeevmagudi-4817.c.aivencloud.com',
    user: 'avnadmin',       
    password: 'AVNS_alxpjo8j1_KQWnv2lqL',       
    database: 'defaultdb', 
    port: 12872, // It is good practice to explicitly include your port
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true // Enforces the secure SSL mode required by Aiven
    }
});

// Test the connection right away

module.exports = pool;
