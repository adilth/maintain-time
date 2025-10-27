export const config = {
  geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY || '',
};

if (!config.geminiApiKey && process.env.NODE_ENV === 'production') {
  throw new Error('GOOGLE_GEMINI_API_KEY is required');
}