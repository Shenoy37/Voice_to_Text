/**
 * Automated Responsive Design Testing for Voice to Notes Authentication System
 * 
 * This script uses Puppeteer to automate browser-based responsive design testing
 * and generates comprehensive reports.
 * 
 * Usage: node automated-responsive-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AutomatedResponsiveTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {};
        this.testStartTime = Date.now();
    }

    async init() {
        console.log('🚀 Initializing Automated Responsive Test Runner...');

        this.browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            defaultViewport: null,
            args: ['--start-maximized', '--disable-web-security']
        });

        this.page = await this.browser.newPage();

        // Enable console logging from the page
        this.page.on('console', msg => {
            if (msg.type() === 'log') {
                console.log('PAGE:', msg.text());
            }
        });

        // Load the testing script
        const testingScript = fs.readFileSync(path.join(__dirname, 'browser-responsive-test.js'), 'utf8');
        await this.page.evaluateOnNewDocument(testingScript);

        console.log('✅ Browser initialized successfully');
    }

    async navigateToApp() {
        const appUrl = 'http://localhost:3000';
        console.log(`🌐 Navigating to ${appUrl}...`);

        try {
            await this.page.goto(appUrl, { waitUntil: 'networkidle2' });
            console.log('✅ App loaded successfully');

            // Wait for the page to fully load
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        } catch (error) {
            console.error('❌ Failed to load app:', error.message);
            return false;
        }
    }

    async runResponsiveTests() {
        console.log('🔍 Running responsive design tests...');

        try {
            // Run all tests using the browser-based testing framework
            const results = await this.page.evaluate(async () => {
                return await ResponsiveAuthTest.runAllTests();
            });

            this.testResults = results;
            console.log('✅ Responsive design tests completed');
            return results;
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            throw error;
        }
    }

    async captureScreenshots() {
        console.log('📸 Capturing screenshots for different viewports...');

        const viewports = [
            { width: 375, height: 667, name: 'mobile' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 1280, height: 800, name: 'desktop' }
        ];

        // Ensure screenshots directory exists
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results');
        }
        if (!fs.existsSync('test-results/screenshots')) {
            fs.mkdirSync('test-results/screenshots');
        }

        for (const viewport of viewports) {
            await this.page.setViewport(viewport);
            await new Promise(resolve => setTimeout(resolve, 1000));

            await this.page.screenshot({
                path: `test-results/screenshots/auth-${viewport.name}-${viewport.width}x${viewport.height}.png`,
                fullPage: true
            });

            console.log(`📸 Screenshot captured for ${viewport.name} (${viewport.width}x${viewport.height})`);
        }
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');

        const report = {
            timestamp: new Date().toISOString(),
            testDuration: Date.now() - this.testStartTime,
            userAgent: await this.page.evaluate(() => navigator.userAgent),
            viewport: {
                width: await this.page.evaluate(() => window.innerWidth),
                height: await this.page.evaluate(() => window.innerHeight)
            },
            devicePixelRatio: await this.page.evaluate(() => window.devicePixelRatio),
            results: this.testResults,
            summary: await this.generateSummary(),
            recommendations: await this.generateRecommendations(),
            screenshots: this.listScreenshots()
        };

        // Ensure test-results directory exists
        if (!fs.existsSync('test-results')) {
            fs.mkdirSync('test-results');
        }

        // Save detailed JSON report
        fs.writeFileSync(
            'test-results/responsive-auth-test-report.json',
            JSON.stringify(report, null, 2)
        );

        // Save human-readable markdown report
        const readableReport = this.generateReadableReport(report);
        fs.writeFileSync(
            'test-results/responsive-auth-test-report.md',
            readableReport
        );

        console.log('✅ Test report generated successfully');
        console.log('📁 Reports saved to test-results/ directory');

        return report;
    }

    async generateSummary() {
        return await this.page.evaluate(() => {
            const summary = {
                mobileTests: { passed: 0, failed: 0, issues: [] },
                tabletTests: { passed: 0, failed: 0, issues: [] },
                desktopTests: { passed: 0, failed: 0, issues: [] },
                accessibilityTests: { passed: 0, failed: 0, issues: [] },
                performanceTests: { passed: 0, failed: 0, issues: [] },
                deviceSpecificTests: { passed: 0, failed: 0, issues: [] }
            };

            // This would be implemented in the browser context
            // For now, return a basic summary
            return summary;
        });
    }

    async generateRecommendations() {
        return await this.page.evaluate(() => {
            const recommendations = [];

            // Check for common responsive design issues
            if (window.innerWidth < 768) {
                recommendations.push('Test mobile responsiveness thoroughly');
            }

            // Check for accessibility
            const imagesWithoutAlt = document.querySelectorAll('img:not([alt])').length;
            if (imagesWithoutAlt > 0) {
                recommendations.push(`Add alt text to ${imagesWithoutAlt} images`);
            }

            // Check for touch targets
            const smallButtons = Array.from(document.querySelectorAll('button, a')).filter(
                btn => {
                    const rect = btn.getBoundingClientRect();
                    return rect.width < 44 || rect.height < 44;
                }
            );

            if (smallButtons.length > 0) {
                recommendations.push(`Increase touch target size for ${smallButtons.length} buttons`);
            }

            if (recommendations.length === 0) {
                recommendations.push('Great job! No major responsive design issues found.');
            }

            return recommendations;
        });
    }

    listScreenshots() {
        const screenshotDir = 'test-results/screenshots';
        if (fs.existsSync(screenshotDir)) {
            return fs.readdirSync(screenshotDir).filter(file => file.endsWith('.png'));
        }
        return [];
    }

    generateReadableReport(report) {
        return `# Responsive Design Test Report - Voice to Notes Authentication

## Test Summary

**Test Date:** ${new Date(report.timestamp).toLocaleString()}
**Test Duration:** ${Math.round(report.testDuration / 1000)} seconds
**User Agent:** ${report.userAgent}
**Device Pixel Ratio:** ${report.devicePixelRatio}

## Executive Summary

${this.generateExecutiveSummary(report)}

## Device Compatibility Results

### Mobile (320px - 768px)
${this.formatDeviceResults(report.results.mobile, 'Mobile')}

### Tablet (768px - 1024px)
${this.formatDeviceResults(report.results.tablet, 'Tablet')}

### Desktop (1024px+)
${this.formatDeviceResults(report.results.desktop, 'Desktop')}

## Accessibility Results
${this.formatAccessibilityResults(report.results.accessibility)}

## Performance Results
${this.formatPerformanceResults(report.results.performance)}

## Device-Specific Features
${this.formatDeviceSpecificResults(report.results.deviceSpecific)}

## Screenshots
${report.screenshots.map(screenshot => `- ![${screenshot}](screenshots/${screenshot})`).join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. Fix any critical issues identified in the tests
2. Improve touch target sizes for mobile devices
3. Enhance accessibility features
4. Optimize performance for slower connections
5. Test on real devices for final validation

---

*This report was generated automatically by the Responsive Design Testing Framework.*
`;
    }

    generateExecutiveSummary(report) {
        const totalIssues = Object.values(report.results).reduce((total, category) => {
            if (typeof category === 'object') {
                return total + Object.values(category).reduce((catTotal, result) => {
                    if (result && result.issues) {
                        return catTotal + result.issues.length;
                    }
                    return catTotal;
                }, 0);
            }
            return total;
        }, 0);

        if (totalIssues === 0) {
            return '✅ **Excellent!** No responsive design issues found. The authentication system works well across all tested device sizes.';
        } else if (totalIssues <= 5) {
            return `⚠️ **Good** with minor issues. ${totalIssues} issues found that should be addressed for optimal user experience.`;
        } else {
            return `❌ **Needs Improvement.** ${totalIssues} issues found that significantly impact the responsive design experience.`;
        }
    }

    formatDeviceResults(results, deviceType) {
        if (!results || Object.keys(results).length === 0) {
            return `❌ No test results available for ${deviceType}`;
        }

        let output = '';
        for (const [size, data] of Object.entries(results)) {
            output += `\n#### ${size}\n`;

            if (data.signInButton) {
                output += `- **Sign In Button:** ${data.signInButton.visible ? '✅ Visible' : '❌ Not visible'}\n`;
                if (data.signInButton.width) {
                    output += `  - Size: ${data.signInButton.width}x${data.signInButton.height}px\n`;
                }
                if (data.signInButton.issues && data.signInButton.issues.length > 0) {
                    output += `  - Issues: ${data.signInButton.issues.join(', ')}\n`;
                }
            }

            if (data.mobileSpecific) {
                if (data.mobileSpecific.horizontalScroll !== undefined) {
                    output += `- **Horizontal Scroll:** ${data.mobileSpecific.horizontalScroll ? '❌ Present' : '✅ None'}\n`;
                }
                if (data.mobileSpecific.touchTargets) {
                    output += `- **Touch Targets:** ${data.mobileSpecific.touchTargets.compliant ? '✅ Compliant' : '❌ Issues found'}\n`;
                }
            }

            if (data.desktopSpecific) {
                if (data.desktopSpecific.hoverStates) {
                    output += `- **Hover States:** ${data.desktopSpecific.hoverStates.hasHoverStates.length > 0 ? '✅ Present' : '⚠️ Missing'}\n`;
                }
                if (data.desktopSpecific.keyboardNavigation) {
                    output += `- **Keyboard Navigation:** ✅ Tested\n`;
                }
            }
        }

        return output;
    }

    formatAccessibilityResults(results) {
        if (!results) return '❌ No accessibility test results available';

        let output = '';

        if (results.screenReader) {
            output += `- **Screen Reader:** `;
            if (results.screenReader.missingAltText && results.screenReader.missingAltText.length === 0) {
                output += '✅ All images have alt text\n';
            } else {
                output += `❌ ${results.screenReader.missingAltText ? results.screenReader.missingAltText.length : 0} images missing alt text\n`;
            }
        }

        if (results.keyboardNavigation) {
            output += `- **Keyboard Navigation:** ✅ Tested\n`;
        }

        if (results.colorContrast) {
            output += `- **Color Contrast:** `;
            if (results.colorContrast.lowContrast && results.colorContrast.lowContrast.length === 0) {
                output += '✅ No contrast issues detected\n';
            } else {
                output += `⚠️ ${results.colorContrast.lowContrast ? results.colorContrast.lowContrast.length : 0} potential contrast issues\n`;
            }
        }

        return output || '❌ No specific accessibility data available';
    }

    formatPerformanceResults(results) {
        if (!results) return '❌ No performance test results available';

        let output = '';

        if (results.loadTime) {
            output += `- **Load Time:** ${Math.round(results.loadTime.totalTime)}ms\n`;
        }

        if (results.bundleSize) {
            output += `- **Bundle Size:** ${Math.round(results.bundleSize.totalSize / 1024)}KB\n`;
        }

        if (results.animationPerformance) {
            output += `- **Animations:** ${results.animationPerformance.hasHardwareAcceleration ? '✅ Hardware accelerated' : '⚠️ No hardware acceleration'}\n`;
        }

        return output;
    }

    formatDeviceSpecificResults(results) {
        if (!results) return '❌ No device-specific test results available';

        let output = '';

        if (results.orientationChanges) {
            output += `- **Orientation Changes:** ✅ Tested\n`;
        }

        if (results.pixelDensity) {
            output += `- **Pixel Density:** ${results.pixelDensity.devicePixelRatio}x\n`;
        }

        if (results.inputMethods) {
            output += `- **Input Methods:** ✅ Tested\n`;
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
                throw new Error('Failed to navigate to application');
            }

            await this.runResponsiveTests();
            await this.captureScreenshots();
            const report = await this.generateReport();

            console.log('🎉 All tests completed successfully!');
            console.log('📊 Summary:', report.summary);
            console.log('💡 Recommendations:', report.recommendations);

            return report;

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const testRunner = new AutomatedResponsiveTest();
    testRunner.runAllTests().catch(console.error);
}

module.exports = AutomatedResponsiveTest;