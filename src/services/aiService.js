import storage from '../utils/storage';

/**
 * AI Service for generating gift recommendations
 * Uses Google Gemini API (if key present) or falls back to mock data
 */

const MOCK_GIFTS = [
    {
        id: 'g1',
        name: 'Premium Noise-Canceling Headphones',
        price: 249,
        currency: 'USD',
        category: 'Tech',
        matchScore: 94,
        description: 'Perfect for focused work sessions and travel. Matches tech profile.',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        purchaseUrl: '#',
        tags: ['Tech', 'Productivity', 'Luxury'],
        reasoning: 'Based on their role as Senior Data Scientist, they likely value deep work and focus. High-quality audio gear is a staple for tech professionals.'
    },
    {
        id: 'g2',
        name: 'Custom Data Visualization Course',
        price: 149,
        currency: 'USD',
        category: 'Education',
        matchScore: 88,
        description: 'Enhances data science skills. Shows investment in their career growth.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80',
        purchaseUrl: '#',
        tags: ['Learning', 'Career Growth'],
        reasoning: 'Targeted directly at their job title. A thoughtful professional gift that shows you understand their field.'
    },
    {
        id: 'g3',
        name: 'Artisanal Coffee Subscription',
        price: 120,
        currency: 'USD',
        category: 'Food & Drink',
        matchScore: 85,
        description: 'Monthly delivery of single-origin beans. Provides ongoing enjoyment.',
        imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500&q=80',
        purchaseUrl: '#',
        tags: ['Personal', 'Hobby', 'Monthly Joy'],
        reasoning: 'Matches their interest in "Coffee". A low-risk, high-reward gift that lasts for months.'
    }
];

class AIService {
    constructor() {
        this.useMock = false;
        this.model = 'gemini-pro';
    }

    /**
     * Generate gift suggestions based on profile data
     * @param {Object} profile - The user profile object
     * @param {Object} filters - Optional filters (budget, etc.)
     */
    async generateSuggestions(profile, filters = {}) {
        console.log('Generating suggestions for:', profile.name);

        // 1. Check for API Key
        const settings = storage.getSettings();
        const apiKey = settings.geminiApiKey;

        if (!apiKey) {
            console.warn('No Gemini API key found. Using mock data.');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
            return this._getMockSuggestions(profile);
        }

        // 2. Call Real API
        try {
            console.log('Calling Gemini API...');
            const suggestions = await this._callGeminiAPI(apiKey, profile, filters);
            return {
                success: true,
                suggestions: suggestions,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    model: this.model,
                    profileId: profile.id,
                    source: 'gemini-api'
                }
            };
        } catch (error) {
            console.error('Gemini API Error:', error);
            // Alert removed now that JSON parsing is fixed

            console.warn('Falling back to mock data due to API error.');
            return this._getMockSuggestions(profile);
        }
    }

    /**
     * Internal method to call Google Gemini API
     */
    async getValidGeminiModel(apiKey) {
        try {
            // Ask Google what models are available for this key
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            if (!data.models) return 'gemini-pro';

            // Prefer 1.5-flash for speed/cost, then pro
            const textModels = data.models.filter(m =>
                m.supportedGenerationMethods.includes('generateContent') &&
                !m.name.includes('vision') && // purely text models if possible, though vision models work too
                (m.name.includes('1.5') || m.name.includes('flash') || m.name.includes('pro'))
            );

            if (textModels.length > 0) {
                // Sort to prefer flash/1.5
                textModels.sort((a, b) => {
                    if (a.name.includes('flash')) return -1;
                    if (b.name.includes('flash')) return 1;
                    return 0;
                });
                return textModels[0].name.replace('models/', '');
            }

            return 'gemini-pro';
        } catch (e) {
            console.warn('Failed to auto-detect text models:', e);
            return 'gemini-pro';
        }
    }

    async _callGeminiAPI(apiKey, profile, filters) {
        const prompt = this._constructPrompt(profile, filters);

        // Auto-detect best model
        const modelName = await this.getValidGeminiModel(apiKey);
        console.log('AI Service using model:', modelName);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected API response structure:', data);
            throw new Error('Invalid response structure from Gemini API');
        }

        const text = data.candidates[0].content.parts[0].text;
        return this._parseResponse(text);
    }

    /**
     * Clean and parse the JSON response from the LLM
     */
    _parseResponse(text) {
        try {
            console.log('Raw AI Response:', text); // DEBUG LOG

            // 1. Robust cleanup: Remove markdown code blocks
            let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // 2. Find the first '[' and last ']' to isolate the array
            const firstBracket = cleanText.indexOf('[');
            const lastBracket = cleanText.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1) {
                cleanText = cleanText.substring(firstBracket, lastBracket + 1);
            } else {
                // Heuristic: If no array found, maybe it's a single object or conversational text?
                // Let's force it to be an array if it looks like an object
                if (cleanText.trim().startsWith('{')) {
                    cleanText = `[${cleanText}]`;
                }
            }

            const parsed = JSON.parse(cleanText);

            // Basic validation: ensure it's an array or has a gifts property
            let gifts = [];
            if (Array.isArray(parsed)) {
                gifts = parsed;
            } else if (parsed.gifts && Array.isArray(parsed.gifts)) {
                gifts = parsed.gifts;
            } else {
                throw new Error('Invalid JSON structure');
            }

            // Add default images if missing (since LLM can't easily generate real URLs)
            return gifts.map(gift => ({
                ...gift,
                id: gift.id || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                imageUrl: gift.imageUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80', // Default gift box image
                matchScore: gift.matchScore || 85 // Default score
            }));

        } catch (error) {
            console.error('Failed to parse AI response:', text);
            throw new Error('Failed to parse AI response JSON');
        }
    }

    /**
     * Construct the prompt for the AI
     */
    _constructPrompt(profile, filters) {
        return `
      You are a gift API. Output ONLY a valid JSON array of 5 gift objects for:
      
      PROFILE:
      - Name: ${profile.name}
      - Title: ${profile.title}
      - Interests: ${profile.interests.join(', ')}
      - Budget: ${filters.budget}

      REQUIRED JSON STRUCTURE:
      [
        {
          "id": "g1",
          "name": "Gift Name",
          "price": 50,
          "currency": "USD",
          "category": "Category",
          "matchScore": 90,
          "description": "Description",
          "reasoning": "Reason",
          "tags": ["tag1", "tag2"]
        }
      ]

      IMPORTANT: Do not write "Here is the JSON" or use markdown blocks. Just the raw JSON array.
    `;
    }

    /**
     * Internal method to filter/rank mock data based on profile
     */
    _getMockSuggestions(profile) {
        let results = [...MOCK_GIFTS];

        // Simple mock sorting
        if (profile.budgetRange === 'high' || profile.budgetRange === 'luxury') {
            results.sort((a, b) => b.price - a.price);
        }

        return {
            success: true,
            suggestions: results,
            metadata: {
                generatedAt: new Date().toISOString(),
                model: 'mock-data',
                profileId: profile.id
            }
        };
    }
}

export default new AIService();
