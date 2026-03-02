# 📱 Android Development Setup

## Option 1: Expo Go (Easiest - Recommended for Now)

This is the fastest way to test on Android without installing Android Studio.

### Steps:

1. **Install Expo Go on your Android phone**
   - Open Google Play Store
   - Search for "Expo Go"
   - Install it

2. **Make sure your phone and computer are on the same WiFi**

3. **Scan the QR code**
   - In your terminal where `npm start` is running, you'll see a QR code
   - Open Expo Go app on your phone
   - Tap "Scan QR Code"
   - Point camera at the QR code in terminal
   - App will load on your phone!

**That's it!** No Android Studio needed. Your app runs directly on your phone.

---

## Option 2: Android Studio Emulator (Full Setup)

If you want to use the Android emulator on your Mac:

### 1. Install Android Studio

```bash
# Install via Homebrew
brew install --cask android-studio
```

Or download from: https://developer.android.com/studio

### 2. Run Android Studio

```bash
# Open Android Studio
open -a "Android Studio"
```

### 3. Configure Android Studio

1. Open Android Studio
2. Click "More Actions" → "SDK Manager"
3. In "SDK Platforms" tab:
   - ✅ Check "Android 14.0 (UpsideDownCake)" or latest
   - Click "Apply" to install

4. In "SDK Tools" tab:
   - ✅ Check "Android SDK Build-Tools"
   - ✅ Check "Android Emulator"
   - ✅ Check "Android SDK Platform-Tools"
   - Click "Apply"

### 4. Set Up Environment Variables

Add to your `~/.zshrc` or `~/.bash_profile`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### 5. Create Virtual Device (Emulator)

1. In Android Studio: "More Actions" → "Virtual Device Manager"
2. Click "Create Device"
3. Select "Phone" → "Pixel 7" (or any device)
4. Click "Next"
5. Select a system image (e.g., "UpsideDownCake" / Android 14)
   - Click "Download" if needed
6. Click "Next" → "Finish"

### 6. Start the Emulator

**From Android Studio:**
- Click the "Play" button next to your virtual device

**Or from Terminal:**
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd Pixel_7_API_34
```

### 7. Run Your App

Once emulator is running:

```bash
cd /Users/joao/Documents/Dev/food-pantry/app
npm start

# Press 'a' to open on Android
```

---

## Option 3: Expo Dev Build (Advanced)

For production-like builds with custom native code:

```bash
cd app

# Create development build
npx expo run:android

# This will:
# - Build the app with your custom code
# - Install on emulator/device
# - Take ~5-10 minutes first time
```

---

## 🎯 Recommended Approach

**For now, use Expo Go (Option 1)**:
- ✅ Instant setup (5 minutes)
- ✅ Test on real device
- ✅ Hot reload
- ✅ No Android Studio needed
- ✅ Perfect for development

**Later, when you need:**
- Custom native modules
- Production builds
- Testing performance

**Then install Android Studio (Option 2)**

---

## 🐛 Troubleshooting

### "Cannot connect to app"
- Make sure phone and computer are on same WiFi
- Try restarting Expo Go app
- Try running: `npm start -- --tunnel`

### Emulator won't start
```bash
# Check SDK location
echo $ANDROID_HOME

# Should show: /Users/joao/Library/Android/sdk

# If not, add to ~/.zshrc and reload
```

### "adb not found"
```bash
# Check adb is in path
which adb

# Should show: /Users/joao/Library/Android/sdk/platform-tools/adb
```

---

## 🚀 Quick Test Right Now

**Without installing anything:**

1. Open Expo Go on your Android phone (install from Play Store if needed)
2. Make sure phone is on same WiFi as your Mac
3. In Expo Go app, tap "Scan QR Code"
4. Scan the QR code from your terminal
5. App loads! 🎉

**That's it - you're running on Android in under 5 minutes!**
