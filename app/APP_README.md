# Food Pantry App

React Native mobile app with Expo for iOS, Android, and Web.

## 🚀 Quick Start

```bash
# Start the development server
npm start

# Run on different platforms
npm run web       # Web browser
npm run ios       # iOS Simulator (Mac only)
npm run android   # Android Emulator
```

## 📱 Test the App

1. **Make sure Supabase is running:**
   ```bash
   cd ..
   supabase status
   ```

2. **Start the app:**
   ```bash
   npm start
   ```

3. **Choose a platform:**
   - Press `w` for web
   - Press `i` for iOS (Mac only)
   - Press `a` for Android
   - Or scan QR code with Expo Go app

4. **Login with test credentials:**
   - Email: `test@example.com`
   - Password: `password123`

## 🏗️ Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/         # Screen components
│   ├── auth/       # Login, SignUp
│   ├── pantry/     # Pantry management
│   ├── recipes/    # Recipe management
│   ├── shopping/   # Shopping lists
│   └── profile/    # User profile
├── navigation/      # Navigation setup
├── services/        # API services (Supabase, Gemini)
├── contexts/        # React contexts (Auth)
├── types/          # TypeScript types
├── hooks/          # Custom React hooks
└── utils/          # Utility functions
```

## ✅ What's Working

- ✅ Authentication (Login/SignUp)
- ✅ Supabase integration
- ✅ Pantry screen with data from database
- ✅ Bottom tab navigation
- ✅ User profile display
- ✅ Auto sign-out
- ✅ Real-time data from Supabase

## 🔄 Next Steps

- [ ] Add pantry item (create/edit/delete)
- [ ] Recipe import from URL
- [ ] Shopping list management
- [ ] Macro tracking dashboard
- [ ] Offline sync

## 🐛 Troubleshooting

### "Cannot connect to Supabase"
- Check Supabase is running: `supabase status`
- Check .env file has correct `EXPO_PUBLIC_SUPABASE_URL`

### "Module not found"
- Run: `npm install`
- Clear cache: `npm start -- --clear`

### Web not loading
- Try: `npm run web`
- Or press `w` in the terminal after `npm start`
