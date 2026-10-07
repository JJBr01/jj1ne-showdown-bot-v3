const fs = require('fs');
const path = require('path');
const SmogonCalc = require('@smogon/calc');
const gen = SmogonCalc.Generations.get(9);

// Load Nerd of Now sets
const ncpFile = path.join(__dirname, '../tools/ncp-calc/script_res/setdex_ncp-g9.js');
const ncpCode = fs.readFileSync(ncpFile, 'utf8');
const box = {};
const fn = new Function('box', ncpCode + '\nbox.SETDEX_GEN9 = SETDEX_GEN9;');
fn(box);
const ncpSets = box.SETDEX_GEN9;

console.log('Testing calculation using Nerd of Now Rillaboom Assault Vest set...');
const rillaSet = ncpSets['Rillaboom']['Standard Assault Vest'];
console.log('Rillaboom set:', rillaSet);

const p1 = new SmogonCalc.Pokemon(gen, 'Charizard-Mega-Y', {
  level: 50,
  nature: 'Modest',
  evs: { spa: 252, spe: 252 },
  item: 'Charizardite Y'
});

const p2 = new SmogonCalc.Pokemon(gen, 'Rillaboom', {
  level: 50,
  nature: rillaSet.nature,
  item: rillaSet.item,
  evs: {
    hp: rillaSet.evs.hp,
    atk: rillaSet.evs.at,
    def: rillaSet.evs.df,
    spa: rillaSet.evs.sa,
    spd: rillaSet.evs.sd,
    spe: rillaSet.evs.sp
  }
});

const field = new SmogonCalc.Field({
  gameType: 'Doubles',
  weather: 'Sun'
});

const move = new SmogonCalc.Move(gen, 'Heat Wave');
const res = SmogonCalc.calculate(gen, p1, p2, move, field);

console.log('\nResult:');
console.log(res.desc());
