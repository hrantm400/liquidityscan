# Google OAuth Setup Guide

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External (or Internal if using Google Workspace)
   - App name: Liquidity Scanner
   - User support email: your email
   - Developer contact: your email
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: Liquidity Scanner Web
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `http://localhost:5173` (for frontend development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Copy the **Client ID** and **Client Secret**

## 2. Configure Environment Variables

Add to your `.env` file in `liquidityscan-web/backend/`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=/api/auth/google/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

## 3. Test the Setup

1. Start the backend:
   ```bash
   cd liquidityscan-web/backend
   npm run start:dev
   ```

2. Start the frontend:
   ```bash
   cd liquidityscan-web/frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/app/login`
4. Click "Continue with Google"
5. You should be redirected to Google login page
6. After authentication, you'll be redirected back to the app

## Troubleshooting

- **"redirect_uri_mismatch"**: Make sure the redirect URI in Google Console exactly matches `GOOGLE_CALLBACK_URL`
- **"invalid_client"**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- **CORS errors**: Ensure `CORS_ORIGIN` in backend `.env` includes your frontend URL
