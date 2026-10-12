// team-evolution.js — Autonomous Team Evolution & 50-Game Performance Pivot System
// Maintains recommended teams built around the Mega Dragonite + Mega Charizard core,
// records opponent inspirations, and automatically swaps teams if record falls below .500 after 50 games.

const fs = require('fs');
const path = require('path');
const { Teams } = require('./ps/dist/sim/teams');

const DATA_DIR = path.join(__dirname, 'data');
const PERF_FILE = path.join(DATA_DIR, 'team_performance.json');
const RECS_FILE = path.join(DATA_DIR, 'recommended_teams.json');
const INSP_FILE = path.join(DATA_DIR, 'team_inspirations.json');

const INITIAL_RECOMMENDED_TEAMS = [
  {
    id: "core_standard",
    name: "Dragonite-Charizard Standard (Sitrus Garchomp + Life Orb Kingambit)",
    description: "Balanced dual-Mega core with Sitrus Berry bulk Garchomp, Life Orb Kingambit, Leftovers Milotic, and Tailwind Whimsicott.",
    teamText: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Weather Ball
- Heat Wave
- Ancient Power
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Modest Nature
- Dragon Pulse
- Heat Wave
- Tailwind
- Protect

Garchomp (M) @ Sitrus Berry
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Rock Slide
- Protect

Whimsicott (F) @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect

Kingambit (M) @ Life Orb
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Milotic (F) @ Leftovers
Ability: Competitive
Level: 50
EVs: 32 HP / 18 Def / 16 SpD
Calm Nature
- Scald
- Ice Beam
- Recover
- Protect`
  },
  {
    id: "core_scarf_offense",
    name: "Dragonite-Charizard Scarf Offense (Choice Scarf Garchomp + Black Glasses Kingambit)",
    description: "High-tempo variant: Choice Scarf Garchomp outspeeds Archaludon in Rain and Dragapult; Black Glasses Kingambit powers up Kowtow Cleave and Sucker Punch with zero recoil.",
    teamText: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Weather Ball
- Heat Wave
- Ancient Power
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Modest Nature
- Dragon Pulse
- Heat Wave
- Tailwind
- Protect

Garchomp (M) @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Rock Slide
- Stomping Tantrum

Whimsicott (F) @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect

Kingambit (M) @ Black Glasses
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Milotic (F) @ Leftovers
Ability: Competitive
Level: 50
EVs: 32 HP / 18 Def / 16 SpD
Calm Nature
- Scald
- Ice Beam
- Recover
- Protect`
  },
  {
    id: "core_grassy_balance",
    name: "Dragonite-Charizard Grassy Balance (Rillaboom over Whimsicott)",
    description: "Tournament inspiration from Frankfurt Champion: Rillaboom replaces Whimsicott for Grassy Terrain recovery, priority Grassy Glide, Fake Out, and U-turn pivoting.",
    teamText: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Weather Ball
- Heat Wave
- Ancient Power
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Modest Nature
- Dragon Pulse
- Heat Wave
- Tailwind
- Protect

Rillaboom (M) @ Miracle Seed
Ability: Grassy Surge
Level: 50
EVs: 32 HP / 32 Atk / 2 Spe
Adamant Nature
- Grassy Glide
- Wood Hammer
- Fake Out
- U-turn

Garchomp (M) @ Sitrus Berry
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Rock Slide
- Protect

Kingambit (M) @ Life Orb
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Milotic (F) @ Leftovers
Ability: Competitive
Level: 50
EVs: 32 HP / 18 Def / 16 SpD
Calm Nature
- Scald
- Ice Beam
- Recover
- Protect`
  },
  {
    id: "core_lum_tank",
    name: "Dragonite-Charizard Lum Tank (Lum Berry Kingambit + Choice Scarf Garchomp)",
    description: "Anti-status build: Lum Berry Kingambit eats Will-O-Wisp, Spore, and Thunder Wave, immediately punishing status users without losing offensive momentum.",
    teamText: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Weather Ball
- Heat Wave
- Ancient Power
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Modest Nature
- Dragon Pulse
- Heat Wave
- Tailwind
- Protect

Garchomp (M) @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Dragon Claw
- Rock Slide
- Stomping Tantrum

Whimsicott (F) @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect

Kingambit (M) @ Lum Berry
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Milotic (F) @ Leftovers
Ability: Competitive
Level: 50
EVs: 32 HP / 18 Def / 16 SpD
Calm Nature
- Scald
- Ice Beam
- Recover
- Protect`
  }
];

function loadPerformance() {
  try {
    if (fs.existsSync(PERF_FILE)) {
      return JSON.parse(fs.readFileSync(PERF_FILE, 'utf8'));
    }
  } catch (e) {}

  return {
    activeTeamId: "core_standard",
    windowGames: 0,
    windowWins: 0,
    windowLosses: 0,
    totalGames: 0,
    totalWins: 0,
    history: []
  };
}

function savePerformance(perf) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PERF_FILE, JSON.stringify(perf, null, 2), 'utf8');
  } catch (e) {
    console.error('[TeamEvolution] Error saving performance:', e.message);
  }
}

function loadRecommendedTeams() {
  try {
    if (fs.existsSync(RECS_FILE)) {
      return JSON.parse(fs.readFileSync(RECS_FILE, 'utf8'));
    }
  } catch (e) {}

  // Save default recommended teams
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(RECS_FILE, JSON.stringify(INITIAL_RECOMMENDED_TEAMS, null, 2), 'utf8');
  return INITIAL_RECOMMENDED_TEAMS;
}

function saveRecommendedTeams(teams) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(RECS_FILE, JSON.stringify(teams, null, 2), 'utf8');
  } catch (e) {
    console.error('[TeamEvolution] Error saving recommended teams:', e.message);
  }
}

function getActiveTeam() {
  const perf = loadPerformance();
  const teams = loadRecommendedTeams();
  return teams.find(t => t.id === perf.activeTeamId) || teams[0];
}

function recordGame(won, log = console.log) {
  const perf = loadPerformance();
  perf.totalGames = (perf.totalGames || 0) + 1;
  if (won) perf.totalWins = (perf.totalWins || 0) + 1;

  perf.windowGames = (perf.windowGames || 0) + 1;
  if (won) perf.windowWins = (perf.windowWins || 0) + 1;
  else perf.windowLosses = (perf.windowLosses || 0) + 1;

  savePerformance(perf);

  const winRate = perf.windowWins / perf.windowGames;
  log(`[Team Performance] Current Team: "${perf.activeTeamId}" | Window: ${perf.windowWins}W - ${perf.windowLosses}L (${perf.windowGames}/50 games, ${Math.round(winRate * 100)}%)`);

  // Check 50-game benchmark
  if (perf.windowGames >= 50) {
    if (winRate < 0.500) {
      log(`[TEAM PIVOT TRIGGERED] Win rate (${Math.round(winRate * 100)}%) is below .500 after 50 games (${perf.windowWins}-${perf.windowLosses})!`);
      return executePivot(perf, log);
    } else {
      log(`[TEAM BENCHMARK PASSED] Win rate (${Math.round(winRate * 100)}%) is >= .500 over 50 games. Retaining "${perf.activeTeamId}" and resetting window.`);
      perf.history.push({
        teamId: perf.activeTeamId,
        date: new Date().toISOString(),
        record: `${perf.windowWins}-${perf.windowLosses}`,
        result: 'PASSED'
      });
      perf.windowGames = 0;
      perf.windowWins = 0;
      perf.windowLosses = 0;
      savePerformance(perf);
    }
  }

  return { pivoted: false, record: `${perf.windowWins}-${perf.windowLosses}`, winRate };
}

function executePivot(perf, log = console.log) {
  const teams = loadRecommendedTeams();
  const currentIndex = teams.findIndex(t => t.id === perf.activeTeamId);
  const nextIndex = (currentIndex + 1) % teams.length;
  const nextTeam = teams[nextIndex];

  perf.history.push({
    teamId: perf.activeTeamId,
    date: new Date().toISOString(),
    record: `${perf.windowWins}-${perf.windowLosses}`,
    result: 'PIVOTED_BELOW_500',
    swappedTo: nextTeam.id
  });

  const oldTeamId = perf.activeTeamId;
  perf.activeTeamId = nextTeam.id;
  perf.windowGames = 0;
  perf.windowWins = 0;
  perf.windowLosses = 0;
  savePerformance(perf);

  // Update team.js with the newly recommended team
  try {
    const teamFilePath = path.join(__dirname, 'team.js');
    fs.writeFileSync(teamFilePath, `module.exports = \`${nextTeam.teamText}\`;\n`, 'utf8');
    delete require.cache[require.resolve('./team.js')];
    log(`[TEAM PIVOT] Successfully updated team.js to "${nextTeam.name}"!`);
  } catch (e) {
    log('[TEAM PIVOT] Error updating team.js:', e.message);
  }

  log(`[TEAM PIVOT COMPLETE] Swapped from "${oldTeamId}" to "${nextTeam.name}". Starting fresh 50-game evaluation trial.`);
  return {
    pivoted: true,
    oldTeam: oldTeamId,
    newTeam: nextTeam,
    reason: `Below .500 record after 50 games`
  };
}

function addInspiration(item) {
  try {
    let list = [];
    if (fs.existsSync(INSP_FILE)) {
      list = JSON.parse(fs.readFileSync(INSP_FILE, 'utf8'));
    }
    list.unshift({
      timestamp: new Date().toISOString(),
      ...item
    });
    if (list.length > 50) list = list.slice(0, 50);
    fs.writeFileSync(INSP_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

function getInspirationsSummary() {
  try {
    if (fs.existsSync(INSP_FILE)) {
      const list = JSON.parse(fs.readFileSync(INSP_FILE, 'utf8'));
      if (!list.length) return 'None recorded yet.';
      return list.slice(0, 5).map(x => `- [${x.opponent || 'Opponent'}] Suggestion: ${x.suggestion || ''} (Reason: ${x.reason || ''})`).join('\n');
    }
  } catch (e) {}
  return 'None recorded yet.';
}

module.exports = {
  loadPerformance,
  loadRecommendedTeams,
  saveRecommendedTeams,
  getActiveTeam,
  recordGame,
  executePivot,
  addInspiration,
  getInspirationsSummary
};
