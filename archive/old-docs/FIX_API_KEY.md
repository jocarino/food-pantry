# Fix Invalid Gemini API Key

## The Problem

Your API key format is correct, but Google is rejecting it as invalid. This means:

1. ❌ The key was deleted/revoked in Google AI Studio
2. ❌ The key has restrictions that don't match this app
3. ❌ The key expired or was never activated
4. ❌ Copy/paste error (missing characters)

## Solution: Get a New API Key

### Step 1: Visit Google AI Studio
Open: https://aistudio.google.com/app/apikey

### Step 2: Sign In
Use your Google account

### Step 3: Create New API Key

**Option A: Create New Project Key**
1. Click **"Create API key"**
2. Select **"Create API key in new project"**
3. Wait for key to be created
4. **Copy the key** (starts with `AIza...`)

**Option B: Use Existing Project**
1. Click **"Create API key"**
2. Select an existing project
3. **Copy the key**

### Step 4: Delete Old Key (Recommended)
If you see your old key in the list:
1. Click the **trash icon** next to it
2. Confirm deletion

### Step 5: Update .env File

Open `app/.env` in a text editor and update the key:

```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...your_new_key_here
```

**Important:**
- ✅ No quotes
- ✅ No spaces around `=`
- ✅ Copy the **entire** key
- ✅ No trailing spaces or newlines

### Step 6: Restart App

```bash
# Stop current app (Ctrl+C)
cd app
npm start
# Press 'w' for web
```

### Step 7: Test

Try parsing a recipe with "Paste Recipe Text"

## Common Mistakes

### ❌ Wrong: Quotes Around Key
```bash
EXPO_PUBLIC_GEMINI_API_KEY="AIzaSy..."  # DON'T DO THIS
```

### ✅ Correct: No Quotes
```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

### ❌ Wrong: Spaces
```bash
EXPO_PUBLIC_GEMINI_API_KEY = AIzaSy...  # DON'T DO THIS
```

### ✅ Correct: No Spaces
```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

### ❌ Wrong: Incomplete Key
```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC  # Too short!
```

### ✅ Correct: Full Key (39 chars)
```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC...full_key_here...  # ~39 chars
```

## Verify Your New Key

After getting a new key, test it with curl:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY_HERE" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

**Expected:** Should return a JSON response with "hello" message

**If invalid:** Will return the same error you're seeing

## API Key Restrictions

When creating the key, make sure:

1. **No API restrictions** (or allow Generative Language API)
2. **No application restrictions** (or allow your domain)
3. **Key is active** (not expired)

### Checking Restrictions

1. Go to https://aistudio.google.com/app/apikey
2. Click on your API key
3. Check **"API restrictions"** section
4. Should say "None" or include "Generative Language API"

## Troubleshooting Steps

### 1. Verify Key in Google Console

Visit: https://console.cloud.google.com/apis/credentials

- Find your API key
- Check if it's enabled
- Check restrictions
- Regenerate if needed

### 2. Check API is Enabled

Visit: https://console.cloud.google.com/apis/library

Search for: **"Generative Language API"**
- Should show "API enabled"
- If not, click "Enable"

### 3. Create Fresh Key

Sometimes keys have issues. Create a brand new one:
1. Delete old key
2. Create new key in new project
3. Copy immediately
4. Test with curl before using in app

### 4. Check for Billing (if using paid tier)

If you're on paid tier:
- Visit: https://console.cloud.google.com/billing
- Ensure billing is active
- Check for any billing alerts

## Your Current Key Analysis

**Format:** ✅ Correct (39-40 chars, starts with AIza)  
**File:** ✅ Correct location (app/.env)  
**Syntax:** ✅ No quotes, no spaces  

**Problem:** ❌ Key itself is invalid/revoked

**Action:** Get a new key from Google AI Studio

## Quick Fix Script

Run this to interactively update your key:

```bash
#!/bin/bash
echo "Enter your new Gemini API key:"
read NEW_KEY

# Backup old .env
cp app/.env app/.env.backup

# Update key
sed -i.bak "s/EXPO_PUBLIC_GEMINI_API_KEY=.*/EXPO_PUBLIC_GEMINI_API_KEY=$NEW_KEY/" app/.env

echo "✓ Updated! Old .env backed up to app/.env.backup"
echo "Now restart the app: cd app && npm start"
```

Save as `update-key.sh`, make executable: `chmod +x update-key.sh`

## Expected .env File Content

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI Configuration
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyC...your_actual_39_char_key...
```

## After Fixing

1. Get new valid key from Google AI Studio
2. Update `app/.env`
3. Restart app: `cd app && npm start`
4. Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
5. Test recipe import

## Still Not Working?

### Check This:

1. **Key copied completely?**
   ```bash
   grep GEMINI app/.env | wc -c
   # Should be around 70 characters total
   ```

2. **Key is active in Google Console?**
   Visit: https://aistudio.google.com/app/apikey
   
3. **Using correct model?**
   Model `gemini-2.0-flash-exp` requires API v1beta
   
4. **Internet connection?**
   Test: `curl https://generativelanguage.googleapis.com`

5. **Firewall/VPN blocking Google APIs?**
   Temporarily disable and test

## Alternative: Use Stable Model

If `gemini-2.0-flash-exp` has issues, try stable model:

**Edit:** `app/src/services/gemini.ts`

```typescript
// Change line 12 from:
const GEMINI_MODEL = 'gemini-2.0-flash-exp';

// To:
const GEMINI_MODEL = 'gemini-1.5-flash';
```

Then restart app.

## Summary

**Action Required:**

1. ✅ Go to https://aistudio.google.com/app/apikey
2. ✅ Create new API key
3. ✅ Copy the full key
4. ✅ Update `app/.env`
5. ✅ Restart app: `cd app && npm start`
6. ✅ Test with recipe import

The key format in your file is correct, but the key itself needs to be regenerated in Google AI Studio.
