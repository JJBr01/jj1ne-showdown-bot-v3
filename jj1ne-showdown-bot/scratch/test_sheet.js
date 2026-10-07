// Test web-tools fetchers
const fs = require('fs');

async function testSheet() {
  const url = 'https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/edit#gid=0';
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = m ? m[1] : null;
  const gidM = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidM ? gidM[1] : null;

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`;
  console.log('Fetching:', csvUrl);

  const res = await fetch(csvUrl);
  const text = await res.text();
  console.log('Fetched text length:', text.length);
  const lines = text.split('\n').slice(0, 10);
  console.log('First 3 lines:\n', lines.slice(0, 3).join('\n'));
}

testSheet().catch(console.error);
