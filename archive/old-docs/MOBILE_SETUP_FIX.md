# 📱 Mobile Connection Fix

## ✅ What I Fixed

The issue was that your phone couldn't connect to `http://127.0.0.1:54321` because that's localhost on your Mac, not accessible from your phone.

**Solution**: Changed to use your Mac's local network IP: `192.168.0.193`

---

## 🚀 How to Restart and Test

### Option 1: Quick Restart (Recommended)

```bash
cd /Users/joao/Documents/Dev/food-pantry/app
npm start -- --clear
```

This will:
- Clear the cache
- Load the new IP address from `.env`
- Show a fresh QR code

### Option 2: Use the Helper Script

```bash
cd /Users/joao/Documents/Dev/food-pantry/app
./start-mobile.sh
```

This script:
- Shows your Mac's IP
- Reminds you of prerequisites
- Starts Expo with cleared cache

---

## 📱 Test on Android

1. **Make sure Supabase is running:**
   ```bash
   cd /Users/joao/Documents/Dev/food-pantry
   supabase status
   ```

2. **Start the app:**
   ```bash
   cd app
   npm start -- --clear
   ```

3. **On your Android phone:**
   - Open **Expo Go** app
   - Tap **"Scan QR Code"**
   - Scan the QR code from terminal
   - Wait for app to load (first time takes 30-60 seconds)

4. **Login:**
   - Email: `test@example.com`
   - Password: `password123`

5. **You should see:**
   - Your 13 pantry items
   - Stock level bars
   - Category badges
   - Pull to refresh works!

---

## 🌐 What Changed

### Before (Didn't work on mobile):
```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```
- 127.0.0.1 = localhost = only accessible from your Mac
- Your phone couldn't reach it

### After (Works on mobile):
```env
EXPO_PUBLIC_SUPABASE_URL=http://192.168.0.193:54321
```
- 192.168.0.193 = Your Mac's IP on local network
- Your phone CAN reach it (same WiFi)

---

## ⚠️ Important Notes

### Your IP Address Can Change

If you restart your router or Mac, your IP might change from `192.168.0.193` to something else.

**If the app stops working on mobile:**

1. Check your new IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `.env` file with new IP:
   ```bash
   # Edit app/.env
   EXPO_PUBLIC_SUPABASE_URL=http://YOUR-NEW-IP:54321
   ```

3. Restart Expo:
   ```bash
   npm start -- --clear
   ```

### Web vs Mobile

- **Web**: Can use `127.0.0.1` or `192.168.0.193` (both work)
- **Mobile**: Must use `192.168.0.193` (local network IP)

**Current setup works for BOTH!** ✅

---

## 🐛 Troubleshooting

### "Network request failed" still appears

**Check 1: Same WiFi?**
```bash
# On Mac - check your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# On phone - go to WiFi settings
# Make sure it shows same network as Mac (e.g., "192.168.0.xxx")
```

**Check 2: Supabase running?**
```bash
cd /Users/joao/Documents/Dev/food-pantry
supabase status

# Should show "Started supabase local development setup"
```

**Check 3: Correct IP in .env?**
```bash
cat app/.env | grep SUPABASE_URL

# Should show: http://192.168.0.193:54321
# NOT: http://127.0.0.1:54321
```

**Check 4: Expo restarted?**
```bash
# Stop Expo (Ctrl+C in terminal)
# Clear cache and restart
cd app
npm start -- --clear
```

---

### "Unable to connect to Supabase"

**Test Supabase from phone browser:**
- Open browser on your phone
- Go to: `http://192.168.0.193:54321`
- You should see Supabase API response

If you can't access it:
- Your phone might be on different WiFi
- Your Mac's firewall might be blocking it

**Check Mac firewall:**
```bash
# System Settings → Network → Firewall
# Make sure it's not blocking incoming connections
```

---

### "Timeout connecting to Expo"

**Check Expo is running:**
```bash
# Should see QR code and "Waiting on exp://..."
# If not, restart:
cd app
npm start
```

---

## ✅ Success Checklist

- [ ] Updated `.env` with Mac's IP (`192.168.0.193`)
- [ ] Restarted Expo with `npm start -- --clear`
- [ ] Supabase is running (`supabase status`)
- [ ] Phone is on same WiFi as Mac
- [ ] Scanned new QR code in Expo Go
- [ ] App loads (may take 30-60 seconds first time)
- [ ] Can login with test credentials
- [ ] Can see 13 pantry items
- [ ] Pull to refresh works

---

## 🎯 Quick Test Flow

1. **Terminal 1** - Check Supabase:
   ```bash
   cd /Users/joao/Documents/Dev/food-pantry
   supabase status
   ```

2. **Terminal 2** - Start App:
   ```bash
   cd /Users/joao/Documents/Dev/food-pantry/app
   npm start -- --clear
   ```

3. **Phone** - Open Expo Go:
   - Scan QR code
   - Wait for bundle to load
   - Login
   - Explore!

---

## 🌟 Pro Tips

### For Development:

**Keep IP stable** - Reserve IP in your router settings:
- Login to your router (usually 192.168.0.1)
- Find DHCP settings
- Reserve `192.168.0.193` for your Mac's MAC address

**Use tunnel** - If WiFi issues persist:
```bash
npm start -- --tunnel

# This creates a public URL that works anywhere
# Slightly slower but more reliable
```

### For Production:

When you deploy to production:
- Change `.env` to your production Supabase URL
- No more IP address issues!
- Works from anywhere

---

## 📝 Summary

**What was wrong:**
- Phone couldn't reach `localhost` (127.0.0.1) on your Mac

**What we fixed:**
- Changed to your Mac's network IP (192.168.0.193)
- Phone can now reach Supabase on your Mac

**What to do:**
- Restart Expo: `npm start -- --clear`
- Scan QR code in Expo Go
- Login and test!

**You're all set! The app should work on your Android phone now!** 🎉
