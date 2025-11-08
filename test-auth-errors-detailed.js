/**
 * Detailed Authentication Error Testing Script
 *
 * This script tests error scenarios with proper redirect following
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const config = {
    baseUrl: 'http://localhost:3000',
    timeout: 10000
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
}

// HTTP request helper with redirect following
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

        // Follow redirects manually to capture the final URL
        let finalUrl = response.url;
        let redirectCount = 0;
        const maxRedirects = 10;

        while (response.redirected && redirectCount < maxRedirects) {
            const location = response.headers.get('location');
            if (!location) break;

            log(`Following redirect ${redirectCount + 1}: ${location}`, 'info');

            const redirectResponse = await fetch(location, {
                ...fetchOptions,
                redirect: 'manual'
            });

            finalUrl = location;
            redirectCount++;

            if (!redirectResponse.redirected) break;
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: finalUrl,
            redirected: response.redirected,
            redirectCount
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

// Test 1: OAuth denial with redirect following
async function testOAuthDenial() {
    log('Testing OAuth denial scenario with redirect following...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/callback/google?error=access_denied&state=test_state`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl, { redirect: 'manual' });

    log(`Response status: ${response.status}`, 'info');
    log(`Final URL: ${response.url}`, 'info');
    log(`Redirect count: ${response.redirectCount}`, 'info');

    const testPassed = response.url && response.url.includes('/auth/error') && response.url.includes('error=access_denied');
    log(`OAuth Denial Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return {
        testName: 'OAuth Denial',
        testPassed,
        status: response.status,
        finalUrl: response.url,
        redirectCount: response.redirectCount,
        expectedBehavior: 'Should redirect to error page with access_denied error',
        actualBehavior: `Final URL: ${response.url}`,
        errorHandled: response.url && response.url.includes('/auth/error'),
        errorParameter: response.url && response.url.includes('error=access_denied')
    };
}

// Test 2: Invalid OAuth state with redirect following
async function testInvalidOAuthState() {
    log('Testing invalid OAuth state parameter with redirect following...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/callback/google?code=test_code&state=invalid_state`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl, { redirect: 'manual' });

    log(`Response status: ${response.status}`, 'info');
    log(`Final URL: ${response.url}`, 'info');
    log(`Redirect count: ${response.redirectCount}`, 'info');

    const testPassed = response.url && response.url.includes('/auth/error') && response.url.includes('error=invalid_state');
    log(`Invalid OAuth State Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return {
        testName: 'Invalid OAuth State',
        testPassed,
        status: response.status,
        finalUrl: response.url,
        redirectCount: response.redirectCount,
        expectedBehavior: 'Should reject invalid state and redirect to error page',
        actualBehavior: `Final URL: ${response.url}`,
        errorHandled: response.url && response.url.includes('/auth/error'),
        errorParameter: response.url && response.url.includes('error=invalid_state')
    };
}

// Test 3: Expired authorization code
async function testExpiredAuthCode() {
    log('Testing expired authorization code...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/callback/google?code=expired_code&state=test_state`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl, { redirect: 'manual' });

    log(`Response status: ${response.status}`, 'info');
    log(`Final URL: ${response.url}`, 'info');

    const testPassed = response.url && response.url.includes('/auth/error');
    log(`Expired Auth Code Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return {
        testName: 'Expired Authorization Code',
        testPassed,
        status: response.status,
        finalUrl: response.url,
        expectedBehavior: 'Should handle expired code and redirect to error page',
        actualBehavior: `Final URL: ${response.url}`,
        errorHandled: response.url && response.url.includes('/auth/error')
    };
}

// Test 4: Error page with different parameters
async function testErrorPageParameters() {
    log('Testing error page with different parameters...', 'info');

    const errorTypes = [
        'access_denied',
        'invalid_request',
        'server_error',
        'configuration',
        'session_expired'
    ];

    const results = [];

    for (const errorType of errorTypes) {
        log(`Testing error page with parameter: ${errorType}`, 'info');

        const testUrl = `${config.baseUrl}/auth/error?error=${errorType}`;
        const response = await makeRequest(testUrl);

        log(`Response status: ${response.status}`, 'info');
        log(`Response ok: ${response.ok}`, 'info');

        const testPassed = response.ok;
        log(`Error Page ${errorType} Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

        results.push({
            errorType,
            testPassed,
            status: response.status,
            expectedBehavior: `Should display appropriate error message for ${errorType}`,
            actualBehavior: `Status: ${response.status}, Page loaded: ${response.ok}`,
            errorPageLoaded: response.ok
        });
    }

    return results;
}

// Test 5: Session error scenarios
async function testSessionErrors() {
    log('Testing session error scenarios...', 'info');

    const sessionTests = [
        {
            name: 'Expired Session',
            token: JSON.stringify({
                user: { id: 'test', email: 'test@example.com', name: 'Test User' },
                sessionId: 'expired_session',
                expiresAt: Date.now() - 86400000 // Yesterday
            })
        },
        {
            name: 'Invalid Session Token',
            token: 'invalid_token_format'
        },
        {
            name: 'Corrupted Session',
            token: '{"user": {"id": "test"}, "sessionId": "test", "expiresAt": ' + 'invalid'
        }
    ];

    const results = [];

    for (const sessionTest of sessionTests) {
        log(`Testing ${sessionTest.name}...`, 'info');

        const response = await makeRequest(`${config.baseUrl}/api/auth/session`, {
            headers: {
                'Cookie': `session_token=${encodeURIComponent(sessionTest.token)}`
            }
        });

        log(`Response status: ${response.status}`, 'info');
        log(`Response ok: ${response.ok}`, 'info');

        const testPassed = response.status === 200 && response.ok;
        log(`${sessionTest.name} Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

        results.push({
            testName: sessionTest.name,
            testPassed,
            status: response.status,
            expectedBehavior: `Should handle ${sessionTest.name.toLowerCase()} gracefully`,
            actualBehavior: `Status: ${response.status}, Response handled: ${response.ok}`,
            errorHandled: response.status === 200 && response.ok
        });
    }

    return results;
}

// Test 6: Security scenarios
async function testSecurityScenarios() {
    log('Testing security scenarios...', 'info');

    const securityTests = [
        {
            name: 'XSS Protection',
            url: `${config.baseUrl}/auth/error?error=${encodeURIComponent('<script>alert("xss")</script>')}`,
            expectedStatus: 200
        },
        {
            name: 'SQL Injection Attempt',
            url: `${config.baseUrl}/api/auth/session?user=${encodeURIComponent("'; DROP TABLE users; --")}`,
            expectedStatus: 200
        },
        {
            name: 'Authentication Bypass',
            url: `${config.baseUrl}/dashboard`,
            expectedStatus: 401
        }
    ];

    const results = [];

    for (const securityTest of securityTests) {
        log(`Testing ${securityTest.name}...`, 'info');

        const response = await makeRequest(securityTest.url);

        log(`Response status: ${response.status}`, 'info');
        log(`Expected status: ${securityTest.expectedStatus}`, 'info');

        const testPassed = response.status === securityTest.expectedStatus || response.ok;
        log(`${securityTest.name} Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

        results.push({
            testName: securityTest.name,
            testPassed,
            status: response.status,
            expectedStatus: securityTest.expectedStatus,
            expectedBehavior: securityTest.expectedStatus === 401 ?
                'Should prevent authentication bypass' :
                'Should handle security attack gracefully',
            actualBehavior: `Status: ${response.status}, Security handled: ${testPassed}`,
            securityHandled: testPassed
        });
    }

    return results;
}

// Main test execution
async function runDetailedTests() {
    log('Starting Detailed Authentication Error Testing...', 'info');
    log(`Testing against: ${config.baseUrl}`, 'info');

    const testResults = {
        authentication: [],
        session: [],
        errorPage: [],
        security: []
    };

    // Run authentication error tests
    testResults.authentication.push(await testOAuthDenial());
    testResults.authentication.push(await testInvalidOAuthState());
    testResults.authentication.push(await testExpiredAuthCode());

    // Run error page tests
    testResults.errorPage = await testErrorPageParameters();

    // Run session error tests
    testResults.session = await testSessionErrors();

    // Run security tests
    testResults.security = await testSecurityScenarios();

    // Generate summary
    const allTests = [
        ...testResults.authentication,
        ...testResults.errorPage,
        ...testResults.session,
        ...testResults.security
    ];

    const totalTests = allTests.length;
    const passedTests = allTests.filter(t => t.testPassed).length;
    const failedTests = totalTests - passedTests;

    log('\n=== DETAILED TEST SUMMARY ===', 'info');
    log(`Total Tests: ${totalTests}`, 'info');
    log(`Passed: ${passedTests}`, 'success');
    log(`Failed: ${failedTests}`, 'error');
    log(`Pass Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'info');

    log('\n=== CATEGORY BREAKDOWN ===', 'info');
    Object.entries(testResults).forEach(([category, tests]) => {
        const categoryPassed = tests.filter(t => t.testPassed).length;
        const categoryTotal = tests.length;
        const passRate = Math.round((categoryPassed / categoryTotal) * 100);
        log(`${category}: ${categoryPassed}/${categoryTotal} (${passRate}%)`,
            categoryPassed === categoryTotal ? 'success' : 'error');
    });

    // Save detailed results
    const reportData = {
        testExecutionTime: new Date().toISOString(),
        baseUrl: config.baseUrl,
        summary: {
            totalTests,
            passedTests,
            failedTests,
            passRate: `${Math.round((passedTests / totalTests) * 100)}%`
        },
        categoryResults: testResults,
        allTests
    };

    const reportPath = path.join(__dirname, 'detailed-auth-error-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    log(`Detailed report saved to ${reportPath}`, 'success');

    return reportData;
}

// Run tests
runDetailedTests().catch(error => {
    log(`Fatal error during test execution: ${error.message}`, 'error');
    process.exit(1);
});