const LLM = require('../llm.js');
const fs = require('fs');
const path = require('path');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

// Test prompt with tools
const WT = require('../web-tools.js');

async function testChatQuery() {
  console.log('Testing Chat Query under new slimmed-down system prompt...');
  const chatCfg = { ...(CFG.claude || {}), thinking: { coach: 0, turn: 0, preview: 0, chat: 0 } };

  // Simple system prompt
  const system = 'You are the JJ1NE AI VGC Coach. Answer concisely.';
  const messages = [{ role: 'user', content: 'What is our lead strategy against Trick Room teams?' }];

  const t0 = Date.now();
  const r = await LLM.callClaude(chatCfg, {
    role: 'chat',
    system,
    messages,
    maxTokens: 500,
    timeoutMs: 30000
  });

  console.log(`✓ Responded in ${Date.now() - t0}ms!`);
  console.log('Response:\n', r.text);
  console.log('Usage:', r.usage);
}

testChatQuery().catch(console.error);
