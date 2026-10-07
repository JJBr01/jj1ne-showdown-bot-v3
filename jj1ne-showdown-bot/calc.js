// Damage ranges via @smogon/calc (the Smogon damage calculator), converting the bot's battle state.
// Returns {min,max} in HP, or null if the Smogon calc can't handle this case (caller falls back to the Showdown engine).
// min is widened: also calcs against a max-HP/Def bulky variant so missed OHKOs are caught.
let C=null;try{C=require('@smogon/calc')}catch(e){C=null}
const gen=C?C.Generations.get(9):null;
const WX={sunnyday:'Sun',desolateland:'Harsh Sunshine',raindance:'Rain',primordialsea:'Heavy Rain',sandstorm:'Sand',snowscape:'Snow',snow:'Snow',hail:'Hail'};
const TR={electricterrain:'Electric',grassyterrain:'Grassy',psychicterrain:'Psychic',mistyterrain:'Misty'};
const ST={brn:'brn',par:'par',psn:'psn',tox:'tox',slp:'slp',frz:'frz'};
const sp2ev=v=>Math.min(252,Math.max(0,(v|0)*8)); // Champions Stat Points -> EVs (1 SP = 8 EVs, capped 252)
// Build a Smogon calc Pokemon from the shadow battle mon.
// evOverride: optional {stat: evValue} in standard EV units (0-252) to build bulky/frail variants.
// Uses m.item / m.getAbility() (live battle-state values updated in real-time by handleLine)
// so revealed items/abilities automatically improve calc accuracy for subsequent turns.
function toCalcMon(battle,m,evOverride){const set=m.set||{};const raw=set.evs||{};
  const evs={
    hp:sp2ev(raw.hp),
    atk:sp2ev(raw.atk!==undefined?raw.atk:raw.at),
    def:sp2ev(raw.def!==undefined?raw.def:raw.df),
    spa:sp2ev(raw.spa!==undefined?raw.spa:raw.sa),
    spd:sp2ev(raw.spd!==undefined?raw.spd:raw.sd),
    spe:sp2ev(raw.spe!==undefined?raw.spe:raw.sp)
  };
  if(m.evOverride)for(const k of Object.keys(m.evOverride)){const stat=k==='df'?'def':k==='sd'?'spd':k==='sa'?'spa':k==='sp'?'spe':k==='at'?'atk':k;evs[stat]=Math.min(252,Math.max(0,m.evOverride[k]|0));}
  if(evOverride)for(const k of Object.keys(evOverride)){const stat=k==='df'?'def':k==='sd'?'spd':k==='sa'?'spa':k==='sp'?'spe':k==='at'?'atk':k;evs[stat]=Math.min(252,Math.max(0,evOverride[k]|0));}
  const item=m.item?battle.dex.items.get(m.item).name:'';const ab=m.getAbility?m.getAbility().name:(set.ability||'');
  const p=new C.Pokemon(gen,m.species.name,{level:m.level||50,nature:set.nature||'Serious',evs,item,ability:ab,boosts:{...m.boosts},status:ST[m.status]||''});
  if(!p.species||!p.species.baseStats)throw new Error('species');p.originalCurHP=Math.max(0,Math.min(p.maxHP(),Math.round(p.maxHP()*m.hp/m.maxhp)));return p}
function sideOf(s){const c=s.sideConditions||{};return new C.Side({isReflect:!!c.reflect,isLightScreen:!!c.lightscreen,isAuroraVeil:!!c.auroraveil,isTailwind:!!c.tailwind,isFriendGuard:false})}
// Flatten the Smogon calc damage array (handles multi-hit moves) and return raw numbers.
function extractNums(r){const d=r.damage;let arr=Array.isArray(d)?d:[d];if(Array.isArray(arr[0]))arr=arr.map(x=>Array.isArray(x)?x.reduce((s,v)=>s+v,0):x);return arr.flat().filter(x=>typeof x==='number')}
function smogonRange(battle,a,t,id,spread){if(!C)return null;try{
  const mv=battle.dex.moves.get(id);const isSpreadMove=['allAdjacentFoes','allAdjacent'].includes(mv.target);
  const f=battle.field;const field=new C.Field({gameType:(isSpreadMove&&!spread)?'Singles':'Doubles',weather:WX[f.weather]||undefined,terrain:TR[f.terrain]||undefined,isMagicRoom:!!f.pseudoWeather.magicroom,isWonderRoom:!!f.pseudoWeather.wonderroom,isGravity:!!f.pseudoWeather.gravity,
    attackerSide:sideOf(a.side),defenderSide:sideOf(t.side)});
  const A=toCalcMon(battle,a),D=toCalcMon(battle,t);const move=new C.Move(gen,mv.name);if(!move||!move.bp&&move.category!=='Status'&&!move.named)return null;
  // --- Base calc: assumed/VGCPastes-average set (or exact OTS EVs when provided) ---
  const nums=extractNums(C.calculate(gen,A,D,move,field));if(!nums.length)return null;
  const scale=t.maxhp/D.maxHP(); // convert Smogon HP units -> shadow-battle HP units (≈1 when EVs match)
  let lo=Math.floor(Math.min(...nums)*scale),hi=Math.floor(Math.max(...nums)*scale);
  // --- Bulky variant: also calc against max HP + max Def (physical) or max SpD (special) ---
  // This lowers 'lo' so the bot doesn't overcommit to an OHKO that misses a tanky opponent.
  // 'hi' stays from the base calc (the frail direction is already covered by average-EV set).
  try{
    const isSp=move.category==='Special';
    const Dbulky=toCalcMon(battle,t,{hp:252,[isSp?'spd':'def']:252});
    const bulkyNums=extractNums(C.calculate(gen,A,Dbulky,move,field));
    if(bulkyNums.length){
      // bScale adjusts for the bulky mon's larger maxHP so damage is expressed in shadow-HP units.
      const bScale=t.maxhp/Dbulky.maxHP();
      lo=Math.min(lo,Math.floor(Math.min(...bulkyNums)*bScale));
    }
  }catch(e){}
  return {min:lo,max:hi,src:'smogon'}}catch(e){return null}}
module.exports={smogonRange,available:!!C};
