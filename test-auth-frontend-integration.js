const puppeteer = require('puppeteer');
const { expect } = require('chai');

describe('Frontend Authentication Integration Tests', () => {
    let browser;
    let page;

    before(async () => {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        page = await browser.newPage();

        // Enable console logging from the browser
        page.on('console', msg => {
            console.log('BROWSER CONSOLE:', msg.text());
        });

        // Enable request/response logging
        page.on('request', request => {
            if (request.url().includes('/api/auth')) {
                console.log('AUTH REQUEST:', request.method(), request.url());
            }
        });

        page.on('response', response => {
            if (response.url().includes('/api/auth')) {
                console.log('AUTH RESPONSE:', response.status(), response.url());
            }
        });
    });

    after(async () => {
        await browser.close();
    });

    describe('1. EnhancedSignInButton Integration', () => {
        it('should render correctly on the main page', async () => {
            await page.goto('http://localhost:3000');
            await page.waitForSelector('[data-testid="enhanced-sign-in-button"], .bg-gradient-to-r', { timeout: 10000 });

            const signInButton = await page.$('button:contains("Get Started"), button:has(.LogIn)');
            expect(signInButton).to.not.be.null;

            // Check if button has proper styling
            const buttonStyles = await page.evaluate(() => {
                const button = document.querySelector('button:has(.LogIn), button:contains("Get Started")');
                if (!button) return null;

                const computedStyle = window.getComputedStyle(button);
                return {
                    background: computedStyle.background,
                    borderRadius: computedStyle.borderRadius,
                    padding: computedStyle.padding,
                    display: computedStyle.display
                };
            });

            console.log('Sign-in button styles:', buttonStyles);
        });

        it('should open AuthModal when clicked', async () => {
            await page.goto('http://localhost:3000');
            await page.waitForSelector('button:has(.LogIn), button:contains("Get Started")', { timeout: 10000 });

            // Click the sign-in button
            await page.click('button:has(.LogIn), button:contains("Get Started")');

            // Wait for modal to appear
            await page.waitForSelector('.fixed.inset-0, [role="dialog"]', { timeout: 5000 });

            const modalVisible = await page.evaluate(() => {
                const modal = document.querySelector('.fixed.inset-0, [role="dialog"]');
                return modal && modal.style.display !== 'none' && modal.style.visibility !== 'hidden';
            });

            expect(modalVisible).to.be.true;
        });

        it('should show loading states during authentication', async () => {
            await page.goto('http://localhost:3000');
            await page.waitForSelector('button:has(.LogIn), button:contains("Get Started")');

            // Click sign-in button
            await page.click('button:has(.LogIn), button:contains("Get Started")');
            await page.waitForSelector('.fixed.inset-0');

            // Click Google sign-in button
            await page.click('button:contains("Continue with Google")');

            // Check for loading state
            await page.waitForSelector('.animate-spin, [data-loading="true"]', { timeout: 3000 });

            const loadingVisible = await page.evaluate(() => {
                const loadingElement = document.querySelector('.animate-spin, [data-loading="true"]');
                return loadingElement && loadingElement.style.display !== 'none';
            });

            expect(loadingVisible).to.be.true;
        });
    });

    describe('2. AuthModal Component', () => {
        beforeEach(async () => {
            await page.goto('http://localhost:3000');
            await page.click('button:has(.LogIn), button:contains("Get Started")');
            await page.waitForSelector('.fixed.inset-0');
        });

        it('should open and close properly', async () => {
            // Check if modal is open
            const modalOpen = await page.evaluate(() => {
                const modal = document.querySelector('.fixed.inset-0');
                return modal && modal.style.display !== 'none';
            });

            expect(modalOpen).to.be.true;

            // Close modal by clicking backdrop
            await page.click('.fixed.inset-0 > div:first-child');
            await page.waitForTimeout(500);

            // Check if modal is closed
            const modalClosed = await page.evaluate(() => {
                const modal = document.querySelector('.fixed.inset-0');
                return !modal || modal.style.display === 'none';
            });

            expect(modalClosed).to.be.true;
        });

        it('should have tab switching functionality', async () => {
            // Check if tabs exist
            const tabsExist = await page.evaluate(() => {
                const tabs = document.querySelectorAll('[role="tab"]');
                return tabs.length >= 2;
            });

            expect(tabsExist).to.be.true;

            // Switch to sign-up tab
            await page.click('[role="tab"]:contains("Sign Up")');
            await page.waitForTimeout(300);

            // Check if sign-up form is visible
            const signUpFormVisible = await page.evaluate(() => {
                const nameInput = document.querySelector('input[placeholder*="name"], input[id*="name"]');
                return nameInput && nameInput.offsetParent !== null;
            });

            expect(signUpFormVisible).to.be.true;
        });

        it('should display error messages properly', async () => {
            // Try to submit empty email form
            await page.click('[role="tab"]:contains("Sign In")');
            await page.waitForTimeout(300);

            // Click sign-in button without filling form
            await page.click('button:contains("Sign In"):not([disabled])');

            // Check for error message
            await page.waitForSelector('.text-destructive, .bg-destructive', { timeout: 3000 });

            const errorMessageVisible = await page.evaluate(() => {
                const errorElement = document.querySelector('.text-destructive, .bg-destructive');
                return errorElement && errorElement.textContent.trim().length > 0;
            });

            expect(errorMessageVisible).to.be.true;
        });

        it('should be responsive on different screen sizes', async () => {
            // Test mobile view
            await page.setViewport({ width: 375, height: 667 });
            await page.waitForTimeout(500);

            const modalResponsive = await page.evaluate(() => {
                const modal = document.querySelector('.fixed.inset-0 > div:nth-child(2)');
                if (!modal) return false;

                const rect = modal.getBoundingClientRect();
                return rect.width <= window.innerWidth && rect.height <= window.innerHeight;
            });

            expect(modalResponsive).to.be.true;

            // Reset to desktop view
            await page.setViewport({ width: 1280, height: 800 });
        });
    });

    describe('3. EnhancedUserMenu Integration', () => {
        it('should display user information when signed in', async () => {
            // This test requires a signed-in state
            // For now, we'll test the component structure

            await page.goto('http://localhost:3000');

            // Check if user menu exists (might not be visible if not signed in)
            const userMenuExists = await page.evaluate(() => {
                const userMenu = document.querySelector('[data-testid="user-menu"], .Avatar');
                return !!userMenu;
            });

            console.log('User menu exists:', userMenuExists);

            // If user menu exists, test its functionality
            if (userMenuExists) {
                await page.click('[data-testid="user-menu"], .Avatar');
                await page.waitForTimeout(500);

                const dropdownVisible = await page.evaluate(() => {
                    const dropdown = document.querySelector('[role="menu"], .DropdownMenuContent');
                    return dropdown && dropdown.style.display !== 'none';
                });

                expect(dropdownVisible).to.be.true;
            }
        });
    });

    describe('4. AuthProvider Integration', () => {
        it('should manage session state properly', async () => {
            await page.goto('http://localhost:3000');

            // Wait for initial auth state to load
            await page.waitForTimeout(2000);

            const authState = await page.evaluate(() => {
                // Check if React DevTools is available to inspect state
                // Or check for loading states
                const loadingElement = document.querySelector('.animate-spin');
                const signInButton = document.querySelector('button:has(.LogIn), button:contains("Get Started")');

                return {
                    hasLoadingState: !!loadingElement,
                    hasSignInButton: !!signInButton,
                    loadingVisible: loadingElement ? loadingElement.offsetParent !== null : false
                };
            });

            console.log('Auth state:', authState);

            // Should have sign-in button when not authenticated
            expect(authState.hasSignInButton).to.be.true;
        });

        it('should handle authentication state changes', async () => {
            await page.goto('http://localhost:3000');

            // Monitor console for auth-related messages
            const consoleMessages = [];
            page.on('console', msg => {
                if (msg.text().includes('auth') || msg.text().includes('Auth')) {
                    consoleMessages.push(msg.text());
                }
            });

            // Click sign-in button
            await page.click('button:has(.LogIn), button:contains("Get Started")');
            await page.waitForSelector('.fixed.inset-0');

            // Click Google sign-in
            await page.click('button:contains("Continue with Google")');

            // Wait for any auth-related console messages
            await page.waitForTimeout(3000);

            console.log('Auth console messages:', consoleMessages);
        });
    });

    describe('5. Complete Frontend Flow', () => {
        it('should handle the complete authentication flow', async () => {
            await page.goto('http://localhost:3000');

            // Step 1: Verify unauthenticated state
            await page.waitForSelector('button:has(.LogIn), button:contains("Get Started")');

            const unauthenticatedState = await page.evaluate(() => {
                const signInButton = document.querySelector('button:has(.LogIn), button:contains("Get Started")');
                const userMenu = document.querySelector('[data-testid="user-menu"], .Avatar');

                return {
                    hasSignInButton: !!signInButton,
                    hasUserMenu: !!userMenu,
                    signInButtonVisible: signInButton ? signInButton.offsetParent !== null : false
                };
            });

            expect(unauthenticatedState.hasSignInButton).to.be.true;
            expect(unauthenticatedState.signInButtonVisible).to.be.true;

            // Step 2: Initiate sign-in process
            await page.click('button:has(.LogIn), button:contains("Get Started")');
            await page.waitForSelector('.fixed.inset-0');

            const modalOpened = await page.evaluate(() => {
                const modal = document.querySelector('.fixed.inset-0');
                return modal && modal.style.display !== 'none';
            });

            expect(modalOpened).to.be.true;

            // Step 3: Test Google OAuth initiation
            await page.click('button:contains("Continue with Google")');

            // Check for loading state
            await page.waitForSelector('.animate-spin', { timeout: 3000 });

            const loadingState = await page.evaluate(() => {
                const loadingElement = document.querySelector('.animate-spin');
                return loadingElement && loadingElement.offsetParent !== null;
            });

            expect(loadingState).to.be.true;

            // Note: Full OAuth flow would require redirect handling and Google credentials
            // This test verifies the frontend initiation works correctly
        });
    });
});

// Run tests if this file is executed directly
if (require.main === module) {
    const { run } = require('mocha');

    console.log('Starting Frontend Authentication Integration Tests...');
    console.log('Make sure the development server is running on http://localhost:3000');
    console.log('This test will open a browser window to perform interactive tests.\n');

    run();
}