// Pilots: greedy (old) and wolfe (rule-based upgrade). Both get (battle, sideId, req, mem) and return a choice string.
const {Pokemon}=require('./ps/dist/sim/pokemon');
const toID=s=>(''+s).toLowerCase().replace(/[^a-z0-9]/g,'');
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const PROTECT=['protect','detect','spikyshield','banefulbunker','kingsshield','silktrap'];
const DROPPERS=['dracometeor','overheat','leafstorm','closecombat','makeitrain','fleurcannon','psychoboost'];
function rawDmg(battle,a,t,id,spread){try{const am=battle.dex.getActiveMove(id);if(spread)am.spreadHit=true;const d=battle.actions.getDamage(a,t,am,true);return typeof d==='number'?d:0}catch(e){return 0}}
// Full damage range like the Smogon calc: min = 85% roll, max = 100% roll, no crits.
const CALC=(()=>{try{return require('./calc.js')}catch(e){return null}})();
function dmgR(battle,a,t,id,spread){if(W.calc!=='engine'&&CALC&&CALC.available){const r=CALC.smogonRange(battle,a,t,id,spread);if(r){W.calcStats.smogon++;return {min:r.min,max:r.max,avg:(r.min+r.max)/2,src:'smogon'}}W.calcStats.engine++}return engR(battle,a,t,id,spread)}
function engR(battle,a,t,id,spread){const b=battle;const hadR=Object.prototype.hasOwnProperty.call(b,'randomizer'),hadC=Object.prototype.hasOwnProperty.call(b,'randomChance');
  b.randomChance=()=>false;let min=0,max=0;try{b.randomizer=d=>Math.floor(d*85/100);min=rawDmg(b,a,t,id,spread);b.randomizer=d=>d;max=rawDmg(b,a,t,id,spread)}finally{if(!hadR)delete b.randomizer;if(!hadC)delete b.randomChance}
  return {min,max,avg:(min+max)/2}}
function koP(r,hp){if(hp<=0)return 0;if(r.min>=hp)return 1;if(r.max<hp)return 0;return (r.max-hp+1)/(r.max-r.min+1)}
function isSpreadNow(battle,a,id){const mv=battle.dex.moves.get(id);if(!['allAdjacentFoes','allAdjacent'].includes(mv.target))return false;try{const n=a.side.foe.active.filter(x=>x&&!x.fainted).length+(mv.target==='allAdjacent'?a.side.active.filter(x=>x&&!x.fainted&&x!==a).length:0);return n>1}catch(e){return false}}
function dmg(battle,a,t,id){return dmgR(battle,a,t,id,isSpreadNow(battle,a,id)).avg}
function this_turn_key(b){return String(b.turn)}
function dmgMoves(battle,mon){return mon.moveSlots.map(m=>m.id).filter(id=>battle.dex.moves.get(id).category!=='Status')}
function bestDmg(battle,a,t){let b=0;for(const id of dmgMoves(battle,a))b=Math.max(b,dmg(battle,a,t,id));return b}
function bestR(battle,a,t){let b={min:0,max:0,avg:0};for(const id of dmgMoves(battle,a)){const r=dmgR(battle,a,t,id,isSpreadNow(battle,a,id));if(r.avg>b.avg)b=r}return b}
function spe(mon){try{return mon.getActionSpeed()}catch(e){return mon.getStat('spe')}}
// ---------------- GREEDY (unchanged behaviour) ----------------
function greedy(battle,side,req,mem){
  if(req.teamPreview){const sets=battle.sides[side==='p1'?0:1].pokemon.map(p=>p.set);const megas=sets.map((s,i)=>battle.dex.items.get(s.item).megaStone?i:-1).filter(i=>i>=0);const others=sets.map((_,i)=>i).filter(i=>!megas.includes(i));
    let m=megas.length?[sets.forceMega?megas.find(i=>sets[i].species===sets.forceMega):rnd(megas)]:[];if(mem.forceMega)m=[megas.find(i=>sets[i].species===mem.forceMega)];
    const four=shuffle([...m,...shuffle(others).slice(0,4-m.length)]);mem.mega=m.length?sets[m[0]].species:'none';return 'team '+four.map(i=>i+1).join('')}
  if(req.wait)return null;const me=battle.sides[side==='p1'?0:1],foe=me.foe;
  if(req.forceSwitch)return forced(battle,req,me,false);
  let megaUsed=false;mem.lp=mem.lp||{};
  return req.active.map((act,i)=>{const mon=me.active[i];if(!mon||mon.fainted||req.side.pokemon[i].condition.endsWith(' fnt'))return 'pass';
    const foes=foe.active.filter(f=>f&&!f.fainted);const ally=me.active[1-i];let threat=0;for(const f of foes)threat=Math.max(threat,bestDmg(battle,f,mon));
    let best={score:-1,cmd:'move 1'};
    act.moves.forEach((m,k)=>{if(m.disabled)return;const mv=battle.dex.moves.get(m.id);let sc=0,tgt='';const needsFoe=['normal','any','adjacentFoe'].includes(mv.target);
      if(PROTECT.includes(mv.id))sc=(threat>=mon.hp&&!mem.lp[i])?0.95:0.02;
      else if(mv.id==='tailwind')sc=me.sideConditions.tailwind?0:0.9;
      else if(mv.id==='trickroom')sc=battle.field.pseudoWeather.trickroom?0:0.6;
      else if(mv.id==='fakeout'){if(mon.activeTurns>0)sc=0;else{sc=0.7;tgt=' '+(Math.random()<.5?1:2)}}
      else if(mv.id==='followme'||mv.id==='ragepowder'){let at=0;if(ally&&!ally.fainted)for(const f of foes)at=Math.max(at,bestDmg(battle,f,ally)/ally.hp);sc=(ally&&!ally.fainted)?Math.min(0.9,0.25+0.6*at):0}
      else if(['recover','roost','lifedew','slackoff'].includes(mv.id))sc=(mon.hp/mon.maxhp<0.5&&threat<mon.maxhp*0.5)?0.85:0.03;
      else if(mv.id==='coil')sc=(mon.boosts.def<2&&mon.hp/mon.maxhp>0.6)?0.35:0.02;
      else if(mv.id==='helpinghand'){if(!ally||ally.fainted)return;sc=0.4;tgt=' -'+(2-i)}
      else if(mv.category==='Status'){if(['adjacentAlly','adjacentAllyOrSelf'].includes(mv.target))return;sc=['followme','ragepowder','partingshot','auroraveil','reflect','lightscreen','sleeppowder','yawn','hypnosis','willowisp'].includes(mv.id)?0.3:0.12;if(needsFoe)tgt=' '+(Math.random()<.5?1:2)}
      else{const val=t=>{const d=dmg(battle,mon,t,mv.id);return (Math.min(d,t.hp)/t.maxhp+(d>=t.hp?0.6:0))*(mv.accuracy===true?1:mv.accuracy/100)};
        if(['allAdjacentFoes','allAdjacent'].includes(mv.target)){sc=foes.reduce((a,f)=>a+val(f),0);if(mv.target==='allAdjacent'&&ally&&!ally.fainted)sc-=1.3*val(ally)}
        else if(needsFoe){let bt=0,bv=-1;foe.active.forEach((f,fi)=>{if(!f||f.fainted)return;const v=val(f);if(v>bv){bv=v;bt=fi}});sc=bv;tgt=' '+(bt+1)}else sc=0.1}
      if(needsFoe&&!tgt)tgt=' 1';sc+=Math.random()*0.05;if(sc>best.score)best={score:sc,cmd:`move ${k+1}${tgt}`,id:mv.id}});
    mem.lp[i]=PROTECT.includes(best.id);let cmd=best.cmd;if(act.canMegaEvo&&!megaUsed){cmd+=' mega';megaUsed=true}return cmd}).join(', ');
}
function forced(battle,req,me,smart){const ch=new Set();const foes=me.foe.active.filter(f=>f&&!f.fainted);
  return req.forceSwitch.map(f=>{if(!f)return 'pass';const opts=req.side.pokemon.map((p,j)=>({p,j})).filter(({p,j})=>!p.active&&!p.condition.endsWith(' fnt')&&!ch.has(j));if(!opts.length)return 'pass';
    let pick=opts[0];if(smart){let bv=-1e9;for(const o of opts){const mon=me.pokemon[o.j];let v=0;for(const fo of foes){v+=Math.min(1,bestDmg(battle,mon,fo)/fo.hp)-0.8*Math.min(1,bestDmg(battle,fo,mon)/mon.hp)+(spe(mon)>spe(fo)?0.15:0)}v+=0.3*mon.hp/mon.maxhp;if(v>bv){bv=v;pick=o}}}
    ch.add(pick.j);return 'switch '+(pick.j+1)}).join(', ')}
// ---------------- WOLFE ----------------
function megaClone(battle,side,set){const st=battle.dex.items.get(set.item);if(!st.megaStone)return null;let forme=st.megaStone;if(typeof forme==='object')forme=Object.values(forme)[0];try{return new Pokemon({...set,species:forme,ability:battle.dex.species.get(forme).abilities[0]},side)}catch(e){return null}}
let TACTICS=null;
function getTactics(){try{delete require.cache[require.resolve('./tactics.js')];TACTICS=require('./tactics.js')}catch(e){if(!TACTICS)TACTICS={}}return TACTICS}
function previewWolfe(battle,side,mem){
  const me=battle.sides[side==='p1'?0:1],foe=me.foe;const mine=me.pokemon,theirs=foe.pokemon;
  const sets=mine.map(p=>p.set);
  const forms=mine.map((p,i)=>megaClone(battle,me,sets[i])||p);const theirF=theirs.map((p)=>megaClone(battle,foe,p.set)||p);
  const isMega=i=>battle.dex.items.get(sets[i].item).megaStone;
  const foeIntim=theirs.some(p=>p.set.ability==='Intimidate');
  const WX={drought:'sunnyday',drizzle:'raindance',sandstream:'sandstorm',snowwarning:'snowscape'};
  const withWx=(id,fn)=>{if(!id)return fn();const f=battle.field,ow=f.weather,os=f.weatherState;f.weather=id;f.weatherState={id};try{return fn()}finally{f.weather=ow;f.weatherState=os}};
  const val=i=>withWx(WX[forms[i].getAbility().id],()=>val0(i));
  const val0=i=>{const m=forms[i];let v=0;for(const o of theirF){const off=Math.min(1.3,bestDmg(battle,m,o)/o.maxhp),def=Math.min(1.3,bestDmg(battle,o,m)/m.maxhp);v+=off-0.7*def+(spe(m)>spe(o)?0.2:-0.05)}v/=theirF.length;
    const ids=mine[i].moveSlots.map(x=>x.id);if(ids.includes('tailwind'))v+=0.3;if(ids.includes('fakeout'))v+=0.2;if(ids.includes('followme')||ids.includes('ragepowder'))v+=0.15;
    if(mine[i].set.ability==='Competitive'&&foeIntim)v+=0.2;if(mine[i].set.ability==='Intimidate'&&theirs.some(p=>['Defiant','Competitive'].includes(p.set.ability)))v-=0.15;return v};
  const V=mine.map((_,i)=>val(i));if(W.debug)console.log('V',mine.map((p,i)=>p.name+':'+V[i].toFixed(2)).join(' '));
  const megas=mine.map((_,i)=>i).filter(isMega),others=mine.map((_,i)=>i).filter(i=>!isMega(i));
  if(W.pmode&&W.pmode!=='value'){let zi=megas.find(i=>sets[i].species==='Charizard')??megas[0];
    if(mem.plan&&mem.plan.mega){const mi=megas.find(i=>sets[i].species===mem.plan.mega);if(mi!=null)zi=mi}
    let mode=mem.plan&&mem.plan.lead?mem.plan.lead:W.pmode;
    try{const T=getTactics();if(T&&T.getLeadPreference){const pref=T.getLeadPreference(mem.plan&&mem.plan.arch||'standard',theirs.map(p=>p.set));if(pref&&pref.lead)mode=pref.lead}}catch(e){}
    if(mode==='adaptive'){
      const th=theirs.map(p=>p.set);
      const isRaichu=th.some(x=>/Raichunite/.test(x.item))&&th.some(x=>/Staraptite/.test(x.item)||/Arcanine-Hisui/.test(x.species)||x.species==='arcanine-hisui');
      const isTR=th.some(x=>(x.moves||[]).some(m=>toID(m)==='trickroom'));
      mode=isTR?'zk':(isRaichu?'zg':'zw');
    }
    let leadPartner;
    if(mode==='zk'||mode==='zf'){
      leadPartner=others.find(i=>/kingambit/i.test(mine[i].species.name))??others[0];
    }else if(mode==='zg'){
      leadPartner=others.find(i=>/garchomp/i.test(mine[i].species.name))??others[0];
    }else{
      const tw=others.filter(i=>mine[i].moveSlots.some(m=>m.id==='tailwind'));
      leadPartner=tw[0]??others[0];
    }
    const rest=others.filter(i=>i!==leadPartner&&!(mem.avoid||[]).includes(mine[i].species.name)).sort((a,b)=>V[b]-V[a]);
    let four=[zi,leadPartner,...rest].slice(0,4);
    const pref=(mem.leadPref||[]).map(n=>mine.findIndex(p=>p.species.name===n)).filter(i=>i>=0&&!four.includes(i));
    if(pref.length)four=[...four.slice(0,3),pref[0]];
    let lead;const lp=(mem.leadPref||[]).map(n=>four.find(i=>mine[i].species.name===n)).find(i=>i!=null);
    if(lp!=null){lead=[lp,zi]}else{lead=[leadPartner,zi]}
    const order=[...lead,...four.filter(k=>!lead.includes(k))];mem.mega=sets[zi].species;mem.picked=order.map(i=>mine[i].name);mem.leadMode=mode;return 'team '+order.map(i=>i+1).join('')}
  let mega=megas.length?megas.reduce((a,b)=>V[a]>=V[b]?a:b):null;if(mem.forceMega)mega=megas.find(i=>sets[i].species===mem.forceMega);
  const rest=others.sort((a,b)=>V[b]-V[a]).slice(0,mega==null?4:3);const four=mega==null?rest:[mega,...rest];
  // lead pair
  let best=null;for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){const x=four[a],y=four[b];const ix=mine[x].moveSlots.map(m=>m.id),iy=mine[y].moveSlots.map(m=>m.id);
    let s=V[x]+V[y];const fo=ix.includes('fakeout')||iy.includes('fakeout'),tw=ix.includes('tailwind')||iy.includes('tailwind');if(fo&&tw)s+=0.25;if(x===mega||y===mega)s+=0.1;
    const eq=[x,y].some(k=>mine[k].moveSlots.some(m=>m.id==='earthquake'));if(eq){const other=[x,y].find(k=>!mine[k].moveSlots.some(m=>m.id==='earthquake'));if(other!=null&&battle.dex.getEffectiveness('Ground',forms[other])>0&&!forms[other].hasType('Flying'))s-=0.3}
    if(!best||s>best.s)best={s,x,y}}
  const order=[best.x,best.y,...four.filter(k=>k!==best.x&&k!==best.y)];mem.mega=mega!=null?sets[mega].species:'none';
  return 'team '+order.map(i=>i+1).join('')}
const W={calc:'smogon',calcStats:{smogon:0,engine:0},sw:true,pro6:true,willMove:0.35,focus:true,drop:true,preview:true,pmode:'adaptive',stats:{}};
function wolfe(battle,side,req,mem){
  if(req.teamPreview)return W.preview?previewWolfe(battle,side,mem):greedy(battle,side,req,mem);
  if(req.wait)return null;const me=battle.sides[side==='p1'?0:1],foe=me.foe;
  if(req.forceSwitch)return forced(battle,req,me,true);
  mem.lp=mem.lp||{};const foes=foe.active.map((f,fi)=>f&&!f.fainted?f:null);
  const live=foes.filter(Boolean);const trick=!!battle.field.pseudoWeather.trickroom;
  const faster=(a,b)=>trick?spe(a)<spe(b):spe(a)>spe(b);
  // Mega Evolution happens at the start of the turn: evaluate pending Megas (ours and theirs) in Mega form, with their weather.
  const cloneLike=(c,m)=>{c.hp=Math.max(1,Math.round(c.maxhp*m.hp/m.maxhp));c.boosts={...m.boosts};c.status=m.status;c.position=m.position;c.isActive=true;c.activeTurns=m.activeTurns;return c};
  const pend=req.active?req.active.findIndex(a=>a&&a.canMegaEvo):-1;
  const myForm=[0,1].map(i=>{const m=me.active[i];if(!m||m.fainted||i!==pend)return m;const c=megaClone(battle,me,m.set);return c?cloneLike(c,m):m});
  const foeMegaDone=foe.pokemon.some(p=>p.species.isMega)||foe.__megaDone;let foeMegaPicked=false;
  const FF=foes.map(f=>{if(!f||foeMegaDone||foeMegaPicked||f.species.isMega)return f;const it=battle.dex.items.get(f.item||(f.set&&f.set.item));if(!it.megaStone)return f;const c=megaClone(battle,foe,{...f.set,item:it.name});if(!c)return f;foeMegaPicked=true;return cloneLike(c,f)});
  const FFof=f=>{const k=foes.indexOf(f);return k>=0&&FF[k]?FF[k]:f};
  const WXM={drought:'sunnyday',drizzle:'raindance',sandstream:'sandstorm',snowwarning:'snowscape'};
  const wx=pend>=0&&myForm[pend]!==me.active[pend]?WXM[myForm[pend].getAbility().id]:null;const fld=battle.field,ow=fld.weather,ows=fld.weatherState;if(wx&&ow!==wx){fld.weather=wx;fld.weatherState={id:wx}}
  const T=getTactics();
  let options;try{
  options=req.active.map((act,i)=>{const mon=me.active[i];if(!mon||mon.fainted||req.side.pokemon[i].condition.endsWith(' fnt'))return [{cmd:'pass',score:0}];const M=myForm[i]||mon;
    const ally=me.active[1-i]&&!me.active[1-i].fainted?me.active[1-i]:null;
    // threat analysis
    let threat=0,pKO=0,fastKO=false;for(const f of live){const F=FFof(f);const r=bestR(battle,F,M);threat=Math.max(threat,r.max/M.maxhp*mon.maxhp);const p=koP(r,M.hp);pKO=Math.max(pKO,p);if(p>=0.5&&faster(F,M))fastKO=true}
    const opts=[];
    act.moves.forEach((m,k)=>{if(m.disabled)return;const mv=battle.dex.moves.get(m.id);const needsFoe=['normal','any','adjacentFoe'].includes(mv.target);
      if(T&&T.shouldBlockMove){try{if(T.shouldBlockMove(battle,mon,mv,live))return}catch(e){}}
      let customDelta=0;
      if(T&&T.adjustScore){try{customDelta=T.adjustScore(battle,mon,mv,live,0)||0}catch(e){}}
      const push=(score,tgt,extra={})=>opts.push({cmd:`move ${k+1}${tgt}`,score:score+customDelta,id:mv.id,...extra});
      if(PROTECT.includes(mv.id)){if(mem.lp[i])return;let s=0.02;if(pKO>=0.5)s=0.92;else if(threat>=mon.hp)s=0.6;else if(W.pro6&&threat>=0.6*mon.hp)s=0.35;
        if(mon.species.name==='Dragonite-Mega'&&mon.hp===mon.maxhp&&live.some(f=>f.activeTurns===0&&f.moveSlots.some(x=>x.id==='fakeout')))s=Math.max(s,0.7);
        if((battle.field.weather==='sandstorm'||live.some(f=>/tyranitar|hippowdon/i.test(f.species.name)))&&mon.species.name==='Charizard')s=Math.max(s,0.85);
        if(foe.sideConditions.tailwind&&foe.sideConditions.tailwind.duration<=2&&threat>=0.5*mon.hp)s=Math.max(s,0.6);push(s,'');return}
      if(mv.id==='tailwind'){if(me.sideConditions.tailwind)return;
        const trThreat=trick||live.some(f=>['farigiraf','porygon2','dusclops','hatterene','bronzong','oranguru','cresselia'].includes(toID(f.species.baseSpecies||f.species.name))||f.moveSlots.some(x=>x.id==='trickroom'));
        if(trThreat)return;
        const fastFoes=live.filter(f=>me.active.some(a=>a&&!a.fainted&&spe(f)>spe(a))).length;let s=0.45+0.2*fastFoes+(foe.sideConditions.tailwind?0.3:0);if(fastKO&&!(mv.priority>0||mon.getAbility().id==='prankster'))s*=0.4;push(s,'');return}
      if(mv.id==='fakeout'){if(mon.activeTurns>0)return;foes.forEach((f,fi)=>{if(!f)return;if(f.hasType('Ghost')||f.getAbility().id==='innerfocus'||['armortail','dazzling','queenlymajesty'].includes(f.getAbility().id)||battle.field.terrain==='psychicterrain')return;let s=0.6;const fids=f.moveSlots.map(x=>x.id);if(fids.some(x=>['tailwind','trickroom','followme','ragepowder','fakeout'].includes(x)))s+=0.15;if(ally)s+=0.25*Math.min(1,bestDmg(battle,f,ally)/ally.hp);push(s,' '+(fi+1),{tgt:fi,dmg:dmg(battle,mon,f,'fakeout')})});return}
      if(mv.id==='suckerpunch'){if(battle.field.terrain==='psychicterrain'||live.some(f=>['armortail','dazzling','queenlymajesty'].includes(f.getAbility().id)))return}
      if(mv.id==='encore'){foes.forEach((f,fi)=>{if(!f||!f.lastMove)return;if(mon.getAbility().id==='prankster'&&f.hasType('Dark'))return;if(battle.field.terrain==='psychicterrain'||['armortail','dazzling','queenlymajesty'].includes(f.getAbility().id))return;const lm=battle.dex.moves.get(f.lastMove.id);if(lm.category==='Status')push(0.65,' '+(fi+1))});return}
      if(['recover','roost','lifedew','slackoff'].includes(mv.id)){push((mon.hp/mon.maxhp<0.5&&!fastKO)?0.8:0.02,'');return}
      if(mv.id==='followme'||mv.id==='ragepowder'){if(!ally)return;let at=0;for(const f of live)at=Math.max(at,bestDmg(battle,f,ally)/ally.hp);push(Math.min(0.9,0.2+0.6*at),'');return}
      if(mv.id==='helpinghand'){if(!ally)return;push(0.3,' -'+(2-i));return}
      if(mv.id==='partingshot'){foes.forEach((f,fi)=>{if(f)push(threat>=0.6*mon.hp?0.45:0.2,' '+(fi+1))});return}
      if(mv.category==='Status'){if(['adjacentAlly','adjacentAllyOrSelf'].includes(mv.target))return;if(mv.id==='coil'){push(mon.boosts.def<2&&mon.hp/mon.maxhp>0.6&&!fastKO?0.3:0.02,'');return}
        const s=['sleeppowder','yawn','hypnosis','willowisp','spore','auroraveil','reflect','lightscreen'].includes(mv.id)?0.3:0.1;if(needsFoe){foes.forEach((f,fi)=>{if(f)push(s,' '+(fi+1))})}else push(s,'');return}
      const acc=mv.accuracy===true?1:mv.accuracy/100;const willMove=fastKO?W.willMove:1;let dropPen=(W.drop&&DROPPERS.includes(mv.id))?0.12:0;
      if(dropPen){// overkill check: does a non-dropping attack of ours already guarantee the KO on some foe?
        mem.__nd=mem.__nd||{};const key=i+':'+this_turn_key(battle);if(!mem.__nd[key]){mem.__nd[key]=foes.map(f=>{if(!f)return false;for(const ms of act.moves){if(ms.disabled)continue;const m2=battle.dex.moves.get(ms.id);if(m2.category==='Status'||DROPPERS.includes(m2.id))continue;const r=dmgR(battle,M,FFof(f),m2.id,isSpreadNow(battle,mon,m2.id));if(r.min>=f.hp)return true}return false})}
        if(mem.__nd[key].some(Boolean))dropPen+=0.35}
      const V=(r,t)=>Math.min(r.avg,t.hp)/t.maxhp+0.6*koP(r,t.hp);
      if(['allAdjacentFoes','allAdjacent'].includes(mv.target)){const spr=isSpreadNow(battle,mon,mv.id);const per=foes.map(f=>f?dmgR(battle,M,FFof(f),mv.id,spr):null);let s=0;foes.forEach((f,fi)=>{if(f)s+=V(per[fi],f)});
        if(mv.target==='allAdjacent'&&ally){const r=dmgR(battle,M,ally,mv.id,spr);s-=1.3*(Math.min(r.avg,ally.hp)/ally.maxhp+0.8*koP(r,ally.hp))}
        push((s*acc-dropPen)*willMove,'',{spread:per,pred:foes.map((f,fi)=>f?{t:fi,min:per[fi].min/f.maxhp,max:per[fi].max/f.maxhp}:null).filter(Boolean)});return}
      if(needsFoe){foes.forEach((f,fi)=>{if(!f)return;const r=dmgR(battle,M,FFof(f),mv.id);push((V(r,f)*acc-dropPen)*willMove,' '+(fi+1),{tgt:fi,dmg:r.avg,dmin:r.min,pred:[{t:fi,min:r.min/f.maxhp,max:r.max/f.maxhp}]})});return}
      push(0.1,'');});
    // switch option
    // switching: compare this Pokémon's matchup (plus its current state) with each healthy teammate's
    if(W.sw&&!act.trapped&&!act.maybeTrapped){
      const canProtect=!mem.lp[i]&&act.moves.some(m=>PROTECT.includes(m.id)&&!m.disabled);
      const mu=(X,isCur)=>{let v=0;for(const f of live){const F=FFof(f);const off=Math.min(1,bestR(battle,X,F).avg/Math.max(1,F.hp));const r=bestR(battle,F,X);const def=Math.min(1,r.avg/Math.max(1,X.hp));v+=0.9*off-0.8*def+(faster(X,F)?0.1:0)}return v/Math.max(1,live.length)};
      let cur=mu(M,true);const why=[];
      const atkStat=(M.getStat('atk',true,true)>=M.getStat('spa',true,true))?'atk':'spa';const drop=M.boosts[atkStat]||0;if(drop<=-2){cur-=0.15*(-drop);why.push(atkStat+' '+drop)}
      const per=M.volatiles&&M.volatiles.perishsong;if(per&&per.duration<=1){cur-=3;why.push('perish 1')}
      if(M.volatiles&&M.volatiles.yawn){cur-=0.5;why.push('yawned')}
      const enabled=act.moves.filter(m=>!m.disabled);const lockedChoice=/choice/.test(String(M.item))&&enabled.length===1&&act.moves.length>1;
      if(lockedChoice){// compare the locked move with the best move we'd have if we weren't locked (spread moves count both foes, minus ally damage)
        const val=id=>{const m=battle.dex.moves.get(id);if(m.category==='Status')return 0;const spr=['allAdjacentFoes','allAdjacent'].includes(m.target);
          let v=spr?live.reduce((a,f)=>a+Math.min(1,dmg(battle,M,FFof(f),id)/Math.max(1,f.hp)),0):Math.max(0,...live.map(f=>Math.min(1,dmg(battle,M,FFof(f),id)/Math.max(1,f.hp))));
          if(m.target==='allAdjacent'&&ally&&!ally.fainted)v-=1.3*Math.min(1,dmg(battle,M,ally,id)/Math.max(1,ally.hp));return v};
        const lm=battle.dex.moves.get(enabled[0].id);const lv=val(lm.id);let alt=0,altName='';for(const ms of act.moves){if(ms.id===lm.id)continue;const v=val(ms.id);if(v>alt){alt=v;altName=battle.dex.moves.get(ms.id).name}}
        if(lm.category==='Status'||lv<0.25){cur-=0.5;why.push('locked into '+lm.name)}else if(alt-lv>0.3){cur-=0.6*(alt-lv);why.push(`locked into ${lm.name}; ${altName} is better now`)}}
      if(M.volatiles&&M.volatiles.encore){const em=enabled[0]&&battle.dex.moves.get(enabled[0].id);if(em&&em.category==='Status'){cur-=0.5;why.push('encored')}}
      if(fastKO&&!canProtect){cur-=0.6;why.push('about to be KOd')}
      req.side.pokemon.forEach((p,j)=>{if(p.active||p.condition.endsWith(' fnt'))return;const b=me.pokemon[j];if(!b||b.fainted)return;
        let hit=0;for(const f of live)hit=Math.max(hit,bestR(battle,FFof(f),b).max/Math.max(1,b.hp));if(hit>=1)return; // would just die coming in
        const gain=mu(b,false)-0.5*hit-0.15-cur;if(gain>(+process.env.SW_T||0.12))opts.push({cmd:'switch '+(j+1),score:Math.min(0.95,0.35+gain),sw:j,why:why.join(', ')||'better matchup'})})}
    if(!opts.length){const k=Math.max(0,act.moves.findIndex(m=>!m.disabled));const fm=battle.dex.moves.get(act.moves[k].id);const nf=['normal','any','adjacentFoe'].includes(fm.target);const fi=foes.findIndex(Boolean);opts.push({cmd:'move '+(k+1)+(nf&&fi>=0?' '+(fi+1):''),score:0,id:fm.id})}
    opts.forEach(o=>o.score+=Math.random()*0.03);return opts.sort((a,b)=>b.score-a.score).slice(0,6)});
  }finally{if(wx&&ow!==wx){fld.weather=ow;fld.weatherState=ows}}
  // joint selection: focus fire / overkill
  let best=null;const combos=[];for(const a of options[0])for(const b of options[1]){if(a.sw!=null&&a.sw===b.sw)continue;let s=a.score+b.score;
    if(W.focus&&a.tgt!=null&&b.tgt!=null&&a.tgt===b.tgt){const t=foes[a.tgt];if(t){const Am=a.dmin??a.dmg??0,Bm=b.dmin??b.dmg??0,A=a.dmg||0,B=b.dmg||0;if(Am>=t.hp||Bm>=t.hp)s-=0.45;else if(Am+Bm>=t.hp)s+=0.5;else if(A+B>=t.hp)s+=0.3}}
    combos.push({s,a,b});if(!best||s>best.s)best={s,a,b}}
  // ranked candidate list (for an LLM pilot): final command strings + human-readable descriptions
  try{const pct=x=>Math.round(100*x)+'%';const desc=(p,i)=>{const mon=me.active[i];if(!p||p.cmd==='pass'||!mon)return 'pass';if(p.sw!=null)return `${mon.name}: switch to ${me.pokemon[p.sw].name} (${p.why||'better matchup'})`;
      const mv=battle.dex.moves.get(p.id);let t='';if(p.tgt!=null&&foes[p.tgt])t=' → '+foes[p.tgt].species.name;else if(['allAdjacentFoes','allAdjacent'].includes(mv.target))t=' (spread)';
      const dm=p.pred&&p.pred.length?' ['+p.pred.map(x=>(foes[x.t]?foes[x.t].species.name+' ':'')+pct(x.min)+'–'+pct(x.max)).join(', ')+']':'';return `${mon.name}: ${mv.name}${t}${dm}`};
    const mk=(a,b)=>{let mu=false;return [a,b].map((p,i)=>{let c=p.cmd;const act=req.active[i];if(act&&act.canMegaEvo&&!mu&&c.startsWith('move')){c+=' mega';mu=true}return c}).join(', ')};
    const ranked=combos.sort((x,y)=>y.s-x.s);const swBest=[0,1].map(k=>ranked.find(c=>(k?c.b:c.a).sw!=null)).filter(Boolean);
    const seen=new Set();mem.cands=[...ranked.slice(0,8),...swBest].filter(c=>{const k=mk(c.a,c.b);if(seen.has(k))return false;seen.add(k);return true}).slice(0,10).map(c=>({cmd:mk(c.a,c.b),score:+c.s.toFixed(2),desc:desc(c.a,0)+' | '+desc(c.b,1)}))}catch(e){mem.cands=null}
  const picks=[best.a,best.b];mem.pred=picks.map((p,i)=>p&&p.pred&&me.active[i]?{who:me.active[i].name,move:p.id,targets:p.pred.map(x=>({name:foes[x.t]&&foes[x.t].species.name,min:x.min,max:x.max}))}:null);for(const p of picks){const k=p.sw!=null?'switch':(p.id||'other');W.stats[k]=(W.stats[k]||0)+1}let megaUsed=false;
  return picks.map((p,i)=>{mem.lp[i]=PROTECT.includes(p.id);let cmd=p.cmd;const act=req.active[i];if(act&&act.canMegaEvo&&!megaUsed&&cmd.startsWith('move')){cmd+=' mega';megaUsed=true}return cmd}).join(', ');
}
// Damage table for the LLM pilot: every usable move of ours vs each foe, and each foe's likely moves vs ours (Smogon calc).
function damageTable(battle,side,req){const me=battle.sides[side==='p1'?0:1],foe=me.foe;const pct=(x,m)=>Math.round(100*x/m.maxhp);
  const pend=req.active?req.active.findIndex(a=>a&&a.canMegaEvo):-1;
  const like=(c,m)=>{c.hp=Math.max(1,Math.round(c.maxhp*m.hp/m.maxhp));c.boosts={...m.boosts};c.status=m.status;c.position=m.position;c.isActive=true;return c};
  const mine=[0,1].map(i=>{const m=me.active[i];if(!m||m.fainted)return null;if(i===pend){const c=megaClone(battle,me,m.set);if(c)return {real:m,f:like(c,m),mega:true}}return {real:m,f:m}});
  const foeMegaDone=foe.pokemon.some(p=>p.species.isMega);let picked=false;
  const foes=[0,1].map(i=>{const m=foe.active[i];if(!m||m.fainted)return null;let f=m;if(!foeMegaDone&&!picked&&!m.species.isMega){const it=battle.dex.items.get(m.item||(m.set&&m.set.item));if(it.megaStone){const c=megaClone(battle,foe,{...m.set,item:it.name});if(c){f=like(c,m);picked=true}}}return {real:m,f,mega:f!==m}});
  const WXM={drought:'sunnyday',drizzle:'raindance',sandstream:'sandstorm',snowwarning:'snowscape'};const pm=pend>=0&&mine[pend]&&mine[pend].mega?WXM[mine[pend].f.getAbility().id]:null;
  const fld=battle.field,ow=fld.weather,ows=fld.weatherState;if(pm&&ow!==pm){fld.weather=pm;fld.weatherState={id:pm}}
  const sash=m=>m.hp===m.maxhp&&/focussash/.test(String(m.item))||(m.hp===m.maxhp&&['sturdy'].includes(m.getAbility().id));
  const tag=(r,t,id)=>{const hp=t.real.hp;const ko=r.min>=hp?' KO':(r.max>=hp?' (KO '+Math.round(100*koP(r,hp))+'%)':'');const mh=id&&battle.dex.moves.get(id).multihit;return ko&&sash(t.real)&&!mh?' (Focus Sash/Sturdy: survives at 1 HP)':ko};
  const L=[];try{
    L.push('DAMAGE TABLE (Smogon calc, min–max roll, % of max HP; KO = guaranteed vs current HP; their side uses their most likely set):');
    mine.forEach((x,i)=>{if(!x)return;const act=req.active[i];if(!act)return;const parts=[];
      for(const ms of act.moves){if(ms.disabled)continue;const mv=battle.dex.moves.get(ms.id);if(mv.category==='Status')continue;const spr=isSpreadNow(battle,x.real,mv.id);
        const segs=foes.map(t=>{if(!t)return null;const r=dmgR(battle,x.f,t.f,mv.id,spr);return `${t.real.species.name} ${pct(r.min,t.f)}–${pct(r.max,t.f)}%${tag(r,t,mv.id)}`}).filter(Boolean);
        const best=Math.max(0,...foes.map(t=>t?dmgR(battle,x.f,t.f,mv.id,spr).max/t.f.maxhp:0));if(best<0.05&&!process.env.DT_FULL)continue;
        let ally='';if(mv.target==='allAdjacent'){const a=mine[1-i];if(a){const r=dmgR(battle,x.f,a.f,mv.id,spr);ally=` | hits OUR ${a.real.name} ${pct(r.min,a.f)}–${pct(r.max,a.f)}%`}}
        parts.push(`${mv.name}${spr?' (spread)':''}: ${segs.join(', ')}${ally}`)}
      if(parts.length)L.push(`- OUR ${x.real.name}${x.mega?' (as Mega this turn)':''}: `+parts.join(' ; '))});
    foes.forEach(t=>{if(!t)return;const parts=[];const ranked=t.f.moveSlots.map(ms=>battle.dex.moves.get(ms.id)).filter(mv=>mv.category!=='Status').map(mv=>({mv,v:Math.max(0,...mine.map(x=>x?dmgR(battle,t.f,x.f,mv.id,isSpreadNow(battle,t.real,mv.id)).max/x.f.maxhp:0))})).sort((a,b)=>b.v-a.v).slice(0,process.env.DT_FULL?9:2);
      for(const {mv} of ranked){const spr=isSpreadNow(battle,t.real,mv.id);
        const segs=mine.map(x=>{if(!x)return null;const r=dmgR(battle,t.f,x.f,mv.id,spr);return `${x.real.name} ${pct(r.min,x.f)}–${pct(r.max,x.f)}%${tag(r,{real:x.real},mv.id)}`}).filter(Boolean);parts.push(`${mv.name}${spr?' (spread)':''}: ${segs.join(', ')}`)}
      if(parts.length)L.push(`- FOE ${t.real.species.name}${t.mega?' (if it Mega Evolves)':''}: `+parts.join(' ; '))});
  }finally{if(pm&&ow!==pm){fld.weather=ow;fld.weatherState=ows}}
  return L.length>1?'\n\n'+L.join('\n'):''}
module.exports={greedy,wolfe,W,dmgR,engR,koP,damageTable,isSpreadNow};
