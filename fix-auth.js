const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createAuthTables() {
    try {
        console.log('Creating Better Auth tables...');

        // Create accounts table
        await sql`
          CREATE TABLE IF NOT EXISTS accounts (
            id text PRIMARY KEY NOT NULL,
            user_id text NOT NULL,
            account_id text NOT NULL,
            provider_id text NOT NULL,
            access_token text,
            refresh_token text,
            id_token text,
            access_token_expires_at timestamp with time zone,
            refresh_token_expires_at timestamp with time zone,
            scope text,
            password text,
            created_at timestamp with time zone DEFAULT now() NOT NULL,
            updated_at timestamp with time zone DEFAULT now() NOT NULL,
            CONSTRAINT accounts_provider_id_account_id_unique UNIQUE(provider_id, account_id)
          );
        `;

        // Create sessions table
        await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        token text NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        ip_address text,
        user_agent text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT sessions_token_unique UNIQUE(token)
      );
    `;

        // Create verifications table
        await sql`
      CREATE TABLE IF NOT EXISTS verifications (
        id text PRIMARY KEY NOT NULL,
        identifier text NOT NULL,
        value text NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `;

        // Create authenticators table
        await sql`
      CREATE TABLE IF NOT EXISTS authenticators (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        account_name text,
        credential_id text NOT NULL,
        credential_public_key text NOT NULL,
        counter integer NOT NULL,
        credential_device_type text,
        credential_backed_up boolean NOT NULL,
        transports text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT authenticators_credential_id_unique UNIQUE(credential_id)
      );
    `;

        // Add foreign key constraints
        try {
            await sql`
            ALTER TABLE accounts ADD CONSTRAINT accounts_user_id_users_id_fk
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;
          `;
        } catch (e) {
            console.log('Accounts FK constraint may already exist');
        }

        try {
            await sql`
            ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_users_id_fk
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;
          `;
        } catch (e) {
            console.log('Sessions FK constraint may already exist');
        }

        try {
            await sql`
            ALTER TABLE authenticators ADD CONSTRAINT authenticators_user_id_users_id_fk
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade ON UPDATE no action;
          `;
        } catch (e) {
            console.log('Authenticators FK constraint may already exist');
        }

        console.log('✅ Better Auth tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    }
}

createAuthTables();