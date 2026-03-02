# Environment Variables & App Restart Guide

## Quick Answer: How to Restart After Changing .env

### Step 1: Stop the App
```bash
# Press Ctrl+C in the terminal where app is running
# Or run:
pkill -f "expo start"
```

### Step 2: Start Fresh
```bash
cd app
npm start
```

### Step 3: Open in Browser
When Metro bundler starts, press `w` to open web browser

### Or Use the Restart Script
```bash
./restart-app.sh
```

Then manually run:
```bash
cd app && npm start
```

## Why Environment Variables Need Restart

### How Environment Variables Work

**At Build Time:**
```javascript
// When app starts, this reads .env
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
```

**Key Point:** The `.env` file is read **once** when the app starts, not continuously.

### What Happens

1. **App starts** → Reads `.env` file → Loads into memory
2. **You edit `.env`** → Change not picked up (old value still in memory)
3. **App restart** → Re-reads `.env` file → New value loaded ✅

## Your Current Configuration

### Environment File Location
```
app/.env
```

### Required Variables
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Gemini AI Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
```

### Verification Status
✅ All variables found and configured correctly!

## Common Issues & Solutions

### Issue 1: "API key not valid"

**Cause:** 
- Wrong API key
- API key not loaded (need restart)
- Extra spaces in .env file

**Solution:**
```bash
# 1. Check your .env file
cat app/.env | grep GEMINI

# 2. Should look like (no quotes, no spaces around =):
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyABC123...

# 3. Restart app
cd app && npm start
```

### Issue 2: "API key not configured"

**Cause:**
- Missing EXPO_PUBLIC_ prefix
- Wrong file location

**Solution:**
```bash
# Check file exists
ls -la app/.env

# Check variable name
grep "EXPO_PUBLIC_GEMINI" app/.env

# Must have EXPO_PUBLIC_ prefix!
```

### Issue 3: Changes Not Appearing

**Cause:**
- Metro bundler caching
- Browser caching
- App not restarted

**Solution:**
```bash
# 1. Stop app (Ctrl+C)
# 2. Clear caches
rm -rf app/.expo
rm -rf app/node_modules/.cache

# 3. Restart
cd app && npm start

# 4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
```

## Environment Variable Best Practices

### DO ✅

```bash
# Use EXPO_PUBLIC_ prefix for client-side variables
EXPO_PUBLIC_GEMINI_API_KEY=your_key

# No spaces around equals sign
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321

# No quotes (Expo handles this)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyABC123

# Use comments for documentation
# Gemini AI API Key from https://makersuite.google.com/
EXPO_PUBLIC_GEMINI_API_KEY=your_key
```

### DON'T ❌

```bash
# No quotes needed
EXPO_PUBLIC_GEMINI_API_KEY="your_key"  # ❌

# No spaces
EXPO_PUBLIC_GEMINI_API_KEY = your_key  # ❌

# Missing prefix (won't work in client)
GEMINI_API_KEY=your_key  # ❌

# Wrong file location
./food-pantry/.env  # ❌ Should be in app/.env
```

## Checking Environment Variables at Runtime

### In Browser Console
```javascript
// Check if variable is loaded
console.log('Gemini Key exists:', !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);
console.log('Key length:', process.env.EXPO_PUBLIC_GEMINI_API_KEY?.length);

// Don't log the actual key (security risk)
```

### In Your Code
```typescript
// app/src/services/gemini.ts
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

if (!API_KEY) {
  throw new Error('Gemini API key not configured');
}
```

## Development vs Production

### Development (.env)
```bash
# app/.env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_GEMINI_API_KEY=dev_key_here
```

### Production (.env.production)
```bash
# app/.env.production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_GEMINI_API_KEY=prod_key_here
```

Load with:
```bash
npx expo start --env production
```

## Restart Checklist

When you change environment variables:

- [ ] Stop the development server (Ctrl+C)
- [ ] Verify changes in `app/.env`
- [ ] Clear caches (optional but recommended)
- [ ] Start server: `cd app && npm start`
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Test the feature

## Quick Commands Reference

```bash
# Stop app
pkill -f "expo start"

# Clear all caches
rm -rf app/.expo app/node_modules/.cache

# Restart fresh
cd app && npm start

# Check environment
cat app/.env | grep EXPO_PUBLIC

# Verify API key format
cat app/.env | grep GEMINI_API_KEY
```

## Troubleshooting Specific Error

Your error was:
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "INVALID_ARGUMENT"
  }
}
```

### This means:
1. ❌ Old/cached API key still loaded
2. ❌ New API key not picked up yet

### Solution:
1. ✅ Stop app (Ctrl+C)
2. ✅ Verify new key in `app/.env`
3. ✅ Start fresh: `cd app && npm start`
4. ✅ Test again

## Getting a Valid API Key

### Step 1: Get Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Step 2: Add to .env
```bash
# app/.env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyABC123...your_actual_key
```

### Step 3: Restart
```bash
cd app && npm start
```

### Step 4: Test
Try importing a recipe with "Paste Recipe Text"

## Summary

**Remember:** 
- Environment variables load at **startup only**
- Changes require **app restart**
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Verify in `app/.env` (not root `.env`)
- No quotes needed around values

**Quick Restart:**
```bash
# Stop (Ctrl+C)
cd app && npm start
```

That's it! 🚀
