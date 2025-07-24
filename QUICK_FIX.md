# Quick Fix for Your Deployment

## Your URLs:
- **Frontend**: https://eye-care-ten.vercel.app
- **Backend**: https://eye-care-1-ck95.onrender.com

## Immediate Steps to Fix the Issue:

### 1. Set Environment Variable in Vercel

Go to your Vercel dashboard and add this environment variable:

**Variable Name**: `VITE_API_URL`
**Value**: `https://eye-care-1-ck95.onrender.com`

**Steps:**
1. Go to https://vercel.com/dashboard
2. Click on your `eye-care-ten` project
3. Go to Settings → Environment Variables
4. Add new variable:
   - Name: `VITE_API_URL`
   - Value: `https://eye-care-1-ck95.onrender.com`
   - Environment: Production (and Preview if you want)
5. Click "Save"

### 2. Redeploy Frontend

After adding the environment variable:
1. Go to Deployments tab in Vercel
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

### 3. Update Backend CORS (if needed)

Make sure your backend allows your frontend domain. Check your server code has:

```javascript
const allowedOrigins = [
  'https://eye-care-ten.vercel.app',
  'http://localhost:5173', // for development
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

### 4. Test the Fix

After redeployment:
1. Open https://eye-care-ten.vercel.app
2. Open browser Developer Tools (F12)
3. Go to Network tab
4. Try to access Billing or Support pages
5. You should see API calls going to `https://eye-care-1-ck95.onrender.com/api/...` instead of relative paths

### 5. Verification Checklist

✅ Backend health check: https://eye-care-1-ck95.onrender.com/health
✅ Environment variable set in Vercel
⏳ Frontend redeployed
⏳ API calls working correctly

## If Still Not Working

1. Check browser console for CORS errors
2. Verify the environment variable is set correctly in Vercel
3. Make sure you redeployed after adding the environment variable
4. Check that your backend CORS configuration allows your frontend domain

Your backend is running correctly, so this should fix the JSON parsing issue!
