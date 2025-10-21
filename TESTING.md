# Testing the Serverless Metadata Extraction

## Current Setup

✅ **Frontend running:** http://localhost:8080/
✅ **Environment configured:** Using production API at `https://vibesync-umber.vercel.app/api`

## Test Plan

### Test 1: Check Environment Configuration

Open browser console (F12) and check:
```javascript
// In console, check which backend URL is being used
console.log('Backend URL:', import.meta.env.VITE_METADATA_API || 'auto-detect');
```

Expected: Should show `https://vibesync-umber.vercel.app/api`

### Test 2: Test API Health Endpoint

**Option A: Browser Console**
```javascript
fetch('https://vibesync-umber.vercel.app/api/health')
  .then(r => r.json())
  .then(d => console.log('Health check:', d))
  .catch(e => console.error('Health check failed:', e));
```

**Option B: Command Line**
```bash
curl https://vibesync-umber.vercel.app/api/health
```

**Expected Response:**
```json
{
  "ok": true
}
```

**Actual Status:** ⚠️ Currently returns 404 (API functions not deployed yet)

### Test 3: Upload Audio File

1. Open http://localhost:8080/
2. Go to **Library** tab
3. Click **Upload files** button
4. Select an audio file (MP3, M4A, etc.)
5. Watch the console for logs:
   - `[Library] File input changed`
   - `[ImportWithProgress] Starting import`
   - `[ImportWithProgress] Checking backend health...`
   - Backend check result
   - Processing logs

**Expected Flow:**

**Scenario A: Backend Available (After Deployment)**
```
✅ Backend health check: true
✅ Using backend route
✅ Processing file X / Y
✅ Metadata extracted with cover art
✅ File added to library
```

**Scenario B: Backend Unavailable (Current State)**
```
⚠️ Backend health check: false
⚠️ Using worker fallback
✅ Processing file X / Y
✅ Basic metadata extracted
✅ File added to library
```

### Test 4: Verify Metadata Extraction

After uploading a file, check:
1. **Track appears in library** ✅
2. **Title extracted** ✅
3. **Artist extracted** ✅
4. **Album info** (if available)
5. **Cover art displayed** (backend only)
6. **Duration shown** ✅

### Test 5: Test Duplicate Detection

1. Upload the same file twice
2. Expected behavior:
   - First upload: Success
   - Second upload: Warning toast "Skipped duplicate (same name & size)"
   - File NOT added to library again

## Current Status

### ✅ What's Working Now:
- Frontend dev server running
- Environment configured for production API
- Console logging enabled for debugging
- Worker fallback functional
- Duplicate detection implemented

### ⚠️ What Needs Deployment:
- Vercel serverless functions not yet deployed
- API endpoints returning 404
- Need to push code and deploy to Vercel

## Next Steps

### Option 1: Test with Worker Fallback (Now)
Since backend isn't deployed yet, test the worker fallback:
1. Upload audio files at http://localhost:8080/
2. Worker will extract basic metadata
3. Verify tracks are added to library

### Option 2: Deploy and Test Full Backend (Recommended)
1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add Vercel serverless functions for metadata extraction"
   git push
   ```

2. **Deploy to Vercel:**
   - Auto-deploys from GitHub
   - Or use: `npx vercel --prod`

3. **Test API:**
   ```bash
   curl https://vibesync-umber.vercel.app/api/health
   ```

4. **Test upload:**
   - Go to your deployed app
   - Upload audio files
   - Backend extracts rich metadata with FFmpeg

## Troubleshooting

### Issue: "Backend health check failed"
**Cause:** API functions not deployed yet
**Solution:** Deploy to Vercel first

### Issue: "Worker fallback isn't working"
**Check:**
- Console for errors
- `music-metadata-browser` installed
- Worker file compiles without type errors

### Issue: "No cover art showing"
**Cause:** Worker fallback doesn't extract cover art (only backend does)
**Solution:** Deploy backend or run local Express server

## Manual Backend Test (Alternative)

If you want to test backend locally without Vercel:

**Terminal 1:**
```bash
cd backend
node server.js
```

**Terminal 2:**
```bash
npm run dev
```

**Update `.env`:**
```bash
VITE_METADATA_API=http://localhost:5000
```

Then test upload - should use local backend.

---

## Quick Test Script

Open browser console on http://localhost:8080/ and run:

```javascript
// Test 1: Check config
console.log('=== Configuration ===');
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_METADATA_API || 'auto-detect');

// Test 2: Check health
console.log('=== Testing Health Endpoint ===');
const apiUrl = import.meta.env.VITE_METADATA_API || 'https://vibesync-umber.vercel.app/api';
fetch(`${apiUrl}/health`)
  .then(r => {
    console.log('Status:', r.status, r.statusText);
    return r.json();
  })
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e.message));

// Test 3: Now try uploading a file through the UI
console.log('=== Ready to Test Upload ===');
console.log('1. Go to Library tab');
console.log('2. Click Upload files');
console.log('3. Select an audio file');
console.log('4. Watch console for logs');
```

---

**Current Recommendation:** 🚀 **Deploy to Vercel first**, then test the full functionality!
