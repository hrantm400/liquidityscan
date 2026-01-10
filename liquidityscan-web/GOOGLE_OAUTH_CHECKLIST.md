# Google OAuth Setup Checklist

## Environment Variables (.env)

### Backend Environment Variables

Your `backend/.env` file MUST contain the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# JWT Configuration (if not already set)
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database (if not already set)
DATABASE_URL=your-database-url-here
```

### Important Notes:

1. **GOOGLE_CALLBACK_URL must be an absolute URL**
   - ✅ Good: `http://localhost:3000/api/auth/google/callback`
   - ❌ Bad: `/api/auth/google/callback`

2. **FRONTEND_URL must match your Vite dev server**
   - For local development: `http://localhost:5173`
   - For Cloudflare Tunnel: `https://your-tunnel-url.trycloudflare.com`
   - For production: `https://yourdomain.com`

3. **CORS_ORIGIN should match FRONTEND_URL**

## Google Cloud Console Setup

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select an existing one

### Step 2: Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Configure the following:

#### Authorized JavaScript origins:
```
http://localhost:5173
http://localhost:3000
```

If using Cloudflare Tunnel, also add:
```
https://your-tunnel-url.trycloudflare.com
```

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/google/callback
```

If using Cloudflare Tunnel, also add:
```
https://your-tunnel-url.trycloudflare.com/api/auth/google/callback
```

### Step 4: Copy Credentials
1. After creating, copy the **Client ID**
2. Copy the **Client Secret**
3. Paste them into your `backend/.env` file

## Testing the Setup

### 1. Check Backend Logs
When you start the backend (`npm run start:dev`), you should see:

```
[GoogleStrategy] Initializing with:
  - Client ID: 123456789012-abc...
  - Client Secret: SET
  - Callback URL: http://localhost:3000/api/auth/google/callback
[CORS] Enabling CORS for origin: http://localhost:5173
Application is running on: http://localhost:3000
API available at: http://localhost:3000/api
Google OAuth callback: http://localhost:3000/api/auth/google/callback
```

### 2. Test OAuth Flow
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:5173`
4. Click "Login" or "Launch App"
5. Click "Continue with Google"
6. Select your Google account
7. You should be redirected to the dashboard

### 3. Check Browser Console
After successful login, you should see:

```
[OAuthHandler] Processing OAuth tokens...
[OAuthHandler] Step 1: Storing tokens in Zustand...
[OAuthHandler] Step 2: Storing tokens in localStorage...
[OAuthHandler] Step 3: Fetching user profile from API...
[OAuthHandler] Profile fetched: { id: '...', email: '...', name: '...' }
[OAuthHandler] Step 4: Storing user in Zustand...
[OAuthHandler] OAuth processing complete! Redirecting to dashboard...
```

### 4. Check Backend Logs
During OAuth flow, you should see:

```
[Google OAuth Callback] ========================================
[Google OAuth Callback] Received callback from Google
[Google OAuth Callback] User data received from GoogleStrategy: { email: '...', firstName: '...', lastName: '...' }
[Google OAuth Callback] Calling AuthService.googleLogin()...
[Google OAuth Callback] Tokens generated successfully
[Google OAuth Callback] User from DB: { id: '...', email: '...', name: '...' }
[Google OAuth Callback] Redirecting to: http://localhost:5173/app/dashboard?token=***&refreshToken=***
[Google OAuth Callback] ========================================
```

## Common Issues

### Issue 1: "redirect_uri_mismatch"
**Cause:** The redirect URI in your Google Cloud Console doesn't match the one in your `.env`

**Solution:**
- Check `GOOGLE_CALLBACK_URL` in `backend/.env`
- Verify it matches EXACTLY in Google Cloud Console > Credentials > Authorized redirect URIs

### Issue 2: "Access blocked: This app's request is invalid"
**Cause:** JavaScript origins not configured correctly

**Solution:**
- Add `http://localhost:5173` and `http://localhost:3000` to Authorized JavaScript origins
- Wait a few minutes for Google to propagate changes

### Issue 3: Redirects back to landing page
**Cause:** OAuth tokens not being processed correctly

**Solution:**
- Check browser console for `[OAuthHandler]` logs
- Check backend logs for `[Google OAuth Callback]` logs
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL

### Issue 4: CORS errors
**Cause:** CORS not configured correctly

**Solution:**
- Ensure `CORS_ORIGIN` in `backend/.env` matches `FRONTEND_URL`
- Check backend logs for `[CORS]` messages
- If using Cloudflare Tunnel, the backend should automatically allow `.trycloudflare.com` domains

## Production Setup

When deploying to production:

1. **Update .env variables:**
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Update Google Cloud Console:**
   - Add `https://yourdomain.com` to Authorized JavaScript origins
   - Add `https://yourdomain.com/api/auth/google/callback` to Authorized redirect URIs

3. **SSL/HTTPS:**
   - Google OAuth requires HTTPS in production
   - Use a service like Cloudflare, Vercel, or Netlify for SSL

## Security Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use different credentials for development and production**
3. **Rotate secrets regularly**
4. **Restrict OAuth scopes** - Only request `email` and `profile`
5. **Implement rate limiting** on OAuth endpoints in production

## Need Help?

If you're still having issues:
1. Check backend logs carefully
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Console settings match your `.env` exactly
5. Try in an incognito/private browser window (clears cached OAuth state)
