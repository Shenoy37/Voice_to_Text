
/**
 * Simple Responsive Design Testing for Voice to Notes Authentication
 * 
 * This script uses Puppeteer to directly test responsive design
 * without relying on complex browser script injection.
 * 
 * Usage: node simple-responsive-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SimpleResponsiveTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            mobile: {},
            tablet: {},
            desktop: {},
            accessibility: {},
            performance: {}
        };
        this.testStartTime = Date.now();
    }

    async init() {
        console.log('🚀 Initializing Simple Responsive Test Runner...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable console logging from page
        this.page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log('PAGE:', msg.text());
            }
        });
        
        console.log('✅ Browser initialized successfully');
    }

    async navigateToApp() {
        const appUrl = 'http://localhost:3000';
        console.log(`🌐 Navigating to ${appUrl}...`);
        
        try {
            await this.page.goto(appUrl, { waitUntil: 'networkidle2' });
            console.log('✅ App loaded successfully');
            
            // Wait for page to fully load
            await new Promise(resolve => setTimeout(resolve, 2000));
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const results = await this.testComponentsAtSize(size);
            
            // Test mobile-specific issues
            results.mobileSpecific = {
                horizontalScroll: await this.checkHorizontalScroll(),
                touchTargets: await this.testTouchTargets(),
                textReadability: await this.testTextReadability(size),
                modalBehavior: await this.testModalBehavior(size)
            };
            
            // Take screenshot
            await this.page.screenshot({
                path: `test-results/mobile-${size.name.replace(/\s+/g, '-').toLowerCase()}.png`,
                fullPage: true
            });
            
            this.testResults.mobile[size.name] = results;
        }
        
        console.log('✅ Mobile responsiveness tests completed');
        return this.testResults.mobile;
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const results = await this.testComponentsAtSize(size);
            
            // Test tablet-specific features
            results.tabletSpecific = {
                orientationTest: await this.testOrientationChange(size),
                touchAndMouse: await this.testTouchAndMouseInteraction()
            };
            
            // Take screenshot
            await this.page.screenshot({
                path: `test-results/tablet-${size.name.replace(/\s+/g, '-').toLowerCase()}.png`,
                fullPage: true
            });
            
            this.testResults.tablet[size.name] = results;
        }
        
        console.log('✅ Tablet responsiveness tests completed');
        return this.testResults.tablet;
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const results = await this.testComponentsAtSize(size);
            
            // Test desktop-specific features
            results.desktopSpecific = {
                hoverStates: await this.testHoverStates(),
                keyboardNavigation: await this.testKeyboardNavigation(),
                highResolution: await this.testHighResolution()
            };
            
            // Take screenshot
            await this.page.screenshot({
                path: `test-results/desktop-${size.name.replace(/\s+/g, '-').toLowerCase()}.png`,
                fullPage: true
            });
            
            this.testResults.desktop[size.name] = results;
        }
        
        console.log('✅ Desktop responsiveness tests completed');
        return this.testResults.desktop;
    }

    async testComponentsAtSize(size) {
        return await this.page.evaluate((viewportSize) => {
            const components = {
                signInButton: document.querySelector('button[class*="EnhancedSignInButton"]') || 
                              document.querySelector('button:has([class*="LogIn"])') ||
                              document.querySelector('button'),
                authModal: document.querySelector('[class*="AuthModal"]') || 
                           document.querySelector('.fixed.inset-0.z-50') ||
                           document.querySelector('[role="dialog"]'),
                userMenu: document.querySelector('[class*="EnhancedUserMenu"]') || 
                          document.querySelector('[class*="DropdownMenu"]') ||
                          document.querySelector('[data-testid="user-menu"]'),
                errorPage: document.querySelector('.min-h-screen.bg-gradient-to-br.from-red-50'),
                dashboard: document.querySelector('.min-h-screen.bg-gray-50'),
                header: document.querySelector('header'),
                mainContent: document.querySelector('main'),
                formInputs: document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]'),
                buttons: document.querySelectorAll('button, a[href]')
            };

            const results = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    if (component.length !== undefined) { // It's a NodeList
                        results[componentName] = Array.from(component).map((el, index) => 
                            testElementLayout(el, `${componentName}[${index}]`, viewportSize)
                        );
                    } else {
                        results[componentName] = testElementLayout(component, componentName, viewportSize);
                    }
                } else {
                    results[componentName] = { visible: false, notFound: true };
                }
            }

            function testElementLayout(element, name, viewportSize) {
                const rect = element.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(element);
                
                return {
                    visible: rect.width > 0 && rect.height > 0,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    position: {
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        right: Math.round(rect.right),
                        bottom: Math.round(rect.bottom)
                    },
                    withinViewport: rect.left >= 0 && rect.top >= 0 && 
                                   rect.right <= viewportSize.width && rect.bottom <= viewportSize.height,
                    overflow: computedStyle.overflow === 'hidden' || computedStyle.overflow === 'scroll',
                    truncated: element.offsetWidth < element.scrollWidth,
                    fontSize: parseFloat(computedStyle.fontSize),
                    color: computedStyle.color,
                    backgroundColor: computedStyle.backgroundColor,
                    hasTabIndex: element.hasAttribute('tabindex'),
                    tabIndex: element.tabIndex,
                    hasAriaLabel: element.hasAttribute('aria-label') || element.textContent.trim(),
                    tagName: element.tagName,
                    className: element.className,
                    issues: []
                };
            }

            return results;
        }, size);
    }

    async checkHorizontalScroll() {
        return await this.page.evaluate(() => {
            return document.body.scrollWidth > document.body.clientWidth;
        });
    }

    async testTouchTargets() {
        return await this.page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
            const issues = [];
            
            buttons.forEach((button, index) => {
                const rect = button.getBoundingClientRect();
                if (rect.width < 44 || rect.height < 44) {
                    issues.push(`Button ${index + 1} too small: ${rect.width}x${rect.height}px`);
                }
            });
            
            return {
                totalButtons: buttons.length,
                issues: issues,
                compliant: issues.length === 0
            };
        });
    }

    async testTextReadability(size) {
        return await this.page.evaluate((viewportSize) => {
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');
            const issues = [];
            
            textElements.forEach(element => {
                const styles = window.getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);
                
                // Check minimum font size for mobile
                const minFontSize = viewportSize.width <= 375 ? 14 : 12;
                if (fontSize < minFontSize) {
                    issues.push(`Font size too small: ${fontSize}px (minimum: ${minFontSize}px)`);
                }
                
                // Check line height
                const lineHeight = parseFloat(styles.lineHeight);
                if (lineHeight < 1.2) {
                    issues.push(`Line height too small: ${lineHeight}`);
                }
            });
            
            return {
                totalTextElements: textElements.length,
                issues: issues,
                readable: issues.length === 0
            };
        }, size);
    }

    async testModalBehavior(size) {
        return await this.page.evaluate((viewportSize) => {
            const modal = document.querySelector('[class*="AuthModal"]') || 
                         document.querySelector('.fixed.inset-0.z-50') ||
                         document.querySelector('[role="dialog"]');
            
            if (!modal) return { modalFound: false };

            const rect = modal.getBoundingClientRect();
            const results = {
                modalFound: true,
                properlySized: rect.width <= viewportSize.width * 0.9 && rect.height <= viewportSize.height * 0.9,
                withinViewport: rect.left >= 0 && rect.top >= 0,
                backdropPresent: !!document.querySelector('.fixed.inset-0.bg-black\\/50') ||
                               !!document.querySelector('[class*="backdrop"]') ||
                               !!document.querySelector('[class*="modal-backdrop"]'),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                issues: []
            };

            if (!results.properlySized) {
                results.issues.push('Modal too large for viewport');
            }
            if (!results.withinViewport) {
                results.issues.push('Modal extends beyond viewport');
            }
            if (!results.backdropPresent) {
                results.issues.push('Modal backdrop missing');
            }

            return results;
        }, size);
    }

    async testOrientationChange(size) {
        // Test portrait mode
        const portraitSize = { width: Math.min(size.width, size.height), height: Math.max(size.width, size.height) };
        await this.page.setViewport(portraitSize);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const portraitResults = await this.testComponentsAtSize(portraitSize);
        
        // Test landscape mode
        await this.page.setViewport(size);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const landscapeResults = await this.testComponentsAtSize(size);
        
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

    async testHoverStates() {
        return await this.page.evaluate(() => {
            const hoverableElements = document.querySelectorAll('button, a, [role="button"]');
            const results = { hasHoverStates: [], missingHoverStates: [] };
            
            hoverableElements.forEach(element => {
                const hasHoverClass = element.className.includes('hover:') || 
                                     element.className.includes('group-hover:') ||
                                     element.hasAttribute('onmouseover') ||
                                     element.hasAttribute('onmouseenter');
                
                if (hasHoverClass) {
                    results.hasHoverStates.push(element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''));
                } else {
                    results.missingHoverStates.push(element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''));
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
                    tabIndex: el.tabIndex,
                    hasAriaLabel: el.hasAttribute('aria-label') || el.textContent.trim()
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

    async testAccessibilityFeatures() {
        console.log('♿ Testing Accessibility Features...');
        
        const accessibilityResults = {
            screenReader: await this.testScreenReaderCompatibility(),
            keyboardNavigation: await this.testKeyboardNavigation(),
            colorContrast: await this.testColorContrast(),
            focusManagement: await this.testFocusManagement(),
            semanticHTML: await this.testSemanticHTML()
        };

        this.testResults.accessibility = accessibilityResults;
        console.log('✅ Accessibility tests completed');
        return accessibilityResults;
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

    async testColorContrast() {
        return await this.page.evaluate(() => {
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');
            const contrastIssues = [];
            
            textElements.forEach(element => {
                const styles = window.getComputedStyle(element);
                const fontSize = parseFloat(styles.fontSize);
                
                // Basic checks for common contrast issues
                if (styles.color === styles.backgroundColor) {
                    contrastIssues.push({
                        element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                        issue: 'Text color same as background'
                    });
                }
                
                // Check for very light colors on white background
                if (styles.backgroundColor === 'rgb(255, 255, 255)' || styles.backgroundColor === 'white') {
                    const color = styles.color;
                    if (color.includes('240, 240, 240') || color.includes('250, 250, 250')) {
                        contrastIssues.push({
                            element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                            issue: 'Very light text on white background'
                        });
                    }
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
                footer: document.querySelectorAll('footer').length,
                landmarkRoles: document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"]').length
            };
            
            return semanticElements;
        });
    }

    async testPerformanceAcrossDevices() {
        console.log('⚡ Testing Performance Across Devices...');
        
        const performanceTests = ['mobile', 'tablet', 'desktop'];
        const performanceResults = {};
        
        for (const deviceType of performanceTests) {
            const size = deviceType === 'mobile' ? { width: 375, height: 667 } :
                        deviceType === 'tablet' ? { width: 768, height: 1024 } :
                        { width: 1280, height: 800 };
            
            await this.page.setViewport(size);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            performanceResults[deviceType] = {
                loadTimes: await this.measureLoadTimes(),
                renderTimes: await this.measureRenderTimes(),
                bundleSizes: await this.measureBundleSizes()
            };
        }
        
        this.testResults.performance = performanceResults;
        console.log('✅ Performance tests completed');
        return performanceResults;
    }

    async measureLoadTimes() {
        return await this.page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (!navigation) return { message: 'Navigation timing not available' };
            
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

