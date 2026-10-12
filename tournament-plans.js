// tournament-plans.js — Pre-computed plans for the Top 16 Reg M-C Tournament Teams
// Identifies opponent archetypes matching premier tournament results and applies tested counter-strategies.

const fs = require('fs');
const path = require('path');

const PLANS_FILE = path.join(__dirname, 'data', 'tournament_top16_plans.json');

function toID(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function loadPlans() {
  try {
    if (fs.existsSync(PLANS_FILE)) {
      return JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[TournamentPlans] Error loading tournament plans:', e.message);
  }
  return [];
}

function matchTournamentTeam(oppSpecies = []) {
  if (!oppSpecies || !oppSpecies.length) return null;
  const plans = loadPlans();
  if (!plans.length) return null;

  const oppIds = oppSpecies.map(s => toID(s).replace(/-mega(-[xyz])?$/i, ''));

  let bestMatch = null;
  let maxShared = 0;

  for (const t of plans) {
    const tIds = t.species.map(s => toID(s).replace(/-mega(-[xyz])?$/i, ''));
    const shared = oppSpecies.filter((sp, i) => tIds.includes(oppIds[i]));

    if (shared.length >= 4 && shared.length > maxShared) {
      maxShared = shared.length;
      bestMatch = {
        team: t,
        shared,
        sharedCount: shared.length
      };
    }
  }

  return bestMatch;
}

function formatTournamentPlan(match) {
  if (!match || !match.team) return '';
  const t = match.team;
  const p = t.plan;
  const lines = [];

  lines.push(`\n[PREMIER TOURNAMENT BLUEPRINT IDENTIFIED]`);
  lines.push(`Opponent matches ${t.name} (${t.rank} at ${t.event})!`);
  lines.push(`Shared Core (${match.sharedCount}/6 Pokémon): ${match.shared.join(', ')}`);
  lines.push(`TOURNAMENT PREVIEW & PLAY PLAN:`);
  lines.push(`  - Bring Mega: Mega ${p.mega}`);
  lines.push(`  - Recommended Leads: ${p.leads.join(' + ')}`);
  lines.push(`  - Recommended Bench: ${p.back.join(' + ')}`);
  lines.push(`  - Core Win-Con Strategy: ${p.strategy}`);
  lines.push(`Confirmed Tournament Sets for this exact archetype:`);
  for (const s of t.sets) {
    const mv = s.moves && s.moves.length ? s.moves.join('/') : 'standard moves';
    lines.push(`    • ${s.species}: @${s.item || 'unknown'} (${s.ability}) [${mv}]`);
  }
  lines.push(`Follow this pre-computed tournament game plan at preview and turn 1!`);

  return lines.join('\n');
}

module.exports = {
  loadPlans,
  matchTournamentTeam,
  formatTournamentPlan
};
