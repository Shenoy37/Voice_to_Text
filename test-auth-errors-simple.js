/**
 * Simple Authentication Error Testing Script
 * 
 * This script tests specific error scenarios with detailed logging
 */

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

// Test 1: OAuth denial
async function testOAuthDenial() {
    log('Testing OAuth denial scenario...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/callback/google?error=access_denied&state=test_state`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl, { redirect: 'manual' });

    log(`Response status: ${response.status}`, 'info');
    log(`Response redirected: ${response.redirected}`, 'info');
    if (response.redirected) {
        log(`Redirected to: ${response.url}`, 'info');
    }

    const testPassed = response.url && response.url.includes('/auth/error') && response.url.includes('error=access_denied');
    log(`OAuth Denial Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return testPassed;
}

// Test 2: Invalid OAuth state
async function testInvalidOAuthState() {
    log('Testing invalid OAuth state parameter...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/callback/google?code=test_code&state=invalid_state`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl, { redirect: 'manual' });

    log(`Response status: ${response.status}`, 'info');
    log(`Response redirected: ${response.redirected}`, 'info');
    if (response.redirected) {
        log(`Redirected to: ${response.url}`, 'info');
    }

    const testPassed = response.url && response.url.includes('/auth/error') && response.url.includes('error=invalid_state');
    log(`Invalid OAuth State Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return testPassed;
}

// Test 3: Error page functionality
async function testErrorPage() {
    log('Testing error page functionality...', 'info');

    const testUrl = `${config.baseUrl}/auth/error?error=access_denied`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl);

    log(`Response status: ${response.status}`, 'info');
    log(`Response ok: ${response.ok}`, 'info');

    const testPassed = response.ok;
    log(`Error Page Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return testPassed;
}

// Test 4: Session endpoint
async function testSessionEndpoint() {
    log('Testing session endpoint...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/session`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl);

    log(`Response status: ${response.status}`, 'info');
    log(`Response ok: ${response.ok}`, 'info');

    const testPassed = response.ok;
    log(`Session Endpoint Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return testPassed;
}

// Test 5: Sign-in endpoint
async function testSignInEndpoint() {
    log('Testing sign-in endpoint...', 'info');

    const testUrl = `${config.baseUrl}/api/auth/signin/google`;
    log(`Testing URL: ${testUrl}`, 'info');

    const response = await makeRequest(testUrl, { redirect: 'manual' });

    log(`Response status: ${response.status}`, 'info');
    log(`Response redirected: ${response.redirected}`, 'info');
    if (response.redirected) {
        log(`Redirected to: ${response.url}`, 'info');
    }

    const testPassed = response.redirected || response.status >= 400;
    log(`Sign-in Endpoint Test: ${testPassed ? 'PASSED' : 'FAILED'}`, testPassed ? 'success' : 'error');

    return testPassed;
}

// Main test execution
async function runTests() {
    log('Starting Simple Authentication Error Testing...', 'info');
    log(`Testing against: ${config.baseUrl}`, 'info');

    const results = {
        oauthDenial: await testOAuthDenial(),
        invalidState: await testInvalidOAuthState(),
        errorPage: await testErrorPage(),
        sessionEndpoint: await testSessionEndpoint(),
        signInEndpoint: await testSignInEndpoint()
    };

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const failedTests = totalTests - passedTests;

    log('\n=== TEST SUMMARY ===', 'info');
    log(`Total Tests: ${totalTests}`, 'info');
    log(`Passed: ${passedTests}`, 'success');
    log(`Failed: ${failedTests}`, 'error');
    log(`Pass Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'info');

    log('\n=== DETAILED RESULTS ===', 'info');
    Object.entries(results).forEach(([testName, passed]) => {
        log(`${testName}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
    });

    return results;
}

// Run tests
runTests().catch(error => {
    log(`Fatal error during test execution: ${error.message}`, 'error');
    process.exit(1);
});