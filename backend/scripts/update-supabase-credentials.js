const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function updateCredentials() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const envPath = path.join(projectRoot, 'backend', '.env');

  console.log('Terra AI Supabase Configuration Updater\n');
  console.log('Provide your Supabase project URL and anon public key.');
  console.log('These values will be stored in backend/.env and served to the frontend at runtime.\n');

  const projectUrl = await askQuestion('Project URL: ');
  const anonKey = await askQuestion('Anon public key: ');

  if (!projectUrl || !anonKey) {
    console.log('Both URL and key are required.');
    rl.close();
    return;
  }

  try {
    const envContent = `# Supabase Configuration
SUPABASE_URL=${projectUrl}
SUPABASE_ANON_KEY=${anonKey}

# Google Gemini AI Configuration
GOOGLE_GEMINI_API_KEY=${process.env.GOOGLE_GEMINI_API_KEY || 'your_gemini_api_key_here'}

# Server Configuration
PORT=3000
NODE_ENV=development`;

    fs.writeFileSync(envPath, envContent);
    console.log('\nUpdated backend/.env successfully.');
    console.log('Next steps:');
    console.log('1. Restart the app with npm start');
    console.log('2. Verify login/signup still work');
    console.log('3. Deploy when ready');
  } catch (error) {
    console.error('Error updating configuration:', error.message);
  }

  rl.close();
}

updateCredentials();
