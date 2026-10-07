const LLM = require('../llm.js');
const fs = require('fs');
const path = require('path');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

async function inspect() {
  const model = 'claude-sonnet-5-5';
  const url = CFG.claude.endpoint.replace(/\/+$/, '') + '/v1/messages';
  const key = process.env.AZURE_CLAUDE_KEY || process.env.ANTHROPIC_FOUNDRY_API_KEY;

  const payload = {
    model,
    max_tokens: 400,
    thinking: { type: 'between_tools' },
    system: [{ type: 'text', text: LLM.TURN_SYSTEM(), cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: 'Turn 1. Field: normal. Our side: Charizard-Mega-Y (100% HP) and Garchomp (100% HP). Opponent side: Urshifu-Rapid (100% HP) and Whimsicott (100% HP). Pick actions for both in JSON: {"drogon": {"action": "move", "move": "Heat Wave"}, "chomp": {"action": "move", "move": "Stomping Tantrum", "target": "Whimsicott"}}'
    }]
  };

  console.log('Sending raw payload with prompt caching to Sonnet 5.5...');
  const t0 = Date.now();
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'api-key': key,
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });
  const txt = await r.text();
  const j = JSON.parse(txt);
  console.log(`Response (${r.status}) in ${Date.now() - t0}ms:`);
  console.log('Content types:', (j.content || []).map(b => b.type));
  for (const b of (j.content || [])) {
    if (b.type === 'text') console.log('Text:', b.text);
    if (b.type === 'thinking') console.log('Thinking (length):', (b.thinking || '').length);
  }
  console.log('Usage:', j.usage);
  console.log('Stop reason:', j.stop_reason);
}

inspect().catch(console.error);
