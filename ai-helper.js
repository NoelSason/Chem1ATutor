/**
 * AI Helper Module for Gemini API Integration
 * Provides personalized explanations for incorrect answers
 */

/**
 * Get Gemini API key from environment or config
 */
function getGeminiApiKey() {
    // Try environment variable first (for production)
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }

    // Try Vercel public env var (prefixed with NEXT_PUBLIC_)
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }

    // Fallback to config file (for local development)
    if (typeof GEMINI_CONFIG !== 'undefined' && GEMINI_CONFIG && GEMINI_CONFIG.apiKey) {
        return GEMINI_CONFIG.apiKey;
    }

    throw new Error('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in Vercel or configure gemini-config.js locally.');
}

const API_KEY = getGeminiApiKey();

// Cache for AI responses to avoid redundant API calls
const aiCache = new Map();

/**
 * Get AI-powered explanation for an incorrect answer
 * @param {string} question - The question text
 * @param {string} correctAnswer - The correct answer
 * @param {string} userAnswer - The user's incorrect answer
 * @param {string} questionType - Type of question (multiple-choice or text-input)
 * @param {string} topic - The chemistry topic
 * @returns {Promise<string>} AI-generated explanation
 */
async function getAIExplanation(question, correctAnswer, userAnswer, questionType, topic) {
    // Check cache first
    const cacheKey = `${question}-${userAnswer}`;
    if (aiCache.has(cacheKey)) {
        return aiCache.get(cacheKey);
    }

    try {
        // Check if API key is configured
        if (!GEMINI_CONFIG || !GEMINI_CONFIG.apiKey || GEMINI_CONFIG.apiKey === 'PLACEHOLDER_KEY') {
            throw new Error('Gemini API key not configured. Please add your API key to gemini-config.js');
        }

        const prompt = buildPrompt(question, correctAnswer, userAnswer, questionType, topic);
        const explanation = await callGeminiAPI(prompt);

        // Cache the result
        aiCache.set(cacheKey, explanation);
        return explanation;

    } catch (error) {
        console.error('AI Explanation Error:', error);
        throw error;
    }
}

/**
 * Build the prompt for Gemini API
 */
function buildPrompt(question, correctAnswer, userAnswer, questionType, topic) {
    return `You are a chemistry tutor. A student answered incorrectly.

Topic: ${topic}
Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Provide a concise explanation (2-3 sentences max) that:
1. Explains why their answer is wrong
2. Shows the correct reasoning
3. No fluff, just the key concept they missed

Be direct and educational.`;
}

/**
 * Call Gemini API
 */
async function callGeminiAPI(prompt) {
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const response = await fetch(`${API_URL}?key=${GEMINI_CONFIG.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
                topP: 0.8,
                topK: 10
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 403) {
            throw new Error('Invalid API key. Please check your gemini-config.js file.');
        } else {
            throw new Error(errorData.error?.message || 'Failed to get AI explanation');
        }
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected API response format');
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * Clear the AI cache (useful for testing)
 */
function clearAICache() {
    aiCache.clear();
}
