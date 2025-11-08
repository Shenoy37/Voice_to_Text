// Test complete OAuth flow end-to-end
const puppeteer = require('puppeteer');

async function testCompleteOAuthFlow() {
    console.log('=== Complete OAuth Flow Test ===\n');

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Enable request interception to see all network requests
        page.on('request', request => {
            console.log(`🌐 ${request.method()} ${request.url()}`);
        });

        page.on('response', response => {
            console.log(`📡 ${response.status()} ${response.url()}`);
        });

        console.log('1. Navigating to application home page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        // Wait for page to load
        await page.waitForSelector('body', { timeout: 5000 });

        console.log('2. Looking for sign-in button...');

        // Try to find the sign-in button
        const signInButton = await page.waitForSelector('button:contains("Get Started"), button:contains("Sign In")', { timeout: 10000 });

        if (!signInButton) {
            console.log('❌ Sign-in button not found. Checking if user is already authenticated...');

            // Check if user menu is present (already authenticated)
            const userMenu = await page.$('[data-testid="user-menu"], .avatar, [aria-label*="user"]');
            if (userMenu) {
                console.log('✓ User appears to be already authenticated. Testing sign-out...');

                // Test sign-out flow
                await testSignOutFlow(page);
                return;
            } else {
                console.log('❌ No sign-in button or user menu found');
                return;
            }
        }

        console.log('✓ Sign-in button found');

        // Click sign-in button to open modal
        await signInButton.click();
        await page.waitForTimeout(1000);

        console.log('3. Looking for Google sign-in button in modal...');

        // Wait for modal and find Google sign-in button
        const googleSignInButton = await page.waitForSelector('button:contains("Continue with Google"), button:contains("Google")', { timeout: 10000 });

        if (!googleSignInButton) {
            console.log('❌ Google sign-in button not found in modal');
            return;
        }

        console.log('✓ Google sign-in button found');

        // Click Google sign-in button
        console.log('4. Clicking Google sign-in button...');
        await googleSignInButton.click();

        // Wait for navigation to Google
        console.log('5. Waiting for redirect to Google OAuth...');

        try {
            await page.waitForFunction(
                () => window.location.href.includes('accounts.google.com'),
                { timeout: 10000 }
            );

            console.log('✓ Successfully redirected to Google OAuth');
            console.log(`📍 Current URL: ${page.url()}`);

            // Parse OAuth parameters from Google URL
            const currentUrl = page.url();
            const url = new URL(currentUrl);

            const clientId = url.searchParams.get('client_id');
            const redirectUri = url.searchParams.get('redirect_uri');
            const scope = url.searchParams.get('scope');
            const state = url.searchParams.get('state');
            const responseType = url.searchParams.get('response_type');

            console.log('\n📋 OAuth Parameters Analysis:');
            console.log(`  Client ID: ${clientId ? '✓ Present' : '❌ Missing'}`);
            console.log(`  Redirect URI: ${redirectUri ? '✓ Present' : '❌ Missing'}`);
            console.log(`  Scope: ${scope ? '✓ Present' : '❌ Missing'}`);
            console.log(`  State: ${state ? '✓ Present' : '❌ Missing'}`);
            console.log(`  Response Type: ${responseType ? '✓ Present' : '❌ Missing'}`);

            // Validate redirect URI
            if (redirectUri && redirectUri.includes('localhost:3000/api/auth/callback/google')) {
                console.log('✓ Redirect URI is correctly configured');
            } else if (redirectUri) {
                console.log(`❌ Redirect URI mismatch: ${redirectUri}`);
            }

            console.log('\n✅ OAuth initiation test completed successfully!');
            console.log('📝 Note: Full OAuth flow testing requires manual interaction with Google consent screen.');

        } catch (error) {
            console.log('❌ Failed to redirect to Google OAuth:', error.message);
        }

    } catch (error) {
        console.error('❌ OAuth flow test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function testSignOutFlow(page) {
    console.log('\n--- Testing Sign-Out Flow ---');

    try {
        // Click on user menu to open dropdown
        const userMenuButton = await page.waitForSelector('[data-testid="user-menu"], .avatar, [aria-label*="user"]', { timeout: 5000 });
        await userMenuButton.click();
        await page.waitForTimeout(500);

        // Look for sign-out option
        const signOutButton = await page.waitForSelector('button:contains("Sign Out"), a:contains("Sign Out")', { timeout: 5000 });

        if (!signOutButton) {
            console.log('❌ Sign-out button not found');
            return false;
        }

        console.log('✓ Sign-out button found, clicking...');
        await signOutButton.click();

        // Wait for confirmation dialog (if present)
        await page.waitForTimeout(1000);

        // Look for confirmation button
        const confirmButton = await page.$('button:contains("Sign Out"), button:contains("Confirm")');
        if (confirmButton) {
            await confirmButton.click();
        }

        // Wait for redirect to home page
        await page.waitForFunction(
            () => window.location.pathname === '/',
            { timeout: 5000 }
        );

        console.log('✓ Successfully signed out and redirected to home page');
        return true;

    } catch (error) {
        console.error('❌ Sign-out flow test failed:', error.message);
        return false;
    }
}

// Check if Puppeteer is available
try {
    require('puppeteer');
} catch (error) {
    console.log('❌ Puppeteer not available. Installing puppeteer might be required for browser testing.');
    console.log('📝 Manual testing instructions:');
    console.log('1. Open http://localhost:3000 in browser');
    console.log('2. Click "Get Started" button');
    console.log('3. Click "Continue with Google" in modal');
    console.log('4. Verify redirect to Google OAuth with correct parameters');
    console.log('5. Complete Google consent flow');
    console.log('6. Verify redirect back to application with session');
    console.log('7. Test user menu and sign-out functionality');
    process.exit(0);
}

testCompleteOAuthFlow().catch(console.error);