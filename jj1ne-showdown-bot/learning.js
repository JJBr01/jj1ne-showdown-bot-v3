// Learning: (1) team-preview plan selection per opponent archetype (Thompson sampling),
// (2) opponent set learning from revealed info / Open Team Sheets, (3) per-game reports + running stats.
const fs=require('fs');const path=require('path');
const DIR=process.env.BOT_DATA||path.join(__dirname,'data');if(!fs.existsSync(DIR))fs.mkdirSync(DIR,{recursive:true});
const REPORTS=process.env.BOT_REPORTS||path.join(__dirname,'reports');if(!fs.existsSync(REPORTS))fs.mkdirSync(REPORTS,{recursive:true});
const F={plans:path.join(DIR,'learning_plans.json'),sets:path.join(DIR,'learned_sets.json'),stats:path.join(DIR,'stats.json')};
const load=(f,d)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){return d}};const save=(f,o)=>fs.writeFileSync(f,JSON.stringify(o,null,1));
const toID=s=>(''+s).toLowerCase().replace(/[^a-z0-9]/g,'');
// ---------- (1) preview plans ----------
const ARMS=['Charizard|zw','Charizard|zk','Charizard|zg','Dragonite|zw','Dragonite|zk','Dragonite|zg'];
function classify(oppSets,dex){const ids=oppSets.map(s=>toID(dex.species.get(s.species).baseSpecies||s.species));const has=x=>ids.includes(x);
  const tr=oppSets.some(s=>(s.moves||[]).some(m=>toID(m)==='trickroom'));
  // Psychic Terrain + Expanding Force teams first (Indeedee): they beat our grounded Pokémon and block Fake Out
  const ef=oppSets.some(s=>(s.moves||[]).some(m=>toID(m)==='expandingforce'));if((has('indeedee')||oppSets.some(s=>toID(s.ability)==='psychicsurge'))&&ef)return 'psyterrain';
  // Trick Room teams next (they're usually built around it even when a weather setter is present)
  const trSpecies=['indeedee','armarouge','farigiraf','hatterene','sinistcha','dusclops','porygon2','cresselia','oranguru','bronzong','mimikyu','stakataka','gallade','gardevoir','slowbro','reuniclus'];
  const setters=oppSets.filter(s=>(s.moves||[]).some(m=>toID(m)==='trickroom')||trSpecies.includes(toID(dex.species.get(s.species).baseSpecies||s.species))&&(s.moves||[]).some(m=>toID(m)==='trickroom'));
  const slowNukes=['torkoal','camerupt','armarouge','hatterene','ursaluna','amoonguss','iron hands','glastrier'].map(toID);
  if(setters.length>=2||(setters.length>=1&&(has('indeedee')||oppSets.some(s=>slowNukes.includes(toID(dex.species.get(s.species).baseSpecies||s.species))))))return 'trickroom';
  if(has('raichu')&&(has('staraptor')||ids.includes('arcanine')&&oppSets.some(s=>/hisui/i.test(s.species))))return 'raichu-staraptor';
  if(has('pelipper')||has('politoed'))return 'rain';if(has('torkoal')||has('charizard')&&oppSets.some(s=>/Charizardite Y/.test(s.item||'')))return 'sun';
  if(has('tyranitar')||has('hippowdon'))return 'sand';if(oppSets.some(s=>toID(s.ability)==='snowwarning'))return 'snow';if(tr)return 'trickroom';return 'standard'}
function prior(arch,arm){
  if(arch==='trickroom'){
    if(arm==='Dragonite|zk')return [9,1];
    if(arm==='Charizard|zk')return [7,3];
    if(arm.endsWith('zw'))return [2,8];
    return [4,6];
  }
  if(arch==='psyterrain'){
    if(arm==='Charizard|zk')return [8,2];
    if(arm==='Dragonite|zk')return [7,3];
    if(arm.endsWith('zw'))return [3,7];
    return [4,6];
  }
  if(arch==='sand'){
    if(arm==='Dragonite|zg')return [9,1];
    if(arm==='Charizard|zg')return [6,4];
    if(arm.endsWith('zw'))return [2,8];
    return [4,6];
  }
  if(arch==='raichu-staraptor'){
    if(arm==='Charizard|zg'||arm==='Dragonite|zg')return [8,2];
    if(arm==='Charizard|zw')return [6,4];
    return [4,6];
  }
  if(arch==='rain'){
    if(arm==='Dragonite|zw')return [8,2];
    if(arm==='Charizard|zw')return [5,5];
    return [4,6];
  }
  if(arch==='sun'){
    if(arm==='Charizard|zw')return [9,1];
    return [4,6];
  }
  if(arm==='Dragonite|zw')return [8,2];
  if(arm==='Charizard|zw')return [7,3];
  return [5,5];
}
function gammaS(k){if(k<1)return gammaS(k+1)*Math.pow(Math.random(),1/k);const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{const u1=Math.random(),u2=Math.random();x=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);v=1+c*x}while(v<=0);v=v*v*v;const u=Math.random();if(u<1-0.0331*x**4||Math.log(u)<0.5*x*x+d*(1-v+Math.log(v)))return d*v}}
const betaS=(a,b)=>{const x=gammaS(a);return x/(x+gammaS(b))};
function choosePlan(arch){const P=load(F.plans,{});const st=P[arch]||{};let best=null;
  for(const arm of ARMS){
    const [a0,b0]=prior(arch,arm);
    const r=st[arm]||(arm.endsWith('zk')?st[arm.replace('zk','zf')]:null)||{w:0,l:0};
    const s=betaS(a0+r.w,b0+r.l);
    if(!best||s>best.s)best={arm,s};
  }
  const [mega,lead]=best.arm.split('|');return {mega,lead,arm:best.arm}}
function updatePlan(arch,arm,win){const P=load(F.plans,{});P[arch]=P[arch]||{};const a=arm.replace('zf','zk');const r=P[arch][a]=P[arch][a]||{w:0,l:0};win?r.w++:r.l++;save(F.plans,P)}
function planTable(){const P=load(F.plans,{});const out=[];for(const [arch,st] of Object.entries(P))for(const arm of ARMS){const r=st[arm];if(r)out.push({arch,arm,games:r.w+r.l,winRate:r.w/(r.w+r.l)})}return out}
// ---------- (2) learned sets ----------
function learnedSets(){return load(F.sets,{})}
function recordSets(seen){const L=load(F.sets,{});for(const [id,o] of Object.entries(seen)){const e=L[id]=L[id]||{games:0,moves:{},items:{},abilities:{},natures:{},ots:0};e.games++;
  for(const m of o.moves)e.moves[m]=(e.moves[m]||0)+1;if(o.item)e.items[o.item]=(e.items[o.item]||0)+1;if(o.ability)e.abilities[o.ability]=(e.abilities[o.ability]||0)+1;if(o.nature)e.natures[o.nature]=(e.natures[o.nature]||0)+1;if(o.ots)e.ots++}save(F.sets,L)}
// merge: DB set + learned ladder data (weighted 3x once >=3 games)
function mergeSet(base,learned,dex){if(!learned||learned.games<3)return base;const s={...base};
  const freq={};for(const [m,c] of Object.entries(base.moveFreq||{}))freq[toID(m)]={name:m,c:c/Math.max(1,base.n||1)};
  for(const [m,c] of Object.entries(learned.moves)){const k=toID(m);freq[k]=freq[k]||{name:dex.moves.get(m).name||m,c:0};freq[k].c+=3*c/learned.games}
  s.moves=Object.values(freq).sort((a,b)=>b.c-a.c).slice(0,4).map(x=>x.name);
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1])[0];const ti=top(learned.items),ta=top(learned.abilities),tn=top(learned.natures||{});
  if(ti&&ti[1]>=2)s.item=ti[0];if(ta&&ta[1]>=2)s.ability=ta[0];if(tn&&tn[1]>=2)s.nature=tn[0];s.learned=true;return s}
// ---------- (3) reports + stats ----------
function writeReport(r){const fname=path.join(REPORTS,`${r.time.replace(/[:.]/g,'-')}_${r.result}_${toID(r.opponent)}.md`);
  const pct=x=>(100*x).toFixed(0)+'%';const L=[];
  L.push(`# ${r.result==='W'?'WIN':r.result==='L'?'LOSS':'TIE'} vs ${r.opponent} — ${r.turns} turns`,`${r.time} · ${r.battle}${r.replay?` · [replay](${r.replay})`:''}`,'');
  if(r.battleLog)L.push(`Full battle log: battlelogs/${r.battleLog}`,'');
  const leadDesc=r.plan.lead==='zk'?'Kingambit':(r.plan.lead==='zg'?'Garchomp':(r.plan.lead==='zw'?'Tailwind (Whimsicott)':'Fake Out'));
  L.push(`**Opponent archetype:** ${r.arch}  ·  **Plan:** Mega ${r.plan.mega}, ${leadDesc} lead  ·  **Brought:** ${(r.picked||[]).join(', ')}`);
  L.push(`**Opponent team:** ${r.oppTeam.join(', ')}  ·  **Opp brought:** ${[...new Set(r.oppBrought)].join(', ')}${r.ots?'  ·  Open Team Sheets: yes':''}`,'');
  L.push('## KO timeline');for(const k of r.kos)L.push(`- T${k.turn}: **${k.mon}** (${k.side==='me'?'ours':'theirs'}) fainted${k.by?` — last hit by ${k.by}`:''}`);if(!r.kos.length)L.push('- none');
  L.push('',`**First KO:** ${r.firstKO||'n/a'} · **Tailwind turns:** us ${r.tailwind.me}, them ${r.tailwind.opp} · **Our Mega evolved:** ${r.megaTurn!=null?'turn '+r.megaTurn:'no'}`,'');
  L.push('## Biggest hits');for(const h of r.bigHits.slice(0,8))L.push(`- T${h.turn}: ${h.by} → ${h.target}: ${pct(h.pct)}`);if(!r.bigHits.length)L.push('- none ≥40%');
  L.push('','## Damage dealt by our Pokémon');for(const [m,v] of Object.entries(r.dealt).sort((a,b)=>b[1]-a[1]))L.push(`- ${m}: ${pct(v)} total (KOs: ${r.ourKOs[m]||0})`);
  L.push('','## Damage-calc checks (our attacks: predicted range vs actual)');const miss=r.calcChecks.filter(c=>!c.inRange);
  L.push(`- ${r.calcChecks.length} checked, ${r.calcChecks.length-miss.length} inside the predicted range, ${miss.length} outside`);
  for(const c of miss.slice(0,8))L.push(`  - T${c.turn} ${c.who} ${c.move} → ${c.target}: predicted ${pct(c.min)}–${pct(c.max)}, actual ${pct(c.actual)} ${c.actual>c.max?'(more bulk/boost/crit? → their set may differ)':'(more bulk than assumed?)'}`);
  if(r.llm){L.push('',`## Claude pilot — ${r.llm.calls} calls, ${r.llm.used} used, ${r.llm.override} overrides of the engine, ${r.llm.fallback} fallbacks`);for(const n of r.llm.notes.slice(0,40))L.push('- '+n)}
  L.push('','## Opponent info revealed this game');for(const [sp,o] of Object.entries(r.revealed))L.push(`- ${sp}: ${[o.item&&'@ '+o.item,o.ability&&'('+o.ability+')',o.moves.length&&o.moves.join(' / ')].filter(Boolean).join(' ')}`);
  fs.writeFileSync(fname,L.join('\n'));return fname}
function updateStats(r){const S=load(F.stats,{games:0,wins:0,byArch:{},byPlan:{},ourFaints:{},ourKOs:{},killers:{},firstKO:{us:{w:0,g:0},them:{w:0,g:0}},calc:{checked:0,inRange:0},avgTurns:0});
  const W=r.result==='W'?1:0;S.games++;S.wins+=W;S.avgTurns=((S.avgTurns*(S.games-1))+r.turns)/S.games;
  const inc=(o,k,w)=>{o[k]=o[k]||{w:0,g:0};o[k].g++;o[k].w+=w};inc(S.byArch,r.arch,W);inc(S.byPlan,r.arch+' / '+r.plan.arm,W);
  for(const k of r.kos){if(k.side==='me'){S.ourFaints[k.mon]=(S.ourFaints[k.mon]||0)+1;if(k.by)S.killers[k.by]=(S.killers[k.by]||0)+1}}
  for(const [m,n] of Object.entries(r.ourKOs))S.ourKOs[m]=(S.ourKOs[m]||0)+n;
  if(r.firstKO){const who=r.firstKO.startsWith('ours')?'them':'us';S.firstKO[who].g++;S.firstKO[who].w+=W}
  S.calc.checked+=r.calcChecks.length;S.calc.inRange+=r.calcChecks.filter(c=>c.inRange).length;save(F.stats,S);return S}
module.exports={classify,choosePlan,updatePlan,planTable,learnedSets,recordSets,mergeSet,writeReport,updateStats,DIR,REPORTS};
