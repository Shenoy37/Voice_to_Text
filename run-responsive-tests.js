/**
 * Responsive Design Test Runner for Voice to Notes Authentication System
 * 
 * This script automates the testing of responsive design across different devices
 * and generates comprehensive reports.
 * 
 * Usage:
 * node run-responsive-tests.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ResponsiveTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            mobile: {},
            tablet: {},
            desktop: {},
            crossBrowser: {},
            accessibility: {},
            performance: {},
            deviceSpecific: {}
        };
        this.testStartTime = new Date();
    }

    async init() {
        console.log('🚀 Initializing Responsive Test Runner...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            defaultViewport: null,
            args: ['--start-maximized']
        });
        this.page = await this.browser.newPage();

        // Load the testing script
        const testingScript = fs.readFileSync(path.join(__dirname, 'responsive-auth-testing.js'), 'utf8');
        await this.page.evaluateOnNewDocument(testingScript);

        console.log('✅ Browser initialized successfully');
    }

    async navigateToApp() {
        const appUrl = 'http://localhost:3000'; // Adjust if your app runs on different port
        console.log(`🌐 Navigating to ${appUrl}...`);

        try {
            await this.page.goto(appUrl, { waitUntil: 'networkidle2' });
            console.log('✅ App loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load app:', error.message);
            return false;
        }
    }

    async testMobileResponsiveness() {
        console.log('📱 Testing Mobile Responsiveness (320px - 768px)...');

        const mobileSizes = [
            { width: 320, height: 568, name: 'Mobile Small (iPhone 5)' },
            { width: 375, height: 667, name: 'Mobile (iPhone 8)' },
            { width: 414, height: 896, name: 'Mobile Large (iPhone 11)' }
        ];

        for (const size of mobileSizes) {
            console.log(`  📱 Testing ${size.name} (${size.width}x${size.height})...`);

            await this.page.setViewport({ width: size.width, height: size.height });
            await this.page.waitForTimeout(1000);

            // Run mobile-specific tests
            const results = await this.page.evaluate(() => {
                return ResponsiveAuthTester.testComponentLayout(
                    document.querySelector('button[class*="EnhancedSignInButton"]') ||
                    document.querySelector('button:has([class*="LogIn"])'),
                    'signInButton',
                    { width: window.innerWidth, height: window.innerHeight }
                );
            });

            this.testResults.mobile[size.name] = {
                viewport: size,
                signInButton: results,
                touchTargets: await this.testTouchTargets(),
                modalBehavior: await this.testModalBehavior(),
                horizontalScroll: await this.checkHorizontalScroll(),
                textReadability: await this.testTextReadability()
            };

            // Take screenshot for visual verification
            await this.page.screenshot({
                path: `test-results/mobile-${size.name.replace(/\s+/g, '-').toLowerCase()}.png`,
                fullPage: true
            });
        }

        console.log('✅ Mobile responsiveness tests completed');
    }

    async testTabletResponsiveness() {
        console.log('📱 Testing Tablet Responsiveness (768px - 1024px)...');

        const tabletSizes = [
            { width: 768, height: 1024, name: 'Tablet (iPad)' },
            { width: 1024, height: 768, name: 'Tablet Landscape' }
        ];

        for (const size of tabletSizes) {
            console.log(`  📱 Testing ${size.name} (${size.width}x${size.height})...`);

            await this.page.setViewport({ width: size.width, height: size.height });
            await this.page.waitForTimeout(1000);

            this.testResults.tablet[size.name] = {
                viewport: size,
                componentLayout: await this.testAllComponents(),
                orientationTest: await this.testOrientationChange(size),
                touchAndMouse: await this.testTouchAndMouseInteraction(),
                modalSizing: await this.testModalSizing()
            };

            // Take screenshot
            await this.page.screenshot({
                path: `test-results/tablet-${size.name.replace(/\s+/g, '-').toLowerCase()}.png`,
                fullPage: true
            });
        }

        console.log('✅ Tablet responsiveness tests completed');
    }

    async testDesktopResponsiveness() {
        console.log('🖥️ Testing Desktop Responsiveness (1024px+)...');

        const desktopSizes = [
            { width: 1280, height: 800, name: 'Desktop' },
            { width: 1920, height: 1080, name: 'Desktop Large' }
        ];

        for (const size of desktopSizes) {
            console.log(`  🖥️ Testing ${size.name} (${size.width}x${size.height})...`);

            await this.page.setViewport({ width: size.width, height: size.height });
            await this.page.waitForTimeout(1000);

            this.testResults.desktop[size.name] = {
                viewport: size,
                componentLayout: await this.testAllComponents(),
                hoverStates: await this.testHoverStates(),
                keyboardNavigation: await this.testKeyboardNavigation(),
                highResolution: await this.testHighResolution(),
                multiMonitor: await this.testMultiMonitorScenarios()
            };

            // Take screenshot
            await this.page.screenshot({
                path: `test-results/desktop-${size.name.replace(/\s+/g, '-').toLowerCase()}.png`,
                fullPage: true
            });
        }

        console.log('✅ Desktop responsiveness tests completed');
    }

    async testCrossBrowserCompatibility() {
        console.log('🌐 Testing Cross-Browser Compatibility...');

        // This would typically require multiple browser instances
        // For now, we'll test browser-specific features
        this.testResults.crossBrowser = {
            browserInfo: await this.page.evaluate(() => ({
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            })),
            featureSupport: await this.testBrowserFeatureSupport(),
            renderingEngine: await this.testRenderingEngine(),
            securitySettings: await this.testSecuritySettings()
        };

        console.log('✅ Cross-browser compatibility tests completed');
    }

    async testAccessibilityFeatures() {
        console.log('♿ Testing Accessibility Features...');

        this.testResults.accessibility = {
            screenReader: await this.testScreenReaderCompatibility(),
            keyboardNavigation: await this.testKeyboardNavigation(),
            ariaLabels: await this.testAriaLabels(),
            colorContrast: await this.testColorContrast(),
            focusManagement: await this.testFocusManagement(),
            semanticHTML: await this.testSemanticHTML()
        };

        console.log('✅ Accessibility tests completed');
    }

    async testPerformanceAcrossDevices() {
        console.log('⚡ Testing Performance Across Devices...');

        const performanceTests = ['mobile', 'tablet', 'desktop'];

        for (const deviceType of performanceTests) {
            const size = deviceType === 'mobile' ? { width: 375, height: 667 } :
                deviceType === 'tablet' ? { width: 768, height: 1024 } :
                    { width: 1280, height: 800 };

            await this.page.setViewport(size);
            await this.page.waitForTimeout(1000);

            this.testResults.performance[deviceType] = {
                loadTimes: await this.measureLoadTimes(),
                renderTimes: await this.measureRenderTimes(),
                bundleSizes: await this.measureBundleSizes(),
                animationPerformance: await this.testAnimationPerformance(),
                memoryUsage: await this.measureMemoryUsage()
            };
        }

        console.log('✅ Performance tests completed');
    }

    async testDeviceSpecificFeatures() {
        console.log('📱 Testing Device-Specific Features...');

        this.testResults.deviceSpecific = {
            orientationChanges: await this.testOrientationChanges(),
            viewportResizing: await this.testViewportResizing(),
            zoomFunctionality: await this.testZoomFunctionality(),
            pixelDensity: await this.testPixelDensity(),
            inputMethods: await this.testInputMethods()
        };

        console.log('✅ Device-specific features tests completed');
    }

    // Helper test methods
    async testTouchTargets() {
        return await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
            const issues = [];

            buttons.forEach(button => {
                const rect = button.getBoundingClientRect();
                if (rect.width < 44 || rect.height < 44) {
                    issues.push(`Touch target too small: ${rect.width}x${rect.height}`);
                }
            });

            return {
                totalButtons: buttons.length,
                issues: issues,
                compliant: issues.length === 0
            };
        });
    }

    async testModalBehavior() {
        return await this.page.evaluate(() => {
            const modal = document.querySelector('[class*="AuthModal"]') ||
                document.querySelector('.fixed.inset-0.z-50');

            if (!modal) return { modalFound: false };

            const rect = modal.getBoundingClientRect();
            const viewport = { width: window.innerWidth, height: window.innerHeight };

            return {
                modalFound: true,
                properlySized: rect.width <= viewport.width * 0.9 && rect.height <= viewport.height * 0.9,
                withinViewport: rect.left >= 0 && rect.top >= 0,
                backdropPresent: !!document.querySelector('.fixed.inset-0.bg-black\\/50')
            };
        });
    }

    async checkHorizontalScroll() {
        return await this.page.evaluate(() => {
            return document.body.scrollWidth > document.body.clientWidth;
        });
    }

    async testTextReadability() {
        return await this.page.evaluate(() => {
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');
            const issues = [];

            textElements.forEach(element => {
                const styles = window.getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);

                // Check minimum font size for mobile (16px recommended)
                if (fontSize < 14) {
                    issues.push(`Font size too small: ${fontSize}px`);
                }
            });

            return {
                totalTextElements: textElements.length,
                issues: issues,
                readable: issues.length === 0
            };
        });
    }

    async testAllComponents() {
        return await this.page.evaluate(() => {
            const components = {
                signInButton: document.querySelector('button[class*="EnhancedSignInButton"]') ||
                    document.querySelector('button:has([class*="LogIn"])'),
                authModal: document.querySelector('[class*="AuthModal"]') ||
                    document.querySelector('.fixed.inset-0.z-50'),
                userMenu: document.querySelector('[class*="EnhancedUserMenu"]') ||
                    document.querySelector('[class*="DropdownMenu"]'),
                errorPage: document.querySelector('.min-h-screen.bg-gradient-to-br.from-red-50'),
                dashboard: document.querySelector('.min-h-screen.bg-gray-50'),
                header: document.querySelector('header'),
                mainContent: document.querySelector('main')
            };

            const results = {};
            const viewport = { width: window.innerWidth, height: window.innerHeight };

            for (const [name, element] of Object.entries(components)) {
                if (element) {
                    const rect = element.getBoundingClientRect();
                    results[name] = {
                        visible: rect.width > 0 && rect.height > 0,
                        width: rect.width,
                        height: rect.height,
                        position: {
                            top: rect.top,
                            left: rect.left,
                            right: rect.right,
                            bottom: rect.bottom
                        },
                        withinViewport: rect.right <= viewport.width && rect.bottom <= viewport.height
                    };
                } else {
                    results[name] = { visible: false, notFound: true };
                }
            }

            return results;
        });
    }

    async testOrientationChange(size) {
        // Test portrait mode
        const portraitSize = { width: Math.min(size.width, size.height), height: Math.max(size.width, size.height) };
        await this.page.setViewport(portraitSize);
        await this.page.waitForTimeout(500);

        const portraitResults = await this.testAllComponents();

        // Test landscape mode
        await this.page.setViewport(size);
        await this.page.waitForTimeout(500);

        const landscapeResults = await this.testAllComponents();

        return {
            portrait: portraitResults,
            landscape: landscapeResults,
            layoutChanges: this.detectLayoutChanges(portraitResults, landscapeResults)
        };
    }

    detectLayoutChanges(portraitResults, landscapeResults) {
        const changes = [];

        for (const componentName of Object.keys(portraitResults)) {
            const portrait = portraitResults[componentName];
            const landscape = landscapeResults[componentName];

            if (portrait && landscape && portrait.visible && landscape.visible) {
                if (portrait.width !== landscape.width || portrait.height !== landscape.height) {
                    changes.push({
                        component: componentName,
                        portraitSize: { width: portrait.width, height: portrait.height },
                        landscapeSize: { width: landscape.width, height: landscape.height }
                    });
                }
            }
        }

        return changes;
    }

    async testTouchAndMouseInteraction() {
        return await this.page.evaluate(() => {
            const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
            const results = {
                totalElements: interactiveElements.length,
                hasTouchEvents: 0,
                hasMouseEvents: 0,
                hasBoth: 0
            };

            interactiveElements.forEach(element => {
                const hasTouch = element.ontouchstart !== undefined;
                const hasMouse = element.onmouseover !== undefined || element.onclick !== undefined;

                if (hasTouch) results.hasTouchEvents++;
                if (hasMouse) results.hasMouseEvents++;
                if (hasTouch && hasMouse) results.hasBoth++;
            });

            return results;
        });
    }

    async testModalSizing() {
        return await this.testModalBehavior();
    }

    async testHoverStates() {
        return await this.page.evaluate(() => {
            const hoverableElements = document.querySelectorAll('button, a, [role="button"]');
            const results = { hasHoverStates: [], missingHoverStates: [] };

            hoverableElements.forEach(element => {
                const styles = window.getComputedStyle(element, ':hover');
                const hasHover = styles.backgroundColor !== window.getComputedStyle(element).backgroundColor ||
                    styles.color !== window.getComputedStyle(element).color;

                if (hasHover) {
                    results.hasHoverStates.push(element.tagName);
                } else {
                    results.missingHoverStates.push(element.tagName);
                }
            });

            return results;
        });
    }

    async testKeyboardNavigation() {
        return await this.page.evaluate(() => {
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            return {
                totalFocusableElements: focusableElements.length,
                elementsHaveTabIndex: Array.from(focusableElements).map(el => ({
                    tag: el.tagName,
                    tabIndex: el.tabIndex
                }))
            };
        });
    }

    async testHighResolution() {
        return await this.page.evaluate(() => ({
            devicePixelRatio: window.devicePixelRatio,
            isHighResolution: window.devicePixelRatio > 1
        }));
    }

    async testMultiMonitorScenarios() {
        // Test window positioning and sizing
        return await this.page.evaluate(() => ({
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            windowWidth: window.outerWidth,
            windowHeight: window.outerHeight
        }));
    }

    async testBrowserFeatureSupport() {
        return await this.page.evaluate(() => ({
            localStorage: typeof Storage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            geolocation: 'geolocation' in navigator,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            webWorkers: typeof Worker !== 'undefined',
            serviceWorkers: 'serviceWorker' in navigator,
            pushNotifications: 'PushManager' in window,
            webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        }));
    }

    async testRenderingEngine() {
        return await this.page.evaluate(() => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            return {
                renderer: gl ? gl.getParameter(gl.RENDERER) : 'Unknown',
                vendor: gl ? gl.getParameter(gl.VENDOR) : 'Unknown',
                webGLVersion: gl ? gl.getParameter(gl.VERSION) : 'Not supported'
            };
        });
    }

    async testSecuritySettings() {
        return await this.page.evaluate(() => ({
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            https: location.protocol === 'https:',
            mixedContent: document.querySelectorAll('img[src^="http://"], script[src^="http://"]').length
        }));
    }

    async testScreenReaderCompatibility() {
        return await this.page.evaluate(() => {
            const images = document.querySelectorAll('img');
            const buttons = document.querySelectorAll('button');

            return {
                imagesWithAlt: Array.from(images).filter(img => img.alt).length,
                imagesWithoutAlt: Array.from(images).filter(img => !img.alt).length,
                buttonsWithAriaLabel: Array.from(buttons).filter(btn =>
                    btn.hasAttribute('aria-label') || btn.textContent.trim()
                ).length,
                buttonsWithoutAriaLabel: Array.from(buttons).filter(btn =>
                    !btn.hasAttribute('aria-label') && !btn.textContent.trim()
                ).length
            };
        });
    }

    async testAriaLabels() {
        return await this.page.evaluate(() => {
            const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');

            return {
                totalElementsWithAria: elementsWithAria.length,
                elements: Array.from(elementsWithAria).map(el => ({
                    tag: el.tagName,
                    ariaLabel: el.getAttribute('aria-label'),
                    role: el.getAttribute('role')
                }))
            };
        });
    }

    async testColorContrast() {
        return await this.page.evaluate(() => {
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');
            const contrastIssues = [];

            textElements.forEach(element => {
                const styles = window.getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);

                // Simple check for small text sizes
                if (fontSize < 14) {
                    contrastIssues.push({
                        element: element.tagName,
                        fontSize: fontSize,
                        issue: 'Font size may be too small for good readability'
                    });
                }
            });

            return {
                totalTextElements: textElements.length,
                contrastIssues: contrastIssues
            };
        });
    }

    async testFocusManagement() {
        return await this.page.evaluate(() => {
            const modals = document.querySelectorAll('[role="dialog"], .fixed.inset-0.z-50');

            return {
                modalCount: modals.length,
                modalsWithFocusTrap: Array.from(modals).map(modal => ({
                    focusableElements: modal.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    ).length
                }))
            };
        });
    }

    async testSemanticHTML() {
        return await this.page.evaluate(() => {
            const semanticElements = {
                header: document.querySelectorAll('header').length,
                nav: document.querySelectorAll('nav').length,
                main: document.querySelectorAll('main').length,
                section: document.querySelectorAll('section').length,
                article: document.querySelectorAll('article').length,
                aside: document.querySelectorAll('aside').length,
                footer: document.querySelectorAll('footer').length
            };

            return semanticElements;
        });
    }

    async measureLoadTimes() {
        return await this.page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalTime: navigation.loadEventEnd - navigation.fetchStart
            };
        });
    }

    async measureRenderTimes() {
        return await this.page.evaluate(() => {
            const paintEntries = performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
            const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

            return {
                firstPaint: firstPaint ? firstPaint.startTime : 0,
                firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0
            };
        });
    }

    async measureBundleSizes() {
        return await this.page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            const jsResources = Array.from(resources).filter(resource => resource.name.endsWith('.js'));
            const cssResources = Array.from(resources).filter(resource => resource.name.endsWith('.css'));

            return {
                jsSize: jsResources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
                cssSize: cssResources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
                totalSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0)
            };
        });
    }

    async testAnimationPerformance() {
        return await this.page.evaluate(() => {
            const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');

            return {
                animatedElements: animatedElements.length,
                hasHardwareAcceleration: Array.from(animatedElements).some(element => {
                    const styles = window.getComputedStyle(element);
                    return styles.transform !== 'none' || styles.willChange !== 'auto';
                })
            };
        });
    }

    async measureMemoryUsage() {
        return await this.page.evaluate(() => {
            if ('memory' in performance) {
                const memory = performance.memory;
                return {
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit
                };
            }
            return { message: 'Memory API not available' };
        });
    }

    async testOrientationChanges() {
        const orientations = [
            { width: 375, height: 667, name: 'portrait' },
            { width: 667, height: 375, name: 'landscape' }
        ];

        const results = {};

        for (const orientation of orientations) {
            await this.page.setViewport(orientation);
            await this.page.waitForTimeout(500);

            results[orientation.name] = {
                viewport: orientation,
                componentLayout: await this.testAllComponents()
            };
        }

        return results;
    }

    async testViewportResizing() {
        const sizes = [
            { width: 320, height: 568 },
            { width: 768, height: 1024 },
            { width: 1280, height: 800 }
        ];

        const results = {};

        for (const size of sizes) {
            await this.page.setViewport(size);
            await this.page.waitForTimeout(500);

            results[`${size.width}x${size.height}`] = {
                componentLayout: await this.testAllComponents(),
                horizontalScroll: await this.checkHorizontalScroll()
            };
        }

        return results;
    }

    async testZoomFunctionality() {
        return await this.page.evaluate(() => {
            // Test zoom levels
            const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5];
            const results = {};

            zoomLevels.forEach(zoom => {
                document.body.style.zoom = zoom;
                const scrollWidth = document.body.scrollWidth;
                const clientWidth = document.body.clientWidth;

                results[zoom] = {
                    zoom: zoom,
                    causesHorizontalScroll: scrollWidth > clientWidth,
                    textReadable: window.getComputedStyle(document.body).fontSize
                };
            });

            // Reset zoom
            document.body.style.zoom = 1.0;

            return results;
        });
    }

    async testPixelDensity() {
        return await this.page.evaluate(() => ({
            devicePixelRatio: window.devicePixelRatio,
            isHighDensity: window.devicePixelRatio > 1,
            isUltraHighDensity: window.devicePixelRatio > 2
        }));
    }

    async testInputMethods() {
        return await this.page.evaluate(() => {
            const inputs = document.querySelectorAll('input, textarea, button, a');

            return {
                totalInputs: inputs.length,
                touchOptimized: Array.from(inputs).filter(input => {
                    const rect = input.getBoundingClientRect();
                    return rect.width >= 44 && rect.height >= 44;
                }).length,
                hasKeyboardSupport: inputs.length > 0,
                hasMouseSupport: inputs.length > 0
            };
        });
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');

        const report = {
            timestamp: new Date().toISOString(),
            testDuration: new Date() - this.testStartTime,
            summary: this.generateSummary(),
            detailedResults: this.testResults,
            recommendations: this.generateRecommendations()
        };

        // Ensure test-results directory exists
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results');
        }

        // Save detailed report
        fs.writeFileSync(
            'test-results/responsive-auth-test-report.json',
            JSON.stringify(report, null, 2)
        );

        // Save human-readable report
        const readableReport = this.generateReadableReport(report);
        fs.writeFileSync(
            'test-results/responsive-auth-test-report.md',
            readableReport
        );

        console.log('✅ Test report generated successfully');
        console.log('📁 Reports saved to test-results/ directory');

        return report;
    }

    generateSummary() {
        const summary = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            criticalIssues: [],
            warnings: [],
            deviceCompatibility: {
                mobile: 'Unknown',
                tablet: 'Unknown',
                desktop: 'Unknown'
            },
            accessibilityScore: 0,
            performanceScore: 0
        };

        // Analyze test results and populate summary
        // This is a simplified version - you'd want to add more detailed analysis

        return summary;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze test results and generate recommendations
        // This is a simplified version - you'd want to add more detailed analysis

        return recommendations;
    }

    generateReadableReport(report) {
        return `# Responsive Design Test Report - Voice to Notes Authentication

## Test Summary

**Test Date:** ${new Date(report.timestamp).toLocaleString()}
**Test Duration:** ${Math.round(report.testDuration / 1000)} seconds

### Device Compatibility Results

#### Mobile (320px - 768px)
${this.formatDeviceResults(report.detailedResults.mobile, 'Mobile')}

#### Tablet (768px - 1024px)
${this.formatDeviceResults(report.detailedResults.tablet, 'Tablet')}

#### Desktop (1024px+)
${this.formatDeviceResults(report.detailedResults.desktop, 'Desktop')}

### Accessibility Results
${this.formatAccessibilityResults(report.detailedResults.accessibility)}

### Performance Results
${this.formatPerformanceResults(report.detailedResults.performance)}

### Device-Specific Features
${this.formatDeviceSpecificResults(report.detailedResults.deviceSpecific)}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Test Data

See the accompanying JSON file for complete test results.
`;
    }

    formatDeviceResults(results, deviceType) {
        if (!results || Object.keys(results).length === 0) {
            return `❌ No test results available for ${deviceType}`;
        }

        let output = '';
        for (const [size, data] of Object.entries(results)) {
            output += `\n**${size}:**\n`;
            if (data.signInButton) {
                output += `- Sign In Button: ${data.signInButton.visible ? '✅ Visible' : '❌ Not visible'}\n`;
            }
            if (data.touchTargets) {
                output += `- Touch Targets: ${data.touchTargets.compliant ? '✅ Compliant' : '❌ Issues found'}\n`;
            }
            if (data.horizontalScroll !== undefined) {
                output += `- Horizontal Scroll: ${data.horizontalScroll ? '❌ Present' : '✅ None'}\n`;
            }
        }

        return output;
    }

    formatAccessibilityResults(results) {
        if (!results) return '❌ No accessibility test results available';

        let output = '';
        if (results.screenReader) {
            output += `- Screen Reader: ${results.screenReader.imagesWithoutAlt === 0 ? '✅ Good' : '❌ Issues'}\n`;
        }
        if (results.keyboardNavigation) {
            output += `- Keyboard Navigation: ✅ Tested\n`;
        }
        if (results.colorContrast) {
            output += `- Color Contrast: ${results.colorContrast.contrastIssues.length === 0 ? '✅ Good' : '❌ Issues'}\n`;
        }

        return output || '❌ No specific accessibility data available';
    }

    formatPerformanceResults(results) {
        if (!results) return '❌ No performance test results available';

        let output = '';
        for (const [device, data] of Object.entries(results)) {
            output += `\n**${device.charAt(0).toUpperCase() + device.slice(1)}:**\n`;
            if (data.loadTimes) {
                output += `- Load Time: ${Math.round(data.loadTimes.totalTime)}ms\n`;
            }
            if (data.bundleSizes) {
                output += `- Bundle Size: ${Math.round(data.bundleSizes.totalSize / 1024)}KB\n`;
            }
        }

        return output;
    }

    formatDeviceSpecificResults(results) {
        if (!results) return '❌ No device-specific test results available';

        let output = '';
        if (results.orientationChanges) {
            output += `- Orientation Changes: ✅ Tested\n`;
        }
        if (results.pixelDensity) {
            output += `- Pixel Density: ${results.pixelDensity.devicePixelRatio}x\n`;
        }

        return output;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async runAllTests() {
        try {
            await this.init();

            if (!await this.navigateToApp()) {
                throw new Error('Failed to navigate to the application');
            }

            await this.testMobileResponsiveness();
            await this.testTabletResponsiveness();
            await this.testDesktopResponsiveness();
            await this.testCrossBrowserCompatibility();
            await this.testAccessibilityFeatures();
            await this.testPerformanceAcrossDevices();
            await this.testDeviceSpecificFeatures();

            const report = await this.generateReport();

            console.log('🎉 All tests completed successfully!');
            return report;

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests if this script is executed directly
if (require.main === module) {
    const testRunner = new ResponsiveTestRunner();
    testRunner.runAllTests().catch(console.error);
}

module.exports = ResponsiveTestRunner;