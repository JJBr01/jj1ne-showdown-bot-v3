// Claude (Microsoft Foundry) client + prompts for the turn pilot, team preview, and post-game coach.
const KEY=()=>process.env.AZURE_CLAUDE_KEY||process.env.ANTHROPIC_FOUNDRY_API_KEY||'';
async function callClaude(cfg,opts,maxRetries=3){
  let attempt=0;
  while(attempt<=maxRetries){
    try{
      return await callOnce(cfg,opts);
    }catch(e){
      attempt++;
      const is429=/HTTP 429|rate limit/i.test(e.message);
      if(is429&&attempt<=maxRetries){
        const m=e.message.match(/retry after (\d+)|"retry-after":\s*"?(\d+)|(\d+)\s*seconds/i);
        const waitSec=m?parseInt(m[1]||m[2]||m[3],10):(attempt*4);
        const waitMs=Math.min(Math.max(waitSec*1000,2000),25000);
        console.log(`[llm] Rate limited (HTTP 429) — waiting ${(waitMs/1000).toFixed(1)}s before retry ${attempt}/${maxRetries}...`);
        await new Promise(r=>setTimeout(r,waitMs));
        continue;
      }
      throw e;
    }
  }
}
// Extended thinking per role, from config.json "claude.thinking": { "turn": 0, "preview": 0, "coach": 4000 }
//   0 / "off"  -> thinking disabled          N (number)  -> thinking enabled with a budget of N tokens
//   "adaptive" -> let the model decide (only if your deployment supports it)
const thinkingRejected=new Set();
function thinkingParam(cfg,role,maxTokens,model){
  const isAdaptive=/5[-.]5|sonnet-5/i.test(model||'');
  const t=((cfg&&cfg.thinking)||{})[role];
  if(thinkingRejected.has(model)||t===undefined||t===0||t==='off'||t===false){
    return {param:isAdaptive?{type:'between_tools'}:{type:'disabled'},maxTokens};
  }
  if(isAdaptive){
    return {param:{type:'adaptive'},maxTokens:maxTokens+3000};
  }
  const b=typeof t==='number'&&t>0?Math.max(1024,Math.floor(t)):2000;
  return {param:{type:'enabled',budget_tokens:b},maxTokens:maxTokens+b};
}
const cacheRejected=new Set();
async function callOnce(cfg,{system,user,messages,tools,maxTokens=500,timeoutMs=20000,role='turn'}){
  const model=(cfg&&cfg.deployments&&cfg.deployments[role])||(cfg&&cfg.deployment);
  const th=thinkingParam(cfg,role,maxTokens,model);
  const useCache=cfg.promptCache!==false&&!cacheRejected.has(model)&&role!=='coach'&&Boolean(system);
  if(useCache){try{return await callRaw(cfg,{model,system:[{type:'text',text:system,cache_control:{type:'ephemeral'}}],user,messages,tools,maxTokens:th.maxTokens,timeoutMs,thinking:th.param})}
    catch(e){if(/HTTP 400/.test(e.message)&&/cache/i.test(e.message)){cacheRejected.add(model);console.log(`[llm] deployment "${model}" rejected prompt caching — continuing without it:`,e.message.slice(0,160))}else throw e}}
  try{return await callRaw(cfg,{model,system,user,messages,tools,maxTokens:th.maxTokens,timeoutMs,thinking:th.param})}
  catch(e){
    if(/HTTP 400/.test(e.message)&&/thinking|budget/i.test(e.message)&&th.param){
      thinkingRejected.add(model);
      const isAdaptive=/5[-.]5|sonnet-5/i.test(model||'');
      const offThinking=isAdaptive?{type:'between_tools'}:{type:'disabled'};
      console.log(`[llm] deployment "${model}" rejected the thinking setting — continuing with thinking disabled:`,e.message.slice(0,160));
      return await callRaw(cfg,{model,system,user,messages,tools,maxTokens,timeoutMs,thinking:offThinking});
    }
    throw e;
  }
}
async function callRaw(cfg,{model,system,user,messages,tools,maxTokens=500,timeoutMs=20000,thinking}){
  const key=KEY();if(!key)throw new Error('AZURE_CLAUDE_KEY not set');
  const targetModel=model||(cfg&&cfg.deployment);
  if(!cfg||!cfg.endpoint||!targetModel)throw new Error('claude.endpoint / claude.deployment missing in config.json');
  const url=cfg.endpoint.replace(/\/+$/,'').replace(/\/v1\/messages$/,'')+'/v1/messages';
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),timeoutMs);const t0=Date.now();
  const msgs=messages&&messages.length?messages:[{role:'user',content:user}];
  const payload={model:targetModel,max_tokens:maxTokens,system,messages:msgs};
  if(thinking)payload.thinking=thinking;
  if(tools&&tools.length)payload.tools=tools;
  try{const r=await fetch(url,{method:'POST',signal:ctl.signal,headers:{'content-type':'application/json','api-key':key,'x-api-key':key,'anthropic-version':'2023-06-01'},
      body:JSON.stringify(payload)});
    const txt=await r.text();
    if(!r.ok){
      if(/between_tools/i.test(txt)&&(!thinking||thinking.type!=='between_tools')){
        return await callRaw(cfg,{model:targetModel,system,user,messages,tools,maxTokens,timeoutMs,thinking:{type:'between_tools'}});
      }
      if(/adaptive/i.test(txt)&&thinking&&thinking.type==='enabled'){
        return await callRaw(cfg,{model:targetModel,system,user,messages,tools,maxTokens:maxTokens+3000,timeoutMs,thinking:{type:'adaptive'}});
      }
      throw new Error(`HTTP ${r.status}: ${txt.slice(0,300)}`);
    }
    const j=JSON.parse(txt);
    const out=(j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('\n');
    const toolCalls=(j.content||[]).filter(b=>b.type==='tool_use');
    const u=j.usage||{};const cw=u.cache_creation_input_tokens||0,cr=u.cache_read_input_tokens||0;
    const usage={...u,raw_input_tokens:u.input_tokens||0,input_tokens:Math.round((u.input_tokens||0)+1.25*cw+0.1*cr)};
    return {text:out,toolCalls,rawContent:j.content,stopReason:j.stop_reason,ms:Date.now()-t0,usage,model:targetModel}}
  finally{clearTimeout(t)}}
function parseJSON(text){const t=String(text).replace(/```(json)?/g,'');for(let i=t.indexOf('{');i>=0;i=t.indexOf('{',i+1)){let d=0,inS=false,esc=false;
    for(let k=i;k<t.length;k++){const c=t[k];if(inS){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')inS=false;continue}if(c==='"')inS=true;else if(c==='{')d++;else if(c==='}'){d--;if(d===0){try{return JSON.parse(t.slice(i,k+1))}catch(e){break}}}}}
  throw new Error('no JSON in reply')}
const PRINCIPLES=`You are piloting a Pokémon VGC doubles team on Pokémon Showdown ([Gen 9 Champions] VGC 2026 Reg M-C, level 50, Stat Points instead of EVs, one Mega Evolution per battle).
Play like a top player coached by WolfeyVGC:
- Macro first: identify the opponent's single most valuable win condition and play to deny it. Never evaluate only this turn's damage.
- Never let the opponent have BOTH speed advantage AND power at the same time (Tailwind / Trick Room / boosts).
- Setup is a win condition: if a foe boosts (Calm Mind, Iron Defense, Swords Dance, Quiver Dance, Bulk Up, Coil, Nasty Plot, Dragon Dance) or can Baton Pass boosts, punish it now — attack it, Encore it, or KO it. Do not Protect-stall while it boosts.
- Don't predict when a safe line exists that holds regardless of their choice; predict only when behind and safe lines lose, or every line loses if the read is wrong.
- Protect when a foe that moves before us is likely to KO or cripple this Pokémon this turn and we can't remove that foe first — especially Drogon (Charizard-Y) on turn 1 against Rock, Water, Electric or strong special attackers. Don't Protect with no real threat, don't double-Protect unless both are genuinely threatened, never Protect twice in a row. "Protect wastes Tailwind turns" is NOT a reason to lose a key Pokémon.
- PSYCHIC TERRAIN & ANTI-PRIORITY (Armor Tail / Dazzling / Queenly Majesty): Farigiraf, Tsareena and Bruxish, as well as Psychic Terrain for grounded targets, completely BLOCK all priority moves (Sucker Punch, Fake Out, Prankster status moves aimed at foes)! Never click Sucker Punch into Farigiraf or in Psychic Terrain — the move will FAIL and waste your turn. Psychic Terrain does NOT block moves that target our own side (Tailwind, Protect) or anything aimed at Flying types/Levitate. Expanding Force in Psychic Terrain gets 1.5x power AND hits both foes.
- Accuracy matters: Heat Wave and Draco Meteor are 90% accurate; evasion boosts (Double Team) and accuracy drops affect every move that can miss.
- After Draco Meteor/Overheat drops (−2 or worse SpA), switch out or use a non-dropping move instead of firing again at −4/−6.
- No overkill with stat-drop moves: never fire Draco Meteor, Overheat, Leaf Storm, Close Combat or Make It Rain into a target that a weaker non-dropping move (Moonblast, Dragon Pulse, Heat Wave, Scald...) already KOs — save the stat stages.
- CONTRARY: if a foe gets STRONGER from its own Overheat/Close Combat/Draco Meteor/Superpower/Leaf Storm (boosts instead of drops), it has Contrary — usually given by Malamar's Skill Swap (Malamar, Inkay, Spinda, Serperior, Shuckle). It snowballs every turn: KO it immediately with focus fire, or Encore/Taunt-proof it; do not stall against it, and remember Intimidate RAISES its Attack under Contrary. If Malamar is on their team, expect Skill Swap + Trick Room.
- Remember what they keep doing: after Wide Guard, don't spread into it; after repeated Protect, target the other Pokémon or set up.
- TRICK ROOM (5 turns) REVERSES speed order: the SLOWEST Pokémon moves first. Under Trick Room, Tailwind and Choice Scarf make us move LATER, not earlier — NEVER use Tailwind into Trick Room.
  - Before it goes up: focus fire the setter with Kingambit Kowtow Cleave / Iron Head or burst attacks.
  - While it is up: Kingambit thrives (slowest attacker moves first); stall turns with Protect cycling, and use bulky Milotic.
- Switching is a real tool, not a last resort. Switch a Pokémon out when it is about to be KO'd and can't Protect, has -2 or worse in its attacking stat (after Draco Meteor, Intimidate, Close Combat), is Choice-locked into a bad move, is Yawned (will fall asleep), is Encored into a useless move, or is walled — and bring in a teammate that resists the incoming attacks or threatens the foes. Switching resets stat drops and Choice lock.
- Perish Song: switch out a Pokémon whose perish count will hit 0 if you can.
- SHADOW TAG (Mega Gengar) / Arena Trap / Magnet Pull trap our Pokémon: we cannot switch to reset Perish Song counts. Against Perish Song + Shadow Tag: KO the trapper fast (focus fire, don't split), Protect to stall when it lets their perish counts run out before ours, and never waste turns attacking into an obvious Protect.
- CHOICE LOCK: the board summary marks a Choice-locked Pokémon (our Scarf Garchomp). If the locked move is poor now, switching out resets the lock.
- Ghost types are immune to normal/fighting; Inner Focus blocks flinch.
Team-specific rules (our team: Charizard-Mega-Y "Drogon", Dragonite-Mega, Milotic, Garchomp, Kingambit, Whimsicott):
- Never Earthquake with Garchomp while Kingambit is beside it — Ground hits the ally for 2x. EQ is safe next to Charizard and Dragonite (Flying type immune).
- Kingambit: moves first under Trick Room against most foes; immune to Psychic (Expanding Force) and Prankster; Defiant gets +2 Atk from Intimidate; Sucker Punch is blocked by Psychic Terrain and Armor Tail (Farigiraf).
- Vs Sand (Mega Tyranitar / Excadrill): Protect Drogon (4x Rock weak); Garchomp (immune to sand, resists Rock) and Milotic (Scald) counter Tyranitar.
- Mega Dragonite's Multiscale halves the first hit at full HP — protect it from chip.
- Whimsicott's Prankster Tailwind is the team's speed control; Prankster moves fail against Dark types. Never click Tailwind into Trick Room.`;
const path=require('path');const fs=require('fs');
const DATA=process.env.BOT_DATA||path.join(__dirname,'data');const KDIR=path.join(__dirname,'knowledge');
// ---- knowledge pack (exported project memory + coach notes) ----
function knowledge(kind){let files=[];try{files=fs.readdirSync(KDIR).filter(f=>f.endsWith('.md')).sort()}catch(e){return ''}
  // turn prompts stay focused: team rules + ladder lessons + coach notes + wolfe turn checklist; preview/coach get everything
  const pick=kind==='turn'?files.filter(f=>/^(02|04|05|06)-/.test(f)):files;const cap=kind==='turn'?12000:40000;
  let out='';for(const f of pick){let t=fs.readFileSync(path.join(KDIR,f),'utf8');if(kind==='turn'&&f.startsWith('02-'))t=t.slice(t.indexOf('## Standing rules'));out+='\n\n'+t.trim()}
  return out?'\n\nKNOWLEDGE (from the project and past games):'+out.slice(0,cap):''}
// ---- coach proposals with expiry ----
// proposals matching a "[block: a|b|c]" pattern in knowledge/07-tested-ideas.md were tested and rejected
function blockedPatterns(){try{return [...fs.readFileSync(path.join(KDIR,'07-tested-ideas.md'),'utf8').matchAll(/\[block:\s*([^\]]+)\]/g)].flatMap(m=>m[1].split('|').map(x=>x.trim().toLowerCase()).filter(Boolean))}catch(e){return []}}
function isBlocked(p){const t=String((p&&p.change)||'').toLowerCase();return blockedPatterns().some(b=>t.includes(b))}
function loadProposals(){try{const d=JSON.parse(fs.readFileSync(path.join(DATA,'active_proposals.json'),'utf8'));return (d.proposals||[]).map(p=>({gamesLeft:15,...p})).filter(p=>p.gamesLeft>0&&!isBlocked(p))}catch(e){return []}}
function saveProposals(list){fs.writeFileSync(path.join(DATA,'active_proposals.json'),JSON.stringify({updated:new Date().toISOString(),proposals:list},null,2))}
function mergeProposals(fresh,lifetime=15,max=8){const key=p=>(p.area+'|'+p.change).toLowerCase().replace(/[^a-z0-9|]/g,'').slice(0,80);const cur=loadProposals();const seen=new Set(cur.map(key));
  for(const p of fresh||[]){if(!p||!p.change||isBlocked(p))continue;const k=key(p);if(seen.has(k)){const e=cur.find(x=>key(x)===k);e.gamesLeft=lifetime;continue}cur.push({area:p.area||'pilot',change:p.change,evidence:p.evidence||'',added:new Date().toISOString(),gamesLeft:lifetime});seen.add(k)}
  const list=cur.slice(-max);saveProposals(list);return list}
function tickProposals(){const cur=loadProposals();if(!cur.length)return;saveProposals(cur.map(p=>({...p,gamesLeft:p.gamesLeft-1})).filter(p=>p.gamesLeft>0))}
function loadProposalBlock(){const ps=loadProposals().filter(p=>p.area!=='team');if(!ps.length)return '';
  return '\n\nCOACH ADJUSTMENTS (from post-game reviews; apply unless the board clearly says otherwise):\n'+ps.map((p,i)=>`${i+1}. [${String(p.area).toUpperCase()}] ${p.change}`).join('\n')}
function appendLessons(lessons,max=25){if(!lessons||!lessons.length)return;const f=path.join(KDIR,'05-coach-notes.md');let lines=[];try{lines=fs.readFileSync(f,'utf8').split('\n').filter(l=>l.startsWith('- '))}catch(e){}
  for(const l of lessons){const t='- '+String(l).trim();if(!lines.includes(t))lines.push(t)}fs.writeFileSync(f,'# Coach notes (written automatically after reviews; most recent last)\n'+lines.slice(-max).join('\n')+'\n')}
const COACH_SYSTEM=()=>PRINCIPLES+knowledge('coach')+`
You are the post-game COACH and AUTONOMOUS CODE ARCHITECT for the Pokémon Showdown bot.
After each battle, you evaluate the gameplay through Wolfe Glick's VGC Masterclass standards:
1. WHAT WORKED: What plays, leads, speed control setups, or predictions succeeded.
2. LESSONS APPLIED: Were past coach proposals and Wolfe Masterclass directives followed or violated in this game?
3. WHAT FAILED: Pinpoint exact misplays, failed moves (e.g. Sucker Punch failing into status/Protect/switches/Psychic Terrain/Armor Tail), wasted turns in the 2-action economy, unpunished setup, allowing opponent to achieve speed and power simultaneously, unnecessary predictions when ahead, or bad leads.
4. HOW TO IMPROVE: Concrete strategic adjustments for next time.
5. CODE IMPROVEMENT: Generate an updated, complete JavaScript module for "tactics.js" that incorporates code logic to systematically prevent the mistakes observed (e.g., move blocking guardrails in shouldBlockMove, score penalties/boosts in adjustScore, or lead adjustments in getLeadPreference).
   - It must export: version (number), lastUpdated (ISO string), lastBattle (string), changelog (array of strings), getLeadPreference(arch, oppSets), adjustScore(battle, mon, move, target, currentScore), shouldBlockMove(battle, mon, move, target), getTacticalNotes(battle, req).
   - Ensure the JavaScript syntax is 100% valid with no syntax errors.
6. TEAM INSPIRATION & CORE ADAPTATION: Take inspiration from how the opponent played and their team build: what worked for them? Suggest items to use, changes in EV spreads, or Pokémon to swap in/out based on our core (Mega Dragonite + Mega Charizard Y).

OUTPUT FORMAT:
1. The JSON summary object MUST come FIRST, on the very first line (itemExperiment and teamInspiration are optional):
{"analysis":{"whatWorked":"<summary>","lessonsApplied":"<summary>","whatFailed":"<summary>","howToImprove":"<summary>"},"proposals":[{"area":"preview|pilot|team","change":"...","evidence":"..."}],"lessons":["..."],"itemExperiment":{"switchVariant":"lifeorb_garchomp|scarf_garchomp|sitrus_garchomp|clear_amulet_kingambit","reason":"..."},"teamInspiration":{"opponent":"<name>","suggestion":"<specific recommendation>","reason":"..."}}

2. Followed by your structured Markdown review with these exact sections:
# Coach Review
## 1. What Worked
## 2. Lessons Applied From Before
## 3. What Failed
## 4. How To Improve Next Time
## 5. Team Evolution & Opponent Inspiration (Mega Dragonite + Mega Charizard Core)
## 6. Updated tactics.js Code
\`\`\`javascript
module.exports = {
  version: <incremented number>,
  lastUpdated: "<ISO string>",
  lastBattle: "<opponent and result>",
  changelog: [
    // past changes...,
    "<description of new rule added after this game>"
  ],
  getLeadPreference: function(arch, oppSets) {
    // Lead overrides based on opponent archetype
    ...
  },
  adjustScore: function(battle, mon, move, target, currentScore) {
    // Fine-grained scoring adjustments (-10 to +5)
    ...
  },
  shouldBlockMove: function(battle, mon, move, target) {
    // Hard guardrails: return true to prohibit move
    ...
  },
  getTacticalNotes: function(battle, req) {
    // Strategic guidance injected into Claude turn prompt
    ...
  }
};
\`\`\``;
function TURN_SYSTEM(){return PRINCIPLES+knowledge('turn')+`
Each turn you receive the board state and a ranked list of CANDIDATE choices produced by a calculation engine (damage ranges come from the Smogon damage calculator: min 85% roll to max roll, no crits, % of target max HP, against the opponent's most likely set).
You may also get EXPERT REFERENCE positions: what high-rated players chose in the most similar positions from real ladder replays, and whether they won. Use them as evidence about good play patterns (leads, Protect timing, focus targets, switches), but decide from THIS board — their sets and situations can differ.
You also get a DAMAGE TABLE from the Smogon calculator: every move we can use against each foe, and each foe's likely moves against us. Use these numbers — never estimate damage from memory. If you write your own choice, check it against the table first.
Apply Wolfe Glick's Masterclass Checklist: zero technical errors on board state, check effective speeds and priority brackets, seek safe plays (offensive, defensive repositioning, macro win-con), avoid predictions when ahead, and deny the opponent speed + power.
Pick the best candidate by index, or write your own choice if none fits.
Choice syntax (Showdown): one action per active slot separated by ", ". "move N T" (N = move number 1-4, T = target 1 or 2 for foe slots, -1/-2 for ally slots; omit T for spread/self moves), append " mega" to Mega Evolve, "switch N" (N = party position), "pass" for an empty slot.
STAT ANOMALY & SET DEDUCTIONS:
If the board flags an ANOMALY (e.g. foe took less damage than min roll [BULKIER than standard] or outsped a faster ally [FASTER than standard]), or you deduce their item/spread from battle events, include an optional "deductions" object:
"deductions": {"<SpeciesName>": {"spread": "bulky_spd"|"bulky_def"|"max_bulk"|"offensive_fast", "item": "<e.g. assaultvest, choicescarf, etc.>", "speedTier": "scarf"|"fast"|"slow"}}
Any deduction immediately updates the shadow stats and Smogon calculator damage ranges for that Pokémon on all subsequent turns.
Reply with ONLY JSON: {"pick": <candidate index or -1>, "cmd": "<only if pick is -1>", "deductions": { ... }, "why": "<max 25 words>"}`+loadProposalBlock()}
function PREVIEW_SYSTEM(){return PRINCIPLES+knowledge('preview')+`
TEAM PREVIEW: choose 4 of our 6 and the 2 leads.
Apply Wolfe Glick's Masterclass Elimination Technique & 36-Cell Grid:
1. RULE OUT OUR "NEVER-COME": Identify any Pokémon on our team that is heavily countered or completely ineffective into their 6 (e.g. Sneasler vs Psyterrain / Expanding Force; Charizard vs Sand without answer) and rule it out immediately.
2. LOCK IN OUR "MUST-COME": Identify the piece that hard-counters their primary game plan (e.g. Kingambit vs Psyterrain/Indeedee; Whimsicott vs fast Hyper Offense; Milotic vs Intimidate).
3. SHELTER WIN-CONDITION IN THE BACK: Exactly ONE Mega (Charizard Y or Dragonite). Bring the Mega in the BACK (positions 3 or 4) to protect Multiscale / avoid early chip / Fake Out snipe until checks are weakened.
4. IDENTIFY THEIR "MUST-COME": Deduce what they HAVE to bring to counter our team, and pair front leads to immediately pressure it.
Archetype Rules:
- Against psyterrain (Indeedee + Armarouge/Alakazam): LEAD Kingambit (immune to Expanding Force, hits setters super-effectively) + Flying Mega. Leave Sneasler home.
- Against Trick Room WITHOUT Psychic Terrain: KO/pressure setter turn 1; Whimsicott Encore on setter reverses TR; Milotic is slow and bulky in TR; Tailwind is useless in TR.
- Do NOT lead Garchomp next to Kingambit (Earthquake hits ally).
You get our team, the opponent's 6 with their most likely sets, the opponent archetype, and our learned win rates per plan.
Reply with ONLY JSON: {"team": "<4 digits = our party positions 1-6, first two are the leads, e.g. 6125>", "why": "<max 30 words>"}`+loadProposalBlock()}
module.exports={callClaude,parseJSON,TURN_SYSTEM,PREVIEW_SYSTEM,COACH_SYSTEM,mergeProposals,tickProposals,appendLessons,loadProposals};
