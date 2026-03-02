# AI-Powered Recipe Import Guide

## Overview
The app includes AI-powered recipe import features that can automatically extract recipes from URLs or pasted text using Google's Gemini API.

## How to Access AI Import

### Method 1: From Manual Entry Modal
1. Click the **"+ Add Recipe"** button
2. In the modal header, click the **"🌐 AI Import"** button
3. Choose your import method:
   - **Import from URL** - Paste a recipe website URL
   - **Paste Recipe Text** - Copy and paste recipe text

### Method 2: Direct Access
The AI import modal provides three options:
- ✍️ **Enter Manually** (Recommended) - Full control
- 🌐 **Import from URL** (AI) - Auto-extract from websites
- 📝 **Paste Recipe Text** (AI) - Parse recipe from text

## Import Methods

### 1. Import from URL (Web Scraping + AI)
**How it works:**
1. Enter a recipe URL (e.g., `https://www.allrecipes.com/recipe/...`)
2. Click "Import Recipe"
3. The app fetches the webpage
4. Gemini AI extracts:
   - Title
   - Description
   - Ingredients with quantities
   - Instructions
   - Servings, prep time, cook time
   - Nutritional information (if available)

**Supported Sites:**
- Works with most recipe websites
- Best results from structured recipe sites (AllRecipes, Food Network, etc.)
- May work with blogs and other sites

### 2. Paste Recipe Text (AI Parsing)
**How it works:**
1. Copy recipe text from anywhere (email, PDF, screenshot OCR, etc.)
2. Paste into the text area
3. Click "Parse Recipe"
4. Gemini AI intelligently parses the text to extract structured data

**Example Input:**
```
Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup sugar
- 1/2 cup butter
- 2 eggs
- 1 cup chocolate chips

Instructions:
1. Mix butter and sugar
2. Add eggs and flour
3. Fold in chocolate chips
4. Bake at 350°F for 12 minutes
```

## Setup Requirements

### Google Gemini API Key
To use AI import features, you need a Gemini API key:

1. **Get API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key

2. **Add to Environment:**
   Create or update `.env.local` in the `app/` directory:
   ```bash
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

3. **Restart App:**
   ```bash
   npm start
   ```

### Free Tier Limits
Gemini API free tier includes:
- 60 requests per minute
- 1,500 requests per day
- More than enough for personal use!

## How It Works (Technical)

### Service Layer
File: `app/src/services/gemini.ts`

The service provides two main functions:

```typescript
// Parse recipe from URL
async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe>

// Parse recipe from text
async function parseRecipeFromText(text: string): Promise<ParsedRecipe>
```

### AI Processing Steps

1. **Fetch Content** (URL only)
   - Download webpage HTML
   - Clean and extract text content

2. **Send to Gemini**
   - Include structured prompt
   - Request JSON response format
   - Specify all required fields

3. **Parse Response**
   - Extract recipe data
   - Convert units (both metric and imperial)
   - Format ingredients and instructions
   - Validate data structure

4. **Preview & Save**
   - Show user a preview
   - Allow editing before saving
   - Save to database with proper format

### Data Structure
```typescript
interface ParsedRecipe {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    original_quantity: number;
    original_unit: string;
    metric_quantity: number;
    metric_unit: string;
    imperial_quantity: number;
    imperial_unit: string;
  }>;
  instructions: Array<{
    step_number: number;
    text: string;
  }>;
  servings: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  nutrition_per_serving?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}
```

## Benefits

### Time Savings
- **Manual entry:** 10-15 minutes per recipe
- **AI import:** 30 seconds per recipe
- **50x faster!**

### Accuracy
- AI understands natural language
- Converts units automatically
- Handles various formats
- Extracts nutritional data

### Convenience
- Import from any source
- Works with messy formatting
- No typing required
- Instant preview

## Troubleshooting

### "API Key not configured"
- Check `.env.local` exists in `app/` directory
- Verify key is correct: `EXPO_PUBLIC_GEMINI_API_KEY=...`
- Restart development server

### "Failed to parse recipe"
- **URL issues:** Some sites block scraping - try copying text instead
- **Formatting:** AI works best with clear ingredient/instruction sections
- **Try manual entry:** For complex or poorly formatted recipes

### "Network error"
- Check internet connection
- Verify API key is valid
- Check Gemini API status

### Slow Response
- Large recipes may take 3-5 seconds
- Normal for AI processing
- Be patient!

## Privacy & Data

### What gets sent to Gemini:
- Recipe URL or text content only
- No user data
- No authentication info
- No other app data

### Data stored locally:
- Only the parsed recipe
- Saved to your Supabase database
- Associated with your user account

## Example Workflows

### Workflow 1: Import from Recipe Website
1. Find recipe on AllRecipes.com
2. Copy URL from address bar
3. Open app → Recipes → "+" button
4. Click "🌐 AI Import"
5. Select "Import from URL"
6. Paste URL
7. Click "Import Recipe"
8. Preview → Save

### Workflow 2: Import from Email
1. Friend sends recipe via email
2. Copy recipe text
3. Open app → Recipes → "+" button
4. Click "🌐 AI Import"
5. Select "Paste Recipe Text"
6. Paste text
7. Click "Parse Recipe"
8. Preview → Save

### Workflow 3: Import from Screenshot
1. Take screenshot of recipe
2. Use phone's OCR to extract text
3. Follow "Workflow 2" steps

## Tips for Best Results

### URL Import
- ✅ Use recipe-specific URLs (not homepage)
- ✅ Ensure page loads fully before copying URL
- ✅ Try different sites if one doesn't work

### Text Import
- ✅ Include clear sections (Ingredients, Instructions)
- ✅ Use bullet points or numbers
- ✅ Include quantities and units
- ❌ Avoid tables or complex formatting
- ❌ Don't include ads or unrelated content

### General
- Review preview before saving
- Edit if needed after import
- Report issues to improve AI prompts

## Future Enhancements

Planned features:
- [ ] Import from images (OCR + AI)
- [ ] Import from TikTok/Instagram videos
- [ ] Batch import multiple recipes
- [ ] Smart unit conversion preferences
- [ ] Ingredient substitution suggestions
- [ ] Recipe scaling (adjust servings)

## Need Help?

If AI import isn't working:
1. Try manual entry (always works!)
2. Check console for error messages
3. Verify API key setup
4. Report issues with example URLs

---

**Remember:** Manual entry is always available and gives you full control! AI import is a convenience feature for when you want to save time.
