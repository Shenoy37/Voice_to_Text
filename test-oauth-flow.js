const http = require('http');

// Test the Better Auth endpoints
async function testAuthEndpoints() {
    console.log('Testing Better Auth endpoints...');

    // Test base auth endpoint
    try {
        const response = await fetch('http://localhost:3000/api/auth/');
        console.log('Base auth endpoint status:', response.status);
        const text = await response.text();
        console.log('Base auth endpoint response:', text);
    } catch (error) {
        console.error('Error testing base auth endpoint:', error);
    }

    // Test Google OAuth initiation
    try {
        const response = await fetch('http://localhost:3000/api/auth/social/google', {
            method: 'GET',
            redirect: 'manual' // Don't follow redirects
        });
        console.log('Google OAuth endpoint status:', response.status);
        console.log('Google OAuth headers:', Object.fromEntries(response.headers.entries()));

        if (response.status === 302 || response.status === 301) {
            const location = response.headers.get('location');
            console.log('Redirect location:', location);
        }
    } catch (error) {
        console.error('Error testing Google OAuth endpoint:', error);
    }
}

testAuthEndpoints();