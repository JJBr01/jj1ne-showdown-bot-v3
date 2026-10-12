const assert=require('assert');
const M=require('./update-meta.js');

assert.strictEqual(M.placementNumber('1st'),1);
assert.strictEqual(M.placementNumber('Top 16'),16);
assert.strictEqual(M.placementNumber('-'),null);
assert.deepStrictEqual([1,2,5,9,17].map(M.placementWeight),[8,5,3,2,1]);

const rows=[
  ['Team ID','Team Description','Pokepaste','1 Oct 2026','Tournament / Event','Rank'],
  ['MC1','winner','https://pokepast.es/aaaa','1 Oct 2026','Regional','1st'],
  ['MC2','top 16','https://pokepast.es/bbbb','30 Sep 2026','Regional','16th'],
  ['MC3','low','https://pokepast.es/cccc','30 Sep 2026','Regional','17th'],
  ['MC4','casual','https://pokepast.es/dddd','29 Sep 2026','-','']
];
const selected=M.selectTeamRows(rows,{maxPlacement:16,recentDays:0,minTeams:2});
assert.strictEqual(selected.rows.length,2);
assert.deepStrictEqual(selected.rows.map(x=>x.weight),[8,2]);

const paste=(item,move)=>`Rillaboom @ ${item}\nAbility: Grassy Surge\nEVs: 252 HP / 252 Atk\nAdamant Nature\n- ${move}\n- Protect\n\nIncineroar @ Safety Goggles\nAbility: Intimidate\nCareful Nature\n- Fake Out\n- Flare Blitz`;
const built=M.aggregateTeams([
  {...selected.rows[0],paste:paste('Assault Vest','Wood Hammer')},
  {...selected.rows[1],paste:paste('Miracle Seed','Grassy Glide')}
],'Champions M-C',selected.selection);
assert.strictEqual(built.db.rillaboom.item,'Assault Vest');
assert.strictEqual(built.db.rillaboom.variants.length,2);
assert.strictEqual(built.meta.usage[0].pct,100);
assert.strictEqual(built.teams[0].sets[0].moves[0],'Wood Hammer');
console.log('meta tests passed');