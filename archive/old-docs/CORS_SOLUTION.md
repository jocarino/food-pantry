# CORS Issue and Solution

## The Problem

When trying to import recipes from URLs, you may encounter a **CORS (Cross-Origin Resource Sharing)** error:

```
Access to fetch at 'https://example.com/recipe' from origin 'http://localhost:8081' 
has been blocked by CORS policy
```

### What is CORS?

CORS is a browser security feature that prevents websites from accessing content from other domains. It's designed to protect users from malicious scripts.

### Why Does This Happen?

- Your app runs on `localhost:8081`
- The recipe website is on a different domain (e.g., `healthyrecipesblogs.com`)
- The browser blocks the request for security reasons
- This is **normal** and affects most websites

## Solutions Implemented

### Solution 1: CORS Proxy (Automatic)

The app now automatically attempts to use a **free CORS proxy** (`api.allorigins.win`) to fetch websites.

**How it works:**
1. Your app asks the proxy to fetch the website
2. The proxy fetches it (server-to-server, no CORS)
3. The proxy returns the content to your app
4. Gemini AI extracts the recipe

**Limitations:**
- Some websites may still block proxies
- Slower than direct fetching
- Proxy service reliability varies

### Solution 2: Copy/Paste Method (Always Works!)

If the proxy fails, the app will suggest using the **"Paste Recipe Text"** method:

**Steps:**
1. Open the recipe URL in your browser
2. **Select and copy** the recipe text (ingredients + instructions)
3. Return to the app
4. Click **"Paste Recipe Text"**
5. Paste the copied text
6. AI will parse it automatically

**This always works because:**
- No CORS restrictions on text input
- You manually provide the content
- AI is just as accurate

## Recommended Workflow

### For Most Sites (Try First)
```
1. Copy recipe URL
2. Click "+ Add Recipe" → "🌐 AI Import"
3. Select "Import from URL"
4. Paste URL → "Import Recipe"
```

If it works: Great! Recipe imported automatically.

### If CORS Error Occurs (Fallback)
```
1. Click "Use Paste Text" button in error dialog
   (or go back and choose "Paste Recipe Text")
2. Open recipe URL in new browser tab
3. Select recipe content (Ctrl/Cmd+A, then adjust selection)
4. Copy (Ctrl/Cmd+C)
5. Return to app
6. Paste into text area (Ctrl/Cmd+V)
7. Click "Parse Recipe"
```

## Which Method Should You Use?

### Use "Import from URL" when:
- ✅ Recipe is from a popular site (AllRecipes, Food Network, etc.)
- ✅ You want maximum convenience
- ✅ You're willing to retry if it fails

### Use "Paste Recipe Text" when:
- ✅ URL import failed (CORS blocked)
- ✅ Recipe is from a blog or uncommon site
- ✅ You want guaranteed success
- ✅ Recipe is from PDF, email, or screenshot (use OCR)

## Technical Details

### Why Not Build a Backend?

Building a backend server to proxy requests would solve CORS, but adds complexity:

- Need hosting (costs money)
- Need maintenance
- Need security management
- Increases deployment complexity

For a personal app, the copy/paste method is simpler and works 100% of the time.

### Alternative: Browser Extension

Another solution would be a browser extension that fetches pages without CORS restrictions. However, this requires:

- Users to install an extension
- Separate development and maintenance
- Works only in browsers (not mobile apps)

### Mobile App vs Web App

**Web App (localhost):** Has CORS restrictions

**Mobile App (React Native):** Does NOT have CORS restrictions! Mobile apps can fetch any URL directly.

If you build this as a native mobile app (iOS/Android), URL import will work perfectly without any proxy!

## For Developers

### Current Implementation

```typescript
// gemini.ts
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  try {
    // Try CORS proxy first
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const html = await response.text();
    
    // Use Gemini to parse HTML
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(promptWithHTML);
    
    return parsedRecipe;
  } catch (error) {
    // If proxy fails, show helpful error message
    throw new Error('Use copy/paste method instead');
  }
}
```

### Adding Your Own Proxy

If you want to deploy your own CORS proxy:

1. **Deploy a simple proxy:**
   ```javascript
   // server.js (Node.js + Express)
   const express = require('express');
   const cors = require('cors');
   const axios = require('axios');
   
   const app = express();
   app.use(cors());
   
   app.get('/proxy', async (req, res) => {
     const url = req.query.url;
     const response = await axios.get(url);
     res.send(response.data);
   });
   
   app.listen(3000);
   ```

2. **Deploy to Vercel/Netlify/Railway** (free tier)

3. **Update gemini.ts:**
   ```typescript
   const proxyUrl = `https://your-proxy.vercel.app/proxy?url=${encodeURIComponent(url)}`;
   ```

## Summary

**TLDR:**
- URL import uses CORS proxy (works sometimes)
- If proxy fails, use "Paste Recipe Text" (works always)
- Both methods use the same AI parsing
- Results are identical
- Copy/paste adds 30 seconds but is 100% reliable

**Best Practice:**
1. Try URL import first
2. If it fails, use copy/paste
3. Both are equally accurate!

The app is designed to handle both gracefully, so you always have a working solution. 🎉
