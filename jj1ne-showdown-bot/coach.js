// Post-game coach: Claude reads recent reports + stats + learned plans + current tactics + battle logs,
// analyzes what worked, lessons applied, what failed, and how to improve, writes coach/<date>.md,
// merges proposals/lessons, and autonomously writes, validates, and hot-deploys updated code to tactics.js!
// Run manually:  node coach.js [numberOfReports]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const LLM = require('./llm.js');
const LRN = require('./learning.js');
const Exp = require('./experiments.js');
const TeamEvolution = require('./team-evolution.js');

function easternStamp() {
  const d = new Date();
  const date = d.toLocaleDateString('sv-SE', { timeZone: 'America/New_York' });
  const time = d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
  const tz = d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }).split(' ').pop();
  return date + 'T' + time.replace(/:/g, '-') + '-' + tz;
}

async function runCoach(cfg, { n = 10, log = console.log, lifetime = 15, latestBattleLog = '' } = {}) {
  const dir = LRN.REPORTS;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().slice(-n);
  if (!files.length) {
    log('Coach: no reports yet');
    return null;
  }
  const reports = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8').slice(0, 3000)).join('\n\n---\n\n');
  const read = f => {
    try {
      return fs.readFileSync(path.join(LRN.DIR, f), 'utf8').slice(0, 3500);
    } catch (e) {
      return '{}';
    }
  };

  // Turn-by-turn logs of the most recent game and recent losses
  const BL = process.env.BOT_BATTLELOGS || path.join(__dirname, 'battlelogs');
  let latestLogContent = '';
  let lossLogs = '';
  try {
    const keep = /^\|(turn|move|switch|drag|faint|-damage|-heal|-boost|-unboost|-weather|-fieldstart|-sidestart|-mega|-start|-status|-fail|-immune|-activate|-miss|-hint|cant|choice|calc|win)\|/;
    if (fs.existsSync(BL)) {
      const allLogs = fs.readdirSync(BL)
        .filter(f => f.endsWith('.log'))
        .map(f => ({ name: f, time: fs.statSync(path.join(BL, f)).mtimeMs }))
        .sort((a, b) => a.time - b.time)
        .map(x => x.name);

      let latestFile = '';
      if (latestBattleLog && fs.existsSync(latestBattleLog)) {
        latestFile = path.basename(latestBattleLog);
      } else if (allLogs.length) {
        latestFile = allLogs[allLogs.length - 1];
      }

      if (latestFile && fs.existsSync(path.join(BL, latestFile))) {
        const lines = fs.readFileSync(path.join(BL, latestFile), 'utf8')
          .split('\n')
          .filter(l => keep.test(l))
          .map(l => l.replace(/\|\[(from|of|spread|silent)\][^|]*/g, ''));
        latestLogContent = `\n\n### MOST RECENT BATTLE LOG (${latestFile}):\n` + lines.join('\n').slice(0, 6000);
      }
      const losses = allLogs.filter(f => /_L_/.test(f) && f !== latestFile).slice(-2);
      for (const f of losses) {
        const lines = fs.readFileSync(path.join(BL, f), 'utf8')
          .split('\n')
          .filter(l => keep.test(l))
          .map(l => l.replace(/\|\[(from|of|spread|silent)\][^|]*/g, ''));
        lossLogs += `\n\n### PREVIOUS LOSS LOG (${f}):\n` + lines.join('\n').slice(0, 3500);
      }
    }
  } catch (e) {
    log('Coach: error reading battle logs:', e.message);
  }

  // Load current tactics.js code in active memory
  let currentTactics = '';
  const tacticsPath = path.join(__dirname, 'tactics.js');
  try {
    currentTactics = fs.readFileSync(tacticsPath, 'utf8');
  } catch (e) {
    currentTactics = '// tactics.js not yet created';
  }

  const current = LLM.loadProposals().map(p => `- [${p.area}] ${p.change} (${p.gamesLeft} games left)`).join('\n') || 'none';
  let durableLessons = '';
  try {
    const kf = path.join(__dirname, 'knowledge', '05-coach-notes.md');
    if (fs.existsSync(kf)) durableLessons = fs.readFileSync(kf, 'utf8').slice(0, 2000);
  } catch (e) {}

  // Project & Metagame Documents (vgcpastes_mc.txt, docs/)
  let projectDocs = '';
  const vgcDoc = path.join(__dirname, 'data', 'vgcpastes_mc.txt');
  if (fs.existsSync(vgcDoc)) {
    try {
      const topMeta = fs.readFileSync(vgcDoc, 'utf8').trim().split('\n').slice(0, 35).join('\n');
      projectDocs += `\n\nMETAGAME CONTEXT (Top 35 Meta Pokemon, Standard Items, Spreads, and Move Frequencies from data/vgcpastes_mc.txt):\n${topMeta}`;
    } catch(e) {}
  }
  const docsDir = path.join(__dirname, 'docs');
  if (fs.existsSync(docsDir)) {
    try {
      const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      for (const df of docFiles) {
        const content = fs.readFileSync(path.join(docsDir, df), 'utf8').slice(0, 4000);
        projectDocs += `\n\nPROJECT DOCUMENT (${df}):\n${content}`;
      }
    } catch(e) {}
  }

  const user = `CURRENT ACTIVE TACTICS CODE (tactics.js):
\`\`\`javascript
${currentTactics}
\`\`\`

CURRENT ACTIVE PROPOSALS:
${current}

DURABLE LESSONS FROM PREVIOUS COACHING:
${durableLessons}

CURRENT TEAM LOADOUT & EXPERIMENT PERFORMANCE:
${Exp.getExperimentsSummary()}

CURRENT TEAM 50-GAME TRIAL RECORD:
${JSON.stringify(TeamEvolution.loadPerformance(), null, 2)}

RECENT TEAM INSPIRATION NOTES:
${TeamEvolution.getInspirationsSummary()}

RUNNING STATS:
${read('stats.json')}

LEARNED PREVIEW PLANS:
${read('learning_plans.json')}

LAST ${files.length} GAME REPORTS (Summaries):
${reports}
${latestLogContent}
${lossLogs ? `\nOTHER RECENT LOSSES:${lossLogs}` : ''}
${projectDocs}

INSTRUCTIONS:
1. Analyze the battle log above:
   - What worked (successful decisions, moves, reads)
   - Lessons applied (were past coach lessons/rules followed or violated?)
   - What failed (exact misplays, bad leads, missed KOs, unpunished opponent setup)
   - How to improve next time
2. AUTONOMOUS CODE UPDATE:
   - Provide the complete new source code for "tactics.js" incorporating code logic to prevent the mistakes observed in this game.
   - Increment the version number.
   - Append to the changelog array explaining the new rule added.
   - Update getLeadPreference, adjustScore, shouldBlockMove, or getTacticalNotes with concrete VGC logic.
   - Ensure 100% valid JavaScript syntax with module.exports.
3. OPTIONAL ITEM EXPERIMENT:
   - If a clear team item weakness was identified (e.g. outsped in rain or crippled by Intimidate), you may include "itemExperiment": {"switchVariant": "lifeorb_garchomp"|"scarf_garchomp"|"sitrus_garchomp"|"clear_amulet_kingambit", "reason": "..."} in the JSON.
4. OPPONENT INSPIRATION & TEAM RECOMMENDATION:
   - Take inspiration from how the opponent played and their team build: what worked for them?
   - Based on our Mega Dragonite + Mega Charizard Y core, suggest any items to use, EV spread changes, or Pokémon to swap in/out.
   - You may include "teamInspiration": {"opponent": "<name>", "suggestion": "<specific item/spread/mon recommendation>", "reason": "..."} in the JSON.`;

  log(`Coach: calling Claude to analyze battle log and generate code updates...`);
  const r = await LLM.callClaude(cfg, {
    role: 'coach',
    system: LLM.COACH_SYSTEM(),
    user,
    maxTokens: cfg.coachMaxTokens || 3500,
    timeoutMs: cfg.coachTimeoutMs || 120000
  });

  const out = path.join(__dirname, 'coach');
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });
  const stamp = easternStamp();
  fs.writeFileSync(path.join(out, `${stamp}.md`), `# Coach review — ${stamp}\n\n` + r.text);

  // Parse JSON summary for proposals and lessons
  let j = null;
  try {
    j = LLM.parseJSON(r.text);
  } catch (e) {
    try {
      log('Coach: reply had no JSON header — extracting proposals and lessons');
      const r2 = await LLM.callClaude(cfg, {
        role: 'turn',
        system: 'Extract JSON summary from this coach review. Reply with ONLY valid JSON: {"analysis":{"whatWorked":"...","lessonsApplied":"...","whatFailed":"...","howToImprove":"..."},"proposals":[{"area":"preview|pilot|team","change":"...","evidence":"..."}],"lessons":["..."]}',
        user: r.text.slice(0, 5000),
        maxTokens: 900,
        timeoutMs: 60000
      });
      j = LLM.parseJSON(r2.text);
      r.usage = {
        input_tokens: (r.usage.input_tokens || 0) + ((r2.usage || {}).input_tokens || 0),
        output_tokens: (r.usage.output_tokens || 0) + ((r2.usage || {}).output_tokens || 0)
      };
    } catch (e2) {}
  }

  if (j) {
    try {
      fs.appendFileSync(path.join(out, 'proposals.jsonl'), JSON.stringify({ time: stamp, ...j }) + '\n');
      const list = LLM.mergeProposals(j.proposals || [], lifetime);
      LLM.appendLessons(j.lessons || []);
      log(`Coach: ${(j.proposals || []).length} proposals (${list.length} active), ${(j.lessons || []).length} lessons saved`);
      if (j.analysis) {
        log(`  [Review] What worked: ${j.analysis.whatWorked || 'N/A'}`);
        log(`  [Review] What failed: ${j.analysis.whatFailed || 'N/A'}`);
      }
      if (j.itemExperiment && j.itemExperiment.switchVariant) {
        try {
          const switched = Exp.switchVariant(j.itemExperiment.switchVariant, j.itemExperiment.reason);
          if (switched) {
            log(`[Item Experiment] Coach switched team loadout to "${j.itemExperiment.switchVariant}"! Reason: ${j.itemExperiment.reason}`);
          }
        } catch(err) {
          log('[Item Experiment] Error switching variant:', err.message);
        }
      }
      if (j.teamInspiration && j.teamInspiration.suggestion) {
        try {
          TeamEvolution.addInspiration(j.teamInspiration);
          log(`[Team Inspiration] Recorded suggestion inspired by opponent build: "${j.teamInspiration.suggestion}" (Reason: ${j.teamInspiration.reason})`);
        } catch(err) {
          log('[Team Inspiration] Error recording inspiration:', err.message);
        }
      }
    } catch (e) {
      log('Coach: error processing proposals/lessons:', e.message);
    }
  }

  // Autonomous Code Compilation and Deployment Pipeline
  let candidateCode = '';
  if (j && j.tacticsCode && typeof j.tacticsCode === 'string' && j.tacticsCode.includes('module.exports')) {
    candidateCode = j.tacticsCode.trim();
  } else {
    const m = r.text.match(/```(?:javascript|js)?\s*([\s\S]*?module\.exports[\s\S]*?)```/);
    if (m) {
      candidateCode = m[1].trim();
    } else {
      const idx = r.text.indexOf('module.exports');
      if (idx !== -1) {
        const sub = r.text.slice(idx);
        const end = sub.indexOf('```');
        candidateCode = (end !== -1 ? sub.slice(0, end) : sub).trim();
      }
    }
  }

  if (!candidateCode && j && (j.analysis || (j.proposals && j.proposals.length))) {
    try {
      log('Coach: generating complete tactics.js code based on post-game lessons...');
      const rCode = await LLM.callClaude(cfg, {
        role: 'coach',
        system: 'You are an autonomous JavaScript software engineer for a Pokemon Showdown bot. Output ONLY valid, runnable JavaScript code for tactics.js. Start directly with module.exports = { and provide all required methods: getLeadPreference, adjustScore, shouldBlockMove, getTacticalNotes.',
        user: `Incorporate these lessons from the last game into the tactics code:\n\nWHAT WORKED:\n${j.analysis ? j.analysis.whatWorked : 'N/A'}\n\nWHAT FAILED:\n${j.analysis ? j.analysis.whatFailed : 'N/A'}\n\nHOW TO IMPROVE:\n${j.analysis ? j.analysis.howToImprove : 'N/A'}\n\nNEW PROPOSALS:\n${(j.proposals || []).map(p => `- [${p.area}] ${p.change}`).join('\n')}\n\nCURRENT TACTICS CODE:\n${currentTactics}`,
        maxTokens: 3500,
        timeoutMs: 60000
      });
      const m = rCode.text.match(/```(?:javascript|js)?\s*([\s\S]*?module\.exports[\s\S]*?)```/);
      if (m) {
        candidateCode = m[1].trim();
      } else {
        const idx = rCode.text.indexOf('module.exports');
        if (idx !== -1) {
          const sub = rCode.text.slice(idx);
          const end = sub.indexOf('```');
          candidateCode = (end !== -1 ? sub.slice(0, end) : sub).trim();
        }
      }
    } catch(err) {
      log('Coach: code generation fallback error:', err.message);
    }
  }

  if (candidateCode) {
    candidateCode = candidateCode.replace(/^```(?:javascript|js)?\s*/i, '').replace(/```\s*$/, '').trim();
    const candPath = path.join(__dirname, 'tactics.candidate.js');
    const histDir = path.join(__dirname, 'data', 'tactics_history');
    if (!fs.existsSync(histDir)) fs.mkdirSync(histDir, { recursive: true });

    try {
      fs.writeFileSync(candPath, candidateCode, 'utf8');

      // 1. Sandbox syntax check
      execSync(`node -c "${candPath}"`, { stdio: 'pipe', timeout: 5000 });

      // 2. Load and verify required exports
      const resolvedCand = path.resolve(candPath);
      delete require.cache[resolvedCand];
      const candMod = require(resolvedCand);

      if (typeof candMod !== 'object' || candMod === null) {
        throw new Error('Export is not an object');
      }
      const requiredFns = ['getLeadPreference', 'adjustScore', 'shouldBlockMove', 'getTacticalNotes'];
      for (const fn of requiredFns) {
        if (typeof candMod[fn] !== 'function') {
          throw new Error(`Exported object is missing required function: ${fn}`);
        }
      }

      // 3. Backup existing tactics.js
      if (fs.existsSync(tacticsPath)) {
        const bkName = `tactics_${stamp.replace(/:/g, '-')}_v${candMod.version || 'prev'}.js`;
        fs.copyFileSync(tacticsPath, path.join(histDir, bkName));
      }

      // 4. Atomic deploy
      fs.copyFileSync(candPath, tacticsPath);

      // Invalidate require cache so running bot instantly picks up new code
      try {
        const resolvedTactics = path.resolve(tacticsPath);
        delete require.cache[resolvedTactics];
      } catch (e) {}

      const latestLog = Array.isArray(candMod.changelog) ? candMod.changelog[candMod.changelog.length - 1] : 'tactics updated';
      log(`[Self-Coding] Successfully compiled and deployed tactics.js (v${candMod.version || '?'})!`);
      log(`[Self-Coding] New tactical lesson applied: "${latestLog}"`);
    } catch (err) {
      log(`[Self-Coding] Code validation failed: ${err.message}. Retaining existing tactics.js.`);
      try {
        fs.writeFileSync(path.join(__dirname, 'tactics.failed.js'), candidateCode, 'utf8');
      } catch (e) {}
    }
  } else {
    log('Coach: no candidate tacticsCode detected in model output.');
  }

  log(`Coach review written: coach/${stamp}.md (${r.ms}ms)`);
  return { text: r.text, usage: r.usage || {} };
}

module.exports = { runCoach };

if (require.main === module) {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  runCoach(cfg.claude || {}, {
    n: +process.argv[2] || 5,
    lifetime: cfg.proposalLifetimeGames || 15
  }).catch(e => {
    console.error('Coach failed:', e.message);
    process.exit(1);
  });
}

