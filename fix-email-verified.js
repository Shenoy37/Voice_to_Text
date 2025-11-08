const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function fixEmailVerifiedColumn() {
    try {
        const sql = neon(process.env.DATABASE_URL);

        console.log('Adding email_verified column to users table...');

        // Add the email_verified column if it doesn't exist
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`;

        console.log('email_verified column added successfully!');

    } catch (error) {
        console.error('Error adding email_verified column:', error);
    }
}

fixEmailVerifiedColumn();