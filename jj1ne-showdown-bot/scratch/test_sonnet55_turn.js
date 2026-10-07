const LLM = require('../llm.js');
const fs = require('fs');
const path = require('path');

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

async function inspectSonnet55() {
  console.log('Testing claude-sonnet-5-5 turn prompt with candidates...');
  const t0 = Date.now();
  const userPrompt = `TURN 1. Field: normal.
Our side: Drogon (Charizard-Mega-Y) 100% HP, Garchomp 100% HP
Opponent: Urshifu-Rapid 100% HP, Whimsicott 100% HP

CANDIDATES (engine score, higher = engine prefers):
0. [92] move 1, move 2 1  —  Drogon Heat Wave, Garchomp Stomping Tantrum into Urshifu-Rapid
1. [88] move 4, move 2 1  —  Drogon Protect, Garchomp Stomping Tantrum into Urshifu-Rapid
2. [75] move 1, move 1  —  Drogon Heat Wave, Garchomp Earthquake

Reply with ONLY JSON: {"pick": <candidate index or -1>, "cmd": "<only if pick is -1>", "why": "<max 25 words>"}`;

  const r = await LLM.callClaude(CFG.claude, {
    role: 'turn',
    system: LLM.TURN_SYSTEM(),
    user: userPrompt,
    maxTokens: 400,
    timeoutMs: 15000
  });
  console.log(`Response received in ${Date.now() - t0}ms!`);
  console.log('Raw text:', r.text);
  console.log('Parsed JSON:', LLM.parseJSON(r.text));
}

inspectSonnet55().catch(console.error);
