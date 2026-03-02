# Debug Deep Link Flow

## What I Changed

### 1. App.tsx - Added Better Logging
- Added `console.log` statements with 🔗 emoji to track deep links
- Added immediate Alert when social media link is received
- Shows the URL that was shared

### 2. RecipesScreen.tsx - Check on Every Focus
- Now uses `useFocusEffect` to check for pending URLs every time you navigate to Recipes
- Better logging with 📱 emoji
- More detailed Alert message

## How to Test (After Rebuilding)

### Method 1: Share from Instagram

1. **Build and install new APK:**
   ```bash
   cd /Users/joao/Documents/Dev/food-pantry/app
   eas build --profile development --platform android
   ```

2. **Install on phone and open the app**

3. **Open Instagram**, find a recipe post

4. **Tap Share → "Food Pantry"**

5. **What you should see:**
   - Alert appears immediately: "📱 Recipe Link Received!"
   - Shows the Instagram URL
   - Tells you to navigate to Recipes screen

6. **Navigate to Recipes tab**
   - Another alert should appear: "📱 Recipe Shared from Social Media"
   - Tap "Continue" to open the paste modal

### Method 2: Use React Native Debugger (See Logs)

1. **Shake your phone** while app is open

2. **Enable "Debug" mode**

3. **Open Chrome DevTools:**
   - Go to `chrome://inspect`
   - Click "inspect" under your device

4. **Try sharing from Instagram again**

5. **Look at console logs** - you should see:
   ```
   🔗 Deep link received (app open): https://www.instagram.com/...
   🔗 handleDeepLink called with: https://www.instagram.com/...
   🔗 Social media URL detected!
   🔗 Stored URL in AsyncStorage
   ```

6. **Navigate to Recipes screen**, should see:
   ```
   📱 RecipesScreen focused, checking for shared URL...
   📱 Checking AsyncStorage for pending_shared_url...
   📱 Pending URL: https://www.instagram.com/...
   ✅ Found pending shared URL: https://www.instagram.com/...
   ```

## Troubleshooting

### "App opens but nothing happens"

**Possible causes:**

1. **Intent filter not working**
   - Check `app.json` has correct intent filters
   - Make sure you built with EAS (not Expo Go)

2. **URL not being captured**
   - Enable debug mode and check logs
   - Look for 🔗 emoji in console

3. **AsyncStorage not persisting**
   - Check app permissions
   - Look for error logs

### "App doesn't appear in Instagram share sheet"

1. **Make sure you installed the APK** (not using Expo Go)
2. **Restart your phone** - Android needs to reindex intent filters
3. **Check the build included intent filters:**
   ```bash
   # After installing APK
   adb shell dumpsys package com.foodpantry.app | grep -A 20 "intent-filter"
   ```

### "Alert appears but modal doesn't open"

- Check you're actually on the Recipes screen
- Try navigating away and back to Recipes
- Check console logs for errors

## Quick Test Without Instagram

You can test the deep link flow directly:

```bash
# Make sure phone is connected via USB with debugging enabled
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://www.instagram.com/reels/DU2Sfe3j7CY/" \
  com.foodpantry.app
```

This simulates sharing an Instagram URL to your app.

## Expected Log Flow

```
# When sharing from Instagram:
🔗 App opened with URL: https://www.instagram.com/reels/DU2Sfe3j7CY/
🔗 handleDeepLink called with: https://www.instagram.com/reels/DU2Sfe3j7CY/
🔗 Parsed deep link: { "scheme": "https", "hostname": "www.instagram.com", ... }
🔗 Social media URL detected!
🔗 Stored URL in AsyncStorage

# When navigating to Recipes:
📱 RecipesScreen focused, checking for shared URL...
📱 Checking AsyncStorage for pending_shared_url...
📱 Pending URL: https://www.instagram.com/reels/DU2Sfe3j7CY/
✅ Found pending shared URL: https://www.instagram.com/reels/DU2Sfe3j7CY/
✅ Cleared pending URL from AsyncStorage
📱 User tapped Continue, opening modal...
```

## Next Steps

1. Rebuild the APK with the new logging
2. Install on your phone
3. Try sharing from Instagram
4. Check if you see the alerts
5. If not, enable debug mode and check console logs
6. Report back what you see!
