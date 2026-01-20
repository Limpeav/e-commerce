# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your ecommerce website.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if using different port)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Add authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production domain
5. Copy your **Client ID**

## Step 2: Configure Environment Variables

### Frontend (.env file in `ecommerce-frontend/`)

Create or update your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### Backend (.env file in `ecommerce-backend/`)

Make sure you have:

```env
JWT_SECRET=your-jwt-secret-here
MONGO_URI=your-mongodb-connection-string
PORT=4000
```

## Step 3: Restart Your Servers

After adding the environment variables:

1. Restart your frontend server:
   ```bash
   cd ecommerce-frontend
   npm run dev
   ```

2. Restart your backend server:
   ```bash
   cd ecommerce-backend
   npm run dev
   ```

## Step 4: Test Google OAuth

1. Go to your login or register page
2. Click the "Continue with Google" or "Sign up with Google" button
3. Select your Google account
4. Grant permissions
5. You should be automatically logged in!

## Features

- ✅ One-click sign in/up with Google
- ✅ Automatic account creation for new users
- ✅ Seamless integration with existing authentication
- ✅ Secure token-based authentication
- ✅ Works on both login and registration pages

## Troubleshooting

### "Invalid client ID" error
- Make sure `VITE_GOOGLE_CLIENT_ID` is set correctly in your `.env` file
- Restart your frontend server after adding the environment variable
- Check that the Client ID matches the one from Google Cloud Console

### "Redirect URI mismatch" error
- Make sure your current URL (e.g., `http://localhost:5173`) is added to authorized JavaScript origins in Google Cloud Console
- Check that the redirect URI in Google Cloud Console matches your frontend URL exactly

### "Access blocked" error
- Make sure you've enabled the Google+ API in Google Cloud Console
- Check that your OAuth consent screen is configured (APIs & Services > OAuth consent screen)

## Security Notes

- Never commit your `.env` files to version control
- Keep your Google Client ID secure
- Use different Client IDs for development and production
- Regularly rotate your JWT_SECRET
