import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

// Log environment variables for debugging
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);

// Create Neon database client
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Database health check
export async function checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
}> {
    try {
        const startTime = Date.now();
        await sql`SELECT 1`;
        const latency = Date.now() - startTime;

        return {
            status: 'healthy',
            latency,
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// Connection pool statistics
export function getConnectionPoolStats() {
    return {
        // Note: Neon doesn't expose detailed pool stats
        // This is a placeholder for monitoring
        totalConnections: 20, // Default max connections
        status: 'active',
    };
}

// Query optimization helper
class QueryOptimizer {
    // Pagination helper with optimized queries
    static paginate<T>(
        query: T,
        page: number = 1,
        limit: number = 10
    ) {
        const offset = (page - 1) * limit;
        const safeLimit = Math.min(limit, 100); // Max 100 items per page
        const safePage = Math.max(page, 1);

        return {
            query,
            offset: (safePage - 1) * safeLimit,
            limit: safeLimit,
        };
    }

    // Build efficient search query
    static buildSearchQuery(searchTerm: string, searchFields: string[]) {
        if (!searchTerm || searchFields.length === 0) {
            return null;
        }

        const terms = searchTerm.trim().split(/\s+/);
        const conditions = terms.map(term =>
            searchFields.map(field => `${field} ILIKE '%${term}%'`).join(' OR ')
        );

        return `(${conditions.map(condition => `(${condition})`).join(' AND ')})`;
    }

    // Get query execution time (for monitoring)
    static async timeQuery<T>(
        queryName: string,
        queryFn: () => Promise<T>
    ): Promise<{ result: T; executionTime: number }> {
        const startTime = Date.now();
        const result = await queryFn();
        const executionTime = Date.now() - startTime;

        // Log slow queries (more than 100ms)
        if (executionTime > 100) {
            console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);
        }

        return { result, executionTime };
    }
}

// Database migration helper
class MigrationHelper {
    // Check if migration is needed
    static async needsMigration(): Promise<boolean> {
        try {
            // Check if migrations table exists
            const result = await sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'drizzle_migrations'
                );
            `;

            return !result[0].exists;
        } catch (error) {
            console.error('Error checking migration status:', error);
            return true; // Assume migration is needed if we can't check
        }
    }

    // Get migration status
    static async getMigrationStatus() {
        try {
            const migrations = await sql`
                SELECT id, name, created_at 
                FROM drizzle_migrations 
                ORDER BY created_at DESC;
            `;

            return {
                hasMigrations: migrations.length > 0,
                lastMigration: migrations[0] || null,
                totalMigrations: migrations.length,
            };
        } catch (error) {
            console.error('Error getting migration status:', error);
            return {
                hasMigrations: false,
                lastMigration: null,
                totalMigrations: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

// Seed data helper
class SeedHelper {
    // Seed users with test data
    static async seedTestUsers() {
        try {
            const testUsers = [
                {
                    email: 'test@example.com',
                    name: 'Test User',
                },
                {
                    email: 'demo@example.com',
                    name: 'Demo User',
                },
            ];

            for (const user of testUsers) {
                await sql`
                    INSERT INTO users (email, name, created_at, updated_at)
                    VALUES (${user.email}, ${user.name}, NOW(), NOW())
                    ON CONFLICT (email) DO NOTHING;
                `;
            }

            console.log('Test users seeded successfully');
        } catch (error) {
            console.error('Error seeding test users:', error);
        }
    }

    // Seed sample notes
    static async seedSampleNotes() {
        try {
            // Get first user ID
            const userResult = await sql`SELECT id FROM users LIMIT 1`;
            if (userResult.length === 0) {
                console.log('No users found, skipping note seeding');
                return;
            }

            const userId = userResult[0].id;

            const sampleNotes = [
                {
                    title: 'Meeting Notes',
                    content: 'Discussed project timeline and deliverables for Q1.',
                    summary: 'Project planning meeting',
                    status: 'published',
                    user_id: userId,
                },
                {
                    title: 'Ideas for New Feature',
                    content: 'Consider adding voice commands and real-time collaboration.',
                    summary: 'Feature brainstorming session',
                    status: 'draft',
                    user_id: userId,
                },
            ];

            for (const note of sampleNotes) {
                await sql`
                    INSERT INTO notes (title, content, summary, status, user_id, created_at, updated_at)
                    VALUES (${note.title}, ${note.content}, ${note.summary}, ${note.status}, ${note.user_id}, NOW(), NOW())
                    ON CONFLICT DO NOTHING;
                `;
            }

            console.log('Sample notes seeded successfully');
        } catch (error) {
            console.error('Error seeding sample notes:', error);
        }
    }

    // Run all seed operations
    static async seedAll() {
        await this.seedTestUsers();
        await this.seedSampleNotes();
    }
}

// Database backup helper
class BackupHelper {
    // Create database backup (PostgreSQL specific)
    static async createBackup(backupName?: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = backupName || `backup-${timestamp}.sql`;

        // Note: This would require additional setup in production
        // For now, just return the filename
        console.log(`Backup would be created as: ${filename}`);

        return filename;
    }

    // Restore database from backup
    static async restoreFromBackup(backupFile: string): Promise<boolean> {
        // Note: This would require additional setup in production
        console.log(`Would restore from backup: ${backupFile}`);

        return true;
    }
}

// Performance monitoring
class PerformanceMonitor {
    // Get database performance metrics
    static async getPerformanceMetrics() {
        try {
            // Get connection stats
            const connectionStats = await sql`
                SELECT 
                    count(*) as total_connections,
                    count(*) FILTER (WHERE state = 'active') as active_connections,
                    count(*) FILTER (WHERE state = 'idle') as idle_connections
                FROM pg_stat_activity;
            `;

            // Get slow queries (if pg_stat_statements is available)
            let slowQueries: Array<{ query: string; calls: number; total_time: number; mean_time: number }> = [];
            try {
                const queryResult = await sql`
                    SELECT query, calls, total_time, mean_time
                    FROM pg_stat_statements
                    ORDER BY mean_time DESC
                    LIMIT 10;
                `;
                slowQueries = queryResult as Array<{ query: string; calls: number; total_time: number; mean_time: number }>;
            } catch (error) {
                // pg_stat_statements might not be available
                console.log('pg_stat_statements not available for slow query analysis');
            }

            return {
                connections: connectionStats[0],
                slowQueries: slowQueries.map((q: { query: string; calls: number; total_time: number; mean_time: number }) => ({
                    query: q.query.substring(0, 100) + '...',
                    calls: q.calls,
                    totalTime: q.total_time,
                    meanTime: q.mean_time,
                })),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error getting performance metrics:', error);
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
}

// Export all utilities
export {
    QueryOptimizer,
    MigrationHelper,
    SeedHelper,
    BackupHelper,
    PerformanceMonitor,
};

// Default export for convenience
export default {
    db,
    checkDatabaseHealth,
    getConnectionPoolStats,
    QueryOptimizer,
    MigrationHelper,
    SeedHelper,
    BackupHelper,
    PerformanceMonitor,
};