const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function seed() {
    console.log("⏳ Starting Database Seeding...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'safs_db',
            multipleStatements: true // Allows running the whole file at once
        });

        // Path to the seed file
        const seedPath = path.join(__dirname, 'database', 'seed.sql');
        const sql = fs.readFileSync(seedPath, 'utf8');

        await connection.query(sql);
        console.log("✅ Data Seeded Successfully!");
        console.log("Records added for Users, Tanks, Sensors, and Readings.");
        
        await connection.end();
    } catch (error) {
        console.error("❌ Seeding Failed:", error.message);
        console.log("Make sure your .env file has the correct DB_NAME and your MySQL server is running.");
    }
}

seed();