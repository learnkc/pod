// test_integration.js
// Simple test script to verify the integration between Express and the AI engine

const axios = require('axios');

// Configuration
const EXPRESS_URL = 'http://localhost:5000';
const AI_ENGINE_URL = 'http://localhost:8000';

async function testIntegration() {
  console.log('Testing integration between Express and AI Engine...');
  
  try {
    // Step 1: Check if Express is running
    console.log('\nChecking Express server...');
    const expressResponse = await axios.get(`${EXPRESS_URL}/api/metrics`);
    console.log('✅ Express server is running');
    
    // Step 2: Check if AI Engine is running
    console.log('\nChecking AI Engine...');
    try {
      const aiEngineResponse = await axios.get(`${AI_ENGINE_URL}/health`);
      console.log('✅ AI Engine is running');
    } catch (error) {
      console.log('❌ AI Engine is not running');
      console.log('Please start the AI Engine with: npm run start:ai');
      return;
    }
    
    // Step 3: Check AI status through Express
    console.log('\nChecking AI status through Express...');
    const aiStatusResponse = await axios.get(`${EXPRESS_URL}/api/ai/status`);
    console.log('AI Engine status:', aiStatusResponse.data.aiEngine.running ? 'Running' : 'Not running');
    console.log('Ollama status:', aiStatusResponse.data.ollama.running ? 'Running' : 'Not running');
    if (aiStatusResponse.data.ollama.running) {
      console.log('Ollama model:', aiStatusResponse.data.ollama.model);
    }
    
    // Step 4: Test a simple analysis
    console.log('\nTesting guest analysis (this may take a while)...');
    const testData = {
      channelUrl: 'https://youtube.com/@lexfridman',
      guestName: 'Elon Musk',
      field: 'technology'
    };
    
    try {
      const analysisResponse = await axios.post(`${EXPRESS_URL}/api/ai/analyze`, testData, {
        timeout: 60000 // 1 minute timeout
      });
      
      if (analysisResponse.data.success) {
        console.log('✅ Analysis successful');
        console.log('Compatibility Score:', analysisResponse.data.analysis.compatibilityScore);
        console.log('Guest:', analysisResponse.data.analysis.guestInfo.name);
        console.log('Field:', analysisResponse.data.analysis.guestInfo.field);
      } else {
        console.log('❌ Analysis failed');
        console.log('Error:', analysisResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Analysis request failed');
      console.log('Error:', error.message);
      console.log('This could be due to a timeout or connection issue.');
      console.log('The LLM analysis can take several minutes to complete.');
    }
    
    console.log('\nIntegration test completed');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testIntegration();