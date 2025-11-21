#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎤 Setting up OpenAI Whisper Voice Transcription\n');

async function setupApiKey() {
  return new Promise((resolve) => {
    rl.question('Enter your OpenAI API Key (get one from https://platform.openai.com/api-keys): ', (apiKey) => {
      if (!apiKey || apiKey.trim() === '') {
        console.log('❌ API key is required. Please get one from OpenAI platform.');
        process.exit(1);
      }
      
      if (!apiKey.startsWith('sk-')) {
        console.log('⚠️  Warning: OpenAI API keys typically start with "sk-"');
      }
      
      resolve(apiKey.trim());
    });
  });
}

async function main() {
  try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
      console.log('📁 .env file already exists. Backing up to .env.backup');
      fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
    }
    
    // Get API key from user
    const apiKey = await setupApiKey();
    
    // Read .env.example as template
    let envContent = '';
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
      envContent = envContent.replace('your-openai-api-key-here', apiKey);
    } else {
      envContent = `# Environment Variables for CMD Transparency App
EXPO_PUBLIC_OPENAI_API_KEY=${apiKey}
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_DEBUG_MODE=true`;
    }
    
    // Write .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Configuration completed successfully!');
    console.log('📝 Created .env file with your API key');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm start');
    console.log('2. Open the app on your device');
    console.log('3. Go to IMaan screen');
    console.log('4. Tap the microphone button to test voice recording');
    console.log('\n💡 Tips:');
    console.log('- Ensure you have microphone permissions');
    console.log('- Speak clearly for better transcription');
    console.log('- Check your OpenAI account for usage costs');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();