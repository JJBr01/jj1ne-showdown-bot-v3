// Live meta updater: imports ranked VGCPastes teams and builds weighted defaults plus exact team sets.
// Run manually: node update-meta.js (the bot also runs it at startup when the data is stale).
const fs=require('fs');const path=require('path');
const SHEET_ID='1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw';
const DATA=process.env.BOT_DATA||path.join(__dirname,'data');if(!fs.existsSync(DATA))fs.mkdirSync(DATA,{recursive:true});
const F={cache:path.join(DATA,'paste_cache.json'),meta:path.join(DATA,'meta.json'),teams:path.join(DATA,'meta_teams.json'),db:path.join(__dirname,'setdb.json')};
const BASE=process.env.META_BASE||'https://docs.google.com';const PBASE=process.env.PASTE_BASE||'';
const toID=s=>(''+s).toLowerCase().replace(/[^a-z0-9]/g,'');
let DEX=null;try{DEX=require('./ps/dist/sim/dex').Dex.forFormat('gen9championsvgc2026regmc')}catch(e){}
const canon=sp=>{if(!DEX)return sp;const s=DEX.species.get(sp);if(!s.exists)return sp;return (s.isMega&&s.baseSpecies)?s.baseSpecies:s.name};
function isStale(hours){try{const m=JSON.parse(fs.readFileSync(F.meta,'utf8'));return Date.now()-new Date(m.updated).getTime()>hours*3600e3}catch(e){return true}}
function parseCSV(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}else{if(c=='"')q=true;else if(c==','){r.push(f);f=''}else if(c=='\n'){r.push(f);rows.push(r);r=[];f=''}else if(c!='\r')f+=c}}if(f||r.length){r.push(f);rows.push(r)}return rows}
const K={HP:0,Atk:1,Def:2,SpA:3,SpD:4,Spe:5},KEYS=['hp','atk','def','spa','spd','spe'];
function parsePaste(txt){const out=[];for(const blk of String(txt).replace(/\r/g,'').split(/\n\s*\n/)){const L=blk.split('\n').map(s=>s.trim()).filter(Boolean);if(!L.length)continue;
  let [nm,item]=L[0].split(' @ ');nm=nm.replace(/\s*\((M|F)\)\s*$/,'').trim();const m=nm.match(/\(([^)]+)\)\s*$/);const sp=(m?m[1]:nm).trim().replace(/-Mega(-[XYZ])?$/,'');if(!sp||sp.length>30)continue;
  let ab='',nat='',ev=null,mv=[];for(const l of L.slice(1)){if(l.startsWith('Ability:'))ab=l.slice(8).trim();else if(/ Nature$/.test(l))nat=l.replace(' Nature','');
    else if(l.startsWith('EVs:')){ev=[0,0,0,0,0,0];for(const p of l.slice(4).split('/')){const [v,s]=p.trim().split(' ');if(K[s]!=null)ev[K[s]]=+v}if(Math.max(...ev)>32)ev=ev.map(v=>Math.round(v/8))}
    else if(l.startsWith('- '))mv.push(l.slice(2).trim())}
  if(mv.length)out.push({species:canon(sp),item:(item||'').trim(),ability:ab,nature:nat,ev,moves:mv})}return out}
const norm=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function placementNumber(value){const m=String(value||'').match(/\d+/);return m?+m[0]:null}
function placementWeight(rank){return rank===1?8:rank<=4?5:rank<=8?3:rank<=16?2:1}
function parseSheetDate(value){const n=Date.parse(String(value||'').trim());return Number.isFinite(n)?n:null}
function sheetColumns(rows){const headerIndex=rows.findIndex(r=>r.some(c=>norm(c)==='team id')&&r.some(c=>norm(c)==='pokepaste')&&r.some(c=>norm(c)==='tournament event'));
  if(headerIndex<0)throw new Error('could not find Team ID/Pokepaste/Tournament headers');const h=rows[headerIndex].map(norm);const find=name=>h.findIndex(x=>x===name);const event=find('tournament event');return {headerIndex,teamId:find('team id'),pokepaste:find('pokepaste'),event,rank:find('rank'),date:event-1}}
function selectTeamRows(rows,{maxPlacement=16,recentDays=90,minTeams=5}={}){const c=sheetColumns(rows);const valid=rows.slice(c.headerIndex+1).map(row=>{const url=(row[c.pokepaste]||row.find(x=>/pokepast\.es\/[0-9a-f]+/i.test(x))||'').trim();return {id:(row[c.teamId]||'').trim(),url,event:(row[c.event]||'').trim(),rank:placementNumber(row[c.rank]),date:(row[c.date]||'').trim(),dateMs:parseSheetDate(row[c.date])}}).filter(x=>/^M[A-Z]\d+$/.test(x.id)&&x.url);
  const ranked=valid.filter(x=>x.event&&x.event!=='-'&&x.rank!==null&&x.rank<=maxPlacement);let chosen=ranked,selection=`top ${maxPlacement}`;
  if(recentDays>0&&ranked.length){const newest=Math.max(...ranked.map(x=>x.dateMs||0));const cutoff=newest-recentDays*864e5;const recent=ranked.filter(x=>x.dateMs!==null&&x.dateMs>=cutoff);if(recent.length>=minTeams){chosen=recent;selection=`top ${maxPlacement}, last ${recentDays} days`}}
  if(chosen.length<minTeams){chosen=valid;selection='all teams (ranked sample too small)'}
  const unique=new Map();for(const x of chosen){x.weight=x.rank===null?1:placementWeight(x.rank);const old=unique.get(x.url);if(!old||x.weight>old.weight||x.weight===old.weight&&(x.dateMs||0)>(old.dateMs||0))unique.set(x.url,x)}
  return {rows:[...unique.values()],selection,totalRows:valid.length,rankedRows:ranked.length,columns:c}}
function evObject(ev){const out={};KEYS.forEach((k,i)=>out[k]=ev?ev[i]||0:0);return out}
function setSignature(s){return JSON.stringify([s.item,s.ability,s.nature,s.ev||[],s.moves])}
function aggregateTeams(records,sheet,selection){const agg={},usage={},pairs={};let sets=0,totalWeight=0;const teams=[];const inc=(o,k,n)=>{if(k)o[k]=(o[k]||0)+n};
  for(const rec of records){const team=parsePaste(rec.paste);if(!team.length)continue;const weight=rec.weight||1;totalWeight+=weight;sets+=team.length;const ids=[...new Set(team.map(s=>s.species))];for(const a of ids){inc(usage,a,weight);for(const b of ids)if(a<b)inc(pairs,a+' + '+b,weight)}
    const teamSets=team.map(s=>({species:s.species,item:s.item,ability:s.ability,nature:s.nature,evs:evObject(s.ev),moves:s.moves}));teams.push({id:rec.id,event:rec.event,rank:rec.rank,date:rec.date,weight,url:rec.url,species:ids,sets:teamSets});
    for(const s of team){const a=agg[s.species]=agg[s.species]||{teamCount:0,weight:0,mv:{},variants:{}};a.teamCount++;a.weight+=weight;s.moves.forEach(x=>inc(a.mv,x,weight));const sig=setSignature(s);const v=a.variants[sig]=a.variants[sig]||{species:s.species,item:s.item,ability:s.ability,nature:s.nature,evs:evObject(s.ev),moves:s.moves,weight:0,count:0,teamIds:[]};v.weight+=weight;v.count++;if(v.teamIds.length<5)v.teamIds.push(rec.id)}}
  const top=(o,k=1)=>Object.entries(o).sort((x,y)=>y[1]-x[1]).slice(0,k);const db={};for(const [sp,a] of Object.entries(agg)){if(a.teamCount<2)continue;const variants=Object.values(a.variants).sort((x,y)=>y.weight-x.weight||y.count-x.count).slice(0,5);const best=variants[0];db[toID(sp)]={...best,n:a.weight,teamCount:a.teamCount,variants,moveFreq:Object.fromEntries(top(a.mv,8)),source:`VGCPastes ranked (${sheet}; ${selection})`}}
  const pct=n=>totalWeight?Math.round(1000*n/totalWeight)/10:0;const meta={updated:new Date().toISOString(),sheet,selection,teams:teams.length,sets,totalWeight,usage:top(usage,40).map(([s,c])=>({species:s,pct:pct(c),item:(db[toID(s)]||{}).item||''})),topPairs:top(pairs,25).map(([p,c])=>({pair:p,pct:pct(c)}))};return {db,meta,teams}}
async function getText(url,ms=20000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status+' '+url);return await r.text()}finally{clearTimeout(t)}}
function atomicJSON(file,value){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,1));fs.renameSync(tmp,file)}
async function updateMeta({log=console.log,sheet='Champions M-C',concurrency=6,maxPlacement=16,recentDays=90,minTeams=5}={}){
  const csv=await getText(`${BASE}/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(sheet)}`);const selected=selectTeamRows(parseCSV(csv),{maxPlacement,recentDays,minTeams});if(selected.rows.length<5)throw new Error('sheet returned only '+selected.rows.length+' usable teams');log(`Meta selection: ${selected.selection} (${selected.rows.length} unique pastes from ${selected.totalRows} rows)`);
  let cache={};try{cache=JSON.parse(fs.readFileSync(F.cache,'utf8'))}catch(e){}
  const todo=selected.rows.filter(r=>!cache[r.url]);let i=0,fresh=0;async function worker(){while(i<todo.length){const rec=todo[i++];try{const id=rec.url.match(/pokepast\.es\/([0-9a-f]+)/i)[1];const j=JSON.parse(await getText((PBASE||'https://pokepast.es')+'/'+id+'/json'));cache[rec.url]=j.paste;fresh++}catch(e){log(`Skipped ${rec.id}: ${e.message}`)}}}
  await Promise.all(Array.from({length:concurrency},worker));atomicJSON(F.cache,cache);const records=selected.rows.filter(r=>cache[r.url]).map(r=>({...r,paste:cache[r.url]}));const built=aggregateTeams(records,sheet,selected.selection);const species=Object.keys(built.db).length;if(species<10)throw new Error('only '+species+' species parsed — keeping the old database');
  let old={};try{old=JSON.parse(fs.readFileSync(F.db,'utf8'))}catch(e){}for(const [id,s] of Object.entries(old))if(!String(s.source||'').startsWith('VGCPastes'))built.db[id]=s;
  atomicJSON(F.db,built.db);atomicJSON(F.meta,built.meta);atomicJSON(F.teams,{updated:built.meta.updated,sheet,selection:selected.selection,teams:built.teams});return {teams:built.meta.teams,sets:built.meta.sets,species,newPastes:fresh,selection:selected.selection}}
function metaSummary(n=25){try{const m=JSON.parse(fs.readFileSync(F.meta,'utf8'));return `Current ranked meta (VGCPastes ${m.sheet}; ${m.selection||'ranked teams'}, ${m.teams} teams, updated ${m.updated.slice(0,10)}): `+m.usage.slice(0,n).map(u=>`${u.species} ${u.pct}%`).join(', ')+'. Common pairs: '+m.topPairs.slice(0,10).map(p=>`${p.pair} ${p.pct}%`).join(', ')+'.'}catch(e){return ''}}
module.exports={updateMeta,isStale,metaSummary,parseCSV,parsePaste,placementNumber,placementWeight,sheetColumns,selectTeamRows,aggregateTeams,F};
if(require.main===module){let opts={};try{opts=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json'),'utf8')).meta||{}}catch(e){}updateMeta(opts).then(r=>console.log(`Meta updated: ${r.teams} teams, ${r.sets} sets, ${r.species} species (${r.newPastes} new pastes; ${r.selection})`)).catch(e=>{console.error('Meta update failed:',e.message);process.exit(1)})}
