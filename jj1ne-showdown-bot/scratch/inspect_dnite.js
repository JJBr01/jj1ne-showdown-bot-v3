const fs = require('fs');
const path = require('path');
const cache = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/paste_cache.json'), 'utf8'));
const updateMeta = require('../update-meta.js');

for (const [url, paste] of Object.entries(cache)) {
  const mons = updateMeta.parsePaste(paste);
  for (const m of mons) {
    if (m.species === 'Dragonite') {
      console.log('--- URL:', url);
      console.log(m.species + ' @ ' + m.item + ' | Ability: ' + m.ability + ' | Nature: ' + m.nature);
      console.log('SP (HP/Atk/Def/SpA/SpD/Spe):', m.ev ? m.ev.join('/') : 'none');
      console.log('Moves:', m.moves.join(', '));
    }
  }
}
