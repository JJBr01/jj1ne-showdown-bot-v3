// BattleClient: turns Showdown protocol for ONE battle into choices, using a shadow battle + the Wolfe pilot.
const {BattleStream}=require('./ps/dist/sim/battle-stream');const {Teams}=require('./ps/dist/sim/teams');const {Dex}=require('./ps/dist/sim/dex');
const fs=require('fs');const path=require('path');const P=require('./pilots.js');const LRN=require('./learning.js');const toID=s=>(''+s).toLowerCase().replace(/[^a-z0-9]/g,'');
const FORMAT='gen9championsvgc2026regmc';const dex=Dex.forFormat(FORMAT);
const WX={sunnyday:'sunnyday',raindance:'raindance',sandstorm:'sandstorm',snowscape:'snowscape',snow:'snowscape',hail:'snowscape',desolateland:'desolateland',primordialsea:'primordialsea'};
const SETDB_FILE=path.join(__dirname,'setdb.json'),META_TEAMS_FILE=path.join(process.env.BOT_DATA||path.join(__dirname,'data'),'meta_teams.json');
let SETDB={},META_TEAMS=[];function reloadMeta(){try{SETDB=JSON.parse(fs.readFileSync(SETDB_FILE,'utf8'))}catch(e){SETDB={}}try{META_TEAMS=(JSON.parse(fs.readFileSync(META_TEAMS_FILE,'utf8')).teams||[])}catch(e){META_TEAMS=[]}}
reloadMeta();
function baseID(species){const sp=dex.species.get(species);return toID(sp.baseSpecies||sp.name||species)}
function matchMetaTeam(species){const ids=new Set(species.map(baseID));let best=null;for(const t of META_TEAMS){const shared=(t.species||[]).filter(s=>ids.has(baseID(s))).length;if(shared<4)continue;if(!best||shared>best.shared||shared===best.shared&&(t.weight||0)>(best.team.weight||0)||shared===best.shared&&(t.weight||0)===(best.team.weight||0)&&(t.rank||999)<(best.team.rank||999))best={team:t,shared}}return best}
function guessSet(species,preferred){const sp=dex.species.get(species);const base=dex.species.get(sp.baseSpecies===sp.name?sp.id:(sp.battleOnly||sp.id));
  let d=preferred||(SETDB[sp.id]||SETDB[base.id]);if(d){if(!preferred)d=LRN.mergeSet(d,(guessSet.learned||{})[sp.id]||(guessSet.learned||{})[base.id],dex);return {name:'',species:sp.name,item:d.item,ability:d.ability,nature:d.nature,moves:d.moves,level:50,ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31},evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0,...d.evs},gender:''}}
  // fallback: best STAB/coverage attacks from learnset
  const phys=sp.baseStats.atk>=sp.baseStats.spa;const ls=(dex.species.getLearnsetData(sp.id).learnset)||(dex.species.getLearnsetData(dex.toID(sp.baseSpecies)).learnset)||{};
  const mv=Object.keys(ls).map(id=>dex.moves.get(id)).filter(m=>m.exists&&m.category===(phys?'Physical':'Special')&&m.basePower>=60&&!m.flags.charge&&!m.selfdestruct&&m.id!=='hyperbeam'&&m.id!=='gigaimpact').map(m=>({m,v:m.basePower*(sp.types.includes(m.type)?1.5:1)*((m.accuracy===true?100:m.accuracy)/100)})).sort((a,b)=>b.v-a.v);
  const picked=[];const types=new Set();for(const {m} of mv){if(picked.length>=3)break;if(types.has(m.type))continue;types.add(m.type);picked.push(m.name)}
  return {name:'',species:sp.name,item:'',ability:Object.values(sp.abilities)[0],nature:phys?'Adamant':'Modest',level:50,ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31},evs:{hp:2,atk:phys?32:0,def:0,spa:phys?0:32,spd:0,spe:32},moves:[...picked,'Protect'],gender:''}}
function guessTeam(species){const match=matchMetaTeam(species);const sets=species.map(sp=>{const preferred=match&&(match.team.sets||[]).find(s=>baseID(s.species)===baseID(sp));return guessSet(sp,preferred)});return {sets,match}}
class BattleClient{
  constructor(myTeamText,log=()=>{}){reloadMeta();guessSet.learned=LRN.learnedSets();this.seen={};this.rep={kos:[],bigHits:[],dealt:{},ourKOs:{},calcChecks:[],tw:{me:0,opp:0},megaTurn:null,firstKO:null,oppBrought:[],ots:false};this.lastHitBy=new Map();this.act=null;this.mySets=Teams.import(myTeamText).map(s=>({...s,level:50}));this.log=log;this.mySide=null;this.oppSpecies=[];this.oppSets=null;this.shadow=null;this.mem={};this.turn=0;this.lastReq=null;this.result=null;this.revealed={}}
  buildShadow(){const s=new BattleStream();s.write(`>start {"formatid":"${FORMAT}"}\n>player p1 {"name":"me","team":${JSON.stringify(Teams.pack(this.mySets))}}\n>player p2 {"name":"opp","team":${JSON.stringify(Teams.pack(this.oppSets))}}`);
    this.stream=s;const b=s.battle;this.b=b;this.me=b.sides[0];this.opp=b.sides[1];
    // shadow teams: nicknames to match protocol idents for my side
    this.me.pokemon.forEach((p,i)=>{p.isActive=false});this.opp.pokemon.forEach(p=>{p.isActive=false});this.me.active=[null,null];this.opp.active=[null,null]}
  sideOf(id){return id.slice(0,2)===this.mySide?this.me:this.opp}
  findMon(ident,details){const side=this.sideOf(ident);const name=ident.replace(/^p\da?b?: ?/,'').replace(/^p\d[ab]: /,'');
    if(side===this.me)return this.me.pokemon.find(p=>p.name===name)||this.me.pokemon.find(p=>details&&dex.species.get(details.split(',')[0]).baseSpecies===p.species.baseSpecies);
    if(details){const sp=dex.species.get(details.split(',')[0]);const m=this.opp.pokemon.find(p=>p.species.baseSpecies===sp.baseSpecies||p.baseSpecies.name===sp.baseSpecies||p.species.name===sp.name);if(m){m.__nick=name;return m}}
    return this.opp.pokemon.find(p=>p.__nick===name)}
  setActive(side,pos,mon){const arr=side.pokemon;const old=arr.indexOf(mon);const prev=arr[pos];if(old!==pos){arr[pos]=mon;arr[old]=prev}
    arr.forEach((p,i)=>{p.position=i;p.isActive=i<2&&side.active.includes(p)});if(prev&&prev!==mon){prev.isActive=false}side.active[pos]=mon;mon.isActive=true;mon.activeTurns=0;mon.boosts={atk:0,def:0,spa:0,spd:0,spe:0,accuracy:0,evasion:0};mon.volatiles={}}
  setHP(mon,cond){if(!mon||!cond)return;const [hpPart,status]=cond.split(' ');if(hpPart==='0'||cond.endsWith('fnt')){mon.hp=0;mon.fainted=true;return}
    const [a,b]=hpPart.split('/').map(Number);mon.hp=b===100&&mon.side===this.opp?Math.max(1,Math.round(a/100*mon.maxhp)):a;mon.fainted=false;mon.status=status&&status!=='fnt'?status:''}
  forme(mon,details){const sp=details.split(',')[0];if(mon.species.name!==sp){try{mon.formeChange(sp,null,true)}catch(e){try{mon.setSpecies(dex.species.get(sp))}catch(e2){}}}}
  syncMine(req){if(!this.b)return;const order=req.side.pokemon.map(rp=>{const nm=rp.ident.replace(/^p\d: /,'');return this.me.pokemon.find(p=>p.name===nm)});
    if(order.every(Boolean)){this.me.pokemon=order;order.forEach((p,i)=>{p.position=i});
      req.side.pokemon.forEach((rp,i)=>{const p=order[i];this.setHP(p,rp.condition);this.forme(p,rp.details);p.isActive=!!rp.active});
      this.me.active=[0,1].map(i=>order[i]&&req.side.pokemon[i].active?order[i]:null)}}
  seenFor(id,name){return this.seen[id]=this.seen[id]||{name,moves:new Set(),item:'',ability:'',nature:'',ots:0,anomalies:[],evOverride:null,deducedSpread:''}}
  oppId(mon){return toID(mon.baseSpecies?mon.baseSpecies.name:mon.species.baseSpecies)}
  pctOf(mon){return mon.maxhp?mon.hp/mon.maxhp:0}
  track(line,parts,cmd){if(!this.b)return;const from=line.includes('[from]');
    if(cmd==='turn'){this.turnMoves=[]}
    if(cmd==='move'){const m=this.findMon(parts[2]);
      if(m){const mv=dex.moves.get(parts[3]);this.turnMoves=this.turnMoves||[];this.turnMoves.push({mon:m,side:m.side,pri:mv?mv.priority||0:0});
        if(m.side===this.opp&&mv&&mv.priority===0&&this.b&&!this.b.field.pseudoWeather.trickroom&&!this.opp.sideConditions.tailwind){
          const ourActive=this.me.active.filter(a=>a&&!a.fainted);
          for(const our of ourActive){
            if(!this.turnMoves.some(x=>x.mon===our)&&our.getStat('spe')>m.getStat('spe')*1.08){
              const sn=this.seenFor(this.oppId(m),m.species.baseSpecies);sn.anomalies=sn.anomalies||[];
              const note=`outsped our ${our.name} (spe ${our.getStat('spe')} vs est.spe ${m.getStat('spe')}) [FASTER than standard: likely Choice Scarf or max Spe]`;
              if(!sn.anomalies.includes(note)){sn.anomalies.push(note);this.log&&this.log(`[Speed Anomaly] ${m.species.name} outsped ${our.name}`)}
            }
          }
        }
      }
      if(m)this.act={mon:m,move:parts[3],turn:this.turn,pred:m.side===this.me&&this.mem.pred?this.mem.pred.find(p=>p&&p.who===m.name&&toID(p.move)===toID(parts[3])):null};
      if(m&&m.side===this.opp)this.seenFor(this.oppId(m),m.species.baseSpecies).moves.add(parts[3])}
    if(cmd==='-damage'&&!from&&this.act){const t=this.findMon(parts[2]);if(t&&t.side!==this.act.mon.side){const before=t.__pct??1;const [a,b]=(parts[3]||'0').split(' ')[0].split('/').map(Number);const after=parts[3]&&parts[3].includes('fnt')||a===0?0:(b?a/b:0);const d=Math.max(0,before-after);
      const by=`${this.act.mon.name} (${this.act.move})`;this.lastHitBy.set(t,this.act.mon.side===this.me?by:`${this.act.mon.species.name} ${this.act.move}`);
      if(this.act.mon.side===this.me){this.rep.dealt[this.act.mon.name]=(this.rep.dealt[this.act.mon.name]||0)+d;const pr=this.act.pred&&this.act.pred.targets.find(x=>x.name&&toID(dex.species.get(x.name).baseSpecies)===toID(t.species.baseSpecies));
        if(pr&&after>0&&!(before>=0.995&&after<=0.02)){
          this.rep.calcChecks.push({turn:this.turn,who:this.act.mon.name,move:this.act.move,target:t.species.name,min:pr.min,max:pr.max,actual:d,inRange:d>=pr.min-0.025&&d<=pr.max+0.025});
          const sn=this.seenFor(this.oppId(t),t.species.baseSpecies);sn.anomalies=sn.anomalies||[];
          const actPct=Math.round(d*100),minPct=Math.round(pr.min*100),maxPct=Math.round(pr.max*100);
          const mvObj=dex.moves.get(this.act.move);const isSp=mvObj&&mvObj.category==='Special';
          if(d<pr.min-0.04){
            const reason=isSp?'heavy SpD or Assault Vest':'heavy Def or Eviolite';
            const note=`took ${actPct}% from ${this.act.move} (expected min: ${minPct}%) [BULKIER than standard: likely ${reason}]`;
            if(!sn.anomalies.includes(note))sn.anomalies.push(note);
            if(!sn.evOverride){
              t.evOverride=isSp?{hp:252,spd:252}:{hp:252,def:252};
              sn.evOverride=t.evOverride;
              sn.deducedSpread=isSp?'bulky_spd (auto)':'bulky_def (auto)';
              this.log&&this.log(`[Auto-Bulk] ${t.species.name} took only ${actPct}% (min ${minPct}%); widening future calcs to max ${isSp?'SpD':'Def'}`);
            }
          }else if(d>pr.max+0.04){
            const note=`took ${actPct}% from ${this.act.move} (expected max: ${maxPct}%) [FRAILER than standard]`;
            if(!sn.anomalies.includes(note))sn.anomalies.push(note);
          }
        }
      }
      if(d>=0.4)this.rep.bigHits.push({turn:this.turn,by:this.act.mon.side===this.me?this.act.mon.name+' '+this.act.move:this.act.mon.species.name+' '+this.act.move,target:(t.side===this.me?t.name:t.species.name),pct:d})}}
    const it=line.match(/\[from\] item: ([^|]+)/);if(it){const m=this.findMon(parts[2]);if(m&&m.side===this.opp)this.seenFor(this.oppId(m),m.species.baseSpecies).item=it[1].trim()}
    const ab=line.match(/\[from\] ability: ([^|]+)/);if(ab){const who=line.match(/\[of\] (p\d[ab]: [^|]+)/);const m=this.findMon(who?who[1]:parts[2]);if(m&&m.side===this.opp)this.seenFor(this.oppId(m),m.species.baseSpecies).ability=ab[1].trim()}
    if(cmd==='-item'||cmd==='-enditem'){const m=this.findMon(parts[2]);if(m&&m.side===this.opp&&parts[3])this.seenFor(this.oppId(m),m.species.baseSpecies).item=parts[3]}
    if(cmd==='-ability'){const m=this.findMon(parts[2]);if(m&&m.side===this.opp)this.seenFor(this.oppId(m),m.species.baseSpecies).ability=parts[3]}
    if(cmd==='-ability'&&/contrary/i.test(parts[3]||'')){const m=this.findMon(parts[2]);if(m)m.__contrary=true}
    if(cmd==='-boost'&&this.act&&!from){const m=this.findMon(parts[2]);const dropMoves=['overheat','closecombat','dracometeor','superpower','leafstorm','makeitrain','fleurcannon','psychoboost','vcreate','headlongrush','armorcannon','hammerarm','spinout'];
      if(m&&m===this.act.mon&&dropMoves.includes(dex.toID(this.act.move))){if(!m.__contrary)this.log&&this.log(`Contrary detected on ${m.species.name}`);m.__contrary=true}}
    if(cmd==='-mega'){const m=this.findMon(parts[2]);if(m&&m.side===this.opp&&parts[4])this.seenFor(this.oppId(m),m.species.baseSpecies).item=parts[4];if(m&&m.side===this.me)this.rep.megaTurn=this.turn}
    if(cmd==='switch'||cmd==='drag'){const m=this.findMon(parts[2],parts[3]);if(m&&m.side===this.opp)this.rep.oppBrought.push(m.species.baseSpecies)}
    if(cmd==='faint'){const m=this.findMon(parts[2]);if(m){const side=m.side===this.me?'me':'opp';const by=this.lastHitBy.get(m)||'';this.rep.kos.push({turn:this.turn,mon:side==='me'?m.name:m.species.name,side,by});
      if(!this.rep.firstKO)this.rep.firstKO=(side==='me'?'ours: ':'theirs: ')+(side==='me'?m.name:m.species.name);
      if(side==='opp'&&by){const k=by.split(' (')[0];this.rep.ourKOs[k]=(this.rep.ourKOs[k]||0)+1}}}
    if(cmd==='turn'){if(this.me.sideConditions.tailwind)this.rep.tw.me++;if(this.opp.sideConditions.tailwind)this.rep.tw.opp++}}
  handleLine(line){(this.hist=this.hist||[]).push(line);const parts=line.split('|');const cmd=parts[1];try{this.track(line,parts,cmd)}catch(e){}
    if(this.b&&['-damage','-heal','-sethp','switch','drag','replace'].includes(cmd)){const m=this.findMon(parts[2],['switch','drag','replace'].includes(cmd)?parts[3]:undefined);const c=['switch','drag','replace'].includes(cmd)?parts[4]:parts[3];if(m&&c){const [a,b]=c.split(' ')[0].split('/').map(Number);m.__pct=c.includes('fnt')?0:(b?a/b:0)}}
    switch(cmd){
      case 'poke':(this.pokes=this.pokes||[]).push([parts[2],parts[3].split(',')[0]]);break;
      case 'teampreview':this.previewReady=true;if(this.pendingReq){const r=this.pendingReq;this.pendingReq=null;return this.onRequest(r)}break;
      case 'showteam':if(parts[2]!==this.mySide&&this.turn===0){try{const raw=Teams.unpack(parts.slice(3).join('|'));const matched=matchMetaTeam(raw.map(s=>s.species));this.oppSets=raw.map(s=>{const exact=matched&&(matched.team.sets||[]).find(x=>baseID(x.species)===baseID(s.species));return {...s,level:50,evs:this.guessEVs(s,exact)}});if(matched)this.log(`OTS matched ranked team ${matched.team.id} (${matched.shared}/6, ${matched.team.rank} at ${matched.team.event}); using its EV spreads`);else this.log('OTS received: exact items/abilities/moves; EVs from ranked VGCPastes defaults');this.rep.ots=true;for(const x of this.oppSets){const id=toID(dex.species.get(x.species).baseSpecies);this.seenFor(id,x.species).ots=1;Object.assign(this.seenFor(id,x.species),{item:x.item,ability:x.ability,nature:x.nature});x.moves.forEach(m=>this.seenFor(id,x.species).moves.add(m))}if(this.mySide&&!this.b){}else this.buildShadow()}catch(e){}}break;
      case 'switch':case 'drag':case 'replace':{if(!this.b)break;const pos=parts[2][2]==='a'?0:1;const side=this.sideOf(parts[2]);const mon=this.findMon(parts[2],parts[3]);if(!mon)break;this.setActive(side,pos,mon);this.forme(mon,parts[3]);this.setHP(mon,parts[4]);break}
      case 'detailschange':case '-formechange':{if(!this.b)break;const mon=this.findMon(parts[2],parts[3]);if(mon)this.forme(mon,parts[3]);break}
      case '-damage':case '-heal':case '-sethp':{if(!this.b)break;const mon=this.findMon(parts[2]);if(mon)this.setHP(mon,parts[3]);break}
      case 'faint':{if(!this.b)break;const mon=this.findMon(parts[2]);if(mon){mon.hp=0;mon.fainted=true}break}
      case '-boost':case '-unboost':{if(!this.b)break;const mon=this.findMon(parts[2]);if(mon){const k=parts[3];const n=+parts[4]*(cmd==='-boost'?1:-1);mon.boosts[k]=Math.max(-6,Math.min(6,(mon.boosts[k]||0)+n))}break}
      case '-setboost':{const mon=this.b&&this.findMon(parts[2]);if(mon)mon.boosts[parts[3]]=+parts[4];break}
      case '-clearboost':case '-clearallboost':{if(!this.b)break;const mons=cmd==='-clearallboost'?[...this.me.active,...this.opp.active]:[this.findMon(parts[2])];for(const m of mons)if(m)for(const k in m.boosts)m.boosts[k]=0;break}
      case '-clearnegativeboost':{const m=this.b&&this.findMon(parts[2]);if(m)for(const k in m.boosts)if(m.boosts[k]<0)m.boosts[k]=0;break}
      case '-status':{const m=this.b&&this.findMon(parts[2]);if(m)m.status=parts[3];break}
      case '-curestatus':{const m=this.b&&this.findMon(parts[2]);if(m)m.status='';break}
      case '-weather':{if(!this.b)break;const w=dex.toID(parts[2]);if(w==='none'){this.b.field.weather='';this.b.field.weatherState={id:''}}else if(!(parts[3]||'').includes('[upkeep]')){const id=WX[w]||w;this.b.field.weather=id;this.b.field.weatherState={id,duration:5}}break}
      case '-fieldstart':{if(!this.b)break;const id=dex.toID(parts[2].replace('move: ',''));if(id.endsWith('terrain')){this.b.field.terrain=id;this.b.field.terrainState={id,duration:5}}else{this.b.field.pseudoWeather[id]={id,duration:5}}break}
      case '-fieldend':{if(!this.b)break;const id=dex.toID(parts[2].replace('move: ',''));if(id.endsWith('terrain')){this.b.field.terrain='';this.b.field.terrainState={id:''}}else delete this.b.field.pseudoWeather[id];break}
      case '-sidestart':{if(!this.b)break;const side=this.sideOf(parts[2]);const id=dex.toID(parts[3].replace('move: ',''));side.sideConditions[id]={id,duration:id==='tailwind'?4:5};break}
      case '-sideend':{if(!this.b)break;const side=this.sideOf(parts[2]);delete side.sideConditions[dex.toID(parts[3].replace('move: ',''))];break}
      case 'move':{if(!this.b)break;const m=this.findMon(parts[2]);if(!m)break;const mv=dex.moves.get(parts[3]);m.lastMove=mv;
        if(m.side===this.opp&&mv.exists&&!m.moveSlots.some(s=>s.id===mv.id)){const rv=this.revealed[m.position+m.species.id]||(this.revealed[m.position+m.species.id]=new Set());const slot=m.moveSlots.findIndex(s=>!rv.has(s.id));if(slot>=0){m.moveSlots[slot]={...m.moveSlots[slot],id:mv.id,move:mv.name,pp:16,maxpp:16};m.baseMoveSlots=m.moveSlots}}
        if(m.side===this.opp){(this.revealed[m.position+m.species.id]=this.revealed[m.position+m.species.id]||new Set()).add(mv.id)}break}
      case '-item':{const m=this.b&&this.findMon(parts[2]);if(m)m.item=dex.toID(parts[3]);break}
      case '-enditem':{const m=this.b&&this.findMon(parts[2]);if(m)m.item='';break}
      case '-ability':{const m=this.b&&this.findMon(parts[2]);if(m)m.ability=dex.toID(parts[3]);break}
      case '-start':{const m=this.b&&this.findMon(parts[2]);if(!m)break;const e=(parts[3]||'').replace('move: ','');const id=dex.toID(e);
        if(/^perish\d$/.test(id))m.volatiles.perishsong={id:'perishsong',duration:+id.slice(6)};else if(['yawn','encore','taunt','confusion','substitute'].includes(id))m.volatiles[id]={id,duration:id==='encore'?3:2};break}
      case '-end':{const m=this.b&&this.findMon(parts[2]);if(!m)break;const id=dex.toID((parts[3]||'').replace('move: ',''));delete m.volatiles[id];if(id==='perishsong')delete m.volatiles.perishsong;break}
      case 'turn':{this.turn=+parts[2];if(!this.b)break;for(const s of [this.me,this.opp]){for(const a of s.active)if(a)a.activeTurns++;for(const k of Object.keys(s.sideConditions)){const c=s.sideConditions[k];if(c.duration&&--c.duration<=0)delete s.sideConditions[k]}}
        for(const k of Object.keys(this.b.field.pseudoWeather)){const c=this.b.field.pseudoWeather[k];if(c.duration&&--c.duration<=0)delete this.b.field.pseudoWeather[k]}break}
      case 'win':this.result=parts[2];break;case 'tie':this.result='tie';break;}}
  guessEVs(s,preferred){
    // If OTS gave us real standard EVs (0-252), convert to Stat Points so calc.js sp2ev() stays correct.
    // SP = EV / 8, rounded. setdb and calc.js both speak Stat Points.
    if(s.evs){const keys=['hp','atk','def','spa','spd','spe'];const hasData=keys.some(k=>s.evs[k]>0);
      if(hasData){const sp={};for(const k of keys)sp[k]=Math.round((s.evs[k]||0)/8);return sp}}
    // Fallback: VGCPastes average spread (already in Stat Points)
    const g=guessSet(s.species,preferred);return g.evs}
  // returns choice string or null
  onRequest(req){this.lastReq=req;if(!this.mySide)this.mySide=req.side.id;
    if(req.teamPreview){if(!this.previewReady||!this.pokes){this.pendingReq=req;return null}
      if(!this.oppSets){const guessed=guessTeam(this.pokes.filter(([sd])=>sd!==this.mySide).slice(0,6).map(([,sp])=>sp));this.oppSets=guessed.sets;if(guessed.match)this.log(`Matched ranked team ${guessed.match.team.id} (${guessed.match.shared}/6, ${guessed.match.team.rank} at ${guessed.match.team.event}); using coherent tournament sets for calcs`)}if(!this.b)this.buildShadow();
      this.arch=LRN.classify(this.oppSets,dex);this.mem.plan=LRN.choosePlan(this.arch);this.mem.avoid=this.arch==='psyterrain'?['Sneasler']:[];this.mem.leadPref=this.arch==='psyterrain'?['Kingambit']:[];this.log(`Opponent archetype: ${this.arch} → plan: Mega ${this.mem.plan.mega}, ${this.mem.plan.lead==='zf'?'Fake Out':'Tailwind'} lead`);}
    if(!this.b&&!req.teamPreview&&this.pokes&&!this.rebuilding){ // joined mid-battle: build the shadow and replay everything seen so far
      this.rebuilding=true;if(!this.oppSets)this.oppSets=guessTeam(this.pokes.filter(([sd])=>sd!==this.mySide).slice(0,6).map(([,sp])=>sp)).sets;this.buildShadow();
      try{this.arch=LRN.classify(this.oppSets,dex)}catch(e){}this.mem.plan=this.mem.plan||{mega:'?',lead:'?',arm:'resumed'};
      const h=this.hist.slice();this.hist=[];for(const l of h){try{this.handleLine(l)}catch(e){}}this.rebuilding=false;this.log('Resumed a battle already in progress (rebuilt state from the room history)')}
    if(!this.b)return null;this.syncMine(req);
    let c;try{c=P.wolfe(this.b,'p1',req,this.mem)}catch(e){this.log('pilot error: '+e.message);return 'default'}
    // locked moves (charge turns, recharge, Outrage-style) take no target
    if(c&&req.active&&!req.teamPreview&&!req.forceSwitch){const parts=c.split(', ');req.active.forEach((a,i)=>{if(a.moves&&a.moves.length===1&&!('target' in a.moves[0])&&parts[i]&&parts[i].startsWith('move'))parts[i]='move 1'});c=parts.join(', ')}
    return c}
}
BattleClient.prototype.finish=function(info){const win=info.result==='W';
  try{if(this.arch&&this.mem.plan)LRN.updatePlan(this.arch,this.mem.plan.arm,win)}catch(e){}
  const seen={};for(const [id,o] of Object.entries(this.seen))seen[id]={moves:[...o.moves],item:o.item,ability:o.ability,nature:o.nature,ots:o.ots};try{LRN.recordSets(seen)}catch(e){}
  const r={...info,arch:this.arch||'?',plan:this.mem.plan||{mega:this.mem.mega,lead:'?',arm:'?'},picked:this.mem.picked,turns:this.turn,oppTeam:(this.oppSets||[]).map(s=>s.species),oppBrought:this.rep.oppBrought,ots:this.rep.ots,
    kos:this.rep.kos,firstKO:this.rep.firstKO,tailwind:this.rep.tw,megaTurn:this.rep.megaTurn,bigHits:this.rep.bigHits.sort((a,b)=>b.pct-a.pct),dealt:this.rep.dealt,ourKOs:this.rep.ourKOs,calcChecks:this.rep.calcChecks,llm:this.rep.llm,
    revealed:Object.fromEntries(Object.values(this.seen).map(o=>[o.name,{moves:[...o.moves],item:o.item,ability:o.ability}]))};
  let file='';try{file=LRN.writeReport(r)}catch(e){this.log('report error '+e.message)}let stats=null;try{stats=LRN.updateStats(r)}catch(e){}
  try{
    const Scouting=require('./scouting.js');
    Scouting.recordBattle({
      opponent: info.opponent||this.oppName,
      result: info.result,
      teamSpecies: (this.oppSets||[]).map(s=>s.species),
      oppBrought: this.rep.oppBrought,
      oppLeads: (this.oppLeads||[]).join(' + '),
      seenSets: seen,
      turns: this.turn
    });
  }catch(e){}
  return {report:file,stats,arch:r.arch,plan:r.plan}};
module.exports={BattleClient,guessSet,guessTeam,matchMetaTeam,reloadMeta};
// ---------------- Claude (LLM) pilot support ----------------
const LLM=require('./llm.js');
const PROT=['protect','detect','spikyshield','banefulbunker','kingsshield','silktrap'];
BattleClient.prototype.validate=function(req,cmd){if(typeof cmd!=='string')return false;cmd=cmd.trim();
  if(req.teamPreview){const m=cmd.match(/^team (\d{4,6})$/);if(!m)return false;const d=m[1].split('').map(Number);return new Set(d).size===d.length&&d.every(x=>x>=1&&x<=req.side.pokemon.length)}
  const parts=cmd.split(/\s*,\s*/);const act=req.active||[];if(parts.length!==act.length)return false;let mega=0;const sw=new Set();
  for(let i=0;i<parts.length;i++){const p=parts[i].split(/\s+/);const rp=req.side.pokemon[i];
    if(p[0]==='pass'){continue}
    if(p[0]==='switch'){const n=+p[1];const t=req.side.pokemon[n-1];if(!t||t.active||t.condition.endsWith(' fnt')||sw.has(n)||(act[i]&&act[i].trapped))return false;sw.add(n);continue}
    if(p[0]!=='move'||!act[i]||(rp&&rp.condition.endsWith(' fnt')))return false;const n=+p[1];const mv=act[i].moves[n-1];if(!mv||mv.disabled)return false;
    let rest=p.slice(2);if(rest[rest.length-1]==='mega'){if(!act[i].canMegaEvo)return false;mega++;rest=rest.slice(0,-1)}
    const locked=act[i].moves.length===1&&!('target' in mv);const tgtType=mv.target;const needs=!locked&&['normal','any','adjacentFoe','adjacentAlly','adjacentAllyOrSelf'].includes(tgtType);
    if(needs){if(rest.length!==1)return false;const t=+rest[0];if(![1,2,-1,-2].includes(t))return false;if(t>0&&tgtType.startsWith('adjacentAlly'))return false}
    else if(rest.length)return false}
  return mega<=1};
BattleClient.prototype.markProtect=function(req,cmd){if(!req.active||!cmd)return;cmd.split(/\s*,\s*/).forEach((p,i)=>{const m=p.match(/^move (\d)/);const mv=m&&req.active[i]&&req.active[i].moves[+m[1]-1];this.mem.lp=this.mem.lp||{};this.mem.lp[i]=!!(mv&&PROT.includes(mv.id))})};
BattleClient.prototype.stateText=function(req){const b=this.b;const pct=m=>m?Math.round(100*m.hp/m.maxhp)+'%':'-';const bo=m=>{const x=Object.entries(m.boosts||{}).filter(([,v])=>v).map(([k,v])=>`${k}${v>0?'+':''}${v}`);return x.length?' ['+x.join(' ')+']':''};
  const f=b.field;const L=[];L.push(`We are ${this.mySide} (in the log below, ${this.mySide}a/${this.mySide}b are OUR Pokémon; the other side is the opponent).`);L.push(`Turn ${this.turn}. Weather: ${f.weather||'none'}. Terrain: ${f.terrain||'none'}. Field: ${Object.keys(f.pseudoWeather).join(', ')||'none'}.`);
  L.push(`Our side conditions: ${Object.keys(this.me.sideConditions).map(k=>k+(this.me.sideConditions[k].duration?`(${this.me.sideConditions[k].duration})`:'')).join(', ')||'none'}. Their side: ${Object.keys(this.opp.sideConditions).map(k=>k+(this.opp.sideConditions[k].duration?`(${this.opp.sideConditions[k].duration})`:'')).join(', ')||'none'}.`);
  // Turn-by-Turn Speed and Priority Order Ladder
  try {
    const tr = !!f.pseudoWeather.trickroom;
    const all = [...this.me.active.map((m,i) => m && !m.fainted ? { m, who: 'OUR ' + m.name, side: 'OUR' } : null),
                 ...this.opp.active.map(m => m && !m.fainted ? { m, who: 'FOE ' + m.species.name, side: 'FOE' } : null)].filter(Boolean);
    for (const x of all) {
      let v = x.m.getStat('spe');
      const bst = (x.m.boosts && x.m.boosts.spe) || 0;
      if (bst > 0) v = Math.floor(v * (2 + bst) / 2);
      else if (bst < 0) v = Math.floor(v * 2 / (2 - bst));
      const isScarf = x.m.item === 'choicescarf' || (x.m.side === this.opp && this.seen[this.oppId(x.m)] && (this.seen[this.oppId(x.m)].isScarf || this.seen[this.oppId(x.m)].item === 'choicescarf'));
      if (isScarf) v = Math.floor(v * 1.5);
      if (x.m.side.sideConditions.tailwind) v *= 2;
      if (x.m.status === 'par') v = Math.floor(v / 2);
      x.v = v;
      x.modStr = (bst ? ` ${bst > 0 ? '+' : ''}${bst} Spe` : '') +
                 (isScarf ? ' [Scarf]' : '') +
                 (x.m.side.sideConditions.tailwind ? ' [Tailwind]' : '') +
                 (x.m.status === 'par' ? ' [Paralyzed]' : '');
    }
    all.sort((a,b) => tr ? a.v - b.v : b.v - a.v);

    const speedSummary = all.map(x => `${x.who.replace('OUR ','').replace('FOE ','[Foe]')}:${x.v}`).join(' > ');
    if (this.turn > 0 && (!this._lastLoggedTurn || this._lastLoggedTurn !== this.turn)) {
      this._lastLoggedTurn = this.turn;
      this.log(`[T${this.turn} Speed Ladder] ${tr ? '[TR ACTIVE: SLOWEST FIRST] ' : ''}${speedSummary}`);
    }

    L.push(`\n[CURRENT TURN SPEED LADDER]`);
    L.push(`Active Speed Modifiers: ${tr ? `Trick Room (${f.pseudoWeather.trickroom.duration || '?'} turns left) — SLOWEST MOVES FIRST` : 'Normal Speed Order'}` +
           `${this.me.sideConditions.tailwind ? ` | OUR Tailwind (${this.me.sideConditions.tailwind.duration || '?'} turns)` : ''}` +
           `${this.opp.sideConditions.tailwind ? ` | FOE Tailwind (${this.opp.sideConditions.tailwind.duration || '?'} turns)` : ''}`);
    L.push(`Move Order for Normal-Priority (0): ${all.map(x => `${x.who} (${x.v}${x.modStr})`).join(' > ')}`);
    const priNotes = [];
    if (this.me.active.some(m => m && !m.fainted && m.species.name === 'Kingambit')) priNotes.push(`OUR Kingambit: Sucker Punch (+1 pri) hits first if target attacks (fails on status/Protect)`);
    if (this.me.active.some(m => m && !m.fainted && m.name === 'Dragonite' && this.turn === 1)) priNotes.push(`OUR Dragonite: Extreme Speed (+2 pri) / Fake Out (+3 pri)`);
    if (this.opp.active.some(m => m && !m.fainted && ['rillaboom','sneasler','incineroar'].includes(toID(m.species.baseSpecies)))) priNotes.push(`Watch for FOE priority: Fake Out (+3) / Grassy Glide (+1)`);
    if (priNotes.length) L.push(`Priority Brackets Active: ${priNotes.join('; ')}`);

    const setters = (this.oppSets || []).filter(s => (s.moves || []).some(m => /trick ?room/i.test(m))).map(s => s.species);
    if (setters.length && !tr) L.push(`Opponent Trick Room setters (likely): ${setters.join(', ')} — if Trick Room goes up, speed order reverses.`);
  } catch(e) {}
  // Tactical priority / terrain / trickroom / protect alerts
  try{
    const antiPri=this.opp.active.find(m=>m&&!m.fainted&&['armortail','dazzling','queenlymajesty'].includes(m.getAbility().id));
    if(antiPri)L.push(`[TACTICAL ALERT] PRIORITY BLOCKED by ${antiPri.species.name} (${antiPri.getAbility().name}): Foes are IMMUNE to priority moves (Sucker Punch, Fake Out, Prankster status moves aimed at foes)!`);
    if(f.terrain==='psychicterrain')L.push(`[TACTICAL ALERT] PSYCHIC TERRAIN ACTIVE: Grounded targets IMMUNE to priority moves (Sucker Punch, Fake Out, etc.)! Expanding Force hits both targets with 1.5x power.`);
    if(!!f.pseudoWeather.trickroom)L.push(`[TACTICAL ALERT] TRICK ROOM ACTIVE: DO NOT USE TAILWIND! Tailwind makes our team move DEAD LAST under Trick Room. Stall turns or attack with slow hitters (Kingambit/Milotic).`);
    const darkFoes=this.opp.active.filter(m=>m&&!m.fainted&&m.hasType('Dark'));
    if(darkFoes.length&&this.me.active.some(m=>m&&!m.fainted&&m.getAbility().id==='prankster'))L.push(`[TACTICAL ALERT] PRANKSTER IMMUNITY: Dark-type foes (${darkFoes.map(m=>m.species.name).join(', ')}) IMMUNE to Whimsicott's status moves (Encore, etc.).`);
    this.opp.active.forEach(m=>{if(m&&!m.fainted&&m.lastMove&&['protect','detect','spikyshield','banefulbunker','kingsshield','silktrap'].includes(m.lastMove.id)){L.push(`[PROTECT TRACKER] FOE ${m.species.name} used Protect last turn. Consecutive Protect chance is only ~33% — safe to attack!`)}});
  }catch(e){}
  try{const trap=this.opp.active.filter(m=>m&&!m.fainted&&['shadowtag','arenatrap','magnetpull'].includes(m.getAbility().id));
    if(trap.length)L.push(`TRAPPED: ${trap.map(m=>m.species.name+' ('+m.getAbility().name+')').join(', ')} — our Pokémon cannot switch out (Ghost types can; Arena Trap only traps grounded, Magnet Pull only Steel). Perish Song + Shadow Tag: you cannot switch to reset the count — KO the trapper or outlast their counts.`)}catch(e){}
  const mega=this.me.pokemon.some(p=>p.species.isMega);L.push(`Our Mega used: ${mega?'yes':'no'}. Their Mega used: ${this.opp.pokemon.some(p=>p.species.isMega)?'yes':'no'}.`);
  req.active.forEach((a,i)=>{const m=this.me.active[i];if(!m)return;const en=a.moves.filter(x=>!x.disabled);const lock=/choice/.test(String(m.item))&&en.length===1&&a.moves.length>1?` | LOCKED by ${dex.items.get(m.item).name} into ${en[0].move} — switching out resets the lock`:'';L.push(`OUR slot ${i+1}${lock?' ['+lock.slice(3)+']':''}: ${m.name} (${m.species.name}) ${pct(m)} ${m.status||''}${bo(m)} spe ${m.getStat('spe')} | moves: ${a.moves.map((x,k)=>`${k+1}.${x.move}${x.disabled?'(disabled)':''}`).join(' ')}${a.canMegaEvo?' | CAN MEGA':''}`)});
  L.push('Our bench: '+req.side.pokemon.map((p,j)=>p.active?null:`${j+1}.${p.ident.replace(/^p\d: /,'')} ${p.condition}`).filter(Boolean).join(', '));
  this.opp.active.forEach((m,i)=>{if(!m||m.fainted)return;const id=this.oppId(m);const sn=this.seen[id];const rev=sn?[...sn.moves].join('/'):'';
    const anom=sn&&sn.anomalies&&sn.anomalies.length?` | ANOMALIES: ${sn.anomalies.join('; ')}`:'';
    const ded=sn&&sn.deducedSpread?` | [DEDUCED: ${sn.deducedSpread}${sn.item?' @'+sn.item:''} (calcs active)]`:'';
    L.push(`FOE slot ${i+1}: ${m.species.name}${m.__contrary?' [CONTRARY — its stat-drop moves BOOST it; KO it now]':''} ${pct(m)} ${m.status||''}${bo(m)} est.spe ${m.getStat('spe')} | revealed: ${rev||'nothing'}${sn&&sn.item?' @'+sn.item:''} | likely set: ${m.moveSlots.map(x=>x.move).join('/')} @${m.item||'?'} (${m.ability})${anom}${ded}`)});
  if(this.recent&&this.recent.length)L.push('Last turns:\n'+this.recent.slice(-24).join('\n'));
  try{
    delete require.cache[require.resolve('./tactics.js')];
    const T=require('./tactics.js');
    if(T&&T.getTacticalNotes){
      const notes=T.getTacticalNotes(b,req);
      if(notes&&notes.length){
        L.push('[AUTONOMOUS LEARNED TACTICS]\n'+notes.map(n=>'• '+n).join('\n'));
      }
    }
  }catch(e){}
  return L.join('\n')};
// expert replay references for the current position
const XP=(()=>{try{return require('./replays.js')}catch(e){return null}})();
const WXN={sunnyday:'SunnyDay',desolateland:'DesolateLand',raindance:'RainDance',primordialsea:'PrimordialSea',sandstorm:'Sandstorm',snowscape:'Snowscape',snow:'Snowscape',hail:'Hail'};
const TRN={psychicterrain:'Psychic Terrain',grassyterrain:'Grassy Terrain',electricterrain:'Electric Terrain',mistyterrain:'Misty Terrain'};
BattleClient.prototype.expertText=function(cfg){try{const E=(this.expertCfg||{});if(E.enabled===false||!XP||!this.b)return '';
  const pc=m=>Math.round(100*m.hp/m.maxhp);const q={my:this.me.active.map(m=>m&&!m.fainted?{base:XP.base(m.species.name),hp:pc(m)}:null),foe:this.opp.active.map(m=>m&&!m.fainted?{base:XP.base(m.species.name),hp:pc(m)}:null),
    tr:!!this.b.field.pseudoWeather.trickroom,weather:WXN[this.b.field.weather]||'',terrain:TRN[this.b.field.terrain]||'',twMe:!!this.me.sideConditions.tailwind,twFoe:!!this.opp.sideConditions.tailwind};
  const list=XP.similar(q,E.k||2);if(list.length){this.rep.expertRefs=(this.rep.expertRefs||0)+1}return XP.describe(list)}catch(e){return ''}};
BattleClient.prototype.applyDeductions=function(deductions){
  if(!deductions||typeof deductions!=='object')return;
  for(const [sp,d] of Object.entries(deductions)){
    if(!d||typeof d!=='object')continue;
    const mon=this.opp&&this.opp.pokemon.find(p=>toID(p.species.baseSpecies)===toID(sp)||toID(p.name)===toID(sp)||toID(p.species.name)===toID(sp));
    const id=toID(dex.species.get(sp).baseSpecies||sp);
    const sn=this.seenFor(id,sp);
    if(d.item){const it=toID(d.item);sn.item=it;if(mon)mon.item=it}
    if(d.speedTier==='scarf'){sn.isScarf=true;if(!sn.item){sn.item='choicescarf';if(mon)mon.item='choicescarf'}}
    if(d.spread){
      let evs=null;
      if(d.spread==='bulky_spd'||d.spread==='special_bulk')evs={hp:252,spd:252};
      else if(d.spread==='bulky_def'||d.spread==='physical_bulk')evs={hp:252,def:252};
      else if(d.spread==='max_bulk'||d.spread==='bulky')evs={hp:252,def:128,spd:128};
      else if(d.spread==='offensive_fast'||d.spread==='fast')evs={spa:252,spe:252};
      else if(typeof d.spread==='object')evs=d.spread;
      if(evs){sn.evOverride=evs;sn.deducedSpread=typeof d.spread==='string'?d.spread:'custom';if(mon)mon.evOverride=evs}
    }
    this.log(`[Deduction applied] ${sp}: ${JSON.stringify(d)} — future calcs updated.`);
  }
};
BattleClient.prototype.updatePredForChoice=function(req,cmd){
  if(!this.b||!cmd||req.teamPreview||req.forceSwitch)return;
  try{
    const parts=cmd.split(/\s*,\s*/);const foes=this.opp.active;
    this.mem.pred=parts.map((p,i)=>{
      const m=this.me.active[i];if(!m||!p.startsWith('move'))return null;
      const mm=p.match(/^move (\d)(?:\s+(-?\d))?/);if(!mm)return null;
      const mv=req.active[i]&&req.active[i].moves[+mm[1]-1];if(!mv)return null;
      const tgt=+mm[2];const tgts=[];
      if(tgt>0&&foes[tgt-1]&&!foes[tgt-1].fainted)tgts.push({name:foes[tgt-1].species.name,mon:foes[tgt-1]});
      else if(['allAdjacentFoes','allAdjacent'].includes(dex.moves.get(mv.id).target)){foes.forEach(f=>{if(f&&!f.fainted)tgts.push({name:f.species.name,mon:f})})}
      const spr=P.isSpreadNow?P.isSpreadNow(this.b,m,mv.id):false;
      return {who:m.name,move:mv.move,targets:tgts.map(x=>{const r=P.dmgR(this.b,m,x.mon,mv.id,spr);return {name:x.name,min:r.min/x.mon.maxhp,max:r.max/x.mon.maxhp}})};
    });
  }catch(e){}
};
BattleClient.prototype.formatActionAndCalcs=function(req,cmd){
  if(!this.b||!cmd||req.teamPreview||req.forceSwitch)return [];
  const lines=[];
  try{
    const parts=cmd.split(/\s*,\s*/);const foes=this.opp.active.filter(f=>f&&!f.fainted);
    const actionParts=[];
    parts.forEach((p,i)=>{
      const mon=this.me.active[i];if(!mon||mon.fainted)return;
      if(p.startsWith('switch')){
        const idx=+p.split(' ')[1]-1;const targetMon=this.me.pokemon[idx];
        actionParts.push(`${mon.name} switches to ${targetMon?targetMon.name:'bench'}`);
      }else if(p.startsWith('move')){
        const mm=p.match(/^move (\d)(?:\s+(-?\d))?/);
        if(mm){
          const moveIdx=+mm[1]-1;
          const mvObj=req.active[i]&&req.active[i].moves[moveIdx];
          if(mvObj){
            const mv=dex.moves.get(mvObj.id);const tgt=+mm[2];let dmgStr='';
            const tag=p.includes('mega')?' [Mega]':(p.includes('terastallize')?' [Tera]':'');
            if(mv.category!=='Status'){
              const spr=P.isSpreadNow?P.isSpreadNow(this.b,mon,mv.id):false;
              const f=(tgt>0&&this.opp.active[tgt-1])?this.opp.active[tgt-1]:(!tgt&&foes[0]?foes[0]:null);
              if(f&&!f.fainted&&!['allAdjacentFoes','allAdjacent'].includes(mv.target)){
                const r=P.dmgR(this.b,mon,f,mv.id,spr);
                const isFull=f.hp>=f.maxhp;const koText=isFull?'OHKO':'KO';
                const ko=r.min>=f.hp?` ${koText}`:(r.max>=f.hp?` (${koText} ${Math.round(100*P.koP(r,f.hp))}%)`:'');
                dmgStr=` -> ${f.species.name} (${Math.round(100*r.min/f.maxhp)}-${Math.round(100*r.max/f.maxhp)}%${ko})`;
              }else if(['allAdjacentFoes','allAdjacent'].includes(mv.target)){
                const dl=foes.map(f=>{
                  const r=P.dmgR(this.b,mon,f,mv.id,spr);
                  const isFull=f.hp>=f.maxhp;const koText=isFull?'OHKO':'KO';
                  const ko=r.min>=f.hp?` ${koText}`:(r.max>=f.hp?` (${koText} ${Math.round(100*P.koP(r,f.hp))}%)`:'');
                  return `${f.species.name} (${Math.round(100*r.min/f.maxhp)}-${Math.round(100*r.max/f.maxhp)}%${ko})`;
                });
                dmgStr=dl.length?` (spread) -> ${dl.join(', ')}`:'';
              }
            }
            actionParts.push(`${mon.name}: ${mv.name}${tag}${dmgStr}`);
          }
        }
      }else if(p==='pass'){actionParts.push(`${mon.name}: pass`)}
    });
    if(actionParts.length)lines.push(`Action: ${actionParts.join(' | ')}`);
    const threatParts=[];
    this.me.active.forEach(our=>{
      if(!our||our.fainted)return;let topThreat=null,topDmg=0;
      foes.forEach(foe=>{
        for(const ms of foe.moveSlots){
          const mv=dex.moves.get(ms.id);if(mv.category==='Status')continue;
          const spr=P.isSpreadNow?P.isSpreadNow(this.b,foe,mv.id):false;
          const r=P.dmgR(this.b,foe,our,mv.id,spr);
          if(r.max>topDmg){
            topDmg=r.max;
            const isFull=our.hp>=our.maxhp;const koText=isFull?'OHKO':'KO';
            const ko=r.min>=our.hp?` ${koText}`:(r.max>=our.hp?` (${koText} ${Math.round(100*P.koP(r,our.hp))}%)`:'');
            topThreat=`${foe.species.name} ${mv.name} (${Math.round(100*r.min/our.maxhp)}-${Math.round(100*r.max/our.maxhp)}%${ko})`;
          }
        }
      });
      if(topThreat&&topDmg>0)threatParts.push(`${our.name} threatened by ${topThreat}`);
    });
    if(threatParts.length)lines.push(`Threats: ${threatParts.join('; ')}`);
  }catch(e){}
  return lines;
};
BattleClient.prototype.askClaude=async function(cfg,req,base){if(!this.b||!req.active||req.forceSwitch||req.wait)return {cmd:base,src:'wolfe'};
  const cands=(this.mem.cands||[]).filter(c=>this.validate(req,c.cmd));if(!cands.find(c=>c.cmd===base)&&this.validate(req,base))cands.unshift({cmd:base,score:'-',desc:'(engine pick)'});
  let dt='';try{dt=P.damageTable(this.b,'p1',req)}catch(e){}
  const user=this.stateText(req)+dt+this.expertText(cfg)+'\n\nCANDIDATES (engine score, higher = engine prefers):\n'+cands.map((c,i)=>`${i}. [${c.score}] ${c.cmd}  —  ${c.desc}`).join('\n');
  this.rep.llm=this.rep.llm||{calls:0,used:0,fallback:0,override:0,notes:[]};this.rep.llm.calls++;
  try{const r=await LLM.callClaude(cfg,{role:'turn',system:LLM.TURN_SYSTEM(),user,maxTokens:cfg.maxTokens||300,timeoutMs:cfg.turnTimeoutMs||25000});const j=LLM.parseJSON(r.text);
    if(j.deductions)this.applyDeductions(j.deductions);
    let cmd=j.pick>=0&&cands[j.pick]?cands[j.pick].cmd:(j.cmd||'').trim();if(!this.validate(req,cmd))throw new Error('invalid choice from Claude: '+cmd);
    this.updatePredForChoice(req,cmd);
    const calcs=this.formatActionAndCalcs(req,cmd);
    this.rep.llm.used++;this.rep.llm.inputTokens=(this.rep.llm.inputTokens||0)+(r.usage.input_tokens||0);this.rep.llm.outputTokens=(this.rep.llm.outputTokens||0)+(r.usage.output_tokens||0);
    if(cmd!==base)this.rep.llm.override++;
    const noteLines=[`T${this.turn}: ${cmd}${cmd!==base?' (override; engine wanted '+base+')':''} — ${j.why||''} [${r.ms}ms]`];
    if(calcs&&calcs.length)calcs.forEach(c=>noteLines.push('    '+c));
    this.rep.llm.notes.push(noteLines.join('\n'));
    return {cmd,src:'claude',why:j.why,ms:r.ms,calcs,override:cmd!==base,base,deductions:j.deductions}}
  catch(e){this.rep.llm.fallback++;this.rep.llm.notes.push(`T${this.turn}: fallback to engine (${e.message.slice(0,80)})`);return {cmd:base,src:'wolfe-fallback',err:e.message}}};
BattleClient.prototype.askPreview=async function(cfg,req,base){const team=req.side.pokemon.map((p,j)=>`${j+1}. ${p.ident.replace(/^p\d: /,'')} (${p.details.split(',')[0]}) @ ${p.item} | ${p.moves.join('/')}`).join('\n');
  const opp=(this.oppSets||[]).map(s=>`- ${s.species} @ ${s.item} (${s.ability}) ${s.moves.join('/')}`).join('\n');let plans='';try{plans=LRN.planTable().filter(x=>x.arch===this.arch).map(x=>`${x.arm}: ${x.games} games, ${Math.round(100*x.winRate)}% wins`).join('; ')}catch(e){}
  const leadHint=this.mem.plan&&this.mem.plan.lead==='zk'?'Kingambit':(this.mem.plan&&this.mem.plan.lead==='zg'?'Garchomp':'Tailwind (Whimsicott)');
  let scoutText='';
  try{
    const Scouting=require('./scouting.js');
    const scout=Scouting.getScoutReport(this.oppName);
    if(scout){
      scoutText=Scouting.formatScoutPrompt(scout);
      this.log(`[Scouting] REMATCH vs ${scout.opponent}! Head-to-Head: ${scout.record} | Known Leads: ${scout.knownLeads.join(' | ') || 'none'}`);
    }
  }catch(e){}
  let tournamentText='';
  try{
    const TP=require('./tournament-plans.js');
    const oppMons=(this.oppSets||[]).map(s=>s.species);
    const match=TP.matchTournamentTeam(oppMons);
    if(match){
      tournamentText=TP.formatTournamentPlan(match);
      this.log(`[Tournament Scout] Opponent matches ${match.team.name} (${match.team.rank})! Activating pre-computed tournament plan.`);
    }
  }catch(e){}
  const user=`OUR TEAM:\n${team}\n\nOPPONENT TEAM (likely sets):\n${opp}\n\n${scoutText?scoutText+'\n\n':''}${tournamentText?tournamentText+'\n\n':''}${(()=>{try{return require('./update-meta.js').metaSummary()}catch(e){return ''}})()}\n\nOpponent archetype: ${this.arch}. Learned plan results for this archetype: ${plans||'none yet'}. The learning system suggests: Mega ${this.mem.plan&&this.mem.plan.mega}, ${leadHint} lead, i.e. "${base}".`;
  this.rep.llm=this.rep.llm||{calls:0,used:0,fallback:0,override:0,notes:[]};this.rep.llm.calls++;
  try{const r=await LLM.callClaude(cfg,{role:'preview',system:LLM.PREVIEW_SYSTEM(),user,maxTokens:300,timeoutMs:cfg.previewTimeoutMs||40000});const j=LLM.parseJSON(r.text);let cmd='team '+String(j.team).replace(/\D/g,'').slice(0,6);
    if(!this.validate(req,cmd))throw new Error('invalid preview: '+cmd);this.rep.llm.used++;this.rep.llm.inputTokens=(this.rep.llm.inputTokens||0)+(r.usage.input_tokens||0);this.rep.llm.outputTokens=(this.rep.llm.outputTokens||0)+(r.usage.output_tokens||0);
    if(cmd!==base)this.rep.llm.override++;
    const picks=String(j.team).replace(/\D/g,'').slice(0,4).split('').map(n=>req.side.pokemon[+n-1]).filter(Boolean);
    if(this.arch==='psyterrain'){const ki=picks.findIndex(p=>/kingambit/i.test(p.details));if(ki>=2){const swap=picks.slice(0,2).findIndex(p=>!/charizardite|dragoninite/i.test(p.item));if(swap>=0){[picks[swap],picks[ki]]=[picks[ki],picks[swap]];const order=picks.map(p=>req.side.pokemon.indexOf(p)+1).join('');j.team=order+String(j.team).replace(/\D/g,'').slice(4);this.log('psyterrain: moved Kingambit into the lead')}}}
    const mi=picks.find(p=>/charizardite|dragoninite/i.test(p.item));const leads=picks.slice(0,2);
    const lead=leads.some(p=>/kingambit/i.test(p.details))?'zk':(leads.some(p=>/garchomp/i.test(p.details))?'zg':(leads.some(p=>p.moves.some(m=>/fakeout/i.test(m)))?'zf':'zw'));
    this.mem.picked=picks.map(p=>p.ident.replace(/^p\d: /,''));cmd=this.arch==='psyterrain'?('team '+String(j.team).replace(/\D/g,'').slice(0,6)):cmd;if(mi){this.mem.mega=mi.details.split(',')[0]}
    if(this.mem.plan)this.mem.plan={...this.mem.plan,mega:this.mem.mega||this.mem.plan.mega,lead,arm:(this.mem.mega||this.mem.plan.mega)+'|'+lead,byClaude:true}
    this.rep.llm.notes.push(`Preview: ${cmd} — ${j.why||''} [${r.ms}ms]`);
    return {cmd,src:'claude',why:j.why,ms:r.ms,override:cmd!==base,base,lead:leads.map(p=>p.details.split(',')[0]).join(' + '),back:picks.slice(2,4).map(p=>p.details.split(',')[0]).join(' + '),mega:this.mem.mega,plan:this.mem.plan,picks:this.mem.picked}}
  catch(e){this.rep.llm.fallback++;this.rep.llm.notes.push(`Preview: fallback (${e.message.slice(0,80)})`);return {cmd:base,src:'wolfe-fallback',err:e.message}}};
// keep a short log of recent public events for the LLM
const _hl=BattleClient.prototype.handleLine;BattleClient.prototype.handleLine=function(line){const p=line.split('|');
  if(p[1]==='player'&&p[3]){const u=p[3].trim();if(u&&!u.toLowerCase().includes('jj1ne'))this.oppName=u}
  if(p[1]==='switch'&&this.turn===0&&this.mySide&&!line.startsWith('|switch|'+this.mySide)){
    const mon=p[3].split(',')[0].trim();this.oppLeads=this.oppLeads||[];if(!this.oppLeads.includes(mon))this.oppLeads.push(mon);
  }
  if(['move','faint','switch','-damage','-boost','-unboost','-weather','-fieldstart','-sidestart','-mega','turn','-status'].includes(p[1])&&!line.includes('[silent]')){this.recent=this.recent||[];this.recent.push(line.replace(/\|\[(from|of|spread)\][^|]*/g,'').slice(0,90));if(this.recent.length>60)this.recent.shift()}
  return _hl.call(this,line)};
