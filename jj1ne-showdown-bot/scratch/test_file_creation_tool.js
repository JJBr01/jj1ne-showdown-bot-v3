const fs = require('fs');
const path = require('path');
const LLM = require('../llm.js');
const WT = require('../web-tools.js');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

async function testFileTools() {
  console.log('1. Testing direct create_file...');
  const res1 = await WT.executeTool({
    name: 'create_file',
    input: { filePath: 'scratch/test_tool_created.txt', content: 'Hello from Coach file creation tool!' }
  });
  console.log('Result 1:', res1);

  console.log('\n2. Testing direct read_project_file...');
  const res2 = await WT.executeTool({
    name: 'read_project_file',
    input: { filePath: 'scratch/test_tool_created.txt' }
  });
  console.log('Result 2:', res2);

  console.log('\n3. Testing autonomous file creation by Claude...');
  const messages = [
    { role: 'user', content: 'Create a test file named "scratch/ai_coach_verification.txt" with the content "AI Coach now has full project file creation access verified." and confirm when done.' }
  ];

  const chatCfg = { ...(CFG.claude || {}), thinking: { coach: 0, turn: 0, preview: 0 } };
  const r = await LLM.callClaude(chatCfg, {
    role: 'coach',
    system: 'You are an autonomous VGC AI Coach. You have full filesystem write access via your create_file tool. Always call create_file when asked to create or save a file.',
    messages,
    tools: WT.TOOLS_DEFINITION,
    maxTokens: 1000,
    timeoutMs: 45000
  });

  if (r.toolCalls && r.toolCalls.length > 0) {
    console.log('Claude invoked tool:', r.toolCalls[0].name, r.toolCalls[0].input);
    const out = await WT.executeTool(r.toolCalls[0]);
    console.log('Tool execution output:', out);
    messages.push({ role: 'assistant', content: r.rawContent });
    messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: r.toolCalls[0].id, content: out }] });

    const r2 = await LLM.callClaude(chatCfg, {
      role: 'coach',
      system: 'You are an autonomous VGC AI Coach. Confirm file creation.',
      messages,
      maxTokens: 500,
      timeoutMs: 45000
    });
    console.log('Claude final response:', r2.text.trim());
  } else {
    console.log('Claude response without tool:', r.text);
  }
}

testFileTools().catch(console.error);
