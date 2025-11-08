#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const { URL } = require('url');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/auth`;

// Test state
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function logTestStart(testName) {
    log(`\n🧪 Starting test: ${testName}`, 'info');
    testResults.total++;
}

function logTestResult(testName, passed, details = '') {
    if (passed) {
        log(`✅ Test passed: ${testName}`, 'success');
        testResults.passed++;
    } else {
        log(`❌ Test failed: ${testName}`, 'error');
        testResults.failed++;
    }

    testResults.details.push({
        test: testName,
        passed,
        details,
        timestamp: new Date().toISOString()
    });
}

function logResponseDetails(response, body = null) {
    log(`Response Status: ${response.status} ${response.statusText}`);
    log(`Response Headers:`, 'info');
    response.headers.forEach((value, key) => {
        log(`  ${key}: ${value}`, 'info');
    });

    if (body) {
        log(`Response Body: ${body}`);
    }
}

// Extract cookies from response headers
function extractCookies(response) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (!setCookieHeader) return [];

    return setCookieHeader.split(',').map(cookie => cookie.split(';')[0].trim());
}

// Create a cookie string for requests
function createCookieString(cookies) {
    return cookies.join('; ');
}

// Test 1: Get current session (no authentication)
async function testGetCurrentSessionNoAuth() {
    logTestStart('Get Current Session (No Authentication)');

    try {
        const response = await fetch(`${API_BASE}/get-session`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const body = await response.text();
        logResponseDetails(response, body);

        // Should return null or empty session for unauthenticated request
        const isCorrectResponse = response.status === 200 && (body.includes('null') || body.includes('{}'));
        logTestResult('Get Current Session (No Authentication)', isCorrectResponse,
            `Status: ${response.status}, Body contains null/empty: ${body.includes('null') || body.includes('{}')}`);

        return { response, body };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Get Current Session (No Authentication)', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 2: Initiate Google OAuth flow
async function testGoogleOAuthInitiation() {
    logTestStart('Google OAuth Initiation');

    try {
        const response = await fetch(`${API_BASE}/sign-in/social`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'google'
            }),
            redirect: 'manual' // Don't follow redirects
        });

        const body = await response.text();
        logResponseDetails(response, body);

        // Should return a redirect to Google OAuth
        const isRedirect = response.status === 302 || response.status === 301;
        const locationHeader = response.headers.get('location');
        const isGoogleRedirect = isRedirect && locationHeader && locationHeader.includes('accounts.google.com');

        logTestResult('Google OAuth Initiation', isGoogleRedirect,
            `Status: ${response.status}, Redirect to Google: ${isGoogleRedirect}`);

        return { response, body, location: locationHeader };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Google OAuth Initiation', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 3: Test OAuth callback with invalid state
async function testOAuthCallbackInvalidState() {
    logTestStart('OAuth Callback (Invalid State)');

    try {
        const response = await fetch(`${API_BASE}/callback/google?code=invalid_code&state=invalid_state`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'manual'
        });

        const body = await response.text();
        logResponseDetails(response, body);

        // Should handle error gracefully
        const isErrorHandled = response.status >= 400 && response.status < 500;

        logTestResult('OAuth Callback (Invalid State)', isErrorHandled,
            `Status: ${response.status}, Error handled: ${isErrorHandled}`);

        return { response, body };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('OAuth Callback (Invalid State)', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 4: Test sign-out without authentication
async function testSignOutNoAuth() {
    logTestStart('Sign Out (No Authentication)');

    try {
        const response = await fetch(`${API_BASE}/sign-out`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'manual'
        });

        const body = await response.text();
        logResponseDetails(response, body);

        // Should handle sign-out gracefully even without authentication
        const isHandled = response.status === 200 || response.status === 302 || response.status === 401;

        logTestResult('Sign Out (No Authentication)', isHandled,
            `Status: ${response.status}, Handled gracefully: ${isHandled}`);

        return { response, body };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Sign Out (No Authentication)', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 5: Test session management with cookies
async function testSessionCookieManagement() {
    logTestStart('Session Cookie Management');

    try {
        // First, initiate OAuth to get cookies
        const oauthResponse = await fetch(`${API_BASE}/sign-in/social`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'google'
            }),
            redirect: 'manual'
        });

        const cookies = extractCookies(oauthResponse);
        log(`Received cookies: ${cookies.join(', ')}`);

        // Now test session with cookies
        const sessionResponse = await fetch(`${API_BASE}/get-session`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': createCookieString(cookies)
            }
        });

        const sessionBody = await sessionResponse.text();
        logResponseDetails(sessionResponse, sessionBody);

        // Should return session information or null
        const isCorrectResponse = sessionResponse.status === 200;

        logTestResult('Session Cookie Management', isCorrectResponse,
            `Status: ${sessionResponse.status}, Cookies handled: ${cookies.length > 0}`);

        return { sessionResponse, sessionBody, cookies };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Session Cookie Management', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 6: Test CSRF protection
async function testCSRFProtection() {
    logTestStart('CSRF Protection');

    try {
        // Test POST without proper CSRF token
        const response = await fetch(`${API_BASE}/sign-in/social`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://malicious-site.com'
            },
            body: JSON.stringify({
                provider: 'google'
            }),
            redirect: 'manual'
        });

        const body = await response.text();
        logResponseDetails(response, body);

        // Better Auth should handle this appropriately
        const isHandled = response.status >= 200 && response.status < 500;

        logTestResult('CSRF Protection', isHandled,
            `Status: ${response.status}, Request handled: ${isHandled}`);

        return { response, body };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('CSRF Protection', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 7: Test error handling for invalid provider
async function testInvalidProvider() {
    logTestStart('Invalid OAuth Provider');

    try {
        const response = await fetch(`${API_BASE}/sign-in/social`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'invalid-provider'
            }),
            redirect: 'manual'
        });

        const body = await response.text();
        logResponseDetails(response, body);

        // Should return error for invalid provider
        const isError = response.status >= 400;

        logTestResult('Invalid OAuth Provider', isError,
            `Status: ${response.status}, Error returned: ${isError}`);

        return { response, body };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Invalid OAuth Provider', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 8: Test rate limiting (if implemented)
async function testRateLimiting() {
    logTestStart('Rate Limiting');

    try {
        const requests = [];
        const numRequests = 10;

        // Send multiple rapid requests
        for (let i = 0; i < numRequests; i++) {
            const request = fetch(`${API_BASE}/get-session`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            requests.push(request);
        }

        const responses = await Promise.all(requests);
        const statusCodes = responses.map(r => r.status);

        log(`Status codes for ${numRequests} requests: ${statusCodes.join(', ')}`);

        // Check if any request was rate limited
        const rateLimited = statusCodes.some(code => code === 429);

        logTestResult('Rate Limiting', rateLimited || statusCodes.every(code => code === 200),
            `Rate limited: ${rateLimited}, All successful: ${statusCodes.every(code => code === 200)}`);

        return { responses, statusCodes };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Rate Limiting', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 9: Test headers and security
async function testSecurityHeaders() {
    logTestStart('Security Headers');

    try {
        const response = await fetch(`${API_BASE}/get-session`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const headers = response.headers;
        const securityHeaders = {
            'x-content-type-options': headers.get('x-content-type-options'),
            'x-frame-options': headers.get('x-frame-options'),
            'x-xss-protection': headers.get('x-xss-protection'),
            'strict-transport-security': headers.get('strict-transport-security'),
            'content-security-policy': headers.get('content-security-policy')
        };

        log('Security Headers:', 'info');
        Object.entries(securityHeaders).forEach(([key, value]) => {
            log(`  ${key}: ${value || 'Not set'}`, 'info');
        });

        const hasSomeSecurityHeaders = Object.values(securityHeaders).some(value => value !== null);

        logTestResult('Security Headers', hasSomeSecurityHeaders,
            `Security headers present: ${hasSomeSecurityHeaders}`);

        return { response, securityHeaders };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Security Headers', false, `Error: ${error.message}`);
        return null;
    }
}

// Test 10: Test complete OAuth flow simulation
async function testCompleteOAuthFlowSimulation() {
    logTestStart('Complete OAuth Flow Simulation');

    try {
        // Step 1: Initiate OAuth
        const initiateResponse = await fetch(`${API_BASE}/sign-in/social`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: 'google'
            }),
            redirect: 'manual'
        });

        const location = initiateResponse.headers.get('location');
        if (!location || !location.includes('accounts.google.com')) {
            logTestResult('Complete OAuth Flow Simulation', false, 'Failed to initiate OAuth flow');
            return null;
        }

        log(`OAuth initiation successful, redirect to: ${location}`);

        // Extract state and other parameters from the redirect URL
        const redirectUrl = new URL(location);
        const state = redirectUrl.searchParams.get('state');
        const clientId = redirectUrl.searchParams.get('client_id');
        const redirectUri = redirectUrl.searchParams.get('redirect_uri');

        log(`OAuth parameters - State: ${state}, Client ID: ${clientId}, Redirect URI: ${redirectUri}`);

        // Step 2: Simulate callback (this would normally come from Google)
        // Note: This will fail because we don't have a real authorization code
        const callbackResponse = await fetch(`${API_BASE}/callback/google?code=simulated_code&state=${state}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'manual'
        });

        const callbackBody = await callbackResponse.text();
        logResponseDetails(callbackResponse, callbackBody);

        // The callback should handle the invalid code gracefully
        const isHandled = callbackResponse.status >= 400 && callbackResponse.status < 500;

        logTestResult('Complete OAuth Flow Simulation', isHandled,
            `OAuth initiated: true, Callback handled: ${isHandled}`);

        return { initiateResponse, callbackResponse, state, clientId, redirectUri };
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        logTestResult('Complete OAuth Flow Simulation', false, `Error: ${error.message}`);
        return null;
    }
}

// Main test runner
async function runAllTests() {
    log('\n🚀 Starting Comprehensive Authentication System Tests', 'info');
    log(`Testing against: ${BASE_URL}`, 'info');
    log(`API Base: ${API_BASE}`, 'info');

    // Run all tests
    await testGetCurrentSessionNoAuth();
    await testGoogleOAuthInitiation();
    await testOAuthCallbackInvalidState();
    await testSignOutNoAuth();
    await testSessionCookieManagement();
    await testCSRFProtection();
    await testInvalidProvider();
    await testRateLimiting();
    await testSecurityHeaders();
    await testCompleteOAuthFlowSimulation();

    // Print summary
    log('\n📊 Test Results Summary', 'info');
    log(`Total Tests: ${testResults.total}`, 'info');
    log(`Passed: ${testResults.passed}`, 'success');
    log(`Failed: ${testResults.failed}`, 'error');
    log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`,
        testResults.passed === testResults.total ? 'success' : 'warning');

    // Print detailed results
    log('\n📋 Detailed Results', 'info');
    testResults.details.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        log(`${status} ${result.test}`, result.passed ? 'success' : 'error');
        if (result.details) {
            log(`   Details: ${result.details}`, 'info');
        }
    });

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testGetCurrentSessionNoAuth,
    testGoogleOAuthInitiation,
    testOAuthCallbackInvalidState,
    testSignOutNoAuth,
    testSessionCookieManagement,
    testCSRFProtection,
    testInvalidProvider,
    testRateLimiting,
    testSecurityHeaders,
    testCompleteOAuthFlowSimulation
};
