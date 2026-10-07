const LLM = require('../llm.js');
const fs = require('fs');
const path = require('path');

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

async function testHybrid() {
  console.log('Testing Hybrid Deployments on Microsoft Foundry...');
  console.log('Endpoint:', CFG.claude.endpoint);
  console.log('Turn Deployment (Sonnet 5.5):', CFG.claude.deployments.turn);
  console.log('Preview Deployment (Sonnet 4.6):', CFG.claude.deployments.preview);
  console.log('--------------------------------------------------');

  // Test 1: Sonnet 5.5 (Turn role)
  console.log('\n[1/2] Testing Turn Pilot -> claude-sonnet-5-5 (Fast turn)...');
  try {
    const t0 = Date.now();
    const r1 = await LLM.callClaude(CFG.claude, {
      role: 'turn',
      system: 'You are a competitive Pokemon VGC bot. Answer with valid JSON only.',
      user: 'What is your name and deployment? Answer in JSON: {"model": "...", "status": "..."}',
      maxTokens: 100,
      timeoutMs: 15000
    });
    console.log(`✓ Sonnet 5.5 responded in ${Date.now() - t0}ms!`);
    console.log('Response:', r1.text);
    console.log('Usage:', r1.usage);
  } catch (err) {
    console.error('✗ Sonnet 5.5 failed:', err.message);
  }

  // Test 2: Sonnet 4.6 (Preview role with thinking)
  console.log('\n[2/2] Testing Team Preview -> claude-sonnet-4-6 (Reasoning preview)...');
  try {
    const t0 = Date.now();
    const r2 = await LLM.callClaude(CFG.claude, {
      role: 'preview',
      system: 'You are a competitive Pokemon VGC bot analyzing Team Preview. Answer with valid JSON only.',
      user: 'Opponent team: Urshifu-Rapid, Whimsicott, Incineroar, Rillaboom, Farigiraf, Bloodmoon. Pick 4. Answer in JSON: {"team": "1234", "plan": "..."}',
      maxTokens: 250,
      timeoutMs: 30000
    });
    console.log(`✓ Sonnet 4.6 responded in ${Date.now() - t0}ms!`);
    console.log('Response:', r2.text);
    console.log('Usage:', r2.usage);
  } catch (err) {
    console.error('✗ Sonnet 4.6 failed:', err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log('Hybrid test completed.');
}

testHybrid().catch(console.error);
