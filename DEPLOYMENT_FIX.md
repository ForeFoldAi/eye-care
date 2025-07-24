# Fix for API URL Issues in Production

## Problem
The error "Unexpected token '<', '<!DOCTYPE'... is not valid JSON" occurs because your frontend is trying to fetch JSON from API endpoints, but instead receives HTML responses (usually the index.html file). This happens when API calls use relative paths like `/api/...` which work in development (due to Vite proxy) but fail in production.

## Solution

### 1. Update Environment Variables

#### For Vercel (Frontend)
Add the following environment variable in your Vercel dashboard:

```
VITE_API_URL=https://eye-care-1-ck95.onrender.com
```

#### For Render (Backend)
Make sure your backend environment variables include:

```
NODE_ENV=production
FRONTEND_URL=https://eye-care-ten.vercel.app
ALLOWED_ORIGINS=https://eye-care-ten.vercel.app
```

### 2. Backend CORS Configuration

Ensure your backend server has proper CORS configuration. In your server code, make sure CORS allows your frontend domain:

```javascript
// In your server setup (usually app.js or server.js)
const cors = require('cors');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS?.split(',') || []
].flat().filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### 3. Files Modified

The following files have been updated to fix the API URL configuration:

1. **`client/src/lib/auth.ts`** - Updated to use proper API URL configuration
2. **`client/src/lib/config.ts`** - New file with API configuration utilities
3. **`client/.env.production`** - Production environment variables
4. **`client/.env.development`** - Development environment variables

### 4. How It Works

- **Development**: Uses relative URLs (`/api/...`) which are proxied by Vite to `localhost:3000`
- **Production**: Uses absolute URLs (`https://your-backend.onrender.com/api/...`) when `VITE_API_URL` is set

### 5. Testing

To test locally before deploying:

1. Set `VITE_API_URL` in your local environment:
   ```bash
   export VITE_API_URL=https://your-backend-app.onrender.com
   ```

2. Run the frontend:
   ```bash
   cd client
   npm run build
   npm run preview
   ```

This will simulate production behavior locally.

### 6. Deployment Steps

1. **Deploy Backend First**:
   - Deploy your server to Render
   - Note the URL (e.g., `https://your-app-name.onrender.com`)

2. **Configure Frontend**:
   - In Vercel dashboard, add environment variable:
     - Name: `VITE_API_URL`
     - Value: `https://your-app-name.onrender.com`

3. **Deploy Frontend**:
   - Deploy to Vercel
   - The build process will use the environment variable

### 7. Verification

After deployment, check browser developer tools:

1. **Network Tab**: API calls should go to your Render URL, not relative paths
2. **Console**: Should show "Auth interceptor: Adding token to request" for authenticated requests
3. **Response Type**: Should receive JSON, not HTML

### 8. Common Issues

- **Wrong Backend URL**: Double-check your Render app URL
- **CORS Errors**: Ensure backend allows your Vercel domain
- **Environment Variables**: Make sure `VITE_API_URL` is set in Vercel
- **Build Process**: Environment variables must start with `VITE_` for Vite

### 9. Backend Health Check

Your backend should have a `/health` endpoint that returns a simple JSON response:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

This is used by the frontend to verify server connectivity.
