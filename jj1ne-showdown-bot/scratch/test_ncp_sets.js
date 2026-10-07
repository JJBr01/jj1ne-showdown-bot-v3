const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../tools/ncp-calc/script_res/setdex_ncp-g9.js');
const content = fs.readFileSync(filePath, 'utf8');

// Parse var SETDEX_GEN9 = { ... };
const sandbox = {};
const fn = new Function('sandbox', content + '\nsandbox.SETDEX_GEN9 = SETDEX_GEN9;');
fn(sandbox);

const keys = Object.keys(sandbox.SETDEX_GEN9 || {});
console.log(`Loaded ${keys.length} Pokémon from Nerd of Now VGC Setdex!`);
console.log('Sample Pokémon:', keys.slice(0, 10).join(', '));

// Check Rillaboom and Incineroar
if (sandbox.SETDEX_GEN9['Rillaboom']) {
  console.log('\nRillaboom Sets in Nerd of Now:');
  console.log(JSON.stringify(sandbox.SETDEX_GEN9['Rillaboom'], null, 2));
}
if (sandbox.SETDEX_GEN9['Incineroar']) {
  console.log('\nIncineroar Sets in Nerd of Now:');
  console.log(JSON.stringify(sandbox.SETDEX_GEN9['Incineroar'], null, 2));
}
