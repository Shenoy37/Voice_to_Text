import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, {
    count: number;
    resetTime: number;
}>();

// Security configuration
const SECURITY_CONFIG = {
    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // Max requests per window
    },

    // File upload limits
    upload: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
            'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a',
            'audio/wav', 'audio/webm', 'audio/flac', 'audio/aac', 'audio/ogg',
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'text/plain', 'text/markdown', 'application/pdf'
        ],
        maxFilesPerRequest: 5,
    },

    // Request validation
    request: {
        maxPayloadSize: 10 * 1024 * 1024, // 10MB
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedOrigins: [
            'http://localhost:3000',
            'https://localhost:3000',
            process.env.NEXT_PUBLIC_APP_URL,
        ].filter(Boolean) as string[],
    },

    // Content Security Policy
    csp: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'", 'ws:', 'wss:'],
    },
};

// Rate limiting middleware
export function rateLimit(identifier: string, options: {
    windowMs?: number;
    maxRequests?: number;
} = {}) {
    const {
        windowMs = SECURITY_CONFIG.rateLimit.windowMs,
        maxRequests = SECURITY_CONFIG.rateLimit.maxRequests,
    } = options;

    const now = Date.now();
    const key = identifier;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        // Create new record
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { allowed: true, remaining: maxRequests - 1 };
    }

    if (record.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: record.resetTime,
        };
    }

    // Increment count
    record.count++;
    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime,
    };
}

// Validate request method
export function validateMethod(request: NextRequest): boolean {
    return SECURITY_CONFIG.request.allowedMethods.includes(request.method);
}

// Validate request origin
export function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!origin && !referer) {
        return true; // Allow same-origin requests
    }

    const checkOrigin = (url: string | null) => {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return SECURITY_CONFIG.request.allowedOrigins.includes(urlObj.origin);
        } catch {
            return false;
        }
    };

    return checkOrigin(origin) || checkOrigin(referer);
}

// Validate content type
export function validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type');
    if (!contentType) return false;

    return allowedTypes.some(type => contentType.includes(type));
}

// Validate file upload
export function validateFileUpload(file: File): {
    valid: boolean;
    error?: string;
} {
    // Check file size
    if (file.size > SECURITY_CONFIG.upload.maxFileSize) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed size of ${SECURITY_CONFIG.upload.maxFileSize / 1024 / 1024}MB`,
        };
    }

    // Check file type
    if (!SECURITY_CONFIG.upload.allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} is not allowed`,
        };
    }

    // Check file name for suspicious patterns
    const fileName = file.name.toLowerCase();
    const suspiciousPatterns = [
        /\.(exe|bat|cmd|scr|pif|com)$/i,
        /\.\./,
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(fileName)) {
            return {
                valid: false,
                error: 'File name contains suspicious patterns',
            };
        }
    }

    return { valid: true };
}

// Sanitize input data
export function sanitizeInput(data: unknown): unknown {
    if (typeof data === 'string') {
        return data
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }

    if (Array.isArray(data)) {
        return data.map(sanitizeInput);
    }

    if (typeof data === 'object' && data !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[sanitizeInput(key) as string] = sanitizeInput(value);
        }
        return sanitized;
    }

    return data;
}

// Validate and sanitize request body with Zod schema
export async function validateRequestBody<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    details?: z.ZodIssue[];
}> {
    try {
        const body = await request.json();
        const sanitizedBody = sanitizeInput(body);
        const result = schema.safeParse(sanitizedBody);

        if (result.success) {
            return { success: true, data: result.data };
        } else {
            return {
                success: false,
                error: 'Invalid request body',
                details: result.error.issues,
            };
        }
    } catch (error) {
        return {
            success: false,
            error: 'Invalid JSON in request body',
        };
    }
}

// Authentication middleware
export async function requireAuth(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user?.id) {
            return {
                authenticated: false,
                error: 'Authentication required',
                userId: null,
            };
        }

        return {
            authenticated: true,
            userId: session.user.id,
            user: session.user,
        };
    } catch (error) {
        return {
            authenticated: false,
            error: 'Authentication error',
            userId: null,
        };
    }
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    const cspDirectives = Object.entries(SECURITY_CONFIG.csp)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');

    response.headers.set('Content-Security-Policy', cspDirectives);

    // Other security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Remove server information
    response.headers.set('Server', '');

    return response;
}

// CORS middleware
export function handleCORS(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');

    if (origin && SECURITY_CONFIG.request.allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Methods', SECURITY_CONFIG.request.allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

    return response;
}

// Request size validation
export function validateRequestSize(request: NextRequest): boolean {
    const contentLength = request.headers.get('content-length');
    if (!contentLength) return true; // No content length header

    const size = parseInt(contentLength, 10);
    return size <= SECURITY_CONFIG.request.maxPayloadSize;
}

// IP-based rate limiting
export function getClientIdentifier(request: NextRequest): string {
    // Try to get real IP (behind proxy)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
        return realIp;
    }

    return ip || 'unknown';
}

// Comprehensive security middleware
export async function securityMiddleware(
    request: NextRequest,
    options: {
        requireAuth?: boolean;
        allowedMethods?: string[];
        allowedContentTypes?: string[];
        rateLimitOptions?: {
            windowMs?: number;
            maxRequests?: number;
        };
    } = {}
): Promise<{
    success: boolean;
    response?: NextResponse;
    userId?: string;
}> {
    const {
        requireAuth: shouldRequireAuth = true,
        allowedMethods = SECURITY_CONFIG.request.allowedMethods,
        allowedContentTypes = ['application/json', 'multipart/form-data'],
        rateLimitOptions = {},
    } = options;

    // Validate request method
    if (!validateMethod(request)) {
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Method not allowed' },
                { status: 405 }
            ),
        };
    }

    // Validate origin
    if (!validateOrigin(request)) {
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Origin not allowed' },
                { status: 403 }
            ),
        };
    }

    // Validate content type for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type') || '';
        const isValidContentType = allowedContentTypes.some(type => contentType.includes(type));

        if (!isValidContentType) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: 'Content type not allowed' },
                    { status: 415 }
                ),
            };
        }
    }

    // Validate request size
    if (!validateRequestSize(request)) {
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Request payload too large' },
                { status: 413 }
            ),
        };
    }

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, rateLimitOptions);

    if (!rateLimitResult.allowed) {
        return {
            success: false,
            response: NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    resetTime: rateLimitResult.resetTime,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': String(rateLimitOptions.maxRequests || SECURITY_CONFIG.rateLimit.maxRequests),
                        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                        'X-RateLimit-Reset': String(rateLimitResult.resetTime),
                    },
                }
            ),
        };
    }

    // Authentication
    if (shouldRequireAuth) {
        const authResult = await requireAuth(request);

        if (!authResult.authenticated) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: authResult.error },
                    { status: 401 }
                ),
            };
        }

        return {
            success: true,
            userId: authResult.userId || undefined,
        };
    }

    return { success: true };
}

// Export security configuration
export { SECURITY_CONFIG };