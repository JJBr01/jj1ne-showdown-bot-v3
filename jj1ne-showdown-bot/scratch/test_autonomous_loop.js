const fs = require('fs');
const path = require('path');
const LLM = require('../llm.js');
const WT = require('../web-tools.js');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

async function testAutonomousWeb() {
  const query = "What is the official spreadsheet ID for the VGCPastes repository, and what are the top 3 Pokemon listed on the live Champions M-C sheet? Use your live VGCPastes tool.";
  
  const messages = [
    { role: 'user', content: query }
  ];

  console.log('Sending question to Claude with autonomous web tools...');
  const chatCfg = { ...(CFG.claude || {}), thinking: { coach: 0, turn: 0, preview: 0 } };
  
  let r = await LLM.callClaude(chatCfg, {
    role: 'coach',
    system: 'You are an autonomous VGC AI Coach. You have tools to search the live web, fetch live Google Sheets, and fetch the live VGCPastes repository. Always use your tools whenever you need live data.',
    messages,
    tools: WT.TOOLS_DEFINITION,
    maxTokens: 1000,
    timeoutMs: 45000
  });

  console.log('Initial stop reason:', r.stopReason);
  if (r.toolCalls && r.toolCalls.length) {
    console.log(`Claude invoked ${r.toolCalls.length} tool(s):`, r.toolCalls.map(t => t.name));
    
    // Append assistant's tool-calling message
    messages.push({ role: 'assistant', content: r.rawContent });

    // Execute each tool and return tool_result
    const toolResults = [];
    for (const tc of r.toolCalls) {
      console.log(`Executing tool "${tc.name}" with input:`, tc.input);
      const res = await WT.executeTool(tc);
      console.log(`Tool "${tc.name}" execution complete. Output length:`, res.length);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tc.id,
        content: res
      });
    }

    // Append tool results to messages
    messages.push({ role: 'user', content: toolResults });

    console.log('Sending tool results back to Claude for final synthesis...');
    r = await LLM.callClaude(chatCfg, {
      role: 'coach',
      system: 'You are an autonomous VGC AI Coach. Answer the user based on the tool results.',
      messages,
      maxTokens: 1000,
      timeoutMs: 45000
    });
  }

  console.log('\nFINAL RESPONSE:\n', r.text);
}

testAutonomousWeb().catch(console.error);
