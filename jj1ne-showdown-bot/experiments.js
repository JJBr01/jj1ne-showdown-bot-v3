// experiments.js — Autonomous Item & Set Experimentation System
// Manages team variants (e.g. Scarf Garchomp vs Sitrus Garchomp, Clear Amulet Kingambit)
// and tracks win rates per loadout so Coach can test and switch setups autonomously.

const fs = require('fs');
const path = require('path');
const { Teams } = require('./ps/dist/sim/teams');

const EXP_FILE = path.join(__dirname, 'data', 'team_experiments.json');

// Helper to locate team files dynamically from variant names or filenames
function findTeamFile(name) {
  if (!name) return null;
  const clean = String(name).trim();

  // If path exists directly
  const directPath = path.isAbsolute(clean) ? clean : path.join(__dirname, clean);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) return directPath;
  if (!clean.endsWith('.js')) {
    const withJs = directPath + '.js';
    if (fs.existsSync(withJs) && fs.statSync(withJs).isFile()) return withJs;
  }

  // Common naming patterns in project root
  const candidates = [
    `team-${clean}.js`,
    `team-${clean.replace(/_/g, '-')}.js`,
    `team-core-${clean}.js`,
    `team-core-${clean.replace(/_/g, '-')}.js`,
    `team-garchomp-${clean}.js`,
    `team-garchomp-${clean.replace(/_/g, '-')}.js`,
    `team_${clean}.js`,
    `${clean}.js`
  ];

  for (const c of candidates) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }

  // Scan project root for any team-*.js file matching the normalized query
  try {
    const files = fs.readdirSync(__dirname);
    const normalized = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = files.find(f => {
      if (!f.startsWith('team') || !f.endsWith('.js')) return false;
      const fNorm = f.toLowerCase().replace(/[^a-z0-9]/g, '');
      return fNorm.includes(normalized);
    });
    if (found) return path.join(__dirname, found);
  } catch (e) {}

  return null;
}

// Safely loads team text from either a JS export or a raw Showdown paste
function loadTeamContent(p) {
  try {
    delete require.cache[require.resolve(p)];
    const exported = require(p);
    if (typeof exported === 'string') return exported;
    if (exported && typeof exported === 'object') {
      if (typeof exported.paste === 'string') return exported.paste;
      if (typeof exported.teamText === 'string') return exported.teamText;
    }
  } catch (e) {}

  // Fallback: Read file text directly
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const match = raw.match(/module\.exports\s*=\s*[`"']([\s\S]*?)[`"'];?/);
    if (match) return match[1].trim();
    return raw.trim();
  } catch (e) {}
  return '';
}

// Safely backs up team.js and writes the active team text to team.js
function backupAndWriteTeamJs(teamText) {
  try {
    const teamJsPath = path.join(__dirname, 'team.js');
    const backupDir = path.join(__dirname, 'data', 'team_backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // 1. Create timestamped backup and root team.backup.js
    if (fs.existsSync(teamJsPath)) {
      const current = fs.readFileSync(teamJsPath, 'utf8');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(path.join(backupDir, `team-${ts}.js`), current, 'utf8');
      fs.writeFileSync(path.join(__dirname, 'team.backup.js'), current, 'utf8');
    }

    // 2. Format clean module export
    let rawPaste = String(teamText).trim();
    const match = rawPaste.match(/module\.exports\s*=\s*[`"']([\s\S]*?)[`"'];?/);
    if (match) rawPaste = match[1].trim();

    const formatted = `module.exports = \`${rawPaste}\`;\n`;
    fs.writeFileSync(teamJsPath, formatted, 'utf8');
    try { delete require.cache[require.resolve(teamJsPath)]; } catch (e) {}
    console.log('[Experiments] Successfully backed up and synchronized team.js');
    return true;
  } catch (e) {
    console.error('[Experiments] Error writing team.js:', e.message);
    return false;
  }
}

// Base templates with dynamic resolution
function getTemplate(name) {
  try {
    // 1. Explicit aliases
    if (name === 't16_counter' || name === 't16' || name === 'team_core_t16') {
      const p = path.join(__dirname, 'team-core-t16-counter.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'sun_tempo' || name === 'team_sun_tempo') {
      const p = path.join(__dirname, 'team-core-sun-tempo.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'antirain' || name === 'anti_rain') {
      const p = path.join(__dirname, 'team-core-antirain.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'antipsy' || name === 'anti_psy') {
      const p = path.join(__dirname, 'team-core-antipsy.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'antitr' || name === 'anti_tr') {
      const p = path.join(__dirname, 'team-core-antitr.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'antisand' || name === 'anti_sand') {
      const p = path.join(__dirname, 'team-core-antisand.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'dual_mega' || name === 'charizard_dragonite') {
      const p = path.join(__dirname, 'team-dual-mega.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'lifeorb_garchomp' || name === 'life_orb_garchomp' || name === 'garchomp_lifeorb') {
      const p = path.join(__dirname, 'team-garchomp-lifeorb.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'scarf_garchomp') {
      const p = path.join(__dirname, 'team-garchomp-choicescarf.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }
    if (name === 'sitrus_garchomp') {
      const p = path.join(__dirname, 'team-garchomp-sitrus.js');
      if (fs.existsSync(p)) return loadTeamContent(p);
    }

    // 2. Dynamic file match
    const found = findTeamFile(name);
    if (found) return loadTeamContent(found);

    // 3. Registered variants record
    const state = loadState();
    if (state.variants && state.variants[name]) {
      const v = state.variants[name];
      if (v.teamText) return v.teamText;
      if (v.file) {
        const fp = path.resolve(__dirname, v.file);
        if (fs.existsSync(fp)) return loadTeamContent(fp);
      }
    }

    // 4. Default fallback: team.js
    const teamPath = path.join(__dirname, 'team.js');
    return loadTeamContent(teamPath);
  } catch (e) {
    const teamPath = path.join(__dirname, 'team.js');
    return loadTeamContent(teamPath);
  }
}

function loadState() {
  try {
    if (fs.existsSync(EXP_FILE)) {
      return JSON.parse(fs.readFileSync(EXP_FILE, 'utf8'));
    }
  } catch (e) {}

  return {
    activeVariant: 'standard',
    history: [],
    variants: {
      standard: {
        name: 'standard',
        description: 'Standard: Sitrus Berry Garchomp + Life Orb Kingambit',
        games: 0,
        wins: 0
      },
      scarf_garchomp: {
        name: 'scarf_garchomp',
        description: 'Choice Scarf Garchomp (High Speed Rock Slide / Stomping Tantrum / EQ)',
        games: 0,
        wins: 0
      },
      clear_amulet_kingambit: {
        name: 'clear_amulet_kingambit',
        description: 'Clear Amulet Kingambit (Blocks opposing Intimidate & stat drops)',
        games: 0,
        wins: 0
      },
      lifeorb_garchomp: {
        name: 'lifeorb_garchomp',
        description: 'Life Orb Garchomp + Chople Berry Kingambit + Rillaboom + Incineroar (Dual Mega Core)',
        games: 0,
        wins: 0
      }
    }
  };
}

function saveState(state) {
  try {
    const dir = path.dirname(EXP_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EXP_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('[Experiments] Error saving team_experiments.json:', e.message);
  }
}

function registerVariant(name, details = {}) {
  const state = loadState();
  const cleanName = String(name).trim();
  state.variants[cleanName] = {
    name: cleanName,
    description: details.description || `Custom variant: ${cleanName}`,
    file: details.file ? path.relative(__dirname, details.file) : undefined,
    teamText: details.teamText || undefined,
    games: details.games || (state.variants[cleanName] ? state.variants[cleanName].games : 0),
    wins: details.wins || (state.variants[cleanName] ? state.variants[cleanName].wins : 0)
  };
  saveState(state);
  return state.variants[cleanName];
}

function getActiveVariant() {
  const state = loadState();
  return state.activeVariant || 'standard';
}

function getActiveTeamText() {
  const variant = getActiveVariant();
  let baseText = getTemplate(variant);

  // If clear_amulet_kingambit is active, swap Kingambit item
  if (variant === 'clear_amulet_kingambit') {
    baseText = baseText.replace(/Kingambit @ Life Orb/i, 'Kingambit @ Clear Amulet');
  }
  return baseText;
}

function getActivePacked() {
  const text = getActiveTeamText();
  return Teams.pack(Teams.import(text));
}

function switchVariant(variantName, reason = '', options = {}) {
  const state = loadState();
  const cleanName = String(variantName).trim();

  // If not yet registered, try dynamic registration
  if (!state.variants[cleanName]) {
    const candidateFile = findTeamFile(cleanName);
    if (candidateFile || options.teamText) {
      state.variants[cleanName] = {
        name: cleanName,
        description: options.description || `Variant: ${cleanName}`,
        file: candidateFile ? path.relative(__dirname, candidateFile) : undefined,
        teamText: options.teamText || undefined,
        games: 0,
        wins: 0
      };
      saveState(state);
      console.log(`[Experiments] Dynamically registered variant "${cleanName}".`);
    } else {
      console.log(`[Experiments] Unknown variant "${cleanName}" — keeping "${state.activeVariant}"`);
      return false;
    }
  }

  const prev = state.activeVariant;
  state.activeVariant = cleanName;
  state.history.push({
    timestamp: new Date().toISOString(),
    from: prev,
    to: cleanName,
    reason: reason || 'Switched via AI Coach'
  });
  if (state.history.length > 20) state.history = state.history.slice(-20);
  saveState(state);
  console.log(`[Experiments] Switched team variant from "${prev}" to "${cleanName}". Reason: ${reason}`);

  // Automatically synchronize with team.js (with backup) unless explicitly disabled
  if (options.updateTeamJs !== false) {
    const teamText = getTemplate(cleanName);
    if (teamText) {
      backupAndWriteTeamJs(teamText);
    }
  }

  return true;
}

function createAndSwitchTeam(name, teamText, description = '', options = {}) {
  const cleanName = String(name).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const targetFile = options.filePath ? path.resolve(__dirname, options.filePath) : path.join(__dirname, `team-${cleanName.replace(/_/g, '-')}.js`);

  // 1. Validate team with Showdown Teams parser
  let rawPaste = String(teamText).trim();
  const match = rawPaste.match(/module\.exports\s*=\s*[`"']([\s\S]*?)[`"'];?/);
  if (match) rawPaste = match[1].trim();

  let imported = [];
  try {
    imported = Teams.import(rawPaste);
    if (!imported || imported.length === 0) {
      return { success: false, error: 'Could not parse any Pokémon from the provided team text.' };
    }
  } catch (e) {
    return { success: false, error: `Invalid Pokémon Showdown team format: ${e.message}` };
  }

  // 2. Write file
  const fileContent = `// team-${cleanName}.js — ${description || 'Custom Team Variant'}\n// Created autonomously via AI Coach\n\nmodule.exports = \`${rawPaste}\`;\n`;
  const dir = path.dirname(targetFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetFile, fileContent, 'utf8');

  // 3. Register variant in experiments system
  registerVariant(cleanName, {
    description: description || `Custom variant: ${cleanName} (${imported.map(p => p.name || p.species).join(', ')})`,
    file: targetFile,
    teamText: rawPaste
  });

  // 4. Activate immediately unless disabled
  const shouldActivate = options.activate !== false;
  if (shouldActivate) {
    switchVariant(cleanName, options.reason || 'Created and activated via AI Coach', {
      updateTeamJs: options.updateTeamJs !== false
    });
  }

  return {
    success: true,
    variant: cleanName,
    file: path.relative(__dirname, targetFile),
    pokemonCount: imported.length,
    roster: imported.map(p => p.name || p.species),
    active: shouldActivate
  };
}

function listAllVariants() {
  const state = loadState();
  const res = [];
  const knownNames = new Set(Object.keys(state.variants || {}));

  for (const [k, v] of Object.entries(state.variants || {})) {
    res.push({
      id: k,
      name: v.name || k,
      description: v.description || '',
      games: v.games || 0,
      wins: v.wins || 0,
      winRate: v.games > 0 ? `${Math.round(100 * v.wins / v.games)}%` : '0 games',
      isActive: k === state.activeVariant
    });
  }

  // Also include any standalone team-*.js files in root not yet tracked
  try {
    const files = fs.readdirSync(__dirname);
    for (const f of files) {
      if (f.startsWith('team-') && f.endsWith('.js')) {
        const idGuess = f.replace(/^team-/, '').replace(/\.js$/, '').replace(/-/g, '_');
        if (!knownNames.has(idGuess) && !knownNames.has(f.replace(/\.js$/, ''))) {
          res.push({
            id: idGuess,
            name: idGuess,
            description: `File: ${f}`,
            games: 0,
            wins: 0,
            winRate: 'unregistered file',
            isActive: false,
            file: f
          });
        }
      }
    }
  } catch (e) {}

  return res;
}

function recordGameResult(won) {
  const state = loadState();
  const v = state.activeVariant || 'standard';
  const entry = state.variants[v] || { name: v, games: 0, wins: 0 };
  entry.games = (entry.games || 0) + 1;
  if (won) entry.wins = (entry.wins || 0) + 1;
  state.variants[v] = entry;
  saveState(state);
}

function getExperimentsSummary() {
  const state = loadState();
  const lines = [];
  lines.push(`Active Loadout: [${state.activeVariant}] - ${(state.variants[state.activeVariant] || {}).description || ''}`);
  lines.push(`Loadout Performance Record:`);
  for (const [k, v] of Object.entries(state.variants)) {
    const rate = v.games > 0 ? `${Math.round(100 * v.wins / v.games)}%` : 'no games';
    lines.push(`  - ${k}: ${v.wins}W - ${v.games - v.wins}L (${rate}) | ${v.description}`);
  }
  return lines.join('\n');
}

module.exports = {
  getActiveVariant,
  getActiveTeamText,
  getActivePacked,
  switchVariant,
  recordGameResult,
  getExperimentsSummary,
  registerVariant,
  createAndSwitchTeam,
  findTeamFile,
  backupAndWriteTeamJs,
  listAllVariants
};
