const http = require('http');

// Test the Better Auth endpoints comprehensively
async function testOAuthFlow() {
    console.log('=== Comprehensive OAuth Flow Test ===\n');

    const baseURL = 'http://localhost:3000';

    // Test 1: Check if the application is running
    console.log('1. Testing application health...');
    try {
        const response = await fetch(`${baseURL}/`);
        console.log(`✓ Application is running (Status: ${response.status})`);
    } catch (error) {
        console.error('✗ Application is not running:', error.message);
        return;
    }

    // Test 2: Test Better Auth handler endpoints
    console.log('\n2. Testing Better Auth handler endpoints...');

    const authEndpoints = [
        '/api/auth',
        '/api/auth/signin',
        '/api/auth/signin/google',
        '/api/auth/signout',
        '/api/auth/session',
        '/api/auth/callback/google'
    ];

    for (const endpoint of authEndpoints) {
        try {
            const response = await fetch(`${baseURL}${endpoint}`, {
                method: 'GET',
                redirect: 'manual' // Don't follow redirects for OAuth endpoints
            });
            console.log(`${endpoint}: ${response.status} ${response.statusText}`);

            if (response.status === 302 || response.status === 301) {
                const location = response.headers.get('location');
                console.log(`  → Redirects to: ${location}`);
            }

            if (response.status === 200) {
                const contentType = response.headers.get('content-type');
                console.log(`  → Content-Type: ${contentType}`);
            }
        } catch (error) {
            console.error(`${endpoint}: Error - ${error.message}`);
        }
    }

    // Test 3: Test OAuth initiation with proper headers
    console.log('\n3. Testing Google OAuth initiation...');
    try {
        const response = await fetch(`${baseURL}/api/auth/signin/google`, {
            method: 'GET',
            redirect: 'manual',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log(`Google OAuth initiation status: ${response.status}`);

        if (response.status === 302 || response.status === 301) {
            const location = response.headers.get('location');
            console.log(`✓ Redirect location: ${location}`);

            // Parse the redirect URL to verify OAuth parameters
            if (location && location.includes('accounts.google.com')) {
                const url = new URL(location);
                const params = {
                    client_id: url.searchParams.get('client_id'),
                    redirect_uri: url.searchParams.get('redirect_uri'),
                    scope: url.searchParams.get('scope'),
                    state: url.searchParams.get('state'),
                    response_type: url.searchParams.get('response_type')
                };

                console.log('\nOAuth Parameters:');
                Object.entries(params).forEach(([key, value]) => {
                    if (value) {
                        console.log(`  ${key}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
                    } else {
                        console.log(`  ${key}: MISSING`);
                    }
                });

                // Validate required parameters
                const requiredParams = ['client_id', 'redirect_uri', 'scope', 'state', 'response_type'];
                const missingParams = requiredParams.filter(param => !params[param]);

                if (missingParams.length === 0) {
                    console.log('✓ All required OAuth parameters are present');
                } else {
                    console.log(`✗ Missing OAuth parameters: ${missingParams.join(', ')}`);
                }
            }
        } else {
            const responseText = await response.text();
            console.log(`Response body: ${responseText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.error('✗ Error testing Google OAuth initiation:', error.message);
    }

    // Test 4: Test session endpoint
    console.log('\n4. Testing session endpoint...');
    try {
        const response = await fetch(`${baseURL}/api/auth/session`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log(`Session endpoint status: ${response.status}`);

        if (response.status === 200) {
            const sessionData = await response.json();
            console.log('✓ Session data:', JSON.stringify(sessionData, null, 2));
        } else {
            const responseText = await response.text();
            console.log(`Response: ${responseText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.error('✗ Error testing session endpoint:', error.message);
    }

    // Test 5: Test CORS and security headers
    console.log('\n5. Testing security headers...');
    try {
        const response = await fetch(`${baseURL}/api/auth/signin/google`, {
            method: 'OPTIONS'
        });

        const securityHeaders = {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
            'x-frame-options': response.headers.get('x-frame-options'),
            'x-content-type-options': response.headers.get('x-content-type-options'),
            'referrer-policy': response.headers.get('referrer-policy')
        };

        console.log('Security Headers:');
        Object.entries(securityHeaders).forEach(([header, value]) => {
            console.log(`  ${header}: ${value || 'NOT SET'}`);
        });
    } catch (error) {
        console.error('✗ Error testing security headers:', error.message);
    }

    console.log('\n=== OAuth Flow Test Complete ===');
}

// Run the test
testOAuthFlow().catch(console.error);