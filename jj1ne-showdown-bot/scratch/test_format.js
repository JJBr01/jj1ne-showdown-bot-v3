const WT = require('../web-tools.js');
const fs = require('fs');

async function test() {
  const res = await fetch('https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/gviz/tq?tqx=out:csv&sheet=Champions%20M-C');
  const t = await res.text();
  const rows = WT.parseCSV(t);
  let headerIdx = rows.findIndex(r => r.includes('Team ID'));
  const header = rows[headerIdx];
  const idIdx = header.indexOf('Team ID');
  const nameIdx = header.indexOf('Full Name');
  const eventIdx = header.indexOf('Tournament / Event');
  const rankIdx = header.indexOf('Rank');
  const pasteIdx = header.indexOf('Pokepaste');
  const pokeIdx = header.indexOf('Pokemon Text for Copypasta');

  const countMap = {};
  const tableRows = [];
  for (const r of rows.slice(headerIdx + 1, headerIdx + 30)) {
    if (!r[idIdx] || !r[idIdx].startsWith('MC')) continue;
    const mons = r.slice(pokeIdx, pokeIdx + 6).filter(Boolean);
    for (const m of mons) countMap[m] = (countMap[m] || 0) + 1;
    tableRows.push(`| ${r[idIdx]} | ${r[nameIdx]} | ${r[eventIdx]} | ${r[rankIdx]} | ${mons.join(', ')} | ${r[pasteIdx]} |`);
  }
  const top = Object.entries(countMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([m,c])=>`${m} (${c})`).join(', ');
  console.log('Top Mons in sample:\n', top);
  console.log('\nSample Rows:\n', tableRows.slice(0, 5).join('\n'));
}

test().catch(console.error);
