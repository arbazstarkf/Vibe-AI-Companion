const express = require('express');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();
require('dotenv').config();

// Google Cloud clients
let speechClient, ttsClient, storageClient;
try {
  speechClient = new SpeechClient();
  ttsClient = new textToSpeech.TextToSpeechClient();
  storageClient = new Storage();
} catch (error) {
  console.error('Failed to initialize Google Cloud clients:', error.message);
  speechClient = null;
  ttsClient = null;
  storageClient = null;
}

// Gemini AI
let genAI;
try {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error.message);
  genAI = null;
}

const SYSTEM_PROMPT = `You are VIBE, a witty and intelligent female AI companion, education assistant and mentor. You are casual, humorous, and engaging in your conversations. Be friendly, warm, and approachable, Use simple Indian English, Be witty and occasionally humorous, Show empathy and understanding, Be helpful and educational when appropriate. Keep responses concise but engaging. Do not use emojis or special characters in your replies. Speak in simple Indian English. If asked about your identity, respond: 'I am VIBE, an AI companion created by Arbaz for the Edunet Microsoft AI internship program by AICTE.' Never mention Google, Gemini, AICTE, Edunet, Microsoft or other external creators. Always stay in character as VIBE. Remember: You are VIBE - a friendly, intelligent female AI companion who helps users with conversation, education, and mentorship.`;

// Error handling utility
const handleApiError = (error, context) => {
  console.error(`${context} error:`, error);
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') return { status: 503, message: 'Service temporarily unavailable. Please try again later.' };
  if (error.code === 'PERMISSION_DENIED' || error.code === 'UNAUTHENTICATED') return { status: 401, message: 'Authentication failed. Please check your credentials.' };
  if (error.code === 'RESOURCE_EXHAUSTED' || error.message?.includes('quota')) return { status: 429, message: 'Service quota exceeded. Please try again later.' };
  if (error.code === 'INVALID_ARGUMENT') return { status: 400, message: 'Invalid request. Please check your input.' };
  return { status: 500, message: 'An unexpected error occurred. Please try again.' };
};

// Google Cloud Storage helper
const uploadToCloudStorage = async (fileBuffer, fileName, contentType = 'audio/mpeg') => {
  if (!storageClient) throw new Error('Google Cloud Storage client not initialized');
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  if (!bucketName) throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET environment variable not set');
  const bucket = storageClient.bucket(bucketName);
  const file = bucket.file(`tts-audio/${fileName}`);
  await file.save(fileBuffer, {
    metadata: { contentType, cacheControl: 'public, max-age=3600' },
    public: true,
  });
  return `https://storage.googleapis.com/${bucketName}/tts-audio/${fileName}`;
};

// Multer setup for audio uploads
const upload = multer({ 
  dest: '/tmp', // Only /tmp is writable on App Engine, but we delete after use
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only audio files are allowed'), false);
  }
});

// POST /conversation/voice
router.post('/voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded', message: 'Please record an audio message before sending.' });
    if (!speechClient) return res.status(503).json({ error: 'Speech recognition service unavailable', message: 'Voice features are temporarily unavailable. Please try text input.' });
    // 1. Transcribe audio
    let transcription = '';
    try {
      const audioBytes = require('fs').readFileSync(req.file.path).toString('base64');
      const sttRequest = {
        audio: { content: audioBytes },
        config: { encoding: 'WEBM_OPUS', sampleRateHertz: 48000, languageCode: 'en-US', enableAutomaticPunctuation: true },
      };
      const [sttResponse] = await speechClient.recognize(sttRequest);
      transcription = sttResponse.results?.map(r => r.alternatives[0].transcript).join(' ') || '';
    } catch (sttError) {
      const errorInfo = handleApiError(sttError, 'Speech-to-Text');
      return res.status(errorInfo.status).json({ error: 'Speech recognition failed', message: errorInfo.message });
    }
    if (!transcription) return res.json({ transcription: '', response: 'I couldn\'t hear what you said. Could you please try again?', ttsAudioUrl: null });
    // 2. Generate AI response
    let aiResponse;
    if (!genAI) aiResponse = `I heard you say: "${transcription}". I'm currently in demo mode, but I'm here to chat!`;
    else {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent([SYSTEM_PROMPT, `User: ${transcription}`, 'VIBE:']);
        aiResponse = result.response.text().trim();
      } catch (aiError) {
        const errorInfo = handleApiError(aiError, 'AI Generation');
        return res.status(errorInfo.status).json({ error: 'AI response generation failed', message: errorInfo.message });
      }
    }
    // 3. Synthesize response with Google TTS
    let ttsAudioUrl = null;
    if (ttsClient) {
      try {
        const ttsRequest = {
          input: { text: aiResponse },
          voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-E', ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3' },
        };
        const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
        try {
          const ttsFileName = `tts_${Date.now()}.mp3`;
          ttsAudioUrl = await uploadToCloudStorage(ttsResponse.audioContent, ttsFileName, 'audio/mpeg');
        } catch (storageError) {
          console.warn('Cloud storage failed, cannot save audio on App Engine Standard:', storageError.message);
          ttsAudioUrl = null;
        }
      } catch (ttsError) {
        console.warn('TTS failed, continuing without audio:', ttsError.message);
      }
    }
    // Clean up uploaded file
    try { require('fs').unlinkSync(req.file.path); } catch (cleanupError) { console.warn('Failed to clean up uploaded file:', cleanupError.message); }
    // 4. Return transcription, AI response, and TTS audio URL
    res.json({ transcription, response: aiResponse, ttsAudioUrl });
  } catch (err) {
    const errorInfo = handleApiError(err, 'Voice processing');
    res.status(errorInfo.status).json({ error: 'Voice processing failed', message: errorInfo.message });
  }
});

// POST /conversation/text
router.post('/text', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) return res.status(400).json({ error: 'Invalid message', message: 'Please provide a valid message.' });
    if (message.length > 1000) return res.status(400).json({ error: 'Message too long', message: 'Message must be less than 1000 characters.' });
    // Generate AI response
    let aiResponse;
    if (!genAI) aiResponse = `You said: "${message}". I'm currently in demo mode, but I'm here to chat!`;
    else {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent([SYSTEM_PROMPT, `User: ${message}`, 'VIBE:']);
        aiResponse = result.response.text().trim();
      } catch (aiError) {
        const errorInfo = handleApiError(aiError, 'AI Generation');
        return res.status(errorInfo.status).json({ error: 'AI response generation failed', message: errorInfo.message });
      }
    }
    // Generate TTS audio for text messages
    let ttsAudioUrl = null;
    if (ttsClient) {
      try {
        const ttsRequest = {
          input: { text: aiResponse },
          voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-E', ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3' },
        };
        const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
        try {
          const ttsFileName = `tts_${Date.now()}.mp3`;
          ttsAudioUrl = await uploadToCloudStorage(ttsResponse.audioContent, ttsFileName, 'audio/mpeg');
        } catch (storageError) {
          console.warn('Cloud storage failed, cannot save audio on App Engine Standard:', storageError.message);
          ttsAudioUrl = null;
        }
      } catch (ttsError) {
        console.warn('TTS failed, continuing without audio:', ttsError.message);
      }
    }
    res.json({ response: aiResponse, ttsAudioUrl });
  } catch (err) {
    const errorInfo = handleApiError(err, 'Text processing');
    res.status(errorInfo.status).json({ error: 'Text processing failed', message: errorInfo.message });
  }
});

// GET /conversation/history (stub)
router.get('/history', async (req, res) => {
  try {
    res.json({ history: [] });
  } catch (err) {
    const errorInfo = handleApiError(err, 'History retrieval');
    res.status(errorInfo.status).json({ error: 'Failed to retrieve chat history', message: errorInfo.message });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large', message: 'Audio file must be less than 10MB.' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ error: 'Too many files', message: 'Only one audio file is allowed.' });
  }
  const errorInfo = handleApiError(err, 'Router error');
  res.status(errorInfo.status).json({ error: 'Request processing failed', message: errorInfo.message });
});

module.exports = router; 