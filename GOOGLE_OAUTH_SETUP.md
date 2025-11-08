# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Voice to Notes application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- A Google Cloud project

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click "NEW PROJECT"
5. Enter a project name (e.g., "Voice to Notes")
6. Click "CREATE"

## Step 2: Enable Google+ API

1. In your new project, go to the navigation menu (☰) and select "APIs & Services" > "Library"
2. Search for "Google+ API" or "People API"
3. Click on the API and then click "ENABLE"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" and click "CREATE"
3. Fill in the required fields:
   - **App name**: Voice to Notes
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click "SAVE AND CONTINUE"
5. Add scopes if needed (for basic profile info, the default scopes are sufficient)
6. Click "SAVE AND CONTINUE"
7. Add test users (your email address) if you're in testing mode
8. Click "SAVE AND CONTINUE" and then "BACK TO DASHBOARD"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" and select "OAuth client ID"
3. Select "Web application" as the application type
4. Give it a name (e.g., "Voice to Notes Web Client")
5. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
6. Click "CREATE"

## Step 5: Get Your Credentials

After creating the OAuth client, you'll see a dialog with your:
- **Client ID**
- **Client Secret**

Copy these values as you'll need them for the next step.

## Step 6: Configure Environment Variables

1. Open the `.env` file in your project root
2. Add your Google OAuth credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"
```

3. Generate a secure secret for `BETTER_AUTH_SECRET`. You can use:
   ```bash
   openssl rand -base64 32
   ```

## Step 7: Update Production Configuration

For production deployment, make sure to:

1. Update the `BETTER_AUTH_URL` to your production domain
2. Add the production redirect URI to your Google OAuth client
3. Ensure your domain is verified in Google Cloud Console

## Step 8: Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Click the "Sign in with Google" button

4. You should be redirected to Google's authentication page

5. After signing in, you'll be redirected back to your application

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Make sure the redirect URI in Google Cloud Console exactly matches your application's callback URL
   - Check for trailing slashes and HTTP vs HTTPS

2. **Invalid Client**
   - Verify your Client ID and Client Secret are correctly copied
   - Ensure there are no extra spaces or characters

3. **Access Blocked**
   - Make sure your OAuth consent screen is properly configured
   - Add your email as a test user if in testing mode

4. **CORS Issues**
   - Ensure your frontend URL is properly configured in the OAuth client settings

### Debug Mode

To enable debug mode for better-auth, you can add this to your auth configuration:

```typescript
export const auth = betterAuth({
    // ... other config
    advanced: {
        generateId: false,
        debug: true, // Enable debug mode
    },
});
```

## Security Considerations

1. **Never commit your `.env` file** to version control
2. **Use different credentials** for development and production
3. **Regularly rotate your secrets** and client secrets
4. **Limit the scopes** to only what your application needs
5. **Implement proper session management** with appropriate expiration times

## Next Steps

Once Google OAuth is set up, you can:

1. Customize the user profile handling
2. Add additional social providers
3. Implement role-based access control
4. Add email verification for new users
5. Set up user profile management

For more information about better-auth, visit the [official documentation](https://better-auth.com/docs).