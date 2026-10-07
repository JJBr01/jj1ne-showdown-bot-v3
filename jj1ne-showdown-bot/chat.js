// JJ1NE VGC Master Coach — Interactive Chat CLI
// Allows you to chat directly with the AI Coach about team strategy, match replays,
// archetype counters, Wolfe Glick principles, damage calculations, and ladder performance.

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const LLM = require('./llm.js');
const Exp = require('./experiments.js');
const WT = require('./web-tools.js');

// ANSI Color Helpers
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Persistent Chat History
const CHAT_HISTORY_FILE = path.join(__dirname, 'data', 'chat_history.json');

function loadChatHistory() {
  try {
    if (fs.existsSync(CHAT_HISTORY_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, 'utf8'));
      if (Array.isArray(raw)) {
        const clean = [];
        for (const m of raw) {
          if (!m || typeof m.content !== 'string' || !m.content.trim()) continue;
          if (m.role !== 'user' && m.role !== 'assistant') continue;
          if (clean.length > 0 && clean[clean.length - 1].role === m.role) {
            clean[clean.length - 1].content += '\n\n' + m.content;
          } else {
            clean.push({ role: m.role, content: m.content });
          }
        }
        if (clean.length > 0 && clean[clean.length - 1].role === 'user') {
          clean.pop();
        }
        return clean.slice(-14);
      }
    }
  } catch (e) {}
  return [];
}

function saveChatHistory(messages) {
  try {
    const dir = path.dirname(CHAT_HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const textOnly = [];
    for (const m of messages) {
      if (m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant')) {
        textOnly.push({ role: m.role, content: m.content });
      }
    }
    fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(textOnly.slice(-20), null, 2), 'utf8');
  } catch (e) {}
}

function clearChatHistory() {
  try {
    if (fs.existsSync(CHAT_HISTORY_FILE)) {
      fs.unlinkSync(CHAT_HISTORY_FILE);
    }
  } catch (e) {}
}

// Helper to pull recent ladder stats from results.csv
function getLadderStats() {
  const csvPath = path.join(__dirname, 'results.csv');
  if (!fs.existsSync(csvPath)) return { total: 0, w: 0, l: 0, archetypes: {} };
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
  let w = 0, l = 0;
  const archs = {};
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 4) continue;
    const res = parts[3];
    const arch = parts[5] || 'unknown';
    if (res === 'W') w++;
    else if (res === 'L') l++;
    archs[arch] = archs[arch] || { w: 0, l: 0 };
    if (res === 'W') archs[arch].w++;
    else if (res === 'L') archs[arch].l++;
  }
  return { total: w + l, w, l, rate: (w + l > 0 ? (w / (w + l) * 100).toFixed(1) : '0.0'), archetypes: archs, lines };
}

// Helper to pull recent battle info
function getLastBattleInfo() {
  const csvPath = path.join(__dirname, 'results.csv');
  if (!fs.existsSync(csvPath)) return null;
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
  if (!lines.length) return null;
  const lastLine = lines[lines.length - 1].split(',');
  const time = lastLine[0];
  const battleId = lastLine[1];
  const opp = lastLine[2];
  const result = lastLine[3];
  const turns = lastLine[4];
  const arch = lastLine[5];
  const plan = lastLine[6];
  const replay = lastLine[9] || '';
  const reportFile = lastLine[10] || '';

  let review = '';
  const coachDir = path.join(__dirname, 'coach');
  if (fs.existsSync(coachDir)) {
    const files = fs.readdirSync(coachDir).filter(f => f.endsWith('.md')).sort();
    if (files.length) {
      review = fs.readFileSync(path.join(coachDir, files[files.length - 1]), 'utf8').slice(0, 3000);
    }
  }

  return { time, battleId, opp, result, turns, arch, plan, replay, reportFile, review };
}

// Helper to pull opponent scouting data
function scoutOpponent(name) {
  const scoutFile = path.join(__dirname, 'data', 'scouting.json');
  if (!fs.existsSync(scoutFile)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(scoutFile, 'utf8'));
    const id = ('' + name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return data[id] || null;
  } catch (e) {
    return null;
  }
}

// Helper to assemble dynamic system prompt
function buildChatSystemPrompt() {
  const stats = getLadderStats();
  const activeVariant = Exp.getActiveVariant();
  const teamText = Exp.getActiveTeamText();
  const lastBattle = getLastBattleInfo();

  let coachNotes = '';
  try {
    const kf = path.join(__dirname, 'knowledge', '05-coach-notes.md');
    if (fs.existsSync(kf)) coachNotes = fs.readFileSync(kf, 'utf8').slice(-1200);
  } catch (e) {}

  let teamPerf = '';
  try {
    const pf = path.join(__dirname, 'data', 'team_performance.json');
    if (fs.existsSync(pf)) teamPerf = fs.readFileSync(pf, 'utf8').slice(0, 1000);
  } catch (e) {}

  let projectDocs = '';
  const vgcDoc = path.join(__dirname, 'data', 'vgcpastes_mc.txt');
  if (fs.existsSync(vgcDoc)) {
    try {
      const topMeta = fs.readFileSync(vgcDoc, 'utf8').trim().split('\n').slice(0, 15).join('\n');
      projectDocs += `\n\nMETAGAME CONTEXT (Top 15 Meta Pokemon from data/vgcpastes_mc.txt):\n${topMeta}`;
    } catch(e) {}
  }
  const docsDir = path.join(__dirname, 'docs');
  if (fs.existsSync(docsDir)) {
    try {
      const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      if (docFiles.length > 0) {
        projectDocs += `\n\nAVAILABLE PROJECT DOCUMENTS IN docs/ (${docFiles.length} files — call read_project_file to inspect any doc):\n${docFiles.join(', ')}`;
      }
    } catch(e) {}
  }

  return `You are the JJ1NE AI VGC Head Coach and Strategic Analyst.
You are chatting with your player/trainer. You are an expert in Pokémon VGC doubles ([Gen 9 Champions] VGC 2026 Reg M-C), playing at World Champion caliber and trained under Wolfe Glick's VGC Masterclass principles.

CURRENT ACTIVE BOT PROFILE:
- Player / Showdown Bot Username: JJ1NE
- Format: [Gen 9 Champions] VGC 2026 Reg M-C (Level 50, Stat Points 0-32, max 66 SP per mon, 1 Mega per game).
- Active Team Variant: "${activeVariant}"
- Active Team Roster:
${teamText}

OVERALL LADDER RECORD:
- Total: ${stats.w} Wins - ${stats.l} Losses (${stats.rate}% Win Rate across ${stats.total} matches)
- Performance by Archetype:
${Object.entries(stats.archetypes).map(([a, s]) => `  • ${a}: ${s.w}W - ${s.l}L (${(s.w + s.l > 0 ? (s.w / (s.w + s.l) * 100).toFixed(0) : 0)}%)`).join('\n')}

TEAM EVOLUTION RECORD:
${teamPerf}

RECENT COACH LESSONS & NOTES:
${coachNotes}
${projectDocs}

MOST RECENT BATTLE:
${lastBattle ? `- Opponent: ${lastBattle.opp} (${lastBattle.result === 'W' ? 'WIN' : 'LOSS'} in ${lastBattle.turns} turns)
- Archetype: ${lastBattle.arch} | Plan: ${lastBattle.plan}
- Replay: ${lastBattle.replay}` : 'No battles recorded yet.'}

CORE VGC COACHING PRINCIPLES (Wolfe Glick Masterclass):
1. Macro first: Always identify the opponent's single primary win condition and formulate a plan to deny it.
2. 2-Action Economy: Every double-Protect, failed Sucker Punch, or dead attack wastes half our action economy.
3. Speed Control: Never allow the opponent to establish BOTH speed advantage and power simultaneously.
4. Trick Room: Slower moves first. Tailwind into TR is suicidal. Reversing TR with Encore or stalling with Protect cycling is essential.
5. Weather & Terrain Wars: Sun (Mega Charizard-Y Drought) vs Rain/Sand/Snow; Psychic Terrain blocks priority; Grassy Terrain heals and boosts Grassy Glide.
6. Safe Play Bias: When ahead, take lines that hold regardless of the opponent's read. Predict only when behind.

LIVE WEB & METAGAME RESEARCH CAPABILITIES:
- You have autonomous access to the live web, tournament archives, and Google Spreadsheets via your tools:
  • "search_web": Search DuckDuckGo for recent VGC tournaments, top cut teams, articles, players, or meta discussions.
  • "fetch_google_sheet": Read and parse ANY public Google Sheets link provided by the user.
  • "fetch_live_vgcpastes": Pull the live official VGCPastes Champions repository directly.
  • "fetch_url": Read and analyze Pokepastes (pokepast.es) or any live webpage.
- Proactively call these tools whenever the user asks for live tournament data, meta trends, player sets, or web research.

PROJECT FILE CREATION, TEAM MANAGEMENT & AUTONOMOUS BOT CONTROLS:
- You HAVE FULL FILESYSTEM, TEAM MANAGEMENT, AND SHOWDOWN BOT EXECUTION POWERS:
  • "make_and_switch_team": Build a complete new team variant from a Showdown paste, write its file (e.g. "team-rain.js"), register it with the bot's variant manager, back up "team.js", and immediately activate it for ladder matches!
  • "switch_team_variant": Switch the active team to ANY registered variant or ANY existing team file (e.g. "lifeorb_garchomp", "team-garchomp-lifeorb.js", "team-dual-mega.js", "team-core-antipsy.js"). Automatically backs up and syncs "team.js".
  • "list_team_variants": Check all available team files, registered variants, win rates, and current active team.
  • "create_file": Write, update, or edit any project file (e.g. "team.js", "tactics.js", "docs/analysis.md", "config.json", team files). Automatic backups protect critical files like "team.js".
  • "append_coach_notes": Commit durable tactical rules or threat notes directly into "knowledge/05-coach-notes.md" so the battle pilot references them in live battles!
  • "read_project_file": Read any file in the workspace (e.g. "team.js", "tactics.js", "config.json", "knowledge/05-coach-notes.md").
  • "list_project_files": List files in any directory.
  • "run_bot_battles": Start autonomous Showdown ladder battles in the background (e.g. 10 games) using the active team!
  • "update_bot_config": Update settings in "config.json" (e.g. change "coachEvery", "games", "mode", "pilot").
- CRITICAL RULES FOR COACH:
  1. You DO have filesystem write capabilities, team creation capabilities, variant switching capabilities, and battle running capabilities.
  2. NEVER tell the user "I cannot write files", "I cannot edit the registry", "I cannot switch variants", "I cannot run games", or "I would overwrite without a backup".
  3. When the user asks you to build, finish, or switch a team, call "make_and_switch_team" or "switch_team_variant" immediately!
  4. When the user asks to run games (e.g. "run 10 games" or "play on showdown"), call "run_bot_battles" immediately!
  5. Critical files like "team.js" are automatically backed up when modified.

POKÉMON CHAMPIONS (NERD-OF-NOW) DAMAGE CALCULATOR:
- You have direct, programmatic access to the Pokémon Champions damage calculation tool locked exclusively to Regulation M-C rulesets:
  • "calculate_damage": Run exact damage calculations for ANY Champions matchup (e.g. Charizard-Mega-Y Weather Ball vs Kingambit, Dragonite-Mega Dragon Pulse vs Rillaboom, Floette-Mega vs Kingambit, Sneasler Close Combat vs Mega Dragonite). Computes exact damage rolls, percentage ranges, and OHKO/2HKO probabilities under Level 50, Stat Points (0–32, max 66), 1 Mega Evolution, and Doubles spread reduction rules.
- Whenever the user asks whether a move will KO, how much damage an attack deals, what SP spread survives a hit, or how two Pokémon trade hits, PROACTIVELY call "calculate_damage" to give them verified mathematical calculations instead of guessing!

COMMUNICATION STYLE:
- Speak directly, concisely, and insightfully as an elite Pokémon coach.
- Give concrete, actionable advice (exact move recommendations, lead pairs, EV/SP suggestions, positioning tactics).
- When asked about past matches or specific matchups (like Rain, Trick Room, or PsyTerrain), reference the real ladder data and lessons above.
- Format responses cleanly with bold highlights and bullet points.`;
}

// Start Interactive REPL
async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const stats = getLadderStats();
  const lastBattle = getLastBattleInfo();
  const messages = loadChatHistory();

  console.clear();
  console.log(`${C.cyan}${C.bright}========================================================================${C.reset}`);
  console.log(`${C.cyan}${C.bright}     JJ1NE VGC COACH CHAT — [Gen 9 Champions Reg M-C]${C.reset}`);
  console.log(`${C.cyan}${C.bright}========================================================================${C.reset}`);
  const modelDisplay = CFG.claude && CFG.claude.deployments
    ? `Hybrid (${Object.entries(CFG.claude.deployments).map(([k,v]) => `${k}:${v}`).join(', ')})`
    : (CFG.claude ? CFG.claude.deployment : 'Default');
  console.log(`${C.gray}Model:${C.reset} ${modelDisplay} | ${C.gray}Endpoint:${C.reset} Microsoft Foundry`);
  console.log(`${C.gray}Team:${C.reset}  ${C.green}${Exp.getActiveVariant()}${C.reset} | ${C.gray}Record:${C.reset} ${C.yellow}${stats.w}W - ${stats.l}L (${stats.rate}%)${C.reset}`);
  if (lastBattle) {
    console.log(`${C.gray}Last:${C.reset}  vs ${lastBattle.opp} (${lastBattle.result === 'W' ? C.green + 'WIN' : C.red + 'LOSS'}${C.reset} in ${lastBattle.turns} turns vs ${lastBattle.arch})`);
  }
  if (messages.length > 0) {
    const userTurns = messages.filter(m => m.role === 'user').length;
    console.log(`${C.magenta}Memory:${C.reset} Restored ${userTurns} previous discussion turns from session history. (Type ${C.cyan}/clear${C.reset} to reset)`);
  }
  console.log(`${C.gray}Commands: ${C.cyan}/help${C.gray}, ${C.cyan}/calc <matchup>${C.gray}, ${C.cyan}/history${C.gray}, ${C.cyan}/team${C.gray}, ${C.cyan}/record${C.gray}, ${C.cyan}/clear${C.gray}, ${C.cyan}/exit${C.reset}\n`);

  const promptUser = () => {
    rl.question(`${C.green}${C.bright}You>${C.reset} `, async (input) => {
      const line = input.trim();
      if (!line) {
        promptUser();
        return;
      }

      // Check commands
      const lower = line.toLowerCase();
      if (lower === 'exit' || lower === 'quit' || lower === '/exit') {
        console.log(`\n${C.cyan}Coach:${C.reset} Good luck in your matches! Logging off.\n`);
        rl.close();
        process.exit(0);
      }

      if (lower === '/help') {
        console.log(`\n${C.cyan}${C.bright}Available Commands:${C.reset}`);
        console.log(`  ${C.cyan}/sheet <url>${C.reset}       - Fetch and load a Google Sheet into Coach memory`);
        console.log(`  ${C.cyan}/vgc${C.reset}               - Pull live VGCPastes Champions repository & tournament meta`);
        console.log(`  ${C.cyan}/search <query>${C.reset}    - Live web search for VGC tournaments, pastes, and sets`);
        console.log(`  ${C.cyan}/fetch <url>${C.reset}        - Fetch and read a Pokepaste or any webpage`);
        console.log(`  ${C.cyan}/calc <matchup>${C.reset}    - Smogon damage calc (e.g. "/calc Charizard-Y, Heat Wave vs Rillaboom, Sun")`);
        console.log(`  ${C.cyan}/team${C.reset}              - Display active team export with moves & SP spreads`);
        console.log(`  ${C.cyan}/record${C.reset}            - Display ladder win/loss record by archetype & team`);
        console.log(`  ${C.cyan}/last${C.reset}              - Show detailed breakdown of the last battle played`);
        console.log(`  ${C.cyan}/lessons${C.reset}           - Show recent coach notes & tactical lessons`);
        console.log(`  ${C.cyan}/scout <player>${C.reset}    - Look up an opponent's past teams & leads`);
        console.log(`  ${C.cyan}/history${C.reset}            - View active session discussion history`);
        console.log(`  ${C.cyan}/clear${C.reset}              - Clear conversation history from memory and disk`);
        console.log(`  ${C.cyan}/exit${C.reset}               - Exit the coach chat\n`);
        console.log(`${C.gray}Tip: You can ask Coach in plain English to calculate damage (e.g. "Does Drogon OHKO Rillaboom?"), create files, or read Google Sheets!${C.reset}\n`);
        promptUser();
        return;
      }

      if (lower.startsWith('/calc')) {
        const query = line.replace(/^\/calc\s*/i, '').trim();
        if (!query) {
          console.log(`\n${C.yellow}Usage: /calc <attacker> [move] vs <defender> [weather]${C.reset}`);
          console.log(`Example: ${C.cyan}/calc Charizard-Mega-Y, Heat Wave vs Rillaboom, Sun${C.reset}\n`);
          promptUser();
          return;
        }

        try {
          const vsSplit = query.split(/\s+vs\.?\s+/i);
          let atkPart = vsSplit[0] || '';
          let defPart = vsSplit[1] || '';

          const atkCommas = atkPart.split(',').map(s => s.trim());
          const defCommas = defPart.split(',').map(s => s.trim());

          const attackerSpecies = atkCommas[0] || 'Charizard-Mega-Y';
          const moveName = atkCommas[1] || 'Heat Wave';
          const defenderSpecies = defCommas[0] || 'Rillaboom';
          const weather = defCommas[1] || (query.toLowerCase().includes('sun') ? 'Sun' : (query.toLowerCase().includes('rain') ? 'Rain' : undefined));

          const res = WT.runDamageCalc({
            attackerSpecies,
            defenderSpecies,
            moveName,
            field: { weather, isDoubles: true }
          });

          if (res.error) {
            console.log(`\n${C.red}Calc error:${C.reset} ${res.error}\n`);
          } else {
            console.log(`\n${C.yellow}${C.bright}--- SMOGON DAMAGE CALCULATOR ---${C.reset}`);
            console.log(`${C.cyan}${res.description}${C.reset}`);
            console.log(`Damage: ${C.green}${res.minDamage} - ${res.maxDamage}${C.reset} (${res.percentage})`);
            console.log(`Rolls:  [${res.rolls.join(', ')}]`);
            console.log(`${C.yellow}---------------------------------${C.reset}\n`);
          }
        } catch (err) {
          console.log(`\n${C.red}Calc error:${C.reset} ${err.message}\n`);
        }
        promptUser();
        return;
      }

      if (lower === '/vgc') {
        process.stdout.write(`\n${C.cyan}Pulling live VGCPastes Champions M-C sheet...${C.reset} `);
        try {
          const sheet = await WT.fetchLiveVGCPastes('Champions M-C');
          console.log(`${C.green}Success! Loaded ${sheet.rowsCount} entries.${C.reset}\n`);
          console.log(`${C.yellow}${C.bright}--- LIVE CHAMPIONS META SNAPSHOT ---${C.reset}`);
          console.log(sheet.preview.slice(0, 1800));
          console.log(`${C.yellow}-------------------------------------${C.reset}\n`);
          messages.push({
            role: 'user',
            content: `[Attached Live VGCPastes Data]\n${sheet.markdown}\n\nI have fetched the latest live VGCPastes Champions repository. What are the key meta takeaways and winning cores?`
          });
          messages.push({
            role: 'assistant',
            content: `I have loaded the live VGCPastes Champions repository (${sheet.rowsCount} entries). Ask me anything about tournament placements, champion teams, or archetype matchups!`
          });
        } catch (err) {
          console.log(`${C.red}Failed to fetch VGCPastes:${C.reset} ${err.message}\n`);
        }
        promptUser();
        return;
      }

      if (lower.startsWith('/sheet')) {
        const url = line.replace(/^\/sheet\s*/i, '').trim();
        if (!url) {
          console.log(`\n${C.red}Usage: /sheet <google_sheets_url>${C.reset}\n`);
          promptUser();
          return;
        }
        process.stdout.write(`\n${C.cyan}Fetching Google Sheet...${C.reset} `);
        try {
          const sheet = await WT.fetchGoogleSheet(url);
          console.log(`${C.green}Success!${C.reset} Loaded ${sheet.rowsCount} rows (saved to docs/${sheet.saveName})\n`);
          console.log(`${C.yellow}Preview:${C.reset}\n${sheet.preview}\n`);
          messages.push({
            role: 'user',
            content: `[Attached Google Sheet: "${sheet.title}"]\n${sheet.markdown}\n\nI have loaded this Google Sheet. Please confirm what you see.`
          });
          messages.push({
            role: 'assistant',
            content: `I have received and loaded "${sheet.title}" (${sheet.rowsCount} rows). I can now analyze its spreads, usage, archetypes, and matchups. What would you like to know?`
          });
          console.log(`${C.cyan}Coach:${C.reset} Google Sheet is loaded in memory! You can now ask any question about it.\n`);
        } catch (err) {
          console.log(`${C.red}Failed to fetch sheet:${C.reset} ${err.message}\n`);
        }
        promptUser();
        return;
      }

      if (lower.startsWith('/search')) {
        const query = line.replace(/^\/search\s*/i, '').trim();
        if (!query) {
          console.log(`\n${C.red}Usage: /search <query>${C.reset}\n`);
          promptUser();
          return;
        }
        process.stdout.write(`\n${C.cyan}Searching web for "${query}"...${C.reset} `);
        try {
          const results = await WT.searchWeb(query, 5);
          if (!results.length) {
            console.log(`${C.yellow}No web results found.${C.reset}\n`);
          } else {
            console.log(`${C.green}Found ${results.length} results.${C.reset}\n`);
            console.log(`${C.yellow}${C.bright}--- WEB SEARCH RESULTS ---${C.reset}`);
            results.forEach((r, idx) => {
              console.log(`${C.cyan}${idx + 1}. ${r.title}${C.reset}`);
              console.log(`   ${C.gray}${r.link}${C.reset}`);
              console.log(`   ${r.snippet}\n`);
            });

            // Synthesize with Coach
            messages.push({
              role: 'user',
              content: `[Web Search Query: "${query}"]\nResults:\n${results.map((r, i) => `${i + 1}. ${r.title} (${r.link}): ${r.snippet}`).join('\n')}\nSummarize and evaluate these search results from a VGC competitive perspective.`
            });
            process.stdout.write(`${C.cyan}${C.bright}Coach Analysis:${C.reset} ${C.gray}Synthesizing...${C.reset}`);
            const system = buildChatSystemPrompt();
            const r = await LLM.callClaude({ ...(CFG.claude || {}), thinking: { coach: 0 } }, {
              role: 'coach',
              system,
              messages,
              maxTokens: 2500,
              timeoutMs: 90000
            });
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            console.log(`${C.cyan}${C.bright}Coach Analysis:${C.reset}\n${r.text.trim()}\n`);
            messages.push({ role: 'assistant', content: r.text });
          }
        } catch (err) {
          console.log(`${C.red}Search error:${C.reset} ${err.message}\n`);
        }
        promptUser();
        return;
      }

      if (lower.startsWith('/fetch')) {
        const url = line.replace(/^\/fetch\s*/i, '').trim();
        if (!url) {
          console.log(`\n${C.red}Usage: /fetch <url_or_pokepaste>${C.reset}\n`);
          promptUser();
          return;
        }
        process.stdout.write(`\n${C.cyan}Fetching web content...${C.reset} `);
        try {
          const doc = await WT.fetchWebPage(url);
          console.log(`${C.green}Success!${C.reset} Loaded "${doc.title}" (saved to ${doc.savedPath})\n`);
          messages.push({
            role: 'user',
            content: `[Loaded Document: "${doc.title}" (${url})]\n${doc.content}\n\nI have loaded this content. What do you see?`
          });
          messages.push({
            role: 'assistant',
            content: `I have received and loaded "${doc.title}". What would you like to analyze?`
          });
          console.log(`${C.cyan}Coach:${C.reset} Document is loaded in memory! Ask me anything about it.\n`);
        } catch (err) {
          console.log(`${C.red}Fetch error:${C.reset} ${err.message}\n`);
        }
        promptUser();
        return;
      }

      if (lower === '/team') {
        console.log(`\n${C.yellow}${C.bright}--- CURRENT ACTIVE TEAM (${Exp.getActiveVariant()}) ---${C.reset}`);
        console.log(Exp.getActiveTeamText());
        console.log(`${C.yellow}------------------------------------------------------${C.reset}\n`);
        promptUser();
        return;
      }

      if (lower === '/record') {
        const s = getLadderStats();
        console.log(`\n${C.yellow}${C.bright}--- LADDER PERFORMANCE STATS ---${C.reset}`);
        console.log(`Overall Record: ${s.w}W - ${s.l}L (${s.rate}% Win Rate over ${s.total} games)\n`);
        console.log(`Breakdown by Opponent Archetype:`);
        for (const [arch, rec] of Object.entries(s.archetypes)) {
          const total = rec.w + rec.l;
          const pct = total > 0 ? (rec.w / total * 100).toFixed(0) : '0';
          const color = +pct >= 50 ? C.green : C.red;
          console.log(`  • ${arch.padEnd(18)}: ${rec.w}W - ${rec.l}L ${color}(${pct}%)${C.reset}`);
        }
        console.log(`${C.yellow}--------------------------------${C.reset}\n`);
        promptUser();
        return;
      }

      if (lower === '/last') {
        const lb = getLastBattleInfo();
        if (!lb) {
          console.log(`\n${C.red}No battle reports found yet.${C.reset}\n`);
        } else {
          console.log(`\n${C.yellow}${C.bright}--- LAST BATTLE BREAKDOWN ---${C.reset}`);
          console.log(`Opponent:   ${lb.opp}`);
          console.log(`Result:     ${lb.result === 'W' ? C.green + 'VICTORY' : C.red + 'DEFEAT'}${C.reset} in ${lb.turns} turns`);
          console.log(`Archetype:  ${lb.arch}`);
          console.log(`Plan Used:  ${lb.plan}`);
          console.log(`Replay URL: ${C.cyan}${lb.replay || 'N/A'}${C.reset}`);
          if (lb.review) {
            console.log(`\n${C.bright}Coach Post-Mortem Snippet:${C.reset}`);
            const snippet = lb.review.split('\n').filter(l => l.startsWith('## ') || l.startsWith('1.') || l.startsWith('2.') || l.startsWith('3.')).slice(0, 10).join('\n');
            console.log(C.gray + (snippet || lb.review.slice(0, 500)) + C.reset);
          }
          console.log(`${C.yellow}-----------------------------${C.reset}\n`);
        }
        promptUser();
        return;
      }

      if (lower === '/lessons') {
        const kf = path.join(__dirname, 'knowledge', '05-coach-notes.md');
        if (fs.existsSync(kf)) {
          console.log(`\n${C.yellow}${C.bright}--- RECENT COACH NOTES & LESSONS ---${C.reset}`);
          console.log(fs.readFileSync(kf, 'utf8'));
          console.log(`${C.yellow}-------------------------------------${C.reset}\n`);
        } else {
          console.log(`\n${C.red}No coach notes found.${C.reset}\n`);
        }
        promptUser();
        return;
      }

      if (lower.startsWith('/scout')) {
        const target = line.replace(/^\/scout\s*/i, '').trim();
        if (!target) {
          console.log(`\n${C.red}Usage: /scout <player_name>${C.reset}\n`);
        } else {
          const intel = scoutOpponent(target);
          if (!intel) {
            console.log(`\n${C.yellow}No previous scouting intel found for "${target}".${C.reset}\n`);
          } else {
            console.log(`\n${C.yellow}${C.bright}--- SCOUTING REPORT: ${target} ---${C.reset}`);
            console.log(JSON.stringify(intel, null, 2));
            console.log(`${C.yellow}-----------------------------------${C.reset}\n`);
          }
        }
        promptUser();
        return;
      }

      if (lower === '/history') {
        const textMessages = messages.filter(m => typeof m.content === 'string');
        if (!textMessages.length) {
          console.log(`\n${C.yellow}No previous conversation history in session memory.${C.reset}\n`);
        } else {
          console.log(`\n${C.magenta}${C.bright}--- SESSION CONVERSATION HISTORY (${textMessages.length} messages) ---${C.reset}`);
          for (const m of textMessages) {
            const roleLabel = m.role === 'user' ? `${C.green}${C.bright}You:${C.reset}` : `${C.cyan}${C.bright}Coach:${C.reset}`;
            const snippet = m.content.length > 400 ? m.content.slice(0, 400) + '...' : m.content;
            console.log(`${roleLabel}\n${snippet}\n`);
          }
          console.log(`${C.magenta}-------------------------------------------------------${C.reset}\n`);
        }
        promptUser();
        return;
      }

      if (lower === '/clear') {
        messages.length = 0;
        clearChatHistory();
        console.log(`\n${C.gray}Conversation history cleared from memory and disk.${C.reset}\n`);
        promptUser();
        return;
      }

      // Auto-detect Google Sheets or Pokepaste link in natural question
      let userQuery = line;
      const sheetUrlMatch = line.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+[^\s]*/);
      if (sheetUrlMatch) {
        process.stdout.write(`\n${C.cyan}[Auto-Fetch] Google Sheets link detected. Fetching data...${C.reset} `);
        try {
          const sheet = await WT.fetchGoogleSheet(sheetUrlMatch[0]);
          console.log(`${C.green}Success! Loaded ${sheet.rowsCount} rows.${C.reset}`);
          userQuery = `${line}\n\n[ATTACHED GOOGLE SHEET DATA: "${sheet.title}"]\n${sheet.markdown}\n\nPlease use the above Google Sheet data to answer my request accurately.`;
        } catch (err) {
          console.log(`${C.yellow}[Warning: Could not fetch sheet: ${err.message}]${C.reset}`);
        }
      }

      const pokeMatch = line.match(/https:\/\/pokepast\.es\/[0-9a-f]+[^\s]*/i);
      if (pokeMatch && !sheetUrlMatch) {
        process.stdout.write(`\n${C.cyan}[Auto-Fetch] Pokepaste link detected. Fetching team...${C.reset} `);
        try {
          const doc = await WT.fetchWebPage(pokeMatch[0]);
          console.log(`${C.green}Success! Loaded "${doc.title}".${C.reset}`);
          userQuery = `${line}\n\n[ATTACHED POKEPASTE DATA: "${doc.title}"]\n${doc.content}\n\nPlease analyze this Pokepaste team for my request.`;
        } catch (err) {
          console.log(`${C.yellow}[Warning: Could not fetch pokepaste: ${err.message}]${C.reset}`);
        }
      }

      // Natural language question -> send to Claude with live web tools
      messages.push({ role: 'user', content: userQuery });
      process.stdout.write(`\n${C.cyan}${C.bright}Coach:${C.reset} ${C.gray}Thinking...${C.reset}`);

      try {
        try { delete require.cache[require.resolve('./web-tools.js')]; } catch (e) {}
        try { delete require.cache[require.resolve('./experiments.js')]; } catch (e) {}
        const liveWT = require('./web-tools.js');
        const system = buildChatSystemPrompt();
        // Disable extended thinking for interactive chat so responses are instant and tools execute smoothly
        const chatCfg = { ...(CFG.claude || {}), thinking: { coach: 0, turn: 0, preview: 0, chat: 0 } };

        let turns = 0;
        const maxTurns = 12;
        let finalResponse = null;

        while (turns < maxTurns) {
          turns++;
          const r = await LLM.callClaude(chatCfg, {
            role: 'chat',
            system,
            messages,
            tools: liveWT.TOOLS_DEFINITION,
            maxTokens: 4000,
            timeoutMs: 180000
          });

          // Check if Claude requested tool calls
          if (r.toolCalls && r.toolCalls.length > 0) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);

            // If Claude provided analysis text alongside the tool calls, display it!
            if (r.text && r.text.trim()) {
              console.log(`\n${C.cyan}${C.bright}Coach:${C.reset}\n${r.text.trim()}\n`);
            }

            // Record assistant message with tool calls
            messages.push({ role: 'assistant', content: r.rawContent });

            const toolResults = [];
            for (const tc of r.toolCalls) {
              const argStr = JSON.stringify(tc.input || {});
              const isWeb = tc.name.includes('web') || tc.name.includes('sheet') || tc.name.includes('url');
              const isCalc = tc.name.includes('calc') || tc.name.includes('damage');
              const isTeam = tc.name.includes('team') || tc.name.includes('variant');
              const isBattle = tc.name.includes('battle') || tc.name.includes('bot');
              const toolLabel = isCalc ? 'Damage Calculator' : (isWeb ? 'Live Web Access' : (isTeam ? 'Team Manager' : (isBattle ? 'Battle Runner' : 'Project Action')));
              console.log(`${C.cyan}${C.bright}Coach [${toolLabel}]:${C.reset} Calling ${C.yellow}${tc.name}${C.reset} ${C.gray}${argStr.slice(0, 100)}${C.reset}...`);

              let output = '';
              try {
                output = await liveWT.executeTool(tc);
              } catch (toolErr) {
                output = `Tool error: ${toolErr.message}`;
              }
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tc.id,
                content: output
              });
            }

            // Append tool results to messages
            messages.push({ role: 'user', content: toolResults });
            process.stdout.write(`${C.cyan}${C.bright}Coach:${C.reset} ${C.gray}Working...${C.reset}`);
            continue;
          }

          finalResponse = r.text;
          break;
        }

        // If loop exhausted tool turns without a final response, do one final synthesis turn
        if (!finalResponse && turns >= maxTurns) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(`${C.cyan}${C.bright}Coach:${C.reset} ${C.gray}Finalizing analysis...${C.reset}`);
          messages.push({
            role: 'user',
            content: 'Please provide your final coaching summary and response based on all the steps and tool actions above.'
          });
          const synth = await LLM.callClaude(chatCfg, {
            role: 'chat',
            system,
            messages,
            maxTokens: 2500,
            timeoutMs: 90000
          });
          finalResponse = synth.text;
        }

        // Clear "Thinking..." line
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        if (finalResponse) {
          console.log(`${C.cyan}${C.bright}Coach:${C.reset}\n${finalResponse.trim()}\n`);
          messages.push({ role: 'assistant', content: finalResponse });
          saveChatHistory(messages);
        } else {
          console.log(`${C.yellow}Coach did not return a final response.${C.reset}\n`);
        }
      } catch (err) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log(`${C.red}Coach Error:${C.reset} ${err.message}\n`);
      }

      promptUser();
    });
  };

  promptUser();
}

if (require.main === module) {
  startChat().catch((e) => {
    console.error('Fatal chat error:', e);
    process.exit(1);
  });
}
