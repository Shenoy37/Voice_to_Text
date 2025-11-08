/**
 * Responsive Design Testing Script for Voice to Notes Authentication System
 * 
 * This script tests authentication components across different device sizes
 * and provides detailed feedback on responsive design issues.
 * 
 * Usage:
 * 1. Open the Voice to Notes application in your browser
 * 2. Open browser developer tools (F12)
 * 3. Copy and paste this script into the console
 * 4. Run the test functions to check responsive design
 */

const ResponsiveAuthTester = {
    // Test configurations for different device sizes
    deviceSizes: {
        mobileSmall: { width: 320, height: 568, name: 'Mobile Small (iPhone 5)' },
        mobile: { width: 375, height: 667, name: 'Mobile (iPhone 8)' },
        mobileLarge: { width: 414, height: 896, name: 'Mobile Large (iPhone 11)' },
        tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
        tabletLandscape: { width: 1024, height: 768, name: 'Tablet Landscape' },
        desktop: { width: 1280, height: 800, name: 'Desktop' },
        desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large' }
    },

    // Test results storage
    testResults: {
        mobile: {},
        tablet: {},
        desktop: {},
        crossBrowser: {},
        accessibility: {},
        performance: {}
    },

    // Current test state
    currentTest: null,
    testStartTime: null,

    /**
     * Initialize the testing framework
     */
    init() {
        console.log('%c🔍 Responsive Authentication Testing Framework', 'font-size: 16px; font-weight: bold; color: #2196F3;');
        console.log('Initializing responsive design tests for Voice to Notes authentication system...');

        this.createTestUI();
        this.setupEventListeners();
        console.log('Testing framework initialized. Use the test panel or run ResponsiveAuthTester.runAllTests() to begin.');
    },

    /**
     * Create a testing UI overlay
     */
    createTestUI() {
        const testPanel = document.createElement('div');
        testPanel.id = 'responsive-test-panel';
        testPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: white;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
        `;

        testPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #2196F3;">🔍 Auth Responsive Tests</h3>
            <div style="margin-bottom: 10px;">
                <button id="run-all-tests" style="background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Run All Tests</button>
            </div>
            <div style="margin-bottom: 10px;">
                <button id="test-mobile" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Mobile</button>
                <button id="test-tablet" style="background: #FF9800; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Tablet</button>
                <button id="test-desktop" style="background: #9C27B0; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">Desktop</button>
            </div>
            <div style="margin-bottom: 10px;">
                <button id="test-accessibility" style="background: #795548; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Accessibility</button>
                <button id="test-performance" style="background: #607D8B; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">Performance</button>
            </div>
            <div id="test-status" style="background: #f5f5f5; padding: 8px; border-radius: 4px; min-height: 60px; font-size: 11px;">
                Ready to run tests...
            </div>
            <div style="margin-top: 10px;">
                <button id="close-panel" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Close Panel</button>
            </div>
        `;

        document.body.appendChild(testPanel);
    },

    /**
     * Setup event listeners for the test UI
     */
    setupEventListeners() {
        document.getElementById('run-all-tests').addEventListener('click', () => this.runAllTests());
        document.getElementById('test-mobile').addEventListener('click', () => this.testMobileResponsiveness());
        document.getElementById('test-tablet').addEventListener('click', () => this.testTabletResponsiveness());
        document.getElementById('test-desktop').addEventListener('click', () => this.testDesktopResponsiveness());
        document.getElementById('test-accessibility').addEventListener('click', () => this.testAccessibilityFeatures());
        document.getElementById('test-performance').addEventListener('click', () => this.testPerformanceAcrossDevices());
        document.getElementById('close-panel').addEventListener('click', () => {
            document.getElementById('responsive-test-panel').remove();
        });
    },

    /**
     * Update test status in the UI
     */
    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('test-status');
        if (statusEl) {
            const timestamp = new Date().toLocaleTimeString();
            const color = type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3';
            statusEl.innerHTML = `<div style="color: ${color};">[${timestamp}] ${message}</div>` + statusEl.innerHTML;
        }
        console.log(`%c${message}`, `color: ${type === 'error' ? 'red' : type === 'success' ? 'green' : type === 'warning' ? 'orange' : 'blue'}`);
    },

    /**
     * Set viewport size for testing
     */
    setViewport(width, height) {
        // Store original viewport
        if (!this.originalViewport) {
            this.originalViewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        // Resize viewport (this works in Chrome DevTools device mode)
        if (window.outerWidth) {
            window.resizeTo(width + (window.outerWidth - window.innerWidth), height + (window.outerHeight - window.innerHeight));
        }

        // Add a visual indicator
        const indicator = document.createElement('div');
        indicator.id = 'viewport-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${width}px;
            height: ${height}px;
            border: 2px solid red;
            background: rgba(255, 0, 0, 0.1);
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);

        return new Promise(resolve => setTimeout(resolve, 300));
    },

    /**
     * Reset viewport to original size
     */
    resetViewport() {
        if (this.originalViewport) {
            this.setViewport(this.originalViewport.width, this.originalViewport.height);
        }
        const indicator = document.getElementById('viewport-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    /**
     * Find authentication components on the page
     */
    findAuthComponents() {
        return {
            signInButton: document.querySelector('button[class*="EnhancedSignInButton"]') || document.querySelector('button:has([class*="LogIn"])'),
            authModal: document.querySelector('[class*="AuthModal"]') || document.querySelector('.fixed.inset-0.z-50'),
            userMenu: document.querySelector('[class*="EnhancedUserMenu"]') || document.querySelector('[class*="DropdownMenu"]'),
            errorPage: document.querySelector('.min-h-screen.bg-gradient-to-br.from-red-50'),
            dashboard: document.querySelector('.min-h-screen.bg-gray-50'),
            header: document.querySelector('header'),
            mainContent: document.querySelector('main')
        };
    },

    /**
     * Test component visibility and layout
     */
    testComponentLayout(component, testName, viewportSize) {
        const results = {
            visible: false,
            width: 0,
            height: 0,
            position: null,
            overflow: false,
            truncated: false,
            issues: []
        };

        if (!component) {
            results.issues.push(`Component not found for ${testName}`);
            return results;
        }

        const rect = component.getBoundingClientRect();
        results.visible = rect.width > 0 && rect.height > 0;
        results.width = rect.width;
        results.height = rect.height;
        results.position = {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom
        };

        // Check for overflow issues
        const computedStyle = window.getComputedStyle(component);
        results.overflow = computedStyle.overflow === 'hidden' || computedStyle.overflow === 'scroll';

        // Check for text truncation
        if (component.textContent && component.offsetWidth < component.scrollWidth) {
            results.truncated = true;
            results.issues.push('Text is truncated');
        }

        // Check if component is within viewport
        if (rect.right > viewportSize.width || rect.bottom > viewportSize.height) {
            results.issues.push('Component extends beyond viewport');
        }

        // Check minimum touch target size (44px for mobile)
        if (viewportSize.width <= 768 && component.tagName === 'BUTTON') {
            if (rect.width < 44 || rect.height < 44) {
                results.issues.push('Touch target smaller than 44px minimum');
            }
        }

        return results;
    },

    /**
     * Test mobile responsiveness (320px - 768px)
     */
    async testMobileResponsiveness() {
        this.updateStatus('Starting mobile responsiveness tests...', 'info');
        const mobileSizes = ['mobileSmall', 'mobile', 'mobileLarge'];
        const mobileResults = {};

        for (const sizeKey of mobileSizes) {
            const size = this.deviceSizes[sizeKey];
            this.updateStatus(`Testing ${size.name} (${size.width}x${size.height})...`, 'info');

            await this.setViewport(size.width, size.height);
            await new Promise(resolve => setTimeout(resolve, 500));

            const components = this.findAuthComponents();
            const sizeResults = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    sizeResults[componentName] = this.testComponentLayout(component, componentName, size);
                }
            }

            // Test specific mobile issues
            sizeResults.mobileSpecific = {
                horizontalScroll: document.body.scrollWidth > document.body.clientWidth,
                zoomIssues: window.outerWidth > window.innerWidth * 1.2,
                touchTargets: this.testTouchTargets(components),
                modalBehavior: this.testModalBehavior(components.authModal, size)
            };

            mobileResults[sizeKey] = sizeResults;
        }

        this.testResults.mobile = mobileResults;
        this.resetViewport();
        this.updateStatus('Mobile responsiveness tests completed', 'success');
        return mobileResults;
    },

    /**
     * Test tablet responsiveness (768px - 1024px)
     */
    async testTabletResponsiveness() {
        this.updateStatus('Starting tablet responsiveness tests...', 'info');
        const tabletSizes = ['tablet', 'tabletLandscape'];
        const tabletResults = {};

        for (const sizeKey of tabletSizes) {
            const size = this.deviceSizes[sizeKey];
            this.updateStatus(`Testing ${size.name} (${size.width}x${size.height})...`, 'info');

            await this.setViewport(size.width, size.height);
            await new Promise(resolve => setTimeout(resolve, 500));

            const components = this.findAuthComponents();
            const sizeResults = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    sizeResults[componentName] = this.testComponentLayout(component, componentName, size);
                }
            }

            // Test orientation changes
            sizeResults.orientationTest = await this.testOrientationChange(size);

            tabletResults[sizeKey] = sizeResults;
        }

        this.testResults.tablet = tabletResults;
        this.resetViewport();
        this.updateStatus('Tablet responsiveness tests completed', 'success');
        return tabletResults;
    },

    /**
     * Test desktop responsiveness (1024px+)
     */
    async testDesktopResponsiveness() {
        this.updateStatus('Starting desktop responsiveness tests...', 'info');
        const desktopSizes = ['desktop', 'desktopLarge'];
        const desktopResults = {};

        for (const sizeKey of desktopSizes) {
            const size = this.deviceSizes[sizeKey];
            this.updateStatus(`Testing ${size.name} (${size.width}x${size.height})...`, 'info');

            await this.setViewport(size.width, size.height);
            await new Promise(resolve => setTimeout(resolve, 500));

            const components = this.findAuthComponents();
            const sizeResults = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    sizeResults[componentName] = this.testComponentLayout(component, componentName, size);
                }
            }

            // Test desktop-specific features
            sizeResults.desktopSpecific = {
                hoverStates: this.testHoverStates(components),
                keyboardNavigation: this.testKeyboardNavigation(),
                highResolution: window.devicePixelRatio > 1
            };

            desktopResults[sizeKey] = sizeResults;
        }

        this.testResults.desktop = desktopResults;
        this.resetViewport();
        this.updateStatus('Desktop responsiveness tests completed', 'success');
        return desktopResults;
    },

    /**
     * Test touch targets for mobile usability
     */
    testTouchTargets(components) {
        const issues = [];
        const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');

        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                issues.push(`Touch target too small: ${button.textContent || button.className} (${rect.width}x${rect.height})`);
            }
        });

        return {
            totalButtons: buttons.length,
            issues: issues,
            compliant: issues.length === 0
        };
    },

    /**
     * Test modal behavior on different screen sizes
     */
    testModalBehavior(modal, viewportSize) {
        if (!modal) return { modalFound: false };

        const results = {
            modalFound: true,
            properlySized: false,
            withinViewport: false,
            backdropPresent: false,
            issues: []
        };

        const rect = modal.getBoundingClientRect();
        results.properlySized = rect.width <= viewportSize.width * 0.9 && rect.height <= viewportSize.height * 0.9;
        results.withinViewport = rect.left >= 0 && rect.top >= 0 &&
            rect.right <= viewportSize.width && rect.bottom <= viewportSize.height;

        // Check for backdrop
        const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50') ||
            document.querySelector('[class*="backdrop"]');
        results.backdropPresent = !!backdrop;

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
    },

    /**
     * Test orientation changes for tablet devices
     */
    async testOrientationChange(currentSize) {
        const isLandscape = currentSize.width > currentSize.height;
        const portraitSize = isLandscape ?
            { width: currentSize.height, height: currentSize.width } :
            currentSize;

        // Test portrait mode
        await this.setViewport(portraitSize.width, portraitSize.height);
        await new Promise(resolve => setTimeout(resolve, 300));

        const portraitComponents = this.findAuthComponents();
        const portraitResults = {};

        for (const [componentName, component] of Object.entries(portraitComponents)) {
            if (component) {
                portraitResults[componentName] = this.testComponentLayout(component, componentName, portraitSize);
            }
        }

        // Test landscape mode
        await this.setViewport(currentSize.width, currentSize.height);
        await new Promise(resolve => setTimeout(resolve, 300));

        const landscapeComponents = this.findAuthComponents();
        const landscapeResults = {};

        for (const [componentName, component] of Object.entries(landscapeComponents)) {
            if (component) {
                landscapeResults[componentName] = this.testComponentLayout(component, componentName, currentSize);
            }
        }

        return {
            portrait: portraitResults,
            landscape: landscapeResults,
            layoutChanges: this.detectLayoutChanges(portraitResults, landscapeResults)
        };
    },

    /**
     * Detect layout changes between orientations
     */
    detectLayoutChanges(portraitResults, landscapeResults) {
        const changes = [];

        for (const componentName of Object.keys(portraitResults)) {
            const portrait = portraitResults[componentName];
            const landscape = landscapeResults[componentName];

            if (portrait && landscape) {
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
    },

    /**
     * Test hover states for desktop
     */
    testHoverStates(components) {
        const results = { hasHoverStates: [], missingHoverStates: [] };

        const hoverableElements = document.querySelectorAll('button, a, [role="button"]');
        hoverableElements.forEach(element => {
            const styles = window.getComputedStyle(element, ':hover');
            const hasHover = styles.backgroundColor !== window.getComputedStyle(element).backgroundColor ||
                styles.color !== window.getComputedStyle(element).color ||
                styles.transform !== 'none';

            if (hasHover) {
                results.hasHoverStates.push(element.tagName + (element.className ? '.' + element.className.split(' ').join('.') : ''));
            } else {
                results.missingHoverStates.push(element.tagName + (element.className ? '.' + element.className.split(' ').join('.') : ''));
            }
        });

        return results;
    },

    /**
     * Test keyboard navigation
     */
    testKeyboardNavigation() {
        const results = {
            focusableElements: [],
            tabOrder: [],
            issues: []
        };

        // Get all focusable elements
        const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        results.focusableElements = Array.from(focusableElements).map(el => ({
            tag: el.tagName,
            className: el.className,
            hasTabIndex: el.hasAttribute('tabindex'),
            tabIndex: el.tabIndex
        }));

        // Test tab order
        let currentElement = document.activeElement;
        document.body.focus(); // Start from body

        for (let i = 0; i < focusableElements.length; i++) {
            const element = focusableElements[i];
            element.focus();
            if (document.activeElement === element) {
                results.tabOrder.push({
                    index: i,
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    visible: element.offsetWidth > 0 && element.offsetHeight > 0
                });
            }
        }

        // Check for common issues
        if (results.tabOrder.length !== focusableElements.length) {
            results.issues.push('Not all focusable elements are reachable via keyboard');
        }

        return results;
    },

    /**
     * Test accessibility features
     */
    async testAccessibilityFeatures() {
        this.updateStatus('Starting accessibility tests...', 'info');

        const accessibilityResults = {
            screenReader: this.testScreenReaderCompatibility(),
            keyboardNavigation: this.testKeyboardNavigation(),
            ariaLabels: this.testAriaLabels(),
            colorContrast: this.testColorContrast(),
            focusManagement: this.testFocusManagement()
        };

        this.testResults.accessibility = accessibilityResults;
        this.updateStatus('Accessibility tests completed', 'success');
        return accessibilityResults;
    },

    /**
     * Test screen reader compatibility
     */
    testScreenReaderCompatibility() {
        const results = {
            hasAltText: [],
            missingAltText: [],
            hasAriaLabels: [],
            missingAriaLabels: [],
            hasRoles: [],
            missingRoles: []
        };

        // Test images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.alt) {
                results.hasAltText.push(img.src);
            } else {
                results.missingAltText.push(img.src);
            }
        });

        // Test ARIA labels
        const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
        interactiveElements.forEach(element => {
            const hasAriaLabel = element.hasAttribute('aria-label') ||
                element.hasAttribute('aria-labelledby') ||
                element.textContent.trim();

            if (hasAriaLabel) {
                results.hasAriaLabels.push(element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''));
            } else {
                results.missingAriaLabels.push(element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''));
            }
        });

        // Test ARIA roles
        const elementsWithRoles = document.querySelectorAll('[role]');
        results.hasRoles = Array.from(elementsWithRoles).map(el => ({
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            role: el.getAttribute('role')
        }));

        return results;
    },

    /**
     * Test ARIA labels and roles
     */
    testAriaLabels() {
        const results = {
            properLabels: [],
            improperLabels: [],
            properRoles: [],
            improperRoles: []
        };

        const elementsNeedingLabels = document.querySelectorAll('button[aria-label], input[aria-label], [role="button"][aria-label]');
        elementsNeedingLabels.forEach(element => {
            const label = element.getAttribute('aria-label');
            if (label && label.length > 0) {
                results.properLabels.push({
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    label: label
                });
            }
        });

        const elementsWithRoles = document.querySelectorAll('[role]');
        elementsWithRoles.forEach(element => {
            const role = element.getAttribute('role');
            const validRoles = ['button', 'link', 'navigation', 'main', 'complementary', 'contentinfo', 'banner', 'search', 'form', 'dialog', 'alert'];

            if (validRoles.includes(role)) {
                results.properRoles.push({
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    role: role
                });
            } else {
                results.improperRoles.push({
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    role: role
                });
            }
        });

        return results;
    },

    /**
     * Test color contrast
     */
    testColorContrast() {
        const results = {
            contrastRatios: [],
            lowContrast: []
        };

        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');

        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = this.rgbToHex(styles.color);
            const backgroundColor = this.rgbToHex(styles.backgroundColor);

            if (color && backgroundColor && backgroundColor !== 'transparent') {
                const ratio = this.calculateContrastRatio(color, backgroundColor);
                results.contrastRatios.push({
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    color: color,
                    backgroundColor: backgroundColor,
                    ratio: ratio
                });

                // WCAG AA standard: 4.5:1 for normal text, 3:1 for large text
                const fontSize = parseFloat(styles.fontSize);
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === 'bold');
                const minimumRatio = isLargeText ? 3 : 4.5;

                if (ratio < minimumRatio) {
                    results.lowContrast.push({
                        element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                        ratio: ratio,
                        minimumRequired: minimumRatio
                    });
                }
            }
        });

        return results;
    },

    /**
     * Test focus management
     */
    testFocusManagement() {
        const results = {
            focusTraps: [],
            focusOrder: [],
            issues: []
        };

        // Test modal focus management
        const modals = document.querySelectorAll('[role="dialog"], .fixed.inset-0.z-50');
        modals.forEach(modal => {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
                results.focusTraps.push({
                    modal: 'Modal detected',
                    focusableElements: focusableElements.length,
                    hasFocusTrap: true
                });
            }
        });

        // Test focus order
        const allFocusable = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        let previousTabIndex = -1;
        allFocusable.forEach((element, index) => {
            const tabIndex = element.tabIndex;
            if (tabIndex >= 0 && tabIndex < previousTabIndex) {
                results.issues.push(`Focus order issue at element ${index}`);
            }
            previousTabIndex = tabIndex;
        });

        return results;
    },

    /**
     * Test performance across devices
     */
    async testPerformanceAcrossDevices() {
        this.updateStatus('Starting performance tests...', 'info');

        const performanceResults = {
            loadTime: this.measureLoadTime(),
            renderTime: this.measureRenderTime(),
            bundleSize: await this.measureBundleSize(),
            animationPerformance: this.testAnimationPerformance(),
            memoryUsage: this.measureMemoryUsage()
        };

        this.testResults.performance = performanceResults;
        this.updateStatus('Performance tests completed', 'success');
        return performanceResults;
    },

    /**
     * Measure page load time
     */
    measureLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart
        };
    },

    /**
     * Measure render time
     */
    measureRenderTime() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

        return {
            firstPaint: firstPaint ? firstPaint.startTime : 0,
            firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : 0
        };
    },

    /**
     * Measure bundle size (approximation)
     */
    async measureBundleSize() {
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(resource => resource.name.endsWith('.js'));
        const cssResources = resources.filter(resource => resource.name.endsWith('.css'));

        return {
            jsSize: jsResources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
            cssSize: cssResources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
            totalSize: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0)
        };
    },

    /**
     * Test animation performance
     */
    testAnimationPerformance() {
        const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        const results = {
            animatedElements: animatedElements.length,
            hasHardwareAcceleration: false,
            issues: []
        };

        animatedElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            if (styles.transform !== 'none' || styles.willChange !== 'auto') {
                results.hasHardwareAcceleration = true;
            }
        });

        return results;
    },

    /**
     * Measure memory usage
     */
    measureMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            };
        }
        return { message: 'Memory API not available' };
    },

    /**
     * Run all tests
     */
    async runAllTests() {
        this.updateStatus('Starting comprehensive responsive design tests...', 'info');

        try {
            await this.testMobileResponsiveness();
            await this.testTabletResponsiveness();
            await this.testDesktopResponsiveness();
            await this.testAccessibilityFeatures();
            await this.testPerformanceAcrossDevices();

            this.generateReport();
            this.updateStatus('All tests completed successfully!', 'success');
        } catch (error) {
            this.updateStatus(`Test error: ${error.message}`, 'error');
            console.error('Test error:', error);
        }
    },

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio,
            results: this.testResults,
            summary: this.generateSummary()
        };

        console.log('%c📊 Responsive Design Test Report', 'font-size: 16px; font-weight: bold; color: #2196F3;');
        console.table(report.summary);
        console.log('Full results:', report);

        // Download report as JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `responsive-auth-test-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Generate test summary
     */
    generateSummary() {
        const summary = {
            mobileTests: {
                passed: 0,
                failed: 0,
                issues: []
            },
            tabletTests: {
                passed: 0,
                failed: 0,
                issues: []
            },
            desktopTests: {
                passed: 0,
                failed: 0,
                issues: []
            },
            accessibilityTests: {
                passed: 0,
                failed: 0,
                issues: []
            },
            performanceTests: {
                passed: 0,
                failed: 0,
                issues: []
            }
        };

        // Analyze mobile results
        Object.values(this.testResults.mobile).forEach(sizeResult => {
            Object.values(sizeResult).forEach(componentResult => {
                if (typeof componentResult === 'object' && componentResult.issues) {
                    if (componentResult.issues.length === 0) {
                        summary.mobileTests.passed++;
                    } else {
                        summary.mobileTests.failed++;
                        summary.mobileTests.issues.push(...componentResult.issues);
                    }
                }
            });
        });

        // Analyze tablet results
        Object.values(this.testResults.tablet).forEach(sizeResult => {
            Object.values(sizeResult).forEach(componentResult => {
                if (typeof componentResult === 'object' && componentResult.issues) {
                    if (componentResult.issues.length === 0) {
                        summary.tabletTests.passed++;
                    } else {
                        summary.tabletTests.failed++;
                        summary.tabletTests.issues.push(...componentResult.issues);
                    }
                }
            });
        });

        // Analyze desktop results
        Object.values(this.testResults.desktop).forEach(sizeResult => {
            Object.values(sizeResult).forEach(componentResult => {
                if (typeof componentResult === 'object' && componentResult.issues) {
                    if (componentResult.issues.length === 0) {
                        summary.desktopTests.passed++;
                    } else {
                        summary.desktopTests.failed++;
                        summary.desktopTests.issues.push(...componentResult.issues);
                    }
                }
            });
        });

        return summary;
    },

    /**
     * Helper function to convert RGB to Hex
     */
    rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return null;

        const result = rgb.match(/\d+/g);
        if (!result) return null;

        return "#" + ((1 << 24) + (parseInt(result[0]) << 16) + (parseInt(result[1]) << 8) + parseInt(result[2])).toString(16).slice(1);
    },

    /**
     * Helper function to calculate contrast ratio
     */
    calculateContrastRatio(color1, color2) {
        const luminance1 = this.getLuminance(color1);
        const luminance2 = this.getLuminance(color2);

        const brightest = Math.max(luminance1, luminance2);
        const darkest = Math.min(luminance1, luminance2);

        return (brightest + 0.05) / (darkest + 0.05);
    },

    /**
     * Helper function to get luminance
     */
    getLuminance(hex) {
        const rgb = parseInt(hex.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;

        const rsRGB = r / 255;
        const gsRGB = g / 255;
        const bsRGB = b / 255;

        const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

        return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
    }
};

// Auto-initialize when script is loaded
if (typeof window !== 'undefined') {
    ResponsiveAuthTester.init();
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveAuthTester;
}