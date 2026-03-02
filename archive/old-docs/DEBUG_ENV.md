# Debug Environment Variable Loading

## The Issue

Your API key **WORKS** when tested with curl, but the app shows it's invalid. This means the app isn't loading the updated `.env` file properly.

## Confirmed Working

✅ API key is valid  
✅ Model `gemini-2.5-flash` works  
✅ Test with curl succeeds  
❌ App still uses old/empty key  

## Root Cause

The app is using a **cached or stale environment variable**. This happens when:

1. ❌ App wasn't fully restarted after `.env` change
2. ❌ Browser cached the old bundle
3. ❌ Metro bundler cached the old environment
4. ❌ Multiple app instances running

## Full Reset Solution

### Step 1: Kill ALL Processes

```bash
# Kill expo/react-native
pkill -9 -f "expo"
pkill -9 -f "react-native"
pkill -9 -f "metro"
pkill -9 -f "node.*8081"

# Verify nothing is running
ps aux | grep -E "expo|metro|8081" | grep -v grep
# Should be empty
```

### Step 2: Clear ALL Caches

```bash
cd app

# Clear Expo cache
rm -rf .expo
rm -rf node_modules/.cache

# Clear Metro cache
rm -rf /tmp/metro-*
rm -rf /tmp/react-*

# Clear Watchman (if installed)
watchman watch-del-all 2>/dev/null || true

# Clear yarn/npm cache (optional)
npm cache clean --force
```

### Step 3: Verify .env File

```bash
# Check the file
cat app/.env | grep GEMINI

# Should show:
# EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...your_key
```

### Step 4: Start Fresh

```bash
cd app
npm start -- --clear
```

**Important:** Use `--clear` flag to clear Metro cache

### Step 5: Hard Refresh Browser

When app opens:
1. Press **Ctrl+Shift+R** (Windows/Linux)
2. Or **Cmd+Shift+R** (Mac)
3. Or open DevTools → Right-click refresh → "Empty Cache and Hard Reload"

### Step 6: Check Console

Open browser console (F12) and look for:
```
[Gemini Service] API Key loaded: ...
```

Should show the correct key length (39) and prefix.

## Quick Nuclear Reset Script

Save this as `nuclear-reset.sh`:

```bash
#!/bin/bash
echo "🔥 Nuclear reset - killing everything..."

# Kill all processes
pkill -9 -f "expo" 2>/dev/null
pkill -9 -f "metro" 2>/dev/null
pkill -9 -f "node.*8081" 2>/dev/null
sleep 1

# Clear all caches
cd app
rm -rf .expo node_modules/.cache
rm -rf /tmp/metro-* /tmp/react-* 2>/dev/null
watchman watch-del-all 2>/dev/null

echo "✓ Everything killed and cleared"
echo ""
echo "Now run: cd app && npm start -- --clear"
```

Then:
```bash
chmod +x nuclear-reset.sh
./nuclear-reset.sh
cd app && npm start -- --clear
```

## Check if Environment is Loaded

Add this to test if env loads in app:

**Create:** `app/test-env.js`
```javascript
console.log('=== ENV TEST ===');
console.log('GEMINI KEY:', process.env.EXPO_PUBLIC_GEMINI_API_KEY ? 'EXISTS' : 'MISSING');
console.log('Key length:', process.env.EXPO_PUBLIC_GEMINI_API_KEY?.length || 0);
console.log('================');
```

Import in `App.tsx`:
```typescript
import './test-env';  // Add at top
```

## Alternative: Check in Browser Console

When app is running, open console and type:

```javascript
// Check if env variable exists
console.log('API Key exists:', typeof process?.env?.EXPO_PUBLIC_GEMINI_API_KEY !== 'undefined');
```

**Note:** In browser, `process.env` is replaced at build time, so this might not work. You need to check the actual service file.

## Add Debug Logging

Edit `app/src/services/gemini.ts` temporarily:

```typescript
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// ADD THIS:
console.log('🔑 [Gemini] Key check:', {
  exists: !!API_KEY,
  length: API_KEY.length,
  first10: API_KEY.substring(0, 10),
});

const genAI = new GoogleGenerativeAI(API_KEY);
```

After restart, you should see this in browser console.

## Common Pitfalls

### ❌ Wrong File Location
```bash
# Wrong
./food-pantry/.env          # ❌ Root directory
./food-pantry/.env.local    # ❌ Root directory

# Correct
./food-pantry/app/.env      # ✅ In app directory
```

### ❌ Multiple .env Files
```bash
# Check for duplicates
find . -name ".env*" -type f

# Should only show:
# ./app/.env
# ./.env.example (if exists, that's ok)
```

### ❌ Process Still Running
```bash
# Check port 8081
lsof -i :8081

# Should be empty when stopped
# Kill if found:
kill -9 <PID>
```

### ❌ Browser Service Worker Cache
```bash
# In browser DevTools:
Application → Service Workers → Unregister
Application → Storage → Clear site data
```

## Verification Checklist

After full reset:

- [ ] All processes killed (`ps aux | grep expo` shows nothing)
- [ ] All caches cleared (`.expo` and `node_modules/.cache` deleted)
- [ ] `.env` file verified (`cat app/.env | grep GEMINI`)
- [ ] App started fresh (`npm start -- --clear`)
- [ ] Browser hard refreshed (Ctrl+Shift+R)
- [ ] Console shows API key loaded
- [ ] Test recipe import

## If STILL Not Working

### Option 1: Hardcode for Testing

Edit `app/src/services/gemini.ts`:

```typescript
// Temporary test - REMOVE AFTER TESTING
const API_KEY = 'AIzaSy...your_actual_key_here';
// const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
```

If this works → Environment variable loading issue  
If this fails → Different problem (API restrictions, etc.)

### Option 2: Check Metro Config

Verify `metro.config.js` doesn't block env variables:

```javascript
// Should NOT have this:
resolver: {
  blacklistRE: /\.env/,  // ❌ Don't block .env
}
```

### Option 3: Use Different Env Method

Try `.env.local` instead:

```bash
# Copy to .env.local
cp app/.env app/.env.local

# Expo should pick this up first
```

## Expected Behavior

After proper reset:

1. Console shows: `[Gemini] Key check: { exists: true, length: 39, ... }`
2. API calls work
3. Recipe import succeeds

## Debug Output

Run this to see what's being loaded:

```bash
cd app
node -e "
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');
const geminiLine = lines.find(l => l.includes('GEMINI'));
console.log('Raw .env line:', geminiLine);
console.log('Parsed value:', geminiLine?.split('=')[1]?.length || 0, 'chars');
"
```

Should show 39-40 characters.

## Last Resort: Create New Project

If nothing works, the Expo cache might be corrupted:

```bash
# Create new app directory
mv app app.backup
npx create-expo-app app --template blank

# Copy source files
cp -r app.backup/src app/
cp app.backup/.env app/
cp app.backup/package.json app/

# Install deps
cd app
npm install

# Start fresh
npm start
```

## Summary

**Most likely issue:** Metro bundler cache + browser cache

**Solution:**
1. Kill all processes
2. Clear all caches
3. Restart with `--clear` flag
4. Hard refresh browser

**Test:** Run `./test-api-key.sh` - should show ✅ SUCCESS

Your API key IS valid. The app just needs to pick up the new environment properly!
