const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config();

console.log('Testing database connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);

async function testConnection() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        console.log('Created SQL client');

        const result = await sql`SELECT 1 as test`;
        console.log('Database connection successful:', result);

        // Test if tables exist
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('Tables in database:', tables);

    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection();