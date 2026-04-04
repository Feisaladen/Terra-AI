// supabase.js — Initialize Supabase for auth only

// Configuration
const SUPABASE_URL = 'https://thgacoqqzvpduydazujh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZ2Fjb3FxenZwZHV5ZGF6dWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Njk5ODQsImV4cCI6MjA4NTU0NTk4NH0.Gu7_7YVOvPW94JVqN96dHMv-rCCVeGNxnvHzdyoQMwE';

let supabaseClient = null;
let isInitialized = false;

// Wait for Supabase CDN to load
function waitForSupabaseCDN() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;

    const checkSupabase = () => {
      attempts++;
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        console.log('✅ Supabase CDN loaded');
        resolve(true);
      } else if (attempts >= maxAttempts) {
        console.error('❌ Supabase CDN failed to load');
        loadAlternativeSupabase().then(resolve).catch(reject);
      } else {
        setTimeout(checkSupabase, 100);
      }
    };

    checkSupabase();
  });
}

// Load alternative CDN
function loadAlternativeSupabase() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      console.log('✅ Alternative Supabase CDN loaded');
      resolve(true);
    };
    script.onerror = () => {
      reject(new Error('❌ Failed to load Supabase'));
    };
    document.head.appendChild(script);
  });
}

// Initialize Supabase client
async function initializeSupabase() {
  if (isInitialized && supabaseClient) {
    return supabaseClient;
  }

  try {
    await waitForSupabaseCDN();
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    isInitialized = true;

    console.log('✅ Supabase client initialized');

    window.supabase = supabaseClient;
    return supabaseClient;
  } catch (error) {
    console.error('❌ Supabase init failed:', error);
    return null;
  }
}

// Helper: get current user
async function currentUser() {
  const client = await initializeSupabase();
  if (!client) return null;

  try {
    const { data } = await client.auth.getUser();
    return data?.user ?? null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Export only necessary helpers
window.supabaseHelpers = {
  currentUser,
  initializeSupabase
};

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}
