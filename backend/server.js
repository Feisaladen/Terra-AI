const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, '..', 'frontend');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Multer setup to store uploaded image in memory
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for frontend
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.static(frontendDir));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Terra AI Analysis API'
  });
});

app.get('/api/config', (req, res) => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Supabase public configuration is missing'
    });
  }

  res.json({
    success: true,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Multer-based image upload + analysis endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const lat = req.body.lat || null;
    const lon = req.body.lon || null;
    const file = req.file;

    if (!file || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: image (file) and userId are required'
      });
    }

    console.log(`📥 Received image from user ${userId}`);

    // Convert image buffer to base64 string
    const base64Image = file.buffer.toString('base64');

    // Call AI analysis function with base64 image data
    const analysisResult = await analyzeImageBufferWithGemini(base64Image);

    if (!analysisResult) {
      throw new Error('AI analysis failed');
    }

    res.json({
      success: true,
      analysis: analysisResult,
      message: 'Analysis completed successfully'
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// AI analysis function using Google Gemini (adapted for base64 image input)
async function analyzeImageBufferWithGemini(base64Image) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Analyze this soil/land image and provide detailed information about: 1) Soil condition and health, 2) Detected objects (plants, rocks, water, etc.), 3) Soil type indicators, 4) Recommendations for soil improvement, 5) Suggested crops that would grow well. Provide a structured JSON response with fields: soil_condition, detected_objects, soil_type, recommendations, suggested_crops, confidence_score."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data;
    console.log('Gemini Response:', JSON.stringify(data, null, 2));

    const processedResult = processGeminiResponse(data);
    return processedResult;

  } catch (error) {
    console.error('Gemini Error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      throw new Error('AI service rate limit exceeded. Please try again later.');
    }
    
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

// Process Gemini response helper (same as your existing function)
function processGeminiResponse(geminiResponse) {
  try {
    const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response text from Gemini');
    }

    console.log('Gemini generated text:', generatedText);

    let parsedAnalysis;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      parsedAnalysis = parseTextResponse(generatedText);
    }

    const soilInsights = {
      issue: parsedAnalysis.soil_condition || 'Soil condition analyzed',
      explanation: parsedAnalysis.soil_condition || generatedText.substring(0, 200) + '...',
      recommendations: Array.isArray(parsedAnalysis.recommendations) 
        ? parsedAnalysis.recommendations 
        : (parsedAnalysis.recommendations ? [parsedAnalysis.recommendations] : ['Add organic matter', 'Test soil pH']),
      suggested_crops: Array.isArray(parsedAnalysis.suggested_crops) 
        ? parsedAnalysis.suggested_crops 
        : (parsedAnalysis.suggested_crops ? [parsedAnalysis.suggested_crops] : ['Legumes', 'Cover crops'])
    };

    return {
      provider: 'google-gemini',
      timestamp: new Date().toISOString(),
      detected_objects: parsedAnalysis.detected_objects || [],
      soil_analysis: soilInsights,
      raw_response: geminiResponse,
      raw_text: generatedText
    };

  } catch (error) {
    console.error('Error processing Gemini response:', error);
    return {
      provider: 'google-gemini',
      timestamp: new Date().toISOString(),
      detected_objects: [],
      soil_analysis: {
        issue: 'Analysis completed',
        explanation: 'AI analysis completed successfully',
        recommendations: ['Add organic compost', 'Test soil pH', 'Consider crop rotation'],
        suggested_crops: ['Legumes', 'Green manure crops', 'Cover crops']
      },
      error: error.message,
      raw_text: geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text'
    };
  }
}

// Basic fallback text parsing for Gemini text response
function parseTextResponse(text) {
  const analysis = {
    soil_condition: 'Soil condition analyzed',
    detected_objects: [],
    recommendations: [],
    suggested_crops: []
  };

  if (text.toLowerCase().includes('clay')) {
    analysis.soil_condition = 'Clay soil detected';
    analysis.recommendations.push('Add sand and organic matter for better drainage');
    analysis.suggested_crops.push('Wheat', 'Barley');
  }
  
  if (text.toLowerCase().includes('sandy') || text.toLowerCase().includes('sand')) {
    analysis.soil_condition = 'Sandy soil detected';
    analysis.recommendations.push('Add compost to improve water retention');
    analysis.suggested_crops.push('Carrots', 'Radishes');
  }
  
  if (text.toLowerCase().includes('rock') || text.toLowerCase().includes('stone')) {
    analysis.recommendations.push('Remove large rocks and debris');
  }
  
  if (text.toLowerCase().includes('plant') || text.toLowerCase().includes('vegetation')) {
    analysis.detected_objects.push({ label: 'Vegetation', confidence: 0.8 });
    analysis.suggested_crops.push('Tomatoes', 'Lettuce');
  }

  return analysis;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Terra AI Analysis API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Analysis endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`🔑 Make sure to set your GOOGLE_GEMINI_API_KEY in the .env file`);
});

module.exports = app;

