# URGENT: Google OAuth Fix

## The Error
```
❌ NextAuth Error: OAUTH_CALLBACK_ERROR {
  error: [Error [OAuthCallbackError]: invalid_client (Unauthorized)] {
    code: undefined
  },
  providerId: 'google'
}
```

## Root Cause
Google is rejecting your OAuth credentials. This means your Google Cloud Console setup has an issue.

## IMMEDIATE STEPS TO FIX:

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### Step 2: Check Your OAuth 2.0 Client ID
Click on your client ID: `303327757913-nc2nhcpsglb92uhlt7cq6mm1s6d3v0sl`

### Step 3: CRITICAL - Check Authorized Redirect URIs
**MUST MATCH EXACTLY:**
```
http://localhost:3000/api/auth/callback/google
```

**Common Issues:**
- Missing `http://` (not `https://`)
- Extra `/` at the end
- Wrong port number
- Typo in the path

### Step 4: Check Authorized JavaScript Origins
Add this if missing:
```
http://localhost:3000
```

### Step 5: Check OAuth Consent Screen
- Go to: **APIs & Services > OAuth consent screen**
- Make sure the app is configured and published
- Add test users if app is in "Testing" mode

### Step 6: If Still Not Working - CREATE NEW CREDENTIALS

1. **Create New OAuth 2.0 Client ID:**
   - Application type: Web application
   - Name: Content Platform Local
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

2. **Download the credentials and update `.env.local`:**
   ```
   GOOGLE_CLIENT_ID="your-new-client-id"
   GOOGLE_CLIENT_SECRET="your-new-client-secret"
   ```

### Step 7: Test After Changes
1. Restart the server: `npm run dev`
2. Visit: `http://localhost:3000/test-oauth`
3. Try Google login

## Expected Database Entry After Fix
Once working, Google users will be stored exactly like manual signup:
```sql
INSERT INTO User (
  name,
  email,
  passwordHash,
  role,
  phoneVerified,
  createdAt,
  updatedAt
) VALUES (
  'Google User Name',
  'user@gmail.com',
  '', -- Empty for Google users
  'CONSUMER',
  false,
  NOW(),
  NOW()
);
```

## Quick Test
After fixing, check the database to confirm the user was created:
- Visit: https://console.neon.tech/
- Check your database
- Look for the new user entry with Google email 