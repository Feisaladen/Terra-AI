// Script to update Supabase credentials in all files
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function updateCredentials() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const envPath = path.join(projectRoot, 'backend', '.env');
  const supabaseJsPath = path.join(projectRoot, 'frontend', 'scripts', 'supabase.js');

  console.log('🔧 Terra AI Supabase Configuration Updater\n');
  
  console.log('📋 Please provide your new Supabase credentials:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Go to Settings → API');
  console.log('3. Copy your Project URL and anon public key\n');
  
  const projectUrl = await askQuestion('🌐 Project URL (e.g., https://xxxxxxxxxxxxx.supabase.co): ');
  const anonKey = await askQuestion('🔑 Anon public key (starts with eyJ...): ');
  
  if (!projectUrl || !anonKey) {
    console.log('❌ Both URL and key are required!');
    rl.close();
    return;
  }
  
  console.log('\n🔄 Updating configuration files...\n');
  
  try {
    // Update .env file
    console.log('📝 Updating .env file...');
    const envContent = `# Supabase Configuration
SUPABASE_URL=${projectUrl}
SUPABASE_ANON_KEY=${anonKey}

# Google Gemini AI Configuration
GOOGLE_GEMINI_API_KEY=${process.env.GOOGLE_GEMINI_API_KEY || 'your_gemini_api_key_here'}

# Server Configuration
PORT=3000
NODE_ENV=development`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated');
    
    // Update supabase.js file
    console.log('📝 Updating supabase.js file...');
    const supabaseJsContent = `// supabase.js - Initialize Supabase client and provide helper functions
// This file should be loaded AFTER the Supabase CDN library

// Configuration - centralized here to avoid duplicates
const SUPABASE_URL = '${projectUrl}';
const SUPABASE_ANON_KEY = '${anonKey}';

let supabaseClientInstance = null;
let supabaseReadyPromise = null;

function getSupabaseClient() {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  if (typeof supabase === 'undefined') {
    console.error('Supabase CDN library not loaded. Make sure to include it before supabase.js.');
    return null;
  }

  supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase client initialized successfully');
  return supabaseClientInstance;
}

// Function to wait for the Supabase CDN to be loaded and client initialized
async function waitForSupabase(timeout = 5000) {
  if (supabaseReadyPromise) {
    return supabaseReadyPromise;
  }

  supabaseReadyPromise = new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (typeof window.supabase !== 'undefined' && window.supabaseClientInstance) {
        clearInterval(checkInterval);
        console.log('✅ Supabase CDN library loaded successfully');
        resolve(window.supabaseClientInstance);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.error('❌ Supabase CDN library did not load within the timeout.');
        reject(new Error('Supabase CDN library not loaded.'));
      }
    }, 100);
  });
  return supabaseReadyPromise;
}

// Initialize Supabase client and make it globally available
document.addEventListener('DOMContentLoaded', () => {
  if (window.supabaseClientInstance) {
    console.warn('supabase.js already loaded');
    return;
  }

  const client = getSupabaseClient();
  if (client) {
    window.supabaseClientInstance = client; // Store the instance
    window.supabase = client; // Make it globally accessible as 'supabase'
    testSupabaseStorage();
  }
});

// Helper: get current user
async function currentUser() {
  const client = await waitForSupabase();
  const { data } = await client.auth.getUser();
  return data?.user ?? null;
}

// Helper: get public url for a file in the 'land-images' bucket
async function publicImageUrl(path) {
  const client = await waitForSupabase();
  const { data } = client.storage.from('land-images').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

// Helper: upload file to bucket
async function uploadFileToBucket(path, file) {
  const client = await waitForSupabase();
  return client.storage.from('land-images').upload(path, file);
}

// Test Supabase Storage connection
async function testSupabaseStorage() {
  try {
    const client = await waitForSupabase();
    const { data, error } = await client.storage.from('land-images').list('', { limit: 1 });

    if (error) {
      console.error("❌ Storage connection failed:", error.message);
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        alert("❌ Supabase Storage connection failed. Check bucket name or permissions.");
      }
    } else {
      console.log("✅ Supabase Storage is working. Files:", data);
    }
  } catch (err) {
    console.error('❌ Storage test failed:', err);
  }
}

// Export helpers to window for global access
window.supabaseHelpers = {
  currentUser,
  publicImageUrl,
  uploadFileToBucket,
  waitForSupabase // Expose waitForSupabase for other scripts
};

// Ensure window.supabase is always the initialized client
Object.defineProperty(window, 'supabase', {
  get: function() {
    if (!supabaseClientInstance) {
      console.warn('Accessing supabase before initialization. Waiting for it to be ready...');
      // This will return the promise, so consumers should await it.
      // For direct synchronous access, it will be null until ready.
      return null; 
    }
    return supabaseClientInstance;
  },
  configurable: true
});`;
    
    fs.writeFileSync(supabaseJsPath, supabaseJsContent);
    console.log('✅ supabase.js file updated');
    
    console.log('\n🎉 Configuration updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the SQL setup in your Supabase project');
    console.log('2. Restart your servers:');
    console.log('   - App: npm start');
    console.log('3. Test the signup/login flow');
    
  } catch (error) {
    console.error('❌ Error updating configuration:', error.message);
  }
  
  rl.close();
}

updateCredentials();

