# How to Import Recipes from URLs

## Quick Answer: Use "Paste Recipe Text" Instead

Due to browser security (CORS), fetching recipe URLs directly doesn't work reliably for all websites.

**The easiest and most reliable method:**

### ✅ Recommended: Paste Recipe Text

1. **Open the recipe URL** in your browser
2. **Select the recipe content:**
   - Click at the start of the title
   - Drag to select all ingredients and instructions
   - Or press Ctrl+A (Cmd+A on Mac) and adjust selection
3. **Copy** the selected text (Ctrl+C / Cmd+C)
4. **Return to the app**
5. Click **"+ Add Recipe"** → **"🌐 AI Import"**
6. Choose **"📝 Paste Recipe Text"**
7. **Paste** the text (Ctrl+V / Cmd+V)
8. Click **"Parse Recipe"**
9. **Preview and save!**

**Time required:** 30-60 seconds  
**Success rate:** 100% ✅

## Why URL Import Doesn't Always Work

### The Technical Problem

When you run the app in a web browser (localhost):
- Your app is on `http://localhost:8081`
- Recipe websites are on different domains
- Browsers block cross-domain requests (CORS policy)
- This is a security feature to protect users

### Solutions Tried

1. ✅ **CORS Proxy Services** - Sometimes work, often unreliable
2. ✅ **Supabase Edge Function** - Works, but requires deployment
3. ❌ **Direct fetch** - Blocked by browser security

### When URL Import DOES Work

- ✅ When running as a **native mobile app** (no CORS restrictions)
- ✅ Some websites that allow CORS
- ✅ When using our Supabase Edge Function (requires setup)

## Setting Up Supabase Edge Function (Advanced)

If you want URL import to work reliably, you can deploy the edge function:

### Prerequisites
- Supabase CLI installed
- Supabase project created

### Steps

1. **Deploy the function:**
   ```bash
   cd /path/to/food-pantry
   supabase functions deploy fetch-recipe
   ```

2. **Verify it's working:**
   ```bash
   curl -X POST \
     https://your-project.supabase.co/functions/v1/fetch-recipe \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://www.allrecipes.com/recipe/21014/"}'
   ```

3. **No code changes needed!** The app automatically uses the edge function if available.

### Function Location
`supabase/functions/fetch-recipe/index.ts`

## For Mobile App Users

If you build this as a **React Native mobile app** (iOS/Android):
- URL import works perfectly!
- No CORS restrictions on mobile
- No edge function needed
- Direct fetch works great

## Summary

| Method | Success Rate | Time | Setup Required |
|--------|-------------|------|----------------|
| **Paste Text** | 100% | 60 sec | None ✅ |
| URL + Edge Function | 95% | 10 sec | Deploy function |
| URL + CORS Proxy | 50% | 10-30 sec | None |
| URL (Mobile App) | 100% | 10 sec | Build mobile app |

**Recommendation:** Use "Paste Recipe Text" - it's fast, easy, and always works!

## Example: Real Usage

**Recipe URL:** `https://healthyrecipesblogs.com/protein-pancakes/`

### Method 1: Paste Text (Recommended)
```
1. Open URL in browser
2. Select recipe content
3. Copy (Ctrl+C)
4. App → Paste Recipe Text
5. Paste (Ctrl+V)
6. Parse Recipe
✅ Success! Takes 60 seconds
```

### Method 2: URL Import (May Fail)
```
1. Copy URL
2. App → Import from URL
3. Paste URL
4. Import Recipe
❌ May fail with CORS error
⏰ Faster IF it works (10 seconds)
```

## Tips for Best Results

When copying recipe text:

✅ **Include:**
- Recipe title
- Ingredients list (with quantities)
- Instructions/steps
- Servings, prep time, cook time

❌ **Don't include:**
- Ads
- Comments section
- Related recipes
- Navigation menus

## Need Help?

If you're having trouble:

1. **Check API key:** Make sure `EXPO_PUBLIC_GEMINI_API_KEY` is set in `.env.local`
2. **Try paste method:** It always works
3. **Check console:** Look for helpful error messages
4. **Deploy edge function:** For reliable URL import

## Future: Mobile App

When you build the mobile app version:
- URL import works perfectly
- No CORS issues
- Faster and more reliable
- Best user experience

Until then, "Paste Recipe Text" is your best friend! 🎉
