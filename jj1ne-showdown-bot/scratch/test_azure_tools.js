const fs = require('fs');
const path = require('path');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

async function testTools() {
  const key = process.env.AZURE_CLAUDE_KEY || process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const url = CFG.claude.endpoint.replace(/\/+$/, '').replace(/\/v1\/messages$/, '') + '/v1/messages';

  const body = {
    model: CFG.claude.deployment,
    max_tokens: 300,
    messages: [
      { role: 'user', content: 'What is the weather in Tokyo right now? Use the search_web tool.' }
    ],
    tools: [
      {
        name: 'search_web',
        description: 'Searches the live web for current information.',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query' }
          },
          required: ['query']
        }
      }
    ]
  };

  console.log('Sending request to Azure Foundry with tools...');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'api-key': key,
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const txt = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', txt.slice(0, 500));
}

testTools().catch(console.error);
