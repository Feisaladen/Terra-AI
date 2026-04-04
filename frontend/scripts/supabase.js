// supabase.js - Initialize Supabase for auth using runtime config from the backend

let supabaseClient = null;
let isInitialized = false;
let publicConfig = null;

function waitForSupabaseCDN() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;

    const checkSupabase = () => {
      attempts++;
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        resolve(true);
      } else if (attempts >= maxAttempts) {
        loadAlternativeSupabase().then(resolve).catch(reject);
      } else {
        setTimeout(checkSupabase, 100);
      }
    };

    checkSupabase();
  });
}

function loadAlternativeSupabase() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Supabase CDN'));
    document.head.appendChild(script);
  });
}

async function loadPublicConfig() {
  if (publicConfig) {
    return publicConfig;
  }

  const response = await fetch('/api/config', {
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Failed to load public app config');
  }

  publicConfig = {
    supabaseUrl: payload.supabaseUrl,
    supabaseAnonKey: payload.supabaseAnonKey
  };

  return publicConfig;
}

async function initializeSupabase() {
  if (isInitialized && supabaseClient) {
    return supabaseClient;
  }

  try {
    await waitForSupabaseCDN();
    const config = await loadPublicConfig();
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    isInitialized = true;
    window.supabase = supabaseClient;
    return supabaseClient;
  } catch (error) {
    console.error('Supabase init failed:', error);
    return null;
  }
}

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

window.supabaseHelpers = {
  currentUser,
  initializeSupabase,
  loadPublicConfig
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}
