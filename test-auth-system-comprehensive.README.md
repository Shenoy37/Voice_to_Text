# Comprehensive Authentication Test Script

This document describes the comprehensive authentication test script (`test-auth-system-comprehensive.js`) that tests all the authentication endpoints in the voice-to-notes application.

## Overview

The test script is designed to thoroughly test the Better Auth implementation, including:
- Session management
- OAuth flow initiation
- Callback handling
- Sign-out functionality
- Error scenarios
- Security features

## Prerequisites

Before running the tests, ensure:
1. The development server is running (`npm run dev`)
2. The application is accessible at `http://localhost:3000`
3. Environment variables are properly configured (Google OAuth credentials)

## Running the Tests

### Method 1: Using npm script (recommended)
```bash
npm run test:auth
```

### Method 2: Direct execution
```bash
node test-auth-system-comprehensive.js
```

### Method 3: Make executable and run directly
```bash
chmod +x test-auth-system-comprehensive.js
./test-auth-system-comprehensive.js
```

## Test Cases

The script includes the following test cases:

### 1. Get Current Session (No Authentication)
- **Endpoint**: `/api/auth/get-session`
- **Method**: GET
- **Purpose**: Tests session retrieval without authentication
- **Expected**: Returns null or empty session for unauthenticated requests

### 2. Google OAuth Initiation
- **Endpoint**: `/api/auth/sign-in/social`
- **Method**: POST
- **Purpose**: Tests OAuth flow initiation with Google
- **Expected**: Returns a redirect to Google OAuth

### 3. OAuth Callback (Invalid State)
- **Endpoint**: `/api/auth/callback/google`
- **Method**: GET
- **Purpose**: Tests callback handling with invalid parameters
- **Expected**: Handles errors gracefully

### 4. Sign Out (No Authentication)
- **Endpoint**: `/api/auth/sign-out`
- **Method**: POST
- **Purpose**: Tests sign-out functionality without authentication
- **Expected**: Handles sign-out gracefully

### 5. Session Cookie Management
- **Endpoint**: `/api/auth/get-session`
- **Method**: GET
- **Purpose**: Tests session management with cookies
- **Expected**: Properly handles session cookies

### 6. CSRF Protection
- **Endpoint**: `/api/auth/sign-in/social`
- **Method**: POST
- **Purpose**: Tests CSRF protection mechanisms
- **Expected**: Handles potentially malicious requests

### 7. Invalid OAuth Provider
- **Endpoint**: `/api/auth/sign-in/social`
- **Method**: POST
- **Purpose**: Tests error handling for invalid providers
- **Expected**: Returns appropriate error

### 8. Rate Limiting
- **Endpoint**: `/api/auth/get-session`
- **Method**: GET
- **Purpose**: Tests rate limiting (if implemented)
- **Expected**: Either rate limits requests or handles them successfully

### 9. Security Headers
- **Endpoint**: `/api/auth/get-session`
- **Method**: GET
- **Purpose**: Tests for security headers
- **Expected**: Includes appropriate security headers

### 10. Complete OAuth Flow Simulation
- **Endpoint**: Multiple endpoints
- **Method**: Various
- **Purpose**: Simulates the complete OAuth flow
- **Expected**: Properly initiates OAuth and handles callback

## Output

The test script provides:
- Real-time logging of each test step
- Detailed response information (status, headers, body)
- Summary of test results (passed/failed)
- Success rate percentage
- Detailed results for each test case

## Interpreting Results

### Success Indicators
- ✅ Green checkmarks for passed tests
- Success rate of 100%
- Proper status codes and responses

### Failure Indicators
- ❌ Red X marks for failed tests
- Error messages with details
- Unexpected status codes or responses

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the development server is running
   - Check that the application is accessible at `http://localhost:3000`

2. **OAuth Failures**
   - Verify Google OAuth credentials are properly configured
   - Check environment variables are set correctly

3. **Test Timeouts**
   - Check network connectivity
   - Ensure the server is responsive

### Debug Mode

For more detailed debugging, you can:
1. Add additional console.log statements to the test script
2. Check the server logs for more information
3. Use browser developer tools to inspect network requests

## Extending the Tests

To add new test cases:
1. Create a new async function following the existing pattern
2. Add the function to the `runAllTests()` function
3. Export the function if you want to run it individually
4. Follow the naming convention: `test<TestCaseName>()`

## Best Practices

1. Run tests before deploying changes
2. Use the test script to verify authentication fixes
3. Keep the test script updated with new authentication features
4. Review test results regularly to catch regressions

## Notes

- The script is designed to be non-destructive and won't modify actual user data
- Some tests simulate error conditions and expect appropriate error handling
- The script can be run multiple times without side effects
- Tests are designed to work with the Better Auth framework implementation