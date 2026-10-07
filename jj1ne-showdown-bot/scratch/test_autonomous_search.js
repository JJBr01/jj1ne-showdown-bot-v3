const fs = require('fs');
const path = require('path');
const LLM = require('../llm.js');
const WT = require('../web-tools.js');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

async function testAutonomousSearch() {
  const query = "Search the web for what Mega evolutions are most popular in Gen 9 Champions VGC 2026.";
  const messages = [{ role: 'user', content: query }];

  console.log('Sending query to Claude with autonomous tools...');
  const chatCfg = { ...(CFG.claude || {}), thinking: { coach: 0, turn: 0, preview: 0 } };

  let turns = 0;
  let finalResponse = null;

  while (turns < 4) {
    turns++;
    const r = await LLM.callClaude(chatCfg, {
      role: 'coach',
      system: 'You are an autonomous VGC Coach with live web tools. Proactively use search_web, fetch_live_vgcpastes, or fetch_url to find the most accurate real-world answer.',
      messages,
      tools: WT.TOOLS_DEFINITION,
      maxTokens: 1000,
      timeoutMs: 45000
    });

    if (r.toolCalls && r.toolCalls.length > 0) {
      console.log(`Claude invoked ${r.toolCalls.length} tool(s):`, r.toolCalls.map(t => `${t.name}(${JSON.stringify(t.input)})`));
      messages.push({ role: 'assistant', content: r.rawContent });

      const toolResults = [];
      for (const tc of r.toolCalls) {
        console.log(`Executing ${tc.name}...`);
        const out = await WT.executeTool(tc);
        console.log(`Tool output length: ${out.length}`);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tc.id,
          content: out
        });
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    finalResponse = r.text;
    break;
  }

  console.log('\nFINAL ANSWER:\n', finalResponse);
}

testAutonomousSearch().catch(console.error);
