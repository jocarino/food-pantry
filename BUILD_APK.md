# Build APK with EAS Build

## Step 1: Login to Expo

```bash
cd /Users/joao/Documents/Dev/food-pantry/app
eas login
```

This will open a browser. Log in with your Expo account (or create one if needed).

## Step 2: Configure the Project

```bash
eas build:configure
```

This will set up your project for EAS Build.

## Step 3: Build the Development APK

```bash
eas build --profile development --platform android
```

This will:
1. Upload your code to Expo's build servers
2. Build an APK in the cloud (takes ~10-15 minutes)
3. Give you a download link when done

## Step 4: Install on Your Phone

Once the build completes:

1. You'll get a download link in the terminal
2. Open that link on your Android phone
3. Download and install the APK
4. Allow installation from unknown sources if prompted

## Step 5: Test Deep Linking

### Test 1: Instagram URL Detection (Basic)

1. Open the app on your phone
2. Navigate to Recipes screen
3. Tap "+" to add recipe
4. Choose "Import from URL"
5. Paste: `https://www.instagram.com/reels/DU2Sfe3j7CY/`
6. **Expected**: Orange warning box appears
7. Tap "Import Recipe"
8. **Expected**: Error alert with "Use Paste Text" button

### Test 2: Share from Instagram (Deep Link)

1. Open Instagram app on your phone
2. Find any recipe post
3. Tap the **Share** button (paper airplane icon)
4. Look for "Food Pantry" in the share sheet
5. Tap it
6. **Expected**: Food Pantry app opens with an alert
7. The alert should explain how to copy and paste the recipe

### Test 3: Direct Deep Link (Advanced)

You can test deep linking directly with `adb`:

```bash
# Make sure your phone is connected via USB with USB debugging enabled
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://www.instagram.com/p/ABC123/" \
  com.foodpantry.app
```

## Build Profile Options

- **development**: Includes dev tools, connects to Metro bundler (what we're using)
- **preview**: Like production but unsigned (for testing)
- **production**: Fully optimized, ready for Play Store

## Troubleshooting

### "Not logged in"
Run `eas login` again

### "No project found"
Make sure you're in the `/Users/joao/Documents/Dev/food-pantry/app` directory

### Build fails
Check the build logs in the terminal or at `https://expo.dev`

### App doesn't appear in Instagram share sheet
- Make sure you installed the APK (not using Expo Go)
- Android may take a few minutes to register the intent filters
- Try restarting your phone

## Environment Variables

The build will automatically include your `.env` file. Make sure these are set:

```
EXPO_PUBLIC_SUPABASE_URL=http://192.168.0.193:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_GEMINI_API_KEY=your_key
```

## Notes

- First build takes longer (~15 minutes)
- Subsequent builds are faster (~5-10 minutes)
- You get 30 free builds per month on the free tier
- The APK will be ~50-80 MB

## Alternative: Faster Local Build (Not Recommended)

If you want to build locally, you'd need to complete the Android SDK setup, but cloud build is much easier!
