const fs = require('fs');
const path = require('path');
const WT = require('../web-tools.js');
const LLM = require('../llm.js');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8'));

async function testAgent() {
  console.log('Testing live VGCPastes fetch directly:');
  const vgc = await WT.fetchGoogleSheet('https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/gviz/tq?tqx=out:csv&sheet=Champions%20M-C', 'VGCPastes_Champions');
  console.log('Fetched rows:', vgc.rowsCount, 'Saved to:', vgc.savedPath);
}

testAgent().catch(console.error);
