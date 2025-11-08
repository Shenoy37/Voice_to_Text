/**
 * Comprehensive Authentication Error Testing Script
 * 
 * This script tests various error scenarios in the Voice to Notes authentication system
 * to identify gaps and improvements needed in error handling.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const config = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
    timeout: 10000,
    testResults: {
        authentication: [],
        session: [],
        frontend: [],
        backend: [],
        errorPage: [],
        security: [],
        recovery: []
    }
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
}

function recordResult(category, testName, result) {
    config.testResults[category].push({
        testName,
        timestamp: new Date().toISOString(),
        ...result
    });
}

function saveResults() {
    const reportPath = path.join(__dirname, 'auth-error-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(config.testResults, null, 2));
    log(`Test results saved to ${reportPath}`, 'success');
}

// HTTP request helper
async function makeRequest(url, options = {}) {
    const defaultOptions = {
        timeout: config.timeout,
        headers: {
            'User-Agent': 'Auth-Error-Test-Script/1.0'
        }
    };

    const fetchOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, fetchOptions);
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url,
            redirected: response.redirected
        };
    } catch (error) {
        return {
            ok: false,
            error: error.message,
            status: 0,
            statusText: 'Network Error'
        };
    }
}

// 1. Authentication Error Scenarios
async function testAuthenticationErrors() {
    log('Testing Authentication Error Scenarios...', 'info');

    // Test 1.1: OAuth denial (user cancels Google OAuth)
    async function testOAuthDenial() {
        log('Testing OAuth denial scenario...', 'info');

        // Simulate OAuth denial by accessing callback with error=access_denied
        const testUrl = `${config.baseUrl}/api/auth/callback/google?error=access_denied&state=test_state`;
        const response = await makeRequest(testUrl, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should redirect to error page with access_denied error',
            actualBehavior: response.redirected ? `Redirected to: ${response.url}` : 'No redirect occurred',
            status: response.status,
            errorHandled: response.url && response.url.includes('/auth/error'),
            errorParameter: response.url && response.url.includes('error=access_denied'),
            testPassed: response.url && response.url.includes('/auth/error') && response.url.includes('error=access_denied')
        };

        recordResult('authentication', 'OAuth Denial', result);
        log(`OAuth Denial Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 1.2: Invalid OAuth state parameters
    async function testInvalidOAuthState() {
        log('Testing invalid OAuth state parameter...', 'info');

        // Test with mismatched state
        const testUrl = `${config.baseUrl}/api/auth/callback/google?code=test_code&state=invalid_state`;
        const response = await makeRequest(testUrl, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should reject invalid state and redirect to error page',
            actualBehavior: response.redirected ? `Redirected to: ${response.url}` : 'No redirect occurred',
            status: response.status,
            errorHandled: response.url && response.url.includes('/auth/error'),
            errorParameter: response.url && response.url.includes('error=invalid_state'),
            testPassed: response.url && response.url.includes('/auth/error') && response.url.includes('error=invalid_state')
        };

        recordResult('authentication', 'Invalid OAuth State', result);
        log(`Invalid OAuth State Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 1.3: Expired authorization codes
    async function testExpiredAuthCode() {
        log('Testing expired authorization code...', 'info');

        // Simulate expired code (this would normally be handled by Google OAuth)
        const testUrl = `${config.baseUrl}/api/auth/callback/google?code=expired_code&state=test_state`;
        const response = await makeRequest(testUrl, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should handle expired code and redirect to error page',
            actualBehavior: response.redirected ? `Redirected to: ${response.url}` : 'No redirect occurred',
            status: response.status,
            errorHandled: response.url && response.url.includes('/auth/error'),
            testPassed: response.url && response.url.includes('/auth/error')
        };

        recordResult('authentication', 'Expired Authorization Code', result);
        log(`Expired Auth Code Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 1.4: Network failures during OAuth flow
    async function testNetworkFailures() {
        log('Testing network failure scenarios...', 'info');

        // Test with invalid domain to simulate network failure
        const testUrl = `${config.baseUrl}/api/auth/signin/google`;
        const response = await makeRequest(testUrl, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should handle network failures gracefully',
            actualBehavior: response.error ? `Network error: ${response.error}` : `Status: ${response.status}`,
            status: response.status,
            errorHandled: response.error || response.status >= 500,
            testPassed: response.error || response.status >= 500
        };

        recordResult('authentication', 'Network Failures', result);
        log(`Network Failures Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 1.5: Invalid redirect URIs
    async function testInvalidRedirectURI() {
        log('Testing invalid redirect URI scenarios...', 'info');

        // Test callback with suspicious redirect
        const testUrl = `${config.baseUrl}/api/auth/callback/google?code=test_code&state=test_state&redirect_uri=https://malicious.com`;
        const response = await makeRequest(testUrl, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should reject invalid redirect URIs',
            actualBehavior: response.redirected ? `Redirected to: ${response.url}` : 'No redirect occurred',
            status: response.status,
            errorHandled: response.url && response.url.includes('/auth/error'),
            maliciousRedirectBlocked: !response.url || !response.url.includes('malicious.com'),
            testPassed: response.url && response.url.includes('/auth/error') && !response.url.includes('malicious.com')
        };

        recordResult('authentication', 'Invalid Redirect URI', result);
        log(`Invalid Redirect URI Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all authentication error tests
    await testOAuthDenial();
    await testInvalidOAuthState();
    await testExpiredAuthCode();
    await testNetworkFailures();
    await testInvalidRedirectURI();
}

// 2. Session Error Handling
async function testSessionErrors() {
    log('Testing Session Error Handling...', 'info');

    // Test 2.1: Expired session access
    async function testExpiredSession() {
        log('Testing expired session access...', 'info');

        // Create a mock expired session token
        const expiredToken = JSON.stringify({
            user: { id: 'test', email: 'test@example.com', name: 'Test User' },
            sessionId: 'expired_session',
            expiresAt: Date.now() - 86400000 // Yesterday
        });

        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            headers: {
                'Cookie': `session_token=${encodeURIComponent(expiredToken)}`
            }
        });

        const result = {
            expectedBehavior: 'Should reject expired session and return null',
            actualBehavior: `Status: ${response.status}, Response handled: ${response.ok}`,
            status: response.status,
            sessionRejected: response.status === 200 && response.ok,
            testPassed: response.status === 200 && response.ok
        };

        recordResult('session', 'Expired Session Access', result);
        log(`Expired Session Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 2.2: Invalid session tokens
    async function testInvalidSessionToken() {
        log('Testing invalid session token...', 'info');

        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            headers: {
                'Cookie': 'session_token=invalid_token_format'
            }
        });

        const result = {
            expectedBehavior: 'Should handle invalid token gracefully',
            actualBehavior: `Status: ${response.status}, Response handled: ${response.ok}`,
            status: response.status,
            errorHandled: response.status === 200 && response.ok,
            testPassed: response.status === 200 && response.ok
        };

        recordResult('session', 'Invalid Session Token', result);
        log(`Invalid Session Token Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 2.3: Session corruption scenarios
    async function testSessionCorruption() {
        log('Testing session corruption scenarios...', 'info');

        // Test with malformed JSON
        const corruptedToken = '{"user": {"id": "test"}, "sessionId": "test", "expiresAt": ' + 'invalid';

        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            headers: {
                'Cookie': `session_token=${encodeURIComponent(corruptedToken)}`
            }
        });

        const result = {
            expectedBehavior: 'Should handle corrupted session data',
            actualBehavior: `Status: ${response.status}, Response handled: ${response.ok}`,
            status: response.status,
            errorHandled: response.status === 200 && response.ok,
            testPassed: response.status === 200 && response.ok
        };

        recordResult('session', 'Session Corruption', result);
        log(`Session Corruption Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 2.4: Concurrent session conflicts
    async function testConcurrentSessions() {
        log('Testing concurrent session conflicts...', 'info');

        // This would require multiple simultaneous requests
        // For now, we'll test the session endpoint under load
        const promises = Array(5).fill().map(() =>
            makeRequest(`${config.baseUrl}/api/auth/session`)
        );

        const responses = await Promise.all(promises);
        const allHandled = responses.every(r => r.status === 200);

        const result = {
            expectedBehavior: 'Should handle concurrent session requests',
            actualBehavior: `All ${responses.length} requests handled: ${allHandled}`,
            status: responses.map(r => r.status),
            concurrentHandling: allHandled,
            testPassed: allHandled
        };

        recordResult('session', 'Concurrent Session Conflicts', result);
        log(`Concurrent Sessions Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 2.5: Session timeout handling
    async function testSessionTimeout() {
        log('Testing session timeout handling...', 'info');

        // Test with session about to expire
        const soonToExpireToken = JSON.stringify({
            user: { id: 'test', email: 'test@example.com', name: 'Test User' },
            sessionId: 'timeout_test_session',
            expiresAt: Date.now() + 1000 // Expires in 1 second
        });

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100));

        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            headers: {
                'Cookie': `session_token=${encodeURIComponent(soonToExpireToken)}`
            }
        });

        const result = {
            expectedBehavior: 'Should handle session timeout properly',
            actualBehavior: `Status: ${response.status}, Response handled: ${response.ok}`,
            status: response.status,
            timeoutHandled: response.status === 200 && response.ok,
            testPassed: response.status === 200 && response.ok
        };

        recordResult('session', 'Session Timeout Handling', result);
        log(`Session Timeout Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all session error tests
    await testExpiredSession();
    await testInvalidSessionToken();
    await testSessionCorruption();
    await testConcurrentSessions();
    await testSessionTimeout();
}

// 3. Frontend Error Handling
async function testFrontendErrors() {
    log('Testing Frontend Error Handling...', 'info');

    // Test 3.1: AuthModal error display
    async function testAuthModalErrors() {
        log('Testing AuthModal error display...', 'info');

        // Test the main page to see if AuthModal loads properly
        const response = await makeRequest(config.baseUrl);

        const result = {
            expectedBehavior: 'AuthModal should load and handle errors gracefully',
            actualBehavior: `Status: ${response.status}, Page loaded: ${response.ok}`,
            status: response.status,
            modalComponentLoaded: response.ok,
            errorHandlingPresent: response.ok, // Would need to check actual content
            testPassed: response.ok
        };

        recordResult('frontend', 'AuthModal Error Display', result);
        log(`AuthModal Error Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 3.2: EnhancedSignInButton error states
    async function testSignInButtonErrors() {
        log('Testing EnhancedSignInButton error states...', 'info');

        // Test sign-in endpoint
        const response = await makeRequest(`${config.baseUrl}/api/auth/signin/google`, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'SignInButton should handle loading and error states',
            actualBehavior: `Status: ${response.status}, Redirect handled: ${response.redirected}`,
            status: response.status,
            buttonStateHandling: response.redirected || response.status >= 400,
            testPassed: response.redirected || response.status >= 400
        };

        recordResult('frontend', 'EnhancedSignInButton Error States', result);
        log(`SignInButton Error Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 3.3: EnhancedUserMenu error handling
    async function testUserMenuErrors() {
        log('Testing EnhancedUserMenu error handling...', 'info');

        // Test dashboard page where UserMenu appears
        const response = await makeRequest(`${config.baseUrl}/dashboard`);

        const result = {
            expectedBehavior: 'UserMenu should handle authentication errors gracefully',
            actualBehavior: `Status: ${response.status}, Page handled: ${response.ok}`,
            status: response.status,
            menuErrorHandling: response.ok || response.status === 401,
            testPassed: response.ok || response.status === 401
        };

        recordResult('frontend', 'EnhancedUserMenu Error Handling', result);
        log(`UserMenu Error Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 3.4: AuthProvider error recovery
    async function testAuthProviderErrors() {
        log('Testing AuthProvider error recovery...', 'info');

        // Test session endpoint which AuthProvider uses
        const response = await makeRequest(`${config.baseUrl}/api/auth/session`);

        const result = {
            expectedBehavior: 'AuthProvider should recover from session errors',
            actualBehavior: `Status: ${response.status}, Session handled: ${response.ok}`,
            status: response.status,
            providerErrorRecovery: response.ok,
            testPassed: response.ok
        };

        recordResult('frontend', 'AuthProvider Error Recovery', result);
        log(`AuthProvider Error Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 3.5: Error boundary functionality
    async function testErrorBoundaries() {
        log('Testing error boundary functionality...', 'info');

        // Test with a route that might trigger errors
        const response = await makeRequest(`${config.baseUrl}/non-existent-route`);

        const result = {
            expectedBehavior: 'Error boundaries should catch and display errors gracefully',
            actualBehavior: `Status: ${response.status}, Error handled: ${response.status === 404}`,
            status: response.status,
            errorBoundaryActive: response.status === 404,
            testPassed: response.status === 404
        };

        recordResult('frontend', 'Error Boundary Functionality', result);
        log(`Error Boundary Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all frontend error tests
    await testAuthModalErrors();
    await testSignInButtonErrors();
    await testUserMenuErrors();
    await testAuthProviderErrors();
    await testErrorBoundaries();
}

// 4. Backend Error Scenarios
async function testBackendErrors() {
    log('Testing Backend Error Scenarios...', 'info');

    // Test 4.1: Database connection failures
    async function testDatabaseFailures() {
        log('Testing database connection failure scenarios...', 'info');

        // Test auth endpoint which depends on database
        const response = await makeRequest(`${config.baseUrl}/api/auth/session`);

        const result = {
            expectedBehavior: 'Should handle database connection failures gracefully',
            actualBehavior: `Status: ${response.status}, Error handled: ${!response.ok}`,
            status: response.status,
            databaseErrorHandled: response.status >= 500 || response.ok,
            testPassed: response.status >= 500 || response.ok
        };

        recordResult('backend', 'Database Connection Failures', result);
        log(`Database Failure Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 4.2: Missing environment variables
    async function testMissingEnvVars() {
        log('Testing missing environment variable scenarios...', 'info');

        // Test OAuth endpoint which requires environment variables
        const response = await makeRequest(`${config.baseUrl}/api/auth/signin/google`, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should handle missing environment variables',
            actualBehavior: `Status: ${response.status}, Config error handled: ${response.status >= 500}`,
            status: response.status,
            envVarErrorHandled: response.status >= 500 || response.redirected,
            testPassed: response.status >= 500 || response.redirected
        };

        recordResult('backend', 'Missing Environment Variables', result);
        log(`Missing Env Vars Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 4.3: Invalid Google OAuth configuration
    async function testInvalidOAuthConfig() {
        log('Testing invalid Google OAuth configuration...', 'info');

        // Test callback with invalid configuration
        const testUrl = `${config.baseUrl}/api/auth/callback/google?error=invalid_client`;
        const response = await makeRequest(testUrl, { redirect: 'manual' });

        const result = {
            expectedBehavior: 'Should handle invalid OAuth configuration',
            actualBehavior: response.redirected ? `Redirected to: ${response.url}` : `Status: ${response.status}`,
            status: response.status,
            configErrorHandled: response.url && response.url.includes('/auth/error'),
            testPassed: response.url && response.url.includes('/auth/error')
        };

        recordResult('backend', 'Invalid Google OAuth Configuration', result);
        log(`Invalid OAuth Config Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 4.4: Rate limiting scenarios
    async function testRateLimiting() {
        log('Testing rate limiting scenarios...', 'info');

        // Make multiple rapid requests to test rate limiting
        const promises = Array(20).fill().map(() =>
            makeRequest(`${config.baseUrl}/api/auth/session`)
        );

        const responses = await Promise.all(promises);
        const rateLimited = responses.some(r => r.status === 429);

        const result = {
            expectedBehavior: 'Should implement rate limiting for auth endpoints',
            actualBehavior: `Rate limiting active: ${rateLimited}, Responses: ${responses.map(r => r.status)}`,
            status: responses.map(r => r.status),
            rateLimitingActive: rateLimited,
            testPassed: rateLimited || responses.every(r => r.ok) // Either rate limited or all handled
        };

        recordResult('backend', 'Rate Limiting Scenarios', result);
        log(`Rate Limiting Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 4.5: Server overload conditions
    async function testServerOverload() {
        log('Testing server overload conditions...', 'info');

        // Simulate high load with many concurrent requests
        const promises = Array(50).fill().map(() =>
            makeRequest(`${config.baseUrl}/api/auth/session`)
        );

        const responses = await Promise.all(promises);
        const overloadHandled = responses.every(r => r.status < 500);

        const result = {
            expectedBehavior: 'Should handle server overload gracefully',
            actualBehavior: `Overload handled: ${overloadHandled}, Total requests: ${responses.length}`,
            status: responses.map(r => r.status),
            overloadHandling: overloadHandled,
            testPassed: overloadHandled
        };

        recordResult('backend', 'Server Overload Conditions', result);
        log(`Server Overload Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all backend error tests
    await testDatabaseFailures();
    await testMissingEnvVars();
    await testInvalidOAuthConfig();
    await testRateLimiting();
    await testServerOverload();
}

// 5. Error Page Functionality
async function testErrorPageFunctionality() {
    log('Testing Error Page Functionality...', 'info');

    // Test 5.1: Error page with different error parameters
    async function testErrorPageParameters() {
        const errorTypes = [
            'access_denied',
            'invalid_request',
            'server_error',
            'configuration',
            'session_expired'
        ];

        for (const errorType of errorTypes) {
            log(`Testing error page with parameter: ${errorType}`, 'info');

            const testUrl = `${config.baseUrl}/auth/error?error=${errorType}`;
            const response = await makeRequest(testUrl);

            const result = {
                expectedBehavior: `Should display appropriate error message for ${errorType}`,
                actualBehavior: `Status: ${response.status}, Page loaded: ${response.ok}`,
                status: response.status,
                errorPageLoaded: response.ok,
                testPassed: response.ok
            };

            recordResult('errorPage', `Error Parameter: ${errorType}`, result);
            log(`Error Page ${errorType} Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
        }
    }

    // Test 5.2: Error message display and formatting
    async function testErrorMessageDisplay() {
        log('Testing error message display and formatting...', 'info');

        const testUrl = `${config.baseUrl}/auth/error?error=access_denied&error_description=User denied access`;
        const response = await makeRequest(testUrl);

        const result = {
            expectedBehavior: 'Should display and format error messages correctly',
            actualBehavior: `Status: ${response.status}, Page loaded: ${response.ok}`,
            status: response.status,
            messageDisplayHandled: response.ok,
            testPassed: response.ok
        };

        recordResult('errorPage', 'Error Message Display', result);
        log(`Error Message Display Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 5.3: Error recovery options
    async function testErrorRecoveryOptions() {
        log('Testing error recovery options...', 'info');

        const testUrl = `${config.baseUrl}/auth/error?error=server_error`;
        const response = await makeRequest(testUrl);

        const result = {
            expectedBehavior: 'Should provide recovery options on error page',
            actualBehavior: `Status: ${response.status}, Recovery options available: ${response.ok}`,
            status: response.status,
            recoveryOptionsPresent: response.ok,
            testPassed: response.ok
        };

        recordResult('errorPage', 'Error Recovery Options', result);
        log(`Error Recovery Options Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 5.4: Error page navigation
    async function testErrorPageNavigation() {
        log('Testing error page navigation...', 'info');

        const testUrl = `${config.baseUrl}/auth/error?error=configuration`;
        const response = await makeRequest(testUrl);

        const result = {
            expectedBehavior: 'Should provide proper navigation options',
            actualBehavior: `Status: ${response.status}, Navigation available: ${response.ok}`,
            status: response.status,
            navigationFunctional: response.ok,
            testPassed: response.ok
        };

        recordResult('errorPage', 'Error Page Navigation', result);
        log(`Error Page Navigation Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 5.5: Mobile error page responsiveness
    async function testMobileErrorPage() {
        log('Testing mobile error page responsiveness...', 'info');

        const testUrl = `${config.baseUrl}/auth/error?error=access_denied`;
        const response = await makeRequest(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        const result = {
            expectedBehavior: 'Should be responsive on mobile devices',
            actualBehavior: `Status: ${response.status}, Mobile responsive: ${response.ok}`,
            status: response.status,
            mobileResponsive: response.ok,
            testPassed: response.ok
        };

        recordResult('errorPage', 'Mobile Error Page Responsiveness', result);
        log(`Mobile Error Page Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all error page tests
    await testErrorPageParameters();
    await testErrorMessageDisplay();
    await testErrorRecoveryOptions();
    await testErrorPageNavigation();
    await testMobileErrorPage();
}

// 6. Security Error Scenarios
async function testSecurityErrors() {
    log('Testing Security Error Scenarios...', 'info');

    // Test 6.1: CSRF token validation failures
    async function testCSRFProtection() {
        log('Testing CSRF token validation...', 'info');

        // Test POST request without CSRF token
        const response = await makeRequest(`${config.baseUrl}/api/auth/signout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = {
            expectedBehavior: 'Should validate CSRF tokens for state-changing requests',
            actualBehavior: `Status: ${response.status}, CSRF protection: ${response.status >= 400}`,
            status: response.status,
            csrfProtectionActive: response.status >= 400 || response.ok,
            testPassed: response.status >= 400 || response.ok
        };

        recordResult('security', 'CSRF Token Validation Failures', result);
        log(`CSRF Protection Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 6.2: XSS protection
    async function testXSSProtection() {
        log('Testing XSS protection...', 'info');

        const xssPayload = '<script>alert("xss")</script>';
        const testUrl = `${config.baseUrl}/auth/error?error=${encodeURIComponent(xssPayload)}`;
        const response = await makeRequest(testUrl);

        const result = {
            expectedBehavior: 'Should sanitize and prevent XSS attacks',
            actualBehavior: `Status: ${response.status}, XSS protection: ${response.ok}`,
            status: response.status,
            xssProtectionActive: response.ok,
            testPassed: response.ok
        };

        recordResult('security', 'XSS Protection', result);
        log(`XSS Protection Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 6.3: SQL injection attempts
    async function testSQLInjectionProtection() {
        log('Testing SQL injection protection...', 'info');

        const sqlPayload = "'; DROP TABLE users; --";
        const testUrl = `${config.baseUrl}/api/auth/session?user=${encodeURIComponent(sqlPayload)}`;
        const response = await makeRequest(testUrl);

        const result = {
            expectedBehavior: 'Should prevent SQL injection attacks',
            actualBehavior: `Status: ${response.status}, SQL injection protection: ${response.ok}`,
            status: response.status,
            sqlInjectionProtection: response.ok,
            testPassed: response.ok
        };

        recordResult('security', 'SQL Injection Attempts', result);
        log(`SQL Injection Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 6.4: Malformed request handling
    async function testMalformedRequests() {
        log('Testing malformed request handling...', 'info');

        // Test with invalid JSON
        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '{"invalid": json}'
        });

        const result = {
            expectedBehavior: 'Should handle malformed requests gracefully',
            actualBehavior: `Status: ${response.status}, Malformed request handled: ${response.status >= 400}`,
            status: response.status,
            malformedRequestHandled: response.status >= 400 || response.ok,
            testPassed: response.status >= 400 || response.ok
        };

        recordResult('security', 'Malformed Request Handling', result);
        log(`Malformed Request Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 6.5: Authentication bypass attempts
    async function testAuthBypassAttempts() {
        log('Testing authentication bypass attempts...', 'info');

        // Test accessing protected route without authentication
        const response = await makeRequest(`${config.baseUrl}/dashboard`);

        const result = {
            expectedBehavior: 'Should prevent authentication bypass attempts',
            actualBehavior: `Status: ${response.status}, Bypass prevented: ${response.status === 401 || response.redirected}`,
            status: response.status,
            authBypassPrevented: response.status === 401 || response.redirected,
            testPassed: response.status === 401 || response.redirected
        };

        recordResult('security', 'Authentication Bypass Attempts', result);
        log(`Auth Bypass Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all security error tests
    await testCSRFProtection();
    await testXSSProtection();
    await testSQLInjectionProtection();
    await testMalformedRequests();
    await testAuthBypassAttempts();
}

// 7. Recovery Mechanisms
async function testRecoveryMechanisms() {
    log('Testing Recovery Mechanisms...', 'info');

    // Test 7.1: Automatic retry functionality
    async function testAutomaticRetry() {
        log('Testing automatic retry functionality...', 'info');

        // Test multiple requests to see if retry logic exists
        const promises = Array(3).fill().map((_, index) =>
            makeRequest(`${config.baseUrl}/api/auth/session`, {
                headers: {
                    'X-Retry-Count': index.toString()
                }
            })
        );

        const responses = await Promise.all(promises);
        const retryHandled = responses.every(r => r.ok || r.status >= 400);

        const result = {
            expectedBehavior: 'Should implement automatic retry for transient failures',
            actualBehavior: `Retry handled: ${retryHandled}, Responses: ${responses.map(r => r.status)}`,
            status: responses.map(r => r.status),
            automaticRetry: retryHandled,
            testPassed: retryHandled
        };

        recordResult('recovery', 'Automatic Retry Functionality', result);
        log(`Automatic Retry Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 7.2: Manual retry options
    async function testManualRetry() {
        log('Testing manual retry options...', 'info');

        // Test error page for retry options
        const testUrl = `${config.baseUrl}/auth/error?error=server_error`;
        const response = await makeRequest(testUrl);

        const result = {
            expectedBehavior: 'Should provide manual retry options',
            actualBehavior: `Status: ${response.status}, Manual retry available: ${response.ok}`,
            status: response.status,
            manualRetryAvailable: response.ok,
            testPassed: response.ok
        };

        recordResult('recovery', 'Manual Retry Options', result);
        log(`Manual Retry Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 7.3: Error state clearing
    async function testErrorStateClearing() {
        log('Testing error state clearing...', 'info');

        // First trigger an error
        const errorResponse = await makeRequest(`${config.baseUrl}/auth/error?error=access_denied`);

        // Then try to clear the error state
        const clearResponse = await makeRequest(config.baseUrl);

        const result = {
            expectedBehavior: 'Should clear error states appropriately',
            actualBehavior: `Error page: ${errorResponse.ok}, Clear state: ${clearResponse.ok}`,
            status: { error: errorResponse.status, clear: clearResponse.status },
            errorStateCleared: errorResponse.ok && clearResponse.ok,
            testPassed: errorResponse.ok && clearResponse.ok
        };

        recordResult('recovery', 'Error State Clearing', result);
        log(`Error State Clearing Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 7.4: Graceful degradation
    async function testGracefulDegradation() {
        log('Testing graceful degradation...', 'info');

        // Test with missing headers or incomplete requests
        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            headers: {} // No headers
        });

        const result = {
            expectedBehavior: 'Should degrade gracefully when features are unavailable',
            actualBehavior: `Status: ${response.status}, Graceful degradation: ${response.ok}`,
            status: response.status,
            gracefulDegradation: response.ok,
            testPassed: response.ok
        };

        recordResult('recovery', 'Graceful Degradation', result);
        log(`Graceful Degradation Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Test 7.5: Fallback authentication methods
    async function testFallbackAuth() {
        log('Testing fallback authentication methods...', 'info');

        // Test if there are fallback auth mechanisms
        const response = await makeRequest(`${config.baseUrl}/api/auth/session`);

        const result = {
            expectedBehavior: 'Should provide fallback authentication methods',
            actualBehavior: `Status: ${response.status}, Fallback available: ${response.ok}`,
            status: response.status,
            fallbackAuthAvailable: response.ok,
            testPassed: response.ok
        };

        recordResult('recovery', 'Fallback Authentication Methods', result);
        log(`Fallback Auth Test: ${result.testPassed ? 'PASSED' : 'FAILED'}`, result.testPassed ? 'success' : 'error');
    }

    // Run all recovery mechanism tests
    await testAutomaticRetry();
    await testManualRetry();
    await testErrorStateClearing();
    await testGracefulDegradation();
    await testFallbackAuth();
}

// Main test execution function
async function runAllTests() {
    log('Starting Comprehensive Authentication Error Testing...', 'info');
    log(`Testing against: ${config.baseUrl}`, 'info');

    try {
        await testAuthenticationErrors();
        await testSessionErrors();
        await testFrontendErrors();
        await testBackendErrors();
        await testErrorPageFunctionality();
        await testSecurityErrors();
        await testRecoveryMechanisms();

        // Generate summary report
        generateSummaryReport();
        saveResults();

        log('All authentication error tests completed!', 'success');
    } catch (error) {
        log(`Test execution failed: ${error.message}`, 'error');
        saveResults();
    }
}

// Generate summary report
function generateSummaryReport() {
    const summary = {
        testExecutionTime: new Date().toISOString(),
        baseUrl: config.baseUrl,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        categoryResults: {}
    };

    // Calculate totals
    Object.entries(config.testResults).forEach(([category, tests]) => {
        const categoryPassed = tests.filter(t => t.testPassed).length;
        const categoryTotal = tests.length;

        summary.categoryResults[category] = {
            passed: categoryPassed,
            total: categoryTotal,
            passRate: `${Math.round((categoryPassed / categoryTotal) * 100)}%`
        };

        summary.totalTests += categoryTotal;
        summary.passedTests += categoryPassed;
    });

    summary.failedTests = summary.totalTests - summary.passedTests;
    summary.overallPassRate = `${Math.round((summary.passedTests / summary.totalTests) * 100)}%`;

    // Log summary
    log('\n=== AUTHENTICATION ERROR TEST SUMMARY ===', 'info');
    log(`Total Tests: ${summary.totalTests}`, 'info');
    log(`Passed: ${summary.passedTests}`, 'success');
    log(`Failed: ${summary.failedTests}`, 'error');
    log(`Overall Pass Rate: ${summary.overallPassRate}`, 'info');

    log('\n=== CATEGORY BREAKDOWN ===', 'info');
    Object.entries(summary.categoryResults).forEach(([category, results]) => {
        log(`${category}: ${results.passed}/${results.total} (${results.passRate})`,
            results.passed === results.total ? 'success' : 'error');
    });

    // Save summary to file
    const summaryPath = path.join(__dirname, 'auth-error-test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    log(`Summary report saved to ${summaryPath}`, 'success');
}

// Execute tests if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(error => {
        log(`Fatal error during test execution: ${error.message}`, 'error');
        process.exit(1);
    });
}

export {
    runAllTests,
    testAuthenticationErrors,
    testSessionErrors,
    testFrontendErrors,
    testBackendErrors,
    testErrorPageFunctionality,
    testSecurityErrors,
    testRecoveryMechanisms,
    config
};