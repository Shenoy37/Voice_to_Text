import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/lib/security';
import { validateRequestBody } from '@/lib/security';
import { z } from 'zod';

// Test schemas
const testTranscriptionSchema = z.object({
    audioUrl: z.string().url().optional(),
    testMode: z.enum(['mock', 'integration']).default('mock'),
});

const testUploadSchema = z.object({
    fileName: z.string().optional(),
    fileSize: z.number().int().min(1).max(50 * 1024 * 1024).optional(), // Max 50MB
    testMode: z.enum(['mock', 'integration']).default('mock'),
});

const testQueueSchema = z.object({
    action: z.enum(['add', 'process', 'stats', 'clear']).default('stats'),
    itemType: z.enum(['transcription', 'summarization', 'processing']).optional(),
    priority: z.number().int().min(1).max(10).optional(),
});

// GET - Run API tests
export async function GET(request: NextRequest) {
    try {
        // Apply security middleware (no auth required for tests)
        const securityResult = await securityMiddleware(request, {
            requireAuth: false,
            allowedContentTypes: ['application/json', 'text/plain'],
        });

        if (!securityResult.success) {
            return securityResult.response!;
        }

        const { searchParams } = new URL(request.url);
        const testType = searchParams.get('type') || 'health';

        switch (testType) {
            case 'health':
                return await runHealthCheck();
            case 'transcription':
                return await testTranscriptionAPI();
            case 'upload':
                return await testUploadAPI();
            case 'queue':
                return await testQueueAPI();
            case 'security':
                return await testSecurityMiddleware();
            case 'database':
                return await testDatabaseConnection();
            case 'all':
                return await runAllTests();
            default:
                return NextResponse.json({
                    success: false,
                    error: 'Unknown test type',
                    availableTests: ['health', 'transcription', 'upload', 'queue', 'security', 'database', 'all'],
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Test API error:', error);
        return NextResponse.json(
            {
                error: 'Test execution failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// POST - Run specific test with parameters
export async function POST(request: NextRequest) {
    try {
        // Apply security middleware
        const securityResult = await securityMiddleware(request, {
            requireAuth: false,
            allowedContentTypes: ['application/json'],
        });

        if (!securityResult.success) {
            return securityResult.response!;
        }

        const { searchParams } = new URL(request.url);
        const testType = searchParams.get('type') || 'health';

        switch (testType) {
            case 'transcription':
                return await runTranscriptionTest(request);
            case 'upload':
                return await runUploadTest(request);
            case 'queue':
                return await runQueueTest(request);
            default:
                return NextResponse.json({
                    success: false,
                    error: 'Unknown test type',
                    availableTests: ['transcription', 'upload', 'queue'],
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Test POST API error:', error);
        return NextResponse.json(
            {
                error: 'Test execution failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Health check test
async function runHealthCheck() {
    const startTime = Date.now();

    try {
        // Test database connection
        const { checkDatabaseHealth } = await import('@/lib/database');
        const dbHealth = await checkDatabaseHealth();

        // Test MCP server
        const mcpResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp-transcribe?serverStatus=true`,
            { method: 'GET' }
        );

        let mcpHealth = { status: 'unhealthy' as const };
        if (mcpResponse.ok) {
            const mcpResult = await mcpResponse.json();
            mcpHealth = mcpResult.success ? mcpResult.data : { status: 'unhealthy' };
        }

        const responseTime = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            data: {
                status: 'healthy',
                responseTime,
                services: {
                    database: dbHealth,
                    mcp: mcpHealth,
                    api: { status: 'healthy' },
                },
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

// Test transcription API
async function testTranscriptionAPI() {
    try {
        // Test GET endpoint
        const getStatusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transcribe`,
            { method: 'GET' }
        );

        // Test POST endpoint with mock data
        const postResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/transcribe`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Test Transcription',
                    content: 'Test content for transcription',
                    language: 'en',
                    generateSummary: true,
                }),
            }
        );

        return NextResponse.json({
            success: true,
            data: {
                endpoints: {
                    get: {
                        status: getStatusResponse.ok,
                        statusText: getStatusResponse.statusText,
                    },
                    post: {
                        status: postResponse.ok,
                        statusText: postResponse.statusText,
                    },
                },
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Transcription API test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Test upload API
async function testUploadAPI() {
    try {
        // Test GET endpoint
        const getResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload`,
            { method: 'GET' }
        );

        // Test upload configuration
        const configResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload`,
            { method: 'GET' }
        );

        return NextResponse.json({
            success: true,
            data: {
                endpoints: {
                    get: {
                        status: getResponse.ok,
                        statusText: getResponse.statusText,
                    },
                    config: {
                        status: configResponse.ok,
                        statusText: configResponse.statusText,
                    },
                },
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Upload API test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Test queue API
async function testQueueAPI() {
    try {
        // Test queue status
        const statusResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/queue?action=stats`,
            { method: 'GET' }
        );

        // Test queue items
        const itemsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/queue?action=items`,
            { method: 'GET' }
        );

        return NextResponse.json({
            success: true,
            data: {
                endpoints: {
                    status: {
                        status: statusResponse.ok,
                        statusText: statusResponse.statusText,
                    },
                    items: {
                        status: itemsResponse.ok,
                        statusText: itemsResponse.statusText,
                    },
                },
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Queue API test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Test security middleware
async function testSecurityMiddleware() {
    try {
        const tests = [
            {
                name: 'Rate Limiting',
                test: async () => {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test`,
                        { method: 'GET' }
                    );

                    // Make multiple requests to test rate limiting
                    const promises = Array(10).fill(null).map(() =>
                        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test`, { method: 'GET' })
                    );

                    const results = await Promise.allSettled(promises);
                    const rejected = results.filter(r => r.status === 'rejected').length;

                    return {
                        passed: rejected > 0, // Some should be rejected due to rate limiting
                        message: `Rate limiting test: ${rejected > 0 ? 'PASSED' : 'FAILED'}`,
                    };
                },
            },
            {
                name: 'CORS Headers',
                test: async () => {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test`,
                        {
                            method: 'GET',
                            headers: { Origin: 'https://example.com' }
                        }
                    );

                    const corsHeader = response.headers.get('access-control-allow-origin');

                    return {
                        passed: corsHeader !== null,
                        message: `CORS test: ${corsHeader ? 'PASSED' : 'FAILED'}`,
                    };
                },
            },
            {
                name: 'Input Validation',
                test: async () => {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ invalid: '<script>alert("xss")</script>' }),
                        }
                    );

                    const result = await response.json();

                    return {
                        passed: result.error !== undefined,
                        message: `Input validation test: ${result.error ? 'PASSED' : 'FAILED'}`,
                    };
                },
            },
        ];

        const results = await Promise.allSettled(
            tests.map(test => test.test())
        );

        const testResults = results.map((result, index) => ({
            name: tests[index].name,
            status: result.status === 'fulfilled' ? result.value : { passed: false, message: 'Test failed' },
        }));

        return NextResponse.json({
            success: true,
            data: {
                tests: testResults,
                passedCount: testResults.filter(t => t.status.passed).length,
                totalCount: testResults.length,
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Security middleware test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Test database connection
async function testDatabaseConnection() {
    try {
        const { db, checkDatabaseHealth } = await import('@/lib/database');
        const health = await checkDatabaseHealth();

        return NextResponse.json({
            success: health.status === 'healthy',
            data: {
                status: health.status,
                latency: health.latency,
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Database connection test failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Run all tests
async function runAllTests() {
    const startTime = Date.now();

    try {
        const [
            healthResult,
            transcriptionResult,
            uploadResult,
            queueResult,
            securityResult,
            databaseResult,
        ] = await Promise.allSettled([
            runHealthCheck(),
            testTranscriptionAPI(),
            testUploadAPI(),
            testQueueAPI(),
            testSecurityMiddleware(),
            testDatabaseConnection(),
        ]);

        const results: any = {
            health: healthResult.status === 'fulfilled' ? healthResult.value : { success: false },
            transcription: transcriptionResult.status === 'fulfilled' ? transcriptionResult.value : { success: false },
            upload: uploadResult.status === 'fulfilled' ? uploadResult.value : { success: false },
            queue: queueResult.status === 'fulfilled' ? queueResult.value : { success: false },
            security: securityResult.status === 'fulfilled' ? securityResult.value : { success: false },
            database: databaseResult.status === 'fulfilled' ? databaseResult.value : { success: false },
        };

        const totalExecutionTime = Date.now() - startTime;
        const passedTests = Object.values(results).filter((r: any) =>
            r && r.success === true
        ).length;
        const totalTests = Object.keys(results).length;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalTests,
                    passedTests,
                    failedTests: totalTests - passedTests,
                    successRate: Math.round((passedTests / totalTests) * 100),
                    totalExecutionTime,
                },
                results,
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'All tests execution failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}

// Run specific transcription test
async function runTranscriptionTest(request: NextRequest) {
    const validation = await validateRequestBody(request, testTranscriptionSchema);

    if (!validation.success) {
        return NextResponse.json({
            success: false,
            error: 'Invalid test parameters',
            details: validation.details,
        }, { status: 400 });
    }

    const testData = validation.data as z.infer<typeof testTranscriptionSchema>;
    const testMode = testData.testMode || 'mock';

    if (testMode === 'mock') {
        // Mock transcription test
        return NextResponse.json({
            success: true,
            data: {
                message: 'Mock transcription test completed',
                mockData: {
                    transcription: 'This is a mock transcription result',
                    summary: 'This is a mock summary',
                    duration: 120,
                },
                timestamp: new Date().toISOString(),
            },
        });
    }

    // Integration test would actually call the transcription API
    return NextResponse.json({
        success: true,
        data: {
            message: 'Integration test mode - would call actual transcription API',
            timestamp: new Date().toISOString(),
        },
    });
}

// Run specific upload test
async function runUploadTest(request: NextRequest) {
    const validation = await validateRequestBody(request, testUploadSchema);

    if (!validation.success) {
        return NextResponse.json({
            success: false,
            error: 'Invalid test parameters',
            details: validation.details,
        }, { status: 400 });
    }

    const uploadTestData = validation.data as z.infer<typeof testUploadSchema>;
    const testMode = uploadTestData.testMode || 'mock';

    if (testMode === 'mock') {
        // Mock upload test
        return NextResponse.json({
            success: true,
            data: {
                message: 'Mock upload test completed',
                mockData: {
                    filename: 'test-audio.webm',
                    size: 1024 * 1024, // 1MB
                    type: 'audio/webm',
                    url: '/uploads/test-audio.webm',
                },
                timestamp: new Date().toISOString(),
            },
        });
    }

    return NextResponse.json({
        success: true,
        data: {
            message: 'Integration test mode - would call actual upload API',
            timestamp: new Date().toISOString(),
        },
    });
}

// Run specific queue test
async function runQueueTest(request: NextRequest) {
    const validation = await validateRequestBody(request, testQueueSchema);

    if (!validation.success) {
        return NextResponse.json({
            success: false,
            error: 'Invalid test parameters',
            details: validation.details,
        }, { status: 400 });
    }

    const queueTestData = validation.data as z.infer<typeof testQueueSchema>;
    const action = queueTestData.action || 'stats';

    switch (action) {
        case 'add':
            return NextResponse.json({
                success: true,
                data: {
                    message: 'Mock queue item added',
                    itemId: `test-item-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                },
            });
        case 'process':
            return NextResponse.json({
                success: true,
                data: {
                    message: 'Mock queue processing triggered',
                    timestamp: new Date().toISOString(),
                },
            });
        case 'clear':
            return NextResponse.json({
                success: true,
                data: {
                    message: 'Mock queue cleared',
                    timestamp: new Date().toISOString(),
                },
            });
        default:
            const { getQueueStats } = await import('@/app/api/queue/route');
            const stats = getQueueStats();

            return NextResponse.json({
                success: true,
                data: {
                    message: 'Queue stats retrieved',
                    stats,
                    timestamp: new Date().toISOString(),
                },
            });
    }
}