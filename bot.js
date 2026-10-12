// JJ1NE ladder bot — Pokémon Showdown, [Gen 9 Champions] VGC 2026 Reg M-C, Wolfe pilot.
// Usage: node bot.js            (settings in config.json)
const fs=require('fs');const path=require('path');
const {Teams}=require('./ps/dist/sim/teams');const {BattleClient}=require('./client.js');
const CFG=Object.assign({pilot:'wolfe',coachEvery:10,username:'JJ1NE',mode:'ladder',games:10,format:'gen9championsvgc2026regmc',challengeUser:'',acceptFrom:[],delaySeconds:10,server:'wss://sim3.psim.us/showdown/websocket',saveReplays:true},JSON.parse(fs.readFileSync(process.env.BOT_CONFIG||path.join(__dirname,'config.json'),'utf8')));
// command-line override: node bot.js 25   or   node bot.js --games 25   (0 = unlimited)
{const a=process.argv.slice(2);const i=a.indexOf('--games');const v=i>=0?a[i+1]:a.find(x=>/^\d+$/.test(x));if(v!==undefined&&/^\d+$/.test(v))CFG.games=+v}
const Exp=require('./experiments.js');const LLM=require('./llm.js');let session={in:0,out:0,usd:0};const {runCoach}=require('./coach.js');
const TeamEvolution=require('./team-evolution.js');
function getTeamText(){return Exp.getActiveTeamText()}
function getPacked(){return Exp.getActivePacked()}
const WS=globalThis.WebSocket||require('ws');
const BLOGS=process.env.BOT_BATTLELOGS||path.join(__dirname,'battlelogs');if(!fs.existsSync(BLOGS))fs.mkdirSync(BLOGS,{recursive:true});
const LOG=process.env.BOT_LOG||path.join(__dirname,'bot.log'),CSV=process.env.BOT_CSV||path.join(__dirname,'results.csv');
function easternTime(forFile=false){const d=new Date();const date=d.toLocaleDateString('sv-SE',{timeZone:'America/New_York'});const time=d.toLocaleTimeString('en-US',{timeZone:'America/New_York',hour12:false});const tz=d.toLocaleTimeString('en-US',{timeZone:'America/New_York',timeZoneName:'short'}).split(' ').pop();return forFile?(date+'T'+time.replace(/:/g,'-')+'-'+tz):(date+' '+time+' '+tz)}
const log=(...a)=>{const l=`[${easternTime()}] ${a.join(' ')}`;console.log(l);fs.appendFileSync(LOG,l+'\n')};
if(!fs.existsSync(CSV))fs.writeFileSync(CSV,'time,battle,opponent,result,turns,archetype,plan,mega,lead,replay,report\n');
const toID=s=>(''+s).toLowerCase().replace(/[^a-z0-9]/g,'');
let ws,played=0,searching=false,battles={},stopping=false;const finished=new Set();
const send=m=>{if(ws&&ws.readyState===1)ws.send(m)};
function stopRequested(){return stopping||fs.existsSync(path.join(__dirname,'STOP'))}
function nextGame(){if(stopRequested()){log('STOP requested — finishing.');return shutdown()}
  if(played>=CFG.games&&CFG.games>0){log(`Played ${played} of ${CFG.games} battles — done.`);return shutdown()}
  if(Object.values(battles).some(b=>!b.ended))return;
  send('|/utm '+getPacked());
  if(CFG.mode==='ladder'){send('|/search '+CFG.format);searching=true;log('Searching ladder:',CFG.format,`[Loadout: ${Exp.getActiveVariant()}]`)}
  else if(CFG.mode==='challenge'&&CFG.challengeUser){send(`|/challenge ${CFG.challengeUser}, ${CFG.format}`);log('Challenged',CFG.challengeUser);const n=played;setTimeout(()=>{if(played===n&&!Object.values(battles).some(b=>!b.ended)){send('|/cancelchallenge '+CFG.challengeUser);nextGame()}},30000)}
  else log('Waiting for challenges (accept mode)…')}
function shutdown(){setTimeout(()=>{try{ws.close()}catch(e){}process.exit(0)},3000)}
async function login(challstr){
  if(CFG.noAssertion){send(`|/trn ${CFG.username}`);return}
  const url=`https://play.pokemonshowdown.com/~~showdown/action.php?act=getassertion&userid=${toID(CFG.username)}&challstr=${encodeURIComponent(challstr)}`;
  const r=await fetch(url);const assertion=(await r.text()).trim();
  if(assertion.startsWith(';')){log(`Login failed: "${CFG.username}" is a registered name (needs a password) or was rejected: ${assertion}`);process.exit(1)}
  send(`|/trn ${CFG.username},0,${assertion}`)}
function onBattleMessage(room,lines){
  if(finished.has(room))return;
  let st=battles[room];if(!st){if(!lines.some(l=>l.startsWith('|init|battle')||l.startsWith('|request|')||l.startsWith('|player|')))return;st=battles[room]={client:Object.assign(new BattleClient(getTeamText(),m=>log(room,m)),{expertCfg:CFG.expert||{}}),rqid:null,opp:'?',lead:'',ended:false};send(`${room}|/acceptopenteamsheets`)}
  const c=st.client;
  for(let i=0;i<lines.length;i++){let line=lines[i];
    if(line.startsWith('|split|')){const sd=line.split('|')[2];const secret=lines[i+1],pub=lines[i+2];i+=2;line=(c.mySide===sd)?secret:pub;if(!line)continue}
    if(!line.startsWith('|request|'))(st.raw=st.raw||[]).push(line);
    let choice=null;
    if(line.startsWith('|request|')){const raw=line.slice(9);if(!raw)continue;const req=JSON.parse(raw);st.rqid=req.rqid;choice=c.onRequest(req)}
    else if(line.startsWith('|error|')){if(/\[(Invalid|Unavailable) choice\]/.test(line)){log(room,'choice rejected → default:',line);send(`${room}|/choose default|${st.rqid}`)}continue}
    else{if(line.startsWith('|player|')){const p=line.split('|');if(p[3]&&toID(p[3])!==toID(CFG.username))st.opp=p[3]}
      if(line.startsWith('|switch|')&&c.turn===0&&c.mySide&&line.startsWith('|switch|'+c.mySide))st.lead+=(st.lead?'+':'')+line.split('|')[3].split(',')[0];
      choice=c.handleLine(line)}
    if(choice){const req=c.lastReq;const rq=st.rqid;
      if(CFG.pilot==='claude'&&req&&!req.forceSwitch&&!req.wait&&(req.teamPreview||req.active)){
        (async()=>{
          const isPreview=!!req.teamPreview;
          const r=isPreview?await c.askPreview(CFG.claude||{},req,choice):await c.askClaude(CFG.claude||{},req,choice);
          if(isPreview){
            if(r.src!=='claude'){
              log(room,`[Preview] Engine pick: ${r.cmd} (Claude fallback: ${(r.err||'').slice(0,80)})`);
            }else{
              const leadStr=r.lead?`Leads [${r.lead}] + Back [${r.back||'?'}]`:r.cmd;
              const megaStr=r.mega?` (Mega: ${r.mega})`:'';
              log(room,`[Preview] Decision: ${leadStr}${megaStr}${r.override?' (override; engine suggested '+r.base+')':''} [${r.ms}ms]`);
              if(r.why)log(room,`  Why: ${r.why}`);
              if(r.plan&&r.plan.arm)log(room,`  Plan: ${c.arch} -> ${r.plan.arm}`);
            }
          }else{
            if(r.src!=='claude'){
              log(room,`[T${c.turn}] Decision (Engine fallback): ${r.cmd} (Claude fallback: ${(r.err||'').slice(0,80)})`);
              const calcs=c.formatActionAndCalcs(req,r.cmd);
              if(calcs&&calcs.length)calcs.forEach(line=>log(room,`  ${line}`));
            }else{
              log(room,`[T${c.turn}] Decision: ${r.cmd}${r.override?' (override; engine wanted '+r.base+')':''} [${r.ms}ms]`);
              if(r.why)log(room,`  Why: ${r.why}`);
              if(r.calcs&&r.calcs.length)r.calcs.forEach(line=>log(room,`  ${line}`));
              if(r.deductions&&Object.keys(r.deductions).length){
                const dStr=Object.entries(r.deductions).map(([m,d])=>`${m}: ${JSON.stringify(d)}`).join('; ');
                log(room,`  Deductions: ${dStr}`);
              }
            }
          }
          c.markProtect(req,r.cmd);
          (st.raw=st.raw||[]).push(`|choice|${r.cmd}|${r.src}${r.why?'|'+String(r.why).replace(/\|/g,'/'):''}`);
          if(r.calcs&&r.calcs.length)r.calcs.forEach(line=>(st.raw=st.raw||[]).push(`|calc|${line}`));
          if(st.rqid===rq)send(`${room}|/choose ${r.cmd}|${rq}`);
        })().catch(e=>{
          log(room,'decision error',e.message);
          send(`${room}|/choose ${choice}|${rq}`);
        });
      }else{
        if(req&&req.forceSwitch){
          let swDesc=choice;
          try{
            const parts=choice.split(/\s*,\s*/);
            const descs=parts.map((p,i)=>{
              if(p.startsWith('switch')){
                const idx=+p.split(' ')[1]-1;
                const tm=req.side&&req.side.pokemon&&req.side.pokemon[idx];
                return `in ${tm?tm.ident.replace(/^p\d: /,''):'slot '+(idx+1)}`;
              }
              return null;
            }).filter(Boolean);
            if(descs.length)swDesc=`${descs.join(', ')} (${choice})`;
          }catch(e){}
          log(room,`[T${c.turn}] Forced switch: ${swDesc}`);
        }
        (st.raw=st.raw||[]).push(`|choice|${choice}|engine`);
        send(`${room}|/choose ${choice}|${st.rqid}`);
      }
    }
    if(c.result&&!st.ended){st.ended=true;played++;const res=c.result==='tie'?'tie':(toID(c.result)===toID(CFG.username)?'W':'L');
      try{
        Exp.recordGameResult(res==='W');
        TeamEvolution.recordGame(res==='W', log);
      }catch(e){}
      const replay=`https://replay.pokemonshowdown.com/${room.replace(/^battle-/,'')}`;
      const time=easternTime(true);let logFile='';try{logFile=path.join(BLOGS,`${time}_${res}_${toID(st.opp)}_${room.replace(/^battle-/,'')}.log`);fs.writeFileSync(logFile,(st.raw||[]).join('\n')+'\n')}catch(e){log('battle log write failed',e.message)}
      let fin={};try{fin=c.finish({time,battle:room,opponent:st.opp,result:res,replay:CFG.saveReplays?replay:'',battleLog:logFile?path.basename(logFile):''})}catch(e){log('finish error',e.message)}
      fs.appendFileSync(CSV,[time,room,st.opp,res,c.turn,fin.arch||'',(fin.plan&&fin.plan.arm)||'',c.mem.mega||'',st.lead,CFG.saveReplays?replay:'',fin.report?path.basename(fin.report):''].join(',')+'\n');
      const S=fin.stats;log(`Game ${played}: ${res} vs ${st.opp} in ${c.turn} turns | ${fin.arch} -> ${(fin.plan&&fin.plan.arm)||'?'}${S?` | running record ${S.wins}-${S.games-S.wins}`:''}`);
      if(CFG.saveReplays)send(`${room}|/savereplay`);
      if(fin.stats&&c.rep.llm)log(`  Claude: ${c.rep.llm.used}/${c.rep.llm.calls} decisions, ${c.rep.llm.override} overrides, ${c.rep.llm.fallback} fallbacks`);
      setTimeout(async()=>{finished.add(room);send(`|/noreply /leave ${room}`);delete battles[room];
        let coachIn=0,coachOut=0;
        if(CFG.pilot==='claude'&&CFG.coachEvery>0&&played%CFG.coachEvery===0){try{const cr=await runCoach(CFG.claude||{},{n:Math.min(10,Math.max(5,CFG.coachEvery*2)),log,lifetime:CFG.proposalLifetimeGames||15,latestBattleLog:logFile});coachIn=cr&&cr.usage?cr.usage.input_tokens||0:0;coachOut=cr&&cr.usage?cr.usage.output_tokens||0:0}catch(e){log('Coach failed:',e.message)}}
        if(CFG.pilot==='claude'&&c.rep.llm){const bIn=c.rep.llm.inputTokens||0;const bOut=c.rep.llm.outputTokens||0;const tIn=bIn+coachIn;const tOut=bOut+coachOut;const PR=CFG.pricing||{};const cost=(tIn*(PR.inputPerMillion??15)+tOut*(PR.outputPerMillion??75))/1e6;session.in+=tIn;session.out+=tOut;session.usd+=cost;log(`  Tokens: battle ${bIn.toLocaleString()} in / ${bOut.toLocaleString()} out${coachIn?` | coach ${coachIn.toLocaleString()} in / ${coachOut.toLocaleString()} out`:''} | total ${tIn.toLocaleString()} in / ${tOut.toLocaleString()} out | est. $${cost.toFixed(3)} this game, $${session.usd.toFixed(2)} this session`)}
        try{LLM.tickProposals()}catch(e){}
        setTimeout(nextGame,CFG.delaySeconds*1000)},4000)}}}
function connect(){ws=new WS(CFG.server);
  ws.onopen=()=>log('Connected to',CFG.server);
  ws.onclose=()=>{log('Disconnected.');if(!stopRequested()&&!(played>=CFG.games&&CFG.games>0))setTimeout(connect,15000)};
  ws.onerror=e=>log('Socket error:',e.message||e);
  ws.onmessage=ev=>{const data=typeof ev.data==='string'?ev.data:ev.data.toString();if(process.env.BOT_RAW)fs.appendFileSync(process.env.BOT_RAW,data.slice(0,400)+'\n---\n');let room='';let lines=data.split('\n');if(lines[0].startsWith('>')){room=lines[0].slice(1);lines=lines.slice(1)}
    if(room.startsWith('battle-'))return onBattleMessage(room,lines);
    for(const line of lines){const p=line.split('|');
      if(p[1]==='challstr')login(p.slice(2).join('|')).catch(e=>{log('login error',e.message);process.exit(1)});
      else if(p[1]==='updateuser'){const name=p[2].trim(),named=p[3]==='1';if(named&&toID(name)===toID(CFG.username)){log('Logged in as',name);nextGame()}}
      else if(p[1]==='nametaken'){log(`Name "${p[2]}" unavailable: ${p[3]} — close any other tab using it and restart.`);process.exit(1)}
      else if(p[1]==='popup'){const msg=p.slice(2).join('|').replace(/\|\|/g,' ');log('Server popup:',msg);if(/team was rejected/i.test(msg)){log('CRITICAL: Team was rejected by Showdown server! Exiting so team can be corrected.');process.exit(1);}}
      else if(p[1]==='updatesearch'){try{const s=JSON.parse(p[2]);if(searching&&s.games)searching=false}catch(e){}}
      else if(p[1]==='pm'&&CFG.mode==='accept'&&(p[4]||'').startsWith('/challenge ')){const user=p[2].trim().replace(/^[^A-Za-z0-9]/,'');const fmt=p[4].slice(11).trim();
        if(fmt===CFG.format&&!Object.values(battles).some(b=>!b.ended)&&(!CFG.acceptFrom.length||CFG.acceptFrom.map(toID).includes(toID(user)))){send('|/utm '+getPacked());send('|/accept '+user);log('Accepted challenge from',user)}}
      else if(p[1]==='updatechallenges'&&CFG.mode==='accept'){try{const c=JSON.parse(p[2]);for(const [user,fmt] of Object.entries(c.challengesFrom||{})){if(fmt===CFG.format&&(!CFG.acceptFrom.length||CFG.acceptFrom.map(toID).includes(toID(user)))){send('|/utm '+getPacked());send('|/accept '+user);log('Accepted challenge from',user)}}}catch(e){}}}}}
process.on('SIGINT',()=>{log('Ctrl+C — stopping after cleanup.');stopping=true;if(searching)send('|/cancelsearch');shutdown()});
// battle count from the command line overrides config.json:  node bot.js 25   |  node bot.js --games=25   (0 = unlimited)
{const a=process.argv.slice(2).find(x=>/^(--games=)?\d+$/.test(x));if(a)CFG.games=+a.replace('--games=','')}
const META=CFG.meta||{};try{require('./pilots.js').W.calc=CFG.calc||'smogon'}catch(e){}
const depLabel = (CFG.claude && CFG.claude.deployments)
  ? Object.entries(CFG.claude.deployments).map(([k,v])=>`${k}:${v}`).join(', ')
  : ((CFG.claude||{}).deployment||'?');
log(`Starting bot as ${CFG.username} | mode=${CFG.mode} | battles=${CFG.games||'unlimited'} | pilot=${CFG.pilot}${CFG.pilot==='claude'?' ('+depLabel+')':''} | format=${CFG.format}`);
if(CFG.pilot==='claude'&&!(process.env.AZURE_API_KEY||process.env.AZURE_OPENAI_API_KEY||process.env.AZURE_CLAUDE_KEY))log('WARNING: pilot=claude but AZURE_API_KEY is not set — every decision will fall back to the engine pilot.');(async()=>{const XC=CFG.expert||{};if(XC.enabled!==false){try{const XR=require('./replays.js');if(XR.isStale(XC.refreshHours||72)){log(`Updating expert replays (rating ≥ ${XC.minRating||1450})… first run can take a few minutes`);const r=await XR.refresh({minRating:XC.minRating||1450,maxPages:XC.maxPages||40,log});log(`Expert replays: ${r.newReplays} new, ${r.total} total → ${r.decisions} decisions indexed from ${r.replays} games`)}}catch(e){log('Expert replay update skipped:',e.message,'— continuing without new replays')}}
  if(META.autoUpdate!==false){try{const {updateMeta,isStale}=require('./update-meta.js');if(isStale(META.refreshHours||24)){log('Refreshing ranked meta from the VGCPastes sheet…');const r=await updateMeta({...META,log});require('./client.js').reloadMeta();log(`Meta updated: ${r.teams} teams, ${r.sets} sets, ${r.species} species (${r.newPastes} new pastes; ${r.selection})`)}}catch(e){log('Meta refresh skipped:',e.message,'— using the existing set database')}}
  connect()})();
