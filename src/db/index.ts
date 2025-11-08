import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Re-export database utilities for convenience
export { checkDatabaseHealth, getConnectionPoolStats, QueryOptimizer } from '@/lib/database';
export type { User, Note, NewUser, NewNote } from './schema';