const mysql = require('mysql2/promise');

// Create a reusable connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',       // Replace with your MySQL username
    password: 'magudi',       // Replace with your MySQL password
    database: 'sample_erp', // Replace with your database name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection right away

module.exports = pool;
