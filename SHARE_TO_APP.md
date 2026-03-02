# Share to App Feature - Instagram/TikTok Recipe Import

## Overview

Users can now share recipes directly from Instagram and TikTok to your Food Pantry app! This uses native iOS/Android share intents.

## How It Works

### User Flow

1. **User opens Instagram/TikTok** and finds a recipe post
2. **Taps the Share button** in the Instagram/TikTok app
3. **Selects "Food Pantry"** from the share sheet
4. **App opens automatically** with a helpful prompt
5. **User copies recipe text** from the Instagram/TikTok post
6. **Pastes into the app** 
7. **AI extracts the recipe** automatically!

### Technical Implementation

#### 1. Deep Linking Configuration (`app.json`)

```json
{
  "scheme": "foodpantry",
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [
          {
            "scheme": "https",
            "host": "*.instagram.com"
          }
        ]
      },
      {
        "action": "SEND",
        "data": [{ "mimeType": "text/plain" }]
      }
    ]
  },
  "ios": {
    "associatedDomains": ["applinks:foodpantry.app"]
  }
}
```

#### 2. Deep Link Handler (`App.tsx`)

- Listens for incoming deep links using `expo-linking`
- Stores shared URLs in AsyncStorage
- Passes to RecipesScreen for processing

#### 3. Smart Modal Behavior (`RecipesScreen.tsx`)

- Checks for pending shared URLs on mount
- Shows helpful alert explaining the workflow
- Opens AddRecipeModal in "Paste Text" mode

#### 4. Enhanced Modal (`AddRecipeModal.tsx`)

- Accepts `initialMode` prop to open in specific mode
- Shows blue banner with step-by-step instructions
- Optimized for social media shares

## Platform-Specific Behavior

### Android

- Appears in the system share sheet
- Works with both "Share Link" and "Share" actions
- Supports Instagram and TikTok directly

### iOS

- Requires app to be installed
- Uses Universal Links (requires domain verification)
- Appears in Activity View Controller

## Testing

### Test on Android (Development)

1. Build development APK:
   ```bash
   cd app
   npx expo run:android
   ```

2. Open Instagram app
3. Find any post and tap Share
4. Look for "Food Pantry" in share options
5. Tap it - app should open with prompt

### Test on iOS (Development)

1. Build for iOS:
   ```bash
   cd app
   npx expo run:ios
   ```

2. Open Instagram app
3. Tap Share → More → Food Pantry
4. App opens with instructions

## Why This Approach Works

✅ **No scraping needed** - User manually copies text
✅ **Complies with TOS** - No automated access
✅ **Better UX** - Users feel in control
✅ **More reliable** - Works 100% of the time
✅ **Platform native** - Uses standard share intents

## Future Enhancements

### Option 1: Share Sheet Extension (iOS)
Create a Share Extension that can extract text directly from the post without leaving Instagram.

### Option 2: Clipboard Monitoring
Monitor clipboard for Instagram URLs and offer to import automatically.

### Option 3: Browser Extension
Chrome/Safari extension to extract and send recipes directly to the app.

## Debugging

### Check if deep link is received:

```javascript
// In App.tsx
Linking.getInitialURL().then(url => {
  console.log('Initial URL:', url);
});
```

### Check AsyncStorage:

```javascript
// In RecipesScreen.tsx
AsyncStorage.getItem('pending_shared_url').then(url => {
  console.log('Pending URL:', url);
});
```

### Test with ADB (Android):

```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://www.instagram.com/p/ABC123/" \
  com.foodpantry.app
```

### Test with xcrun (iOS):

```bash
xcrun simctl openurl booted "https://www.instagram.com/p/ABC123/"
```

## Production Deployment

### Android

1. Add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <intent-filter android:autoVerify="true">
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="https" 
           android:host="*.instagram.com" />
   </intent-filter>
   ```

### iOS

1. Enable Associated Domains in Apple Developer
2. Add `applinks:foodpantry.app` capability
3. Host `apple-app-site-association` file at:
   ```
   https://foodpantry.app/.well-known/apple-app-site-association
   ```

## Important Notes

⚠️ **This feature requires the app to be installed**. Users must download your app first before sharing from Instagram/TikTok.

⚠️ **Universal Links on iOS require a verified domain**. For development, use custom URL scheme (`foodpantry://`).

⚠️ **Instagram/TikTok may update their share behavior**. Test regularly to ensure compatibility.
