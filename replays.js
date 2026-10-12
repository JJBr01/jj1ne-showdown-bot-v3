// Expert replay retrieval: download high-rated Reg M-C replays from Pokémon Showdown, turn every turn into a
// "decision record" (what each strong player had on the field, the field state, what they did, did they win),
// and find the most similar positions for the bot's current turn.
// Run manually:  node replays.js            (download new replays + rebuild the index)
const fs=require('fs');const path=require('path');
const DATA=process.env.BOT_DATA||path.join(__dirname,'data');if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
const F={store:path.join(DATA,'expert_replays.jsonl'),index:path.join(DATA,'expert_index.json')};
const BASE=process.env.REPLAY_BASE||'https://replay.pokemonshowdown.com';const FORMAT='gen9championsvgc2026regmc';
let DEX=null;try{DEX=require('./ps/dist/sim/dex').Dex.forFormat(FORMAT)}catch(e){}
const base=sp=>{if(!DEX)return sp.replace(/-Mega.*$/,'');const s=DEX.species.get(sp);if(!s.exists)return sp;return (s.isMega||s.battleOnly)?(Array.isArray(s.battleOnly)?s.battleOnly[0]:(s.battleOnly||s.baseSpecies)):s.name};
async function getJSON(url,ms=20000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
// ---------- download ----------
async function download({minRating=1450,maxPages=40,log=console.log,concurrency=6}={}){
  const have=new Set();if(fs.existsSync(F.store))for(const l of fs.readFileSync(F.store,'utf8').split('\n'))if(l)try{have.add(JSON.parse(l).id)}catch(e){}
  const want=[];for(let p=1;p<=maxPages;p++){let page;try{page=await getJSON(`${BASE}/search.json?format=${FORMAT}&sort=rating&page=${p}`)}catch(e){log('replay search stopped at page '+p+': '+e.message);break}
    if(!page||!page.length)break;let stop=false;for(const r of page.slice(0,50)){if((r.rating||0)<minRating){stop=true;break}if(!r.private&&!have.has(r.id))want.push(r)}if(stop||page.length<51)break}
  let i=0,got=0;async function worker(){while(i<want.length){const r=want[i++];try{const j=await getJSON(`${BASE}/${r.id}.json`);fs.appendFileSync(F.store,JSON.stringify({id:j.id,rating:r.rating||j.rating,players:j.players,uploadtime:j.uploadtime,log:j.log})+'\n');got++;if(got%100===0)log(`  downloaded ${got}/${want.length} replays…`)}catch(e){}}}
  await Promise.all(Array.from({length:concurrency},worker));return {newReplays:got,total:have.size+got}}
// ---------- parse a replay log into decision records ----------
function parseReplay(rep){const L=rep.log.split('\n');const name={},act={},hp={},boosts={},out=[];let turn=0,winner=null,phase='pre';
  const field={weather:'',terrain:'',tr:false,tw:{p1:false,p2:false}};const team={p1:[],p2:[],};const brought={p1:new Set(),p2:new Set()};const megaUsed={p1:'',p2:''};
  let cur=null;const snap=()=>{const s={};for(const sd of ['p1','p2']){s[sd]={act:['a','b'].map(k=>act[sd+k]?{sp:act[sd+k],hp:hp[sd+k]??100,b:boosts[sd+k]||{}}:null)}}return s};
  const startTurn=()=>{cur={turn,state:snap(),field:{...field,tw:{...field.tw}},acts:{p1:{},p2:{}},ended:false}};
  const flush=()=>{if(!cur)return;for(const sd of ['p1','p2']){const me=cur.state[sd].act,foe=cur.state[sd==='p1'?'p2':'p1'].act;const acts=Object.entries(cur.acts[sd]).map(([k,v])=>v);if(!acts.length)continue;
      out.push({id:rep.id,rating:rep.rating,turn:cur.turn,side:sd,player:name[sd]||'',my:me.map(x=>x&&{sp:x.sp,hp:x.hp,b:x.b}),foe:foe.map(x=>x&&{sp:x.sp,hp:x.hp,b:x.b}),
        field:{weather:cur.field.weather,terrain:cur.field.terrain,tr:cur.field.tr,twMe:cur.field.tw[sd],twFoe:cur.field.tw[sd==='p1'?'p2':'p1']},acts,team:team[sd].slice(),foeTeam:team[sd==='p1'?'p2':'p1'].slice()})}cur=null};
  for(const line of L){const p=line.split('|');const c=p[1];const slot=s=>s&&s.slice(0,3).replace(':','');
    switch(c){
      case 'player':if(p[3])name[p[2]]=p[3];break;
      case 'poke':team[p[2]].push(base(p[3].split(',')[0]));break;
      case 'switch':case 'drag':case 'replace':{const s=slot(p[2]);const sd=s.slice(0,2);const sp=p[3].split(',')[0];
        if(cur&&!cur.ended&&c==='switch'&&!(cur.lastMoveBy===s&&/U-turn|Flip Turn|Parting Shot|Volt Switch|Teleport|Baton Pass|Shed Tail/.test(cur.lastMove||'')))cur.acts[sd][s]=`${act[s]||'?'} → switch to ${sp}`;
        act[s]=sp;brought[sd].add(base(sp));boosts[s]={};const h=(p[4]||'').split(' ')[0].split('/');hp[s]=h[1]?Math.round(100*h[0]/h[1]):100;break}
      case 'detailschange':{const s=slot(p[2]);act[s]=p[3].split(',')[0];break}
      case '-mega':{const s=slot(p[2]);megaUsed[s.slice(0,2)]=p[3];if(cur){const k=cur.acts[s.slice(0,2)];k[s]=(k[s]||'')+'[Mega] '}break}
      case 'move':{if(!cur||p.some(x=>/\[still\]|\[from\]/.test(x)&&/\[from\]/.test(x)))break;const s=slot(p[2]);const sd=s.slice(0,2);const tgt=p[4]&&p[4].includes(':')?slot(p[4]):'';
        const who=act[s]||'?';const spread=(p[5]||'').startsWith('[spread]')||(p.slice(5).join('|').includes('[spread]'));
        const tName=tgt&&tgt!==s?(tgt.slice(0,2)===sd?'ally '+(act[tgt]||'?'):(act[tgt]||'?')):'';const prev=cur.acts[sd][s]||'';
        cur.acts[sd][s]=`${prev.startsWith('[Mega]')?'[Mega] ':''}${who}: ${p[3]}${spread?' (spread)':tName&&tName!==who?' → '+tName:''}`;cur.lastMove=p[3];cur.lastMoveBy=s;break}
      case 'cant':{if(!cur)break;const s=slot(p[2]);cur.acts[s.slice(0,2)][s]=`${act[s]||'?'}: couldn't move (${p[3]})`;break}
      case '-damage':case '-heal':case '-sethp':{const s=slot(p[2]);const h=(p[3]||'').split(' ')[0].split('/');if(p[3]&&p[3].includes('fnt'))hp[s]=0;else if(h[1])hp[s]=Math.round(100*h[0]/h[1]);break}
      case 'faint':hp[slot(p[2])]=0;break;
      case '-boost':case '-unboost':{const s=slot(p[2]);boosts[s]=boosts[s]||{};boosts[s][p[3]]=(boosts[s][p[3]]||0)+(+p[4])*(c==='-boost'?1:-1);break}
      case '-clearallboost':for(const k in boosts)boosts[k]={};break;
      case '-weather':field.weather=(p[2]==='none'?'':p[2]);break;
      case '-fieldstart':{const f=p[2].replace('move: ','');if(/Terrain/.test(f))field.terrain=f;else if(/Trick Room/.test(f))field.tr=true;break}
      case '-fieldend':{const f=p[2].replace('move: ','');if(/Terrain/.test(f))field.terrain='';else if(/Trick Room/.test(f))field.tr=false;break}
      case '-sidestart':if(/Tailwind/.test(p[3]))field.tw[p[2].slice(0,2)]=true;break;
      case '-sideend':if(/Tailwind/.test(p[3]))field.tw[p[2].slice(0,2)]=false;break;
      case 'upkeep':if(cur)cur.ended=true;break;
      case 'turn':flush();turn=+p[2];startTurn();break;
      case 'win':flush();winner=p[2];break;}}
  flush();const won=sd=>winner&&name[sd]&&winner===name[sd];
  for(const d of out)d.won=!!won(d.side);
  const preview=['p1','p2'].map(sd=>({id:rep.id,rating:rep.rating,side:sd,team:team[sd],foeTeam:team[sd==='p1'?'p2':'p1'],brought:[...brought[sd]],mega:megaUsed[sd],won:!!won(sd)}));
  return {decisions:out,preview}}
// ---------- index ----------
function buildIndex({log=console.log}={}){if(!fs.existsSync(F.store))throw new Error('no replays downloaded yet');const dec=[],prev=[];let n=0;
  for(const l of fs.readFileSync(F.store,'utf8').split('\n')){if(!l)continue;let r;try{r=JSON.parse(l)}catch(e){continue}try{const x=parseReplay(r);dec.push(...x.decisions);prev.push(...x.preview);n++}catch(e){}}
  const compact=dec.map(d=>({i:d.id,r:d.rating,t:d.turn,w:d.won?1:0,m:d.my.map(x=>x&&[base(x.sp),x.hp,x.sp]),f:d.foe.map(x=>x&&[base(x.sp),x.hp,x.sp]),fl:[d.field.weather,d.field.terrain,d.field.tr?1:0,d.field.twMe?1:0,d.field.twFoe?1:0],a:d.acts}));
  fs.writeFileSync(F.index,JSON.stringify({built:new Date().toISOString(),replays:n,decisions:compact,previews:prev}));return {replays:n,decisions:compact.length}}
function isStale(hours){try{return Date.now()-new Date(JSON.parse(fs.readFileSync(F.index,'utf8')).built).getTime()>hours*3600e3}catch(e){return true}}
async function refresh(opts={}){const d=await download(opts);const b=buildIndex(opts);_idx=null;return {...d,...b}}
// ---------- retrieval ----------
let _idx=null;function idx(){if(_idx)return _idx;try{_idx=JSON.parse(fs.readFileSync(F.index,'utf8'))}catch(e){_idx={decisions:[],previews:[]}}return _idx}
function similar(q,k=3){const I=idx();if(!I.decisions.length)return [];const qm=q.my.filter(Boolean),qf=q.foe.filter(Boolean);const scored=[];
  for(const d of I.decisions){const dm=d.m.filter(Boolean),df=d.f.filter(Boolean);let s=0;
    const om=qm.filter(x=>dm.some(y=>y[0]===x.base)).length,of=qf.filter(x=>df.some(y=>y[0]===x.base)).length;if(om===0||of===0)continue;
    s+=2.2*om+1.8*of;if((d.fl[2]===1)===q.tr)s+=0.8;else s-=1;if(d.fl[0]&&d.fl[0]===q.weather)s+=0.4;if(d.fl[1]&&d.fl[1]===q.terrain)s+=0.4;if(!!d.fl[3]===q.twMe)s+=0.3;if(!!d.fl[4]===q.twFoe)s+=0.3;
    for(const x of qm){const y=dm.find(z=>z[0]===x.base);if(y)s-=Math.abs(y[1]-x.hp)/100}for(const x of qf){const y=df.find(z=>z[0]===x.base);if(y)s-=Math.abs(y[1]-x.hp)/100}
    s+=(d.r-1400)/400+(d.w?0.3:0);scored.push([s,d])}
  scored.sort((a,b)=>b[0]-a[0]);const seen=new Set(),res=[];for(const [s,d] of scored){if(seen.has(d.i))continue;seen.add(d.i);res.push({score:+s.toFixed(2),...d});if(res.length>=k)break}return res}
function describe(list){if(!list.length)return '';const st=x=>x?`${x[2]} ${x[1]}%`:'—';
  return '\n\nEXPERT REFERENCE — the most similar positions from high-rated Reg M-C ladder replays (a guide, not a rule; their sets and the full board may differ):\n'+
    list.map((d,i)=>`${i+1}) [${d.r}] turn ${d.t}: expert had ${d.m.map(st).join(' + ')} vs ${d.f.map(st).join(' + ')}${d.fl[2]?' | Trick Room':''}${d.fl[0]?' | '+d.fl[0]:''}${d.fl[1]?' | '+d.fl[1]:''}${d.fl[3]?' | their Tailwind':''}${d.fl[4]?' | opp Tailwind':''} → chose: ${d.a.join('; ')} — expert ${d.w?'WON':'lost'} the game`).join('\n')}
module.exports={download,parseReplay,buildIndex,refresh,isStale,similar,describe,base};
if(require.main===module){const a=process.argv;const minRating=+(a[2]||1450),maxPages=+(a[3]||40);
  refresh({minRating,maxPages}).then(r=>console.log(`Expert replays: ${r.newReplays} new, ${r.total} total → index of ${r.decisions} decisions from ${r.replays} games`)).catch(e=>{console.error('Replay update failed:',e.message);process.exit(1)})}
