// Live meta updater: reads the public VGCPastes Repository sheet (Champions M-C tab), fetches every
// pokepaste (cached, so only new ones are downloaded), and rebuilds:
//   setdb.json      — most common item / ability / nature / EV spread / moves per species (used to guess opponent sets)
//   data/meta.json  — usage rates, top items, common partners (shown to Claude at team preview)
// Run manually:  node update-meta.js        (the bot also runs it at startup when older than meta.refreshHours)
const fs=require('fs');const path=require('path');
const SHEET_ID='1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw';
const DATA=process.env.BOT_DATA||path.join(__dirname,'data');if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
const F={cache:path.join(DATA,'paste_cache.json'),meta:path.join(DATA,'meta.json'),db:path.join(__dirname,'setdb.json')};
const BASE=process.env.META_BASE||'https://docs.google.com';const PBASE=process.env.PASTE_BASE||'';
const toID=s=>(''+s).toLowerCase().replace(/[^a-z0-9]/g,'');
let DEX=null;try{DEX=require('./ps/dist/sim/dex').Dex.forFormat('gen9championsvgc2026regmc')}catch(e){}
const canon=sp=>{if(!DEX)return sp;const s=DEX.species.get(sp);if(!s.exists)return sp;return (s.isMega&&s.baseSpecies)?s.baseSpecies:s.name}
function isStale(hours){try{const m=JSON.parse(fs.readFileSync(F.meta,'utf8'));return Date.now()-new Date(m.updated).getTime()>hours*3600e3}catch(e){return true}}
function parseCSV(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else{if(c=='"')q=true;else if(c==','){r.push(f);f=''}else if(c=='\n'){r.push(f);rows.push(r);r=[];f=''}else if(c!='\r')f+=c}}if(f||r.length){r.push(f);rows.push(r)}return rows}
const K={HP:0,Atk:1,Def:2,SpA:3,SpD:4,Spe:5},KEYS=['hp','atk','def','spa','spd','spe'];
function parsePaste(txt){const out=[];for(const blk of String(txt).replace(/\r/g,'').split(/\n\s*\n/)){const L=blk.split('\n').map(s=>s.trim()).filter(Boolean);if(!L.length)continue;
  let [nm,item]=L[0].split(' @ ');nm=nm.replace(/\s*\((M|F)\)\s*$/,'').trim();const m=nm.match(/\(([^)]+)\)\s*$/);const sp=(m?m[1]:nm).trim().replace(/-Mega(-[XYZ])?$/,'');if(!sp||sp.length>30)continue;
  let ab='',nat='',ev=null,mv=[];for(const l of L.slice(1)){if(l.startsWith('Ability:'))ab=l.slice(8).trim();else if(/ Nature$/.test(l))nat=l.replace(' Nature','');
    else if(l.startsWith('EVs:')){ev=[0,0,0,0,0,0];for(const p of l.slice(4).split('/')){const [v,s]=p.trim().split(' ');if(K[s]!=null)ev[K[s]]=+v}if(Math.max(...ev)>32)ev=ev.map(v=>Math.round(v/8))}
    else if(l.startsWith('- '))mv.push(l.slice(2).trim())}
  if(mv.length)out.push({species:canon(sp),item:(item||'').trim(),ability:ab,nature:nat,ev,moves:mv})}return out}
async function getText(url,ms=20000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return await r.text()}finally{clearTimeout(t)}}
async function updateMeta({log=console.log,sheet='Champions M-C',concurrency=6}={}){
  const csv=await getText(`${BASE}/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(sheet)}`);
  const rows=parseCSV(csv).filter(r=>/^M[A-Z]\d+/.test(r[0]||''));if(rows.length<5)throw new Error('sheet returned '+rows.length+' teams');
  const urls=[...new Set(rows.map(r=>(r.find(c=>/pokepast\.es\/[0-9a-f]+/i.test(c))||'').trim()).filter(Boolean))];
  let cache={};try{cache=JSON.parse(fs.readFileSync(F.cache,'utf8'))}catch(e){}
  const todo=urls.filter(u=>!cache[u]);let i=0,fresh=0;
  async function worker(){while(i<todo.length){const u=todo[i++];try{const id=u.match(/pokepast\.es\/([0-9a-f]+)/i)[1];const j=JSON.parse(await getText((PBASE||'https://pokepast.es')+'/'+id+'/json'));cache[u]=j.paste;fresh++}catch(e){}}}
  await Promise.all(Array.from({length:concurrency},worker));fs.writeFileSync(F.cache,JSON.stringify(cache));
  // aggregate
  const agg={},usage={},pairs={};let sets=0,teams=0;
  for(const u of urls){if(!cache[u])continue;const team=parsePaste(cache[u]);if(!team.length)continue;teams++;const ids=[...new Set(team.map(s=>s.species))];
    for(const a of ids){usage[a]=(usage[a]||0)+1;for(const b of ids)if(a<b){const k=a+' + '+b;pairs[k]=(pairs[k]||0)+1}}
    for(const s of team){sets++;const a=agg[s.species]=agg[s.species]||{n:0,item:{},ab:{},nat:{},ev:{},mv:{},nev:0};a.n++;const inc=(o,k)=>{if(k)o[k]=(o[k]||0)+1};
      inc(a.item,s.item);inc(a.ab,s.ability);inc(a.nat,s.nature);s.moves.forEach(x=>inc(a.mv,x));if(s.ev&&s.ev.some(v=>v>0)){a.nev++;inc(a.ev,s.ev.join('/')+'|'+s.nature)}}}
  const top=(o,k=1)=>Object.entries(o).sort((x,y)=>y[1]-x[1]).slice(0,k);
  let old={};try{old=JSON.parse(fs.readFileSync(F.db,'utf8'))}catch(e){}const db={...old};let species=0;
  for(const [sp,a] of Object.entries(agg)){if(a.n<2)continue;const ev=top(a.ev)[0];const evs={};const evArr=ev?ev[0].split('|')[0].split('/').map(Number):null;KEYS.forEach((k,i)=>evs[k]=evArr?evArr[i]:0);
    const mf=Object.fromEntries(top(a.mv,8));db[toID(sp)]={species:sp,n:a.n,item:(top(a.item)[0]||[''])[0],ability:(top(a.ab)[0]||[''])[0],nature:ev?ev[0].split('|')[1]:(top(a.nat)[0]||[''])[0],evs,nEV:a.nev,moves:top(a.mv,4).map(x=>x[0]),moveFreq:mf,source:'VGCPastes live ('+sheet+')'};species++}
  if(species<10)throw new Error('only '+species+' species parsed — keeping the old database');
  fs.writeFileSync(F.db,JSON.stringify(db,null,1));
  const meta={updated:new Date().toISOString(),sheet,teams,sets,usage:top(usage,40).map(([s,c])=>({species:s,pct:Math.round(1000*c/teams)/10,item:(top((agg[s]||{}).item||{})[0]||[''])[0]})),topPairs:top(pairs,25).map(([p,c])=>({pair:p,pct:Math.round(1000*c/teams)/10}))};
  fs.writeFileSync(F.meta,JSON.stringify(meta,null,1));return {teams,sets,species,newPastes:fresh}}
function metaSummary(n=25){try{const m=JSON.parse(fs.readFileSync(F.meta,'utf8'));return `Current meta (VGCPastes ${m.sheet}, ${m.teams} teams, updated ${m.updated.slice(0,10)}): `+m.usage.slice(0,n).map(u=>`${u.species} ${u.pct}%`).join(', ')+'. Common pairs: '+m.topPairs.slice(0,10).map(p=>`${p.pair} ${p.pct}%`).join(', ')+'.'}catch(e){return ''}}
module.exports={updateMeta,isStale,metaSummary,parsePaste};
if(require.main===module)updateMeta({}).then(r=>console.log(`Meta updated: ${r.teams} teams, ${r.sets} sets, ${r.species} species (${r.newPastes} new pastes downloaded)`)).catch(e=>{console.error('Meta update failed:',e.message);process.exit(1)});
