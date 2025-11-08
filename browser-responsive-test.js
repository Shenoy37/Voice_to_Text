/**
 * Browser-based Responsive Design Testing for Voice to Notes Authentication
 * 
 * This script can be run directly in the browser console to test responsive design
 * of authentication components across different device sizes.
 * 
 * Usage:
 * 1. Open the Voice to Notes application in your browser
 * 2. Open browser developer tools (F12)
 * 3. Copy and paste this entire script into the console
 * 4. Run tests with: ResponsiveAuthTest.runAllTests()
 */

const ResponsiveAuthTest = {
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
        accessibility: {},
        performance: {},
        deviceSpecific: {}
    },

    // Current test state
    originalViewport: null,
    testStartTime: null,

    /**
     * Initialize the testing framework
     */
    init() {
        console.log('%c🔍 Responsive Authentication Testing Framework', 'font-size: 16px; font-weight: bold; color: #2196F3;');
        console.log('Testing responsive design for Voice to Notes authentication system...');

        this.testStartTime = Date.now();
        this.originalViewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.createTestUI();
        console.log('Testing framework initialized. Use ResponsiveAuthTest.runAllTests() to begin.');
    },

    /**
     * Create a testing UI overlay
     */
    createTestUI() {
        // Remove existing panel if present
        const existingPanel = document.getElementById('responsive-test-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const testPanel = document.createElement('div');
        testPanel.id = 'responsive-test-panel';
        testPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 320px;
            background: white;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-height: 80vh;
            overflow-y: auto;
        `;

        testPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #2196F3;">🔍 Auth Responsive Tests</h3>
            <div style="margin-bottom: 10px;">
                <button id="run-all-tests" style="background: #2196F3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">Run All Tests</button>
                <button id="test-mobile" style="background: #4CAF50; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Mobile</button>
                <button id="test-tablet" style="background: #FF9800; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Tablet</button>
                <button id="test-desktop" style="background: #9C27B0; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">Desktop</button>
            </div>
            <div style="margin-bottom: 10px;">
                <button id="test-accessibility" style="background: #795548; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Accessibility</button>
                <button id="test-performance" style="background: #607D8B; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">Performance</button>
            </div>
            <div style="margin-bottom: 10px;">
                <button id="test-device-specific" style="background: #E91E63; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Device Features</button>
                <button id="generate-report" style="background: #3F51B5; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">Generate Report</button>
            </div>
            <div id="test-status" style="background: #f5f5f5; padding: 8px; border-radius: 4px; min-height: 100px; max-height: 200px; overflow-y: auto; font-size: 11px;">
                Ready to run tests...
            </div>
            <div style="margin-top: 10px;">
                <button id="close-panel" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">Close Panel</button>
                <button id="reset-viewport" style="background: #FF5722; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; margin-left: 5px;">Reset Viewport</button>
            </div>
        `;

        document.body.appendChild(testPanel);
        this.setupEventListeners();
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
        document.getElementById('test-device-specific').addEventListener('click', () => this.testDeviceSpecificFeatures());
        document.getElementById('generate-report').addEventListener('click', () => this.generateReport());
        document.getElementById('close-panel').addEventListener('click', () => {
            document.getElementById('responsive-test-panel').remove();
        });
        document.getElementById('reset-viewport').addEventListener('click', () => {
            this.resetViewport();
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
            const statusDiv = document.createElement('div');
            statusDiv.style.cssText = `color: ${color}; margin-bottom: 2px;`;
            statusDiv.textContent = `[${timestamp}] ${message}`;
            statusEl.appendChild(statusDiv);
            statusEl.scrollTop = statusEl.scrollHeight;
        }
        console.log(`%c${message}`, `color: ${type === 'error' ? 'red' : type === 'success' ? 'green' : type === 'warning' ? 'orange' : 'blue'}`);
    },

    /**
     * Simulate viewport size for testing
     */
    async setViewport(width, height) {
        this.updateStatus(`Setting viewport to ${width}x${height}...`, 'info');

        // Create viewport overlay for visual indication
        const existingIndicator = document.getElementById('viewport-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.id = 'viewport-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${width}px;
            height: ${height}px;
            border: 2px solid red;
            background: rgba(255, 0, 0, 0.05);
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);

        // Simulate responsive behavior by adjusting container
        const mainContainer = document.querySelector('.container, main, body');
        if (mainContainer) {
            mainContainer.style.maxWidth = `${width}px`;
            mainContainer.style.overflow = 'hidden';
        }

        // Wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 300));
        return { width, height };
    },

    /**
     * Reset viewport to original size
     */
    resetViewport() {
        const indicator = document.getElementById('viewport-indicator');
        if (indicator) {
            indicator.remove();
        }

        const mainContainer = document.querySelector('.container, main, body');
        if (mainContainer) {
            mainContainer.style.maxWidth = '';
            mainContainer.style.overflow = '';
        }

        this.updateStatus('Viewport reset to original size', 'info');
    },

    /**
     * Find authentication components on the page
     */
    findAuthComponents() {
        return {
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
            issues: [],
            accessible: false
        };

        if (!component) {
            results.issues.push(`Component not found for ${testName}`);
            return results;
        }

        const rect = component.getBoundingClientRect();
        results.visible = rect.width > 0 && rect.height > 0;
        results.width = Math.round(rect.width);
        results.height = Math.round(rect.height);
        results.position = {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom)
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
        if (viewportSize.width <= 768 && (component.tagName === 'BUTTON' || component.tagName === 'A')) {
            if (rect.width < 44 || rect.height < 44) {
                results.issues.push(`Touch target smaller than 44px minimum (${rect.width}x${rect.height})`);
            }
        }

        // Check accessibility attributes
        results.accessible = this.checkAccessibilityAttributes(component);

        return results;
    },

    /**
     * Check accessibility attributes for a component
     */
    checkAccessibilityAttributes(component) {
        const issues = [];

        // Check for ARIA labels
        if (component.tagName === 'BUTTON' && !component.textContent.trim() &&
            !component.hasAttribute('aria-label') && !component.hasAttribute('aria-labelledby')) {
            issues.push('Button missing accessible name');
        }

        // Check for proper roles
        if (component.hasAttribute('role')) {
            const role = component.getAttribute('role');
            const validRoles = ['button', 'link', 'navigation', 'main', 'complementary', 'contentinfo', 'banner', 'search', 'form', 'dialog', 'alert'];
            if (!validRoles.includes(role)) {
                issues.push(`Invalid ARIA role: ${role}`);
            }
        }

        // Check for alt text on images
        if (component.tagName === 'IMG' && !component.alt) {
            issues.push('Image missing alt text');
        }

        return {
            compliant: issues.length === 0,
            issues: issues
        };
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

            const components = this.findAuthComponents();
            const sizeResults = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    if (Array.isArray(component)) {
                        // Handle arrays of elements (like formInputs, buttons)
                        sizeResults[componentName] = component.map((el, index) =>
                            this.testComponentLayout(el, `${componentName}[${index}]`, size)
                        );
                    } else {
                        sizeResults[componentName] = this.testComponentLayout(component, componentName, size);
                    }
                }
            }

            // Test specific mobile issues
            sizeResults.mobileSpecific = {
                horizontalScroll: document.body.scrollWidth > document.body.clientWidth,
                viewportTooSmall: size.width < 320,
                textReadability: this.testTextReadability(size),
                touchTargets: this.testTouchTargets(components.buttons),
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

            const components = this.findAuthComponents();
            const sizeResults = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    if (Array.isArray(component)) {
                        sizeResults[componentName] = component.map((el, index) =>
                            this.testComponentLayout(el, `${componentName}[${index}]`, size)
                        );
                    } else {
                        sizeResults[componentName] = this.testComponentLayout(component, componentName, size);
                    }
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

            const components = this.findAuthComponents();
            const sizeResults = {};

            // Test each component
            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    if (Array.isArray(component)) {
                        sizeResults[componentName] = component.map((el, index) =>
                            this.testComponentLayout(el, `${componentName}[${index}]`, size)
                        );
                    } else {
                        sizeResults[componentName] = this.testComponentLayout(component, componentName, size);
                    }
                }
            }

            // Test desktop-specific features
            sizeResults.desktopSpecific = {
                hoverStates: this.testHoverStates(),
                keyboardNavigation: this.testKeyboardNavigation(),
                highResolution: window.devicePixelRatio > 1,
                wideScreenOptimization: size.width >= 1920
            };

            desktopResults[sizeKey] = sizeResults;
        }

        this.testResults.desktop = desktopResults;
        this.resetViewport();
        this.updateStatus('Desktop responsiveness tests completed', 'success');
        return desktopResults;
    },

    /**
     * Test text readability
     */
    testTextReadability(viewportSize) {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');
        const issues = [];

        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);

            // Check minimum font size for mobile (16px recommended, 14px minimum)
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
    },

    /**
     * Test touch targets for mobile usability
     */
    testTouchTargets(buttons) {
        if (!buttons || buttons.length === 0) {
            return { totalButtons: 0, issues: [], compliant: true };
        }

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
            document.querySelector('[class*="backdrop"]') ||
            document.querySelector('[class*="modal-backdrop"]');
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
            { width: currentSize.height, height: currentSize.width, name: 'Portrait' } :
            { ...currentSize, name: 'Portrait' };

        // Test portrait mode
        await this.setViewport(portraitSize.width, portraitSize.height);
        await new Promise(resolve => setTimeout(resolve, 300));

        const portraitComponents = this.findAuthComponents();
        const portraitResults = {};

        for (const [componentName, component] of Object.entries(portraitComponents)) {
            if (component) {
                if (Array.isArray(component)) {
                    portraitResults[componentName] = component.map((el, index) =>
                        this.testComponentLayout(el, `${componentName}[${index}]`, portraitSize)
                    );
                } else {
                    portraitResults[componentName] = this.testComponentLayout(component, componentName, portraitSize);
                }
            }
        }

        // Test landscape mode
        await this.setViewport(currentSize.width, currentSize.height);
        await new Promise(resolve => setTimeout(resolve, 300));

        const landscapeComponents = this.findAuthComponents();
        const landscapeResults = {};

        for (const [componentName, component] of Object.entries(landscapeComponents)) {
            if (component) {
                if (Array.isArray(component)) {
                    landscapeResults[componentName] = component.map((el, index) =>
                        this.testComponentLayout(el, `${componentName}[${index}]`, currentSize)
                    );
                } else {
                    landscapeResults[componentName] = this.testComponentLayout(component, componentName, currentSize);
                }
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
                const compareArrays = (arr1, arr2) => {
                    if (Array.isArray(arr1) && Array.isArray(arr2)) {
                        return arr1.length === arr2.length &&
                            arr1.every((item, index) => JSON.stringify(item) === JSON.stringify(arr2[index]));
                    }
                    return JSON.stringify(arr1) === JSON.stringify(arr2);
                };

                if (!compareArrays(portrait, landscape)) {
                    changes.push({
                        component: componentName,
                        changeDetected: true
                    });
                }
            }
        }

        return changes;
    },

    /**
     * Test hover states for desktop
     */
    testHoverStates() {
        const results = { hasHoverStates: [], missingHoverStates: [] };

        const hoverableElements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
        hoverableElements.forEach(element => {
            // Check if element has hover styles defined
            const styles = window.getComputedStyle(element);
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
            tabIndex: el.tabIndex,
            hasAriaLabel: el.hasAttribute('aria-label') || el.textContent.trim()
        }));

        // Check for common issues
        const invisibleFocusable = Array.from(focusableElements).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width === 0 && rect.height === 0;
        });

        if (invisibleFocusable.length > 0) {
            results.issues.push(`${invisibleFocusable.length} focusable elements are not visible`);
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
            focusManagement: this.testFocusManagement(),
            semanticHTML: this.testSemanticHTML()
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
            missingRoles: [],
            headings: this.testHeadingStructure()
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
            element: el.tagName + (el.className ? '.' + element.className.split(' ')[0] : ''),
            role: el.getAttribute('role')
        }));

        return results;
    },

    /**
     * Test heading structure
     */
    testHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const structure = [];
        let hasH1 = false;

        headings.forEach(heading => {
            const level = parseInt(heading.tagName.substring(1));
            structure.push({
                level: level,
                text: heading.textContent.substring(0, 50),
                hasId: !!heading.id
            });

            if (level === 1) hasH1 = true;
        });

        return {
            headings: structure,
            hasH1: hasH1,
            properHierarchy: this.checkHeadingHierarchy(structure)
        };
    },

    /**
     * Check if heading hierarchy is proper
     */
    checkHeadingHierarchy(headings) {
        let previousLevel = 0;

        for (const heading of headings) {
            if (heading.level > previousLevel + 1) {
                return false; // Skipped heading level
            }
            previousLevel = heading.level;
        }

        return true;
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
            const validRoles = ['button', 'link', 'navigation', 'main', 'complementary', 'contentinfo', 'banner', 'search', 'form', 'dialog', 'alert', 'status'];

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
     * Test color contrast (basic implementation)
     */
    testColorContrast() {
        const results = {
            contrastRatios: [],
            lowContrast: [],
            issues: []
        };

        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button, a, label');

        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);

            // Basic checks for common contrast issues
            if (styles.color === styles.backgroundColor) {
                results.lowContrast.push({
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    issue: 'Text color same as background'
                });
            }

            // Check for very light colors on white background
            if (styles.backgroundColor === 'rgb(255, 255, 255)' || styles.backgroundColor === 'white') {
                const color = styles.color;
                if (color.includes('240, 240, 240') || color.includes('250, 250, 250')) {
                    results.lowContrast.push({
                        element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                        issue: 'Very light text on white background'
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
            issues: [],
            skipLinks: this.testSkipLinks()
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

        // Test for skip links
        function testSkipLinks() {
            const skipLinks = document.querySelectorAll('a[href^="#"], [role="navigation"] a');
            return {
                found: skipLinks.length,
                elements: Array.from(skipLinks).map(link => ({
                    text: link.textContent,
                    href: link.getAttribute('href')
                }))
            };
        }

        return results;
    },

    /**
     * Test semantic HTML
     */
    testSemanticHTML() {
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
    },

    /**
     * Test performance across devices
     */
    async testPerformanceAcrossDevices() {
        this.updateStatus('Starting performance tests...', 'info');

        const performanceResults = {
            loadTime: this.measureLoadTime(),
            renderTime: this.measureRenderTime(),
            bundleSize: this.measureBundleSize(),
            animationPerformance: this.testAnimationPerformance(),
            memoryUsage: this.measureMemoryUsage(),
            devicePerformance: {}
        };

        // Test performance on different simulated device sizes
        const deviceTypes = ['mobile', 'tablet', 'desktop'];
        for (const deviceType of deviceTypes) {
            const size = deviceType === 'mobile' ? { width: 375, height: 667 } :
                deviceType === 'tablet' ? { width: 768, height: 1024 } :
                    { width: 1280, height: 800 };

            await this.setViewport(size.width, size.height);
            await new Promise(resolve => setTimeout(resolve, 500));

            performanceResults.devicePerformance[deviceType] = {
                renderTime: this.measureRenderTime(),
                animationPerformance: this.testAnimationPerformance()
            };
        }

        this.testResults.performance = performanceResults;
        this.resetViewport();
        this.updateStatus('Performance tests completed', 'success');
        return performanceResults;
    },

    /**
     * Measure page load time
     */
    measureLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return { message: 'Navigation timing not available' };

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
    measureBundleSize() {
        const resources = performance.getEntriesByType('resource');
        const jsResources = Array.from(resources).filter(resource => resource.name.endsWith('.js'));
        const cssResources = Array.from(resources).filter(resource => resource.name.endsWith('.css'));

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
     * Test device-specific features
     */
    async testDeviceSpecificFeatures() {
        this.updateStatus('Starting device-specific feature tests...', 'info');

        const deviceSpecificResults = {
            orientationChanges: await this.testOrientationChanges(),
            viewportResizing: await this.testViewportResizing(),
            zoomFunctionality: await this.testZoomFunctionality(),
            pixelDensity: this.testPixelDensity(),
            inputMethods: this.testInputMethods(),
            deviceCapabilities: this.testDeviceCapabilities()
        };

        this.testResults.deviceSpecific = deviceSpecificResults;
        this.updateStatus('Device-specific feature tests completed', 'success');
        return deviceSpecificResults;
    },

    /**
     * Test orientation changes
     */
    async testOrientationChanges() {
        const orientations = [
            { width: 375, height: 667, name: 'portrait' },
            { width: 667, height: 375, name: 'landscape' }
        ];

        const results = {};

        for (const orientation of orientations) {
            await this.setViewport(orientation.width, orientation.height);
            await new Promise(resolve => setTimeout(resolve, 500));

            const components = this.findAuthComponents();
            const componentResults = {};

            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    if (Array.isArray(component)) {
                        componentResults[componentName] = component.map((el, index) =>
                            this.testComponentLayout(el, `${componentName}[${index}]`, orientation)
                        );
                    } else {
                        componentResults[componentName] = this.testComponentLayout(component, componentName, orientation);
                    }
                }
            }

            results[orientation.name] = {
                viewport: orientation,
                components: componentResults
            };
        }

        return results;
    },

    /**
     * Test viewport resizing
     */
    async testViewportResizing() {
        const sizes = [
            { width: 320, height: 568 },
            { width: 768, height: 1024 },
            { width: 1280, height: 800 }
        ];

        const results = {};

        for (const size of sizes) {
            await this.setViewport(size.width, size.height);
            await new Promise(resolve => setTimeout(resolve, 500));

            const components = this.findAuthComponents();
            const componentResults = {};

            for (const [componentName, component] of Object.entries(components)) {
                if (component) {
                    if (Array.isArray(component)) {
                        componentResults[componentName] = component.map((el, index) =>
                            this.testComponentLayout(el, `${componentName}[${index}]`, size)
                        );
                    } else {
                        componentResults[componentName] = this.testComponentLayout(component, componentName, size);
                    }
                }
            }

            results[`${size.width}x${size.height}`] = {
                viewport: size,
                components: componentResults,
                horizontalScroll: document.body.scrollWidth > document.body.clientWidth
            };
        }

        return results;
    },

    /**
     * Test zoom functionality
     */
    async testZoomFunctionality() {
        return await new Promise((resolve) => {
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

            resolve(results);
        });
    },

    /**
     * Test pixel density
     */
    testPixelDensity() {
        return {
            devicePixelRatio: window.devicePixelRatio,
            isHighDensity: window.devicePixelRatio > 1,
            isUltraHighDensity: window.devicePixelRatio > 2,
            supportsHighResMedia: window.matchMedia && window.matchMedia('(-webkit-min-device-pixel-ratio: 2)').matches
        };
    },

    /**
     * Test input methods
     */
    testInputMethods() {
        const inputs = document.querySelectorAll('input, textarea, button, a');

        return {
            totalInputs: inputs.length,
            touchOptimized: Array.from(inputs).filter(input => {
                const rect = input.getBoundingClientRect();
                return rect.width >= 44 && rect.height >= 44;
            }).length,
            hasKeyboardSupport: inputs.length > 0,
            hasMouseSupport: inputs.length > 0,
            hasTouchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            inputTypes: this.testInputTypes()
        };
    },

    /**
     * Test different input types
     */
    testInputTypes() {
        const inputTypes = {};
        const inputs = document.querySelectorAll('input');

        inputs.forEach(input => {
            const type = input.type || 'text';
            inputTypes[type] = (inputTypes[type] || 0) + 1;
        });

        return inputTypes;
    },

    /**
     * Test device capabilities
     */
    testDeviceCapabilities() {
        return {
            localStorage: typeof Storage !== 'undefined',
            sessionStorage: typeof sessionStorage !== 'undefined',
            geolocation: 'geolocation' in navigator,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            webWorkers: typeof Worker !== 'undefined',
            serviceWorkers: 'serviceWorker' in navigator,
            pushNotifications: 'PushManager' in window,
            webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window
        };
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
            await this.testDeviceSpecificFeatures();

            this.updateStatus('All tests completed successfully!', 'success');
            return this.testResults;
        } catch (error) {
            this.updateStatus(`Test error: ${error.message}`, 'error');
            console.error('Test error:', error);
            throw error;
        }
    },

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: Date.now() - this.testStartTime,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio,
            results: this.testResults,
            summary: this.generateSummary(),
            recommendations: this.generateRecommendations()
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

        this.updateStatus('Test report downloaded successfully', 'success');
        return report;
    },

    /**
     * Generate test summary
     */
    generateSummary() {
        const summary = {
            mobileTests: { passed: 0, failed: 0, issues: [] },
            tabletTests: { passed: 0, failed: 0, issues: [] },
            desktopTests: { passed: 0, failed: 0, issues: [] },
            accessibilityTests: { passed: 0, failed: 0, issues: [] },
            performanceTests: { passed: 0, failed: 0, issues: [] },
            deviceSpecificTests: { passed: 0, failed: 0, issues: [] }
        };

        // Analyze mobile results
        if (this.testResults.mobile) {
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
        }

        // Analyze tablet results
        if (this.testResults.tablet) {
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
        }

        // Analyze desktop results
        if (this.testResults.desktop) {
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
        }

        return summary;
    },

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        const summary = this.generateSummary();

        // Mobile recommendations
        if (summary.mobileTests.issues.length > 0) {
            recommendations.push('Improve mobile responsiveness - ' + summary.mobileTests.issues.length + ' issues found');

            if (summary.mobileTests.issues.some(issue => issue.includes('Touch target'))) {
                recommendations.push('Increase touch target sizes to minimum 44px for mobile devices');
            }

            if (summary.mobileTests.issues.some(issue => issue.includes('Font size'))) {
                recommendations.push('Increase font sizes for better mobile readability');
            }
        }

        // Accessibility recommendations
        if (summary.accessibilityTests.issues.length > 0) {
            recommendations.push('Improve accessibility - ' + summary.accessibilityTests.issues.length + ' issues found');
        }

        // Performance recommendations
        if (summary.performanceTests.issues.length > 0) {
            recommendations.push('Optimize performance - ' + summary.performanceTests.issues.length + ' issues found');
        }

        // General recommendations
        if (recommendations.length === 0) {
            recommendations.push('Great job! No major responsive design issues found.');
        }

        return recommendations;
    }
};

// Auto-initialize when script is loaded
if (typeof window !== 'undefined') {
    ResponsiveAuthTest.init();
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveAuthTest;
}