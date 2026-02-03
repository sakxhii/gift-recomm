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

            console.warn(`Falling back to mock data due to API error: ${error.message}`);
            return this._getMockSuggestions(profile);
        }
    }

    /**
     * Internal method to call Google Gemini API
     */
    async getPrioritizedModels(apiKey) {
        try {
            // Ask Google what models are available for this key
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            if (!data.models) return ['gemini-1.5-flash', 'gemini-1.0-pro'];

            // Filter for models that generate content
            const usableModels = data.models.filter(m =>
                m.supportedGenerationMethods.includes('generateContent') &&
                !m.name.includes('vision') // Prefer standard multimodal/text versions
            );

            // Sort preferences: Flash > 1.5 > Pro
            usableModels.sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();

                // Prioritize 'flash' (usually fastest/cheapest/highest quota)
                const isFlashA = nameA.includes('flash');
                const isFlashB = nameB.includes('flash');
                if (isFlashA && !isFlashB) return -1;
                if (!isFlashA && isFlashB) return 1;

                // Prioritize newer versions (1.5)
                const is15A = nameA.includes('1.5');
                const is15B = nameB.includes('1.5');
                if (is15A && !is15B) return -1;
                if (!is15A && is15B) return 1;

                return 0;
            });

            return usableModels.map(m => m.name.replace('models/', ''));
        } catch (e) {
            console.warn('Failed to fetch models list, using defaults:', e);
            return ['gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-pro'];
        }
    }

    async _callGeminiAPI(apiKey, profile, filters) {
        const prompt = this._constructPrompt(profile, filters);

        // Get list of all available models for this specific API key
        // This avoids guessing models that don't exist (404s)
        let models = await this.getPrioritizedModels(apiKey);
        console.log('Available models for this key:', models);

        if (models.length === 0) {
            models = ['gemini-1.5-flash', 'gemini-1.0-pro'];
        }

        let lastError = null;

        // Try each model until one works
        for (const modelName of models) {
            try {
                console.log(`Attempting generation with model: ${modelName}`);
                return await this._generateContent(apiKey, modelName, prompt);
            } catch (error) {
                console.warn(`Model ${modelName} failed: ${error.message}`);
                lastError = error;
                // Continue to next model in the list
                continue;
            }
        }

        // If we get here, all models failed
        console.error('All available models failed.');
        throw lastError || new Error('All valid models failed to generate content');
    }

    async _generateContent(apiKey, modelName, prompt) {
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
                    maxOutputTokens: 8192,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // detailed error for debugging
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
                matchScore: gift.matchScore || 85, // Default score
                purchaseUrl: `https://www.google.com/search?q=${encodeURIComponent(gift.name + ' gift')}&tbm=shop`
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
        const interests = (profile.interests && profile.interests.length > 0)
            ? profile.interests.join(', ')
            : 'General Business, Professional Networking, Office Productivity';

        return `
      You are a smart gift recommendation API. Output ONLY a valid JSON array of 5 gift objects.
      
      CONTEXT: The user is looking for gifts for a professional contact derived from a business card.
      The recipient could be a specific individual OR a business entity.

      PROFILE DATA:
      - Name: ${profile.name}
      - Title: ${profile.title || 'N/A (Treat as Business Entity if Name is a Company)'}
      - Company: ${profile.company || 'N/A'}
      - Known Interests: ${interests}
      - Budget Level: ${filters.budget || 'Moderate'}

      INSTRUCTIONS:
      1. Analyze the "Name" and "Title". 
         - If it looks like a person (e.g., "John Doe", "Manager"), suggest professional gifts for an individual AND include 1-2 "Team/Office" gifts (e.g., coffee for the office, desk gadgets).
         - If it looks like a Business/Company (e.g., "Acme Corp", "Tech Solutions") or Title is N/A, suggest B2B/Corporate gifts (e.g., breakroom supplies, software tools, branded swag, office decor).
      2. Ensure a diverse mix of categories (e.g., Tech, Wellness, Office, Food/Drink).
      3. Reasoning should explain WHY it fits the business context or the individual's role.

      REQUIRED JSON STRUCTURE:
      [
        {
          "id": "g1",
          "name": "Gift Name (Specific Product)",
          "price": 50,
          "currency": "USD",
          "category": "Category",
          "matchScore": 90,
          "description": "Brief description of the item.",
          "reasoning": "Explain why this fits the person's role or the business needs.",
          "tags": ["Professional", "Tech", "Office"]
        }
      ]

      IMPORTANT: Do not use markdown formatting (no \`\`\`json). Just return the raw JSON array.
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
