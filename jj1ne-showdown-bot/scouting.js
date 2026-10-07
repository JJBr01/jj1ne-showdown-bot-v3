// scouting.js — Persistent Opponent Rematch Scouting Database
// Tracks opponents, their 6 Pokémon, revealed items/moves/abilities, known leads, and match records.

const fs = require('fs');
const path = require('path');

const SCOUT_FILE = path.join(__dirname, 'data', 'scouting.json');

function toID(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function loadDatabase() {
  try {
    if (fs.existsSync(SCOUT_FILE)) {
      return JSON.parse(fs.readFileSync(SCOUT_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Scouting] Error loading scouting.json:', e.message);
  }
  return {};
}

function saveDatabase(db) {
  try {
    const dir = path.dirname(SCOUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SCOUT_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[Scouting] Error saving scouting.json:', e.message);
  }
}

function getScoutReport(opponentName) {
  const id = toID(opponentName);
  if (!id) return null;
  const db = loadDatabase();
  const entry = db[id];
  if (!entry) return null;

  return {
    opponent: entry.name || opponentName,
    games: entry.games || 0,
    wins: entry.wins || 0,
    losses: entry.losses || 0,
    record: `${entry.wins || 0}W - ${entry.losses || 0}L`,
    lastPlayed: entry.lastPlayed || '',
    species: entry.species || [],
    knownSets: entry.knownSets || {},
    knownLeads: entry.knownLeads || [],
    notes: entry.notes || []
  };
}

function formatScoutPrompt(scout) {
  if (!scout) return '';
  const lines = [];
  lines.push(`\n[OPPONENT REMATCH SCOUT REPORT - KNOWN LADDER PLAYER]`);
  lines.push(`Opponent: ${scout.opponent} | Past Head-to-Head Record: ${scout.record} (${scout.games} games played)`);
  if (scout.species && scout.species.length) {
    lines.push(`Their Known Team (${scout.species.length} mons): ${scout.species.join(', ')}`);
  }
  if (scout.knownLeads && scout.knownLeads.length) {
    lines.push(`Their Common Leads in past games: ${scout.knownLeads.join(' | ')}`);
  }
  const setKeys = Object.keys(scout.knownSets || {});
  if (setKeys.length) {
    lines.push(`Confirmed Items, Abilities & Moves from past matches:`);
    for (const sp of setKeys) {
      const s = scout.knownSets[sp];
      const mvStr = s.moves && s.moves.length ? s.moves.join('/') : 'unknown moves';
      const itStr = s.item ? `@${s.item}` : '@unknown item';
      const abStr = s.ability ? `(${s.ability})` : '';
      lines.push(`  - ${sp}: ${itStr} ${abStr} ${mvStr}`);
    }
  }
  if (scout.notes && scout.notes.length) {
    lines.push(`Scout Notes: ${scout.notes.slice(-3).join('; ')}`);
  }
  lines.push(`Use this intelligence at Team Preview: counter their known leads and prepare for their revealed items (e.g. Scarf/Sash/Trick)!`);
  return lines.join('\n');
}

function recordBattle({ opponent, result, teamSpecies = [], oppBrought = [], oppLeads = '', seenSets = {}, turns = 0, notes = '' }) {
  const id = toID(opponent);
  if (!id) return;
  const db = loadDatabase();
  const entry = db[id] || {
    id,
    name: opponent,
    games: 0,
    wins: 0,
    losses: 0,
    lastPlayed: '',
    species: [],
    knownSets: {},
    knownLeads: [],
    notes: []
  };

  entry.games = (entry.games || 0) + 1;
  if (result === 'W') entry.wins = (entry.wins || 0) + 1;
  else if (result === 'L') entry.losses = (entry.losses || 0) + 1;
  entry.lastPlayed = new Date().toISOString();

  // Merge species list
  const spSet = new Set([...(entry.species || []), ...(teamSpecies || [])]);
  entry.species = Array.from(spSet);

  // Merge known leads
  if (oppLeads) {
    entry.knownLeads = entry.knownLeads || [];
    if (!entry.knownLeads.includes(oppLeads)) {
      entry.knownLeads.push(oppLeads);
      if (entry.knownLeads.length > 5) entry.knownLeads = entry.knownLeads.slice(-5);
    }
  }

  // Merge revealed sets
  entry.knownSets = entry.knownSets || {};
  for (const [monName, s] of Object.entries(seenSets || {})) {
    if (!monName) continue;
    const existing = entry.knownSets[monName] || { moves: [], item: '', ability: '' };
    if (s.item && !existing.item) existing.item = s.item;
    if (s.ability && !existing.ability) existing.ability = s.ability;
    if (s.moves && s.moves.length) {
      const mergedMoves = new Set([...existing.moves, ...s.moves]);
      existing.moves = Array.from(mergedMoves);
    }
    entry.knownSets[monName] = existing;
  }

  // Record key notes
  if (notes) {
    entry.notes = entry.notes || [];
    if (!entry.notes.includes(notes)) {
      entry.notes.push(notes);
      if (entry.notes.length > 6) entry.notes = entry.notes.slice(-6);
    }
  }

  db[id] = entry;
  saveDatabase(db);
}

module.exports = {
  getScoutReport,
  formatScoutPrompt,
  recordBattle,
  toID
};
