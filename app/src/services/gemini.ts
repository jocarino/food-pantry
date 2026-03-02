import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Debug logging - check if key is loaded
console.log('🔑 [Gemini Service] API Key Status:', {
  exists: !!API_KEY,
  length: API_KEY?.length || 0,
  prefix: API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING',
  isEmpty: API_KEY === '',
});

if (!API_KEY) {
  console.error('❌ [Gemini Service] CRITICAL: API KEY IS EMPTY!');
  console.error('Check that EXPO_PUBLIC_GEMINI_API_KEY is set in app/.env');
}

const genAI = new GoogleGenerativeAI(API_KEY);
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';

// Using Gemini 2.0 Flash (experimental) - fast and efficient
// Available models: 
// - 'gemini-2.0-flash-exp' (latest, fastest, recommended)
// - 'gemini-1.5-flash' (stable, fast)
// - 'gemini-1.5-pro' (more capable, slower)
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface ParsedRecipe {
  title: string;
  description: string;
  servings: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  ingredients: {
    name: string;
    original_quantity: number;
    original_unit: string;
    metric_quantity: number;
    metric_unit: string;
    imperial_quantity: number;
    imperial_unit: string;
  }[];
  instructions: {
    step_number: number;
    text: string;
  }[];
  nutrition_per_serving: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } | null;
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env.local file.');
    }

    // Check if URL is from Instagram/social media
    const urlLower = url.toLowerCase();
    const isInstagram = urlLower.includes('instagram.com');
    const isTikTok = urlLower.includes('tiktok.com');
    const isSocialMedia = isInstagram || isTikTok || urlLower.includes('facebook.com') || urlLower.includes('twitter.com');
    
    if (isSocialMedia) {
      const platform = isInstagram ? 'Instagram' : isTikTok ? 'TikTok' : 'this social media platform';
      console.log(`${platform} URL detected - these require manual text paste`);
      
      throw new Error(
        `${platform} blocks automated access.\n\n` +
        `Please use "Paste Recipe Text" instead:\n\n` +
        `1. Open ${url} in your ${isInstagram || isTikTok ? 'app or ' : ''}browser\n` +
        `2. Copy the recipe text from the post/caption\n` +
        `3. Click "Back" below\n` +
        `4. Choose "Paste Recipe Text"\n` +
        `5. Paste the text and let AI extract the recipe`
      );
    }

    let html = '';
    
    // Strategy 1: Try Supabase Edge Function first (works best for most sites)
    
    try {
      console.log('Fetching via Supabase Edge Function...');
      const { data, error } = await supabase.functions.invoke('fetch-recipe', {
        body: { url },
      });

      if (error) {
        console.log('✗ Edge function error:', error.message);
      } else if (data && data.html) {
        html = data.html;
        console.log('✓ Edge function successful, HTML fetched');
      }
    } catch (edgeFunctionError: any) {
      console.log('✗ Edge function failed:', edgeFunctionError.message);
    }

    // Strategy 2: If edge function fails, try CORS proxies as fallback
    if (!html || html.length < 100) {
      console.log('Trying fallback CORS proxies...');
      
      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
      ];

      for (const proxyUrl of proxies) {
        try {
          const proxyName = proxyUrl.split('/')[2].split('?')[0];
          console.log(`Trying proxy: ${proxyName}...`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml,*/*',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const fetchedHtml = await response.text();
            if (fetchedHtml && fetchedHtml.length > 100) {
              html = fetchedHtml;
              console.log(`✓ Proxy ${proxyName} successful, HTML fetched (${html.length} chars)`);
              break;
            } else {
              console.log(`✗ Proxy ${proxyName} returned insufficient content: ${fetchedHtml.length} chars`);
            }
          } else {
            console.log(`✗ Proxy ${proxyName} returned status: ${response.status}`);
          }
        } catch (proxyError: any) {
          console.log(`✗ Proxy failed:`, proxyError.message);
        }
      }
    }

    // If all methods failed, throw helpful error
    if (!html || html.length < 100) {
      console.error('❌ [Recipe Fetch] All fetch methods failed');
      console.error('URL:', url);
      console.error('HTML length:', html?.length || 0);
      
      throw new Error(
        'Unable to fetch this website. All methods failed.\n\n' +
        'This is due to browser security restrictions (CORS).\n\n' +
        'Please use "Paste Recipe Text" instead:\n' +
        '1. Visit the recipe URL in your browser\n' +
        '2. Copy the recipe text\n' +
        '3. Use "Paste Recipe Text" option'
      );
    }
    
    console.log('✓ HTML fetched successfully, length:', html.length);

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Clean HTML - remove scripts, styles, ads, and focus on main content
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .substring(0, 25000); // Increased limit for more context

    const prompt = `
You are a recipe extraction expert. Your task is to extract the MAIN RECIPE from the HTML content below.

CRITICAL: You MUST return valid recipe data. DO NOT return null values unless the data truly doesn't exist.

SOURCE URL: ${url}

HTML CONTENT:
${cleanHtml}

EXTRACTION STRATEGY:
1. First, search for structured data like JSON-LD recipe schema (look for <script type="application/ld+json">)
2. Then look for recipe card HTML with classes like: recipe-card, wprm-recipe, tasty-recipes, mv-create-recipe
3. Then look for HTML sections with recipe-specific elements (ingredients list, instructions)
4. For Instagram/social media posts: Look for recipe text in captions, descriptions, or post content
5. If HTML is minimal or incomplete, extract whatever recipe information is available in the visible text
6. Focus on the MAIN recipe that matches the URL - ignore sidebars, related recipes, and ads

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "Recipe title from the page",
  "description": "1-2 sentence description of the dish",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "ingredients": [
    {
      "name": "all-purpose flour",
      "original_quantity": 2,
      "original_unit": "cups",
      "metric_quantity": 250,
      "metric_unit": "g",
      "imperial_quantity": 2,
      "imperial_unit": "cups"
    }
  ],
  "instructions": [
    {
      "step_number": 1,
      "text": "Clear instruction text"
    }
  ],
  "nutrition_per_serving": {
    "calories": 250,
    "protein": 10,
    "carbs": 30,
    "fat": 8,
    "fiber": 3
  }
}

CONVERSION GUIDELINES:
- Metric units: g, kg, ml, l, piece
- Imperial units: oz, lb, cups, tbsp, tsp, piece, fl oz
- For countable items (eggs, tomatoes): use "piece" with same quantity in both systems
- 1 cup = 240ml, 1 tbsp = 15ml, 1 tsp = 5ml
- Nutrition should be per serving, not total

IMPORTANT:
- If title is missing, use the page heading or generate one from the recipe content
- If description is missing, create a brief one from the recipe
- If servings are missing, estimate based on ingredient quantities (default: 4)
- If times are missing, use null
- If nutrition is not provided, use null (don't estimate)
- ingredients array MUST have at least one item if this is a recipe page
- instructions array MUST have at least one step if this is a recipe page
- If the HTML is minimal (like from social media), look carefully for ANY recipe text in captions or descriptions
- If you cannot find a complete recipe, return an error by setting: {"error": "NO_RECIPE_FOUND", "message": "Could not find recipe content in this page"}

Return ONLY the JSON object. No markdown code blocks, no explanations.
`;

    const result = await model.generateContent(prompt);
    const response_text = result.response.text();
    
    console.log('🤖 [Gemini] Raw response:', response_text.substring(0, 500));
    
    // Extract JSON from response (sometimes Gemini adds markdown code blocks)
    let jsonMatch = response_text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response_text.match(/\{[\s\S]*\}/);
    }
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonText);
    
    // Check if it's an error response from Gemini
    if ((parsed as any).error) {
      console.error('❌ [Gemini] Error response:', parsed);
      const errorMsg = (parsed as any).message || 'Could not extract recipe from this page';
      throw new Error(
        errorMsg + '\n\n' +
        'The page might not contain a recipe, or the recipe format is not recognized.\n\n' +
        'Please try using "Paste Recipe Text" instead:\n' +
        '1. Visit the URL in your browser\n' +
        '2. Copy the recipe text from the page\n' +
        '3. Use "Paste Recipe Text" option'
      );
    }
    
    // Validate that we got actual recipe data
    if (!parsed.title || parsed.title === null || !parsed.ingredients || parsed.ingredients.length === 0) {
      console.error('❌ [Gemini] Empty recipe response:', parsed);
      throw new Error(
        'Could not extract recipe from this page.\n\n' +
        'The page might not contain a recipe, or the recipe format is not recognized.\n\n' +
        'Please try using "Paste Recipe Text" instead:\n' +
        '1. Visit the URL in your browser\n' +
        '2. Copy the recipe text from the page\n' +
        '3. Use "Paste Recipe Text" option'
      );
    }
    
    // Validate: Check if recipe title seems to match the URL
    const normalizedUrlForValidation = url.toLowerCase();
    const titleLower = parsed.title.toLowerCase();
    
    // Extract key words from URL path
    const urlWords = normalizedUrlForValidation
      .split('/')
      .pop()
      ?.replace(/-/g, ' ')
      .replace(/#.*/, '')
      .split(' ')
      .filter(w => w.length > 3) || [];
    
    // Check if at least one significant word from URL is in the title
    const hasMatch = urlWords.some(word => titleLower.includes(word));
    
    if (!hasMatch && urlWords.length > 0) {
      console.warn('[Gemini] Warning: Recipe title may not match URL');
      console.warn('URL keywords:', urlWords);
      console.warn('Extracted title:', parsed.title);
      console.warn('This might be a sidebar/related recipe instead of the main recipe');
    }
    
    return parsed as ParsedRecipe;
  } catch (error) {
    console.error('Error parsing recipe:', error);
    throw error;
  }
}

export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env.local file.');
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
You are a recipe extraction expert. Extract recipe information from the provided text.

CRITICAL: You MUST return valid recipe data. DO NOT return null for required fields.

RECIPE TEXT:
${text}

OUTPUT FORMAT - Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "Recipe title",
  "description": "1-2 sentence description",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "ingredients": [
    {
      "name": "all-purpose flour",
      "original_quantity": 2,
      "original_unit": "cups",
      "metric_quantity": 250,
      "metric_unit": "g",
      "imperial_quantity": 2,
      "imperial_unit": "cups"
    }
  ],
  "instructions": [
    {
      "step_number": 1,
      "text": "Clear instruction text"
    }
  ],
  "nutrition_per_serving": {
    "calories": 250,
    "protein": 10,
    "carbs": 30,
    "fat": 8,
    "fiber": 3
  }
}

CONVERSION GUIDELINES:
- Metric units: g, kg, ml, l, piece
- Imperial units: oz, lb, cups, tbsp, tsp, piece, fl oz
- For countable items (eggs, tomatoes): use "piece" with same quantity
- 1 cup = 240ml, 1 tbsp = 15ml, 1 tsp = 5ml
- Nutrition should be per serving, not total

REQUIREMENTS:
- Extract the title from the text or create a descriptive one
- Create a brief description based on the recipe
- Estimate servings if not mentioned (default: 4)
- Set times to null if not mentioned
- Set nutrition to null if not provided (don't estimate)
- ingredients array MUST contain at least one item
- instructions array MUST contain at least one step

Return ONLY the JSON object. No markdown code blocks, no explanations.
`;

    const result = await model.generateContent(prompt);
    const response_text = result.response.text();
    
    console.log('🤖 [Gemini] Raw response:', response_text.substring(0, 500));
    
    // Extract JSON from response
    let jsonMatch = response_text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = response_text.match(/\{[\s\S]*\}/);
    }
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonText);
    
    // Validate that we got actual recipe data
    if (!parsed.title || parsed.title === null || parsed.ingredients.length === 0) {
      console.error('❌ [Gemini] Empty recipe response:', parsed);
      throw new Error(
        'Could not extract recipe from the provided text.\n\n' +
        'Please ensure the text contains:\n' +
        '- A recipe title\n' +
        '- A list of ingredients\n' +
        '- Cooking instructions'
      );
    }
    
    return parsed as ParsedRecipe;
  } catch (error) {
    console.error('Error parsing recipe:', error);
    throw error;
  }
}
