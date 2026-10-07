const fs = require('fs');
const path = require('path');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
const key = process.env.AZURE_CLAUDE_KEY || process.env.ANTHROPIC_FOUNDRY_API_KEY || '';

async function test46(thinkingObj) {
  const url = CFG.claude.endpoint.replace(/\/+$/, '') + '/v1/messages';
  const payload = {
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    system: 'You are a test assistant.',
    messages: [{ role: 'user', content: 'Say hello in 3 words.' }]
  };
  if (thinkingObj !== undefined) payload.thinking = thinkingObj;

  console.log(`\nTesting Sonnet 4.6 with thinking = ${JSON.stringify(thinkingObj)}`);
  try {
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
    if (!r.ok) {
      console.log(`✗ Error (${r.status}):`, txt);
    } else {
      console.log(`✓ Success!`, JSON.parse(txt).content);
    }
  } catch (e) {
    console.error(`✗ Exception:`, e.message);
  }
}

async function main() {
  await test46(undefined);
  await test46({ type: 'disabled' });
  await test46({ type: 'between_tools' });
}

main();
