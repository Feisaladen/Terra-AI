// Script to update Supabase configuration
const fs = require('fs');
const path = require('path');

console.log('🔧 Supabase Configuration Updater\n');

console.log('📋 Please provide your new Supabase credentials:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Go to Settings → API');
console.log('3. Copy your Project URL and anon public key\n');

console.log('📝 Example format:');
console.log('Project URL: https://xxxxxxxxxxxxx.supabase.co');
console.log('Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n');

console.log('💡 After you provide the credentials, I will update:');
console.log('   - backend/.env');
console.log('   - frontend/scripts/supabase.js');
console.log('   - All HTML files that reference Supabase\n');

console.log('🚀 Ready to update when you provide the new credentials!');
