// Trainer-authorized corrections. Hot-reloaded by pilots.js.
// Contextual guidance replaces stale roster directives and blanket terrain bans.
const foes = b => (b.sides[0] && b.sides[0].foe ? b.sides[0].foe.active : (b.sides[1] || {}).active || []).filter(p => p && !p.fainted);
const ability = p => { try { return p.getAbility().id; } catch (_) { return ''; } };
const grounded = p => { try { return p.isGrounded(); } catch (_) { return null; } };
module.exports = {
  version: 4,
  lastUpdated: new Date().toISOString(),
  changelog: ['Removed stale Garchomp roster notes and unconditional Chople survival claims.', 'Added combined-threat, preservation-purpose and conditional-attack guidance.', 'Psychic Terrain guard checks target grounding; removed blanket Tailwind prohibition.'],
  getLeadPreference() { return null; },
  adjustScore(battle, mon, move, target) {
    // Do not substitute Pokemon count for a verified winning position.
    // Do not reward Protect or direct attacks without contextual threat analysis.
    return 0;
  },
  shouldBlockMove(battle, mon, move, target) {
    if (move.id !== 'suckerpunch') return false;
    const opponents = mon.side && mon.side.foe ? mon.side.foe.active.filter(p => p && !p.fainted) : foes(battle);
    if (opponents.some(p => ['armortail', 'dazzling', 'queenlymajesty'].includes(ability(p)))) return true;
    // Engine callers sometimes pass a list instead of the actual target.
    // Block only when every possible target is confirmed grounded.
    const targets = target && !Array.isArray(target) && target.side ? [target] : opponents;
    return battle.field.terrain === 'psychicterrain' && targets.length > 0 && targets.every(p => grounded(p) === true);
  },
  getTacticalNotes(battle, req) {
    const notes = [
      'MACRO: identify our winning endgame and their main threat; preserve required answers, not every Pokemon indiscriminately.',
      'CHECK STATE: current HP, boosts, consumed items, previous Protect, actual entry-turn Fake Out eligibility, Mega availability and field durations.',
      'CHECK MOVE ORDER: priority, effective Speed, Mega changes, Tailwind and Trick Room. Check both incoming attacks together before assuming survival or a KO before the foe moves.',
      'CALC CAUTION: supplied ranges use inferred sets and approximate KO odds. Do not call a line guaranteed without validating its assumptions and accuracy.',
      'KINGAMBIT: Dark/Steel RESISTS Ghost; it is not immune to Shadow Ball. Chople halves one super-effective Fighting hit, not all incoming damage and not a guaranteed survival.',
      'SUCKER PUNCH: compare Protect, switch and setup responses before repeating it. Prefer broader option coverage when it advances the endgame; direct attacks are not automatically safe either.',
      'PRESERVATION: for each Protect or switch identify the next useful action or pivot purpose. Avoid repeatedly saving a low-HP Dragonite without an achievable attack or Tailwind window.',
      'PROTECT: Protect + attack/switch/speed control may cover both slots. Double Protect can stall/scout but can concede setup or positioning. Do not equate Pokemon-count advantage with a safe win.',
      'FAKE OUT: check eligibility from actual entries and opposing Fake Out order. Psychic Terrain protects grounded targets from opposing priority, not every target. Account for Ghost, Inner Focus and team-wide priority blockers.',
      'SPEED CONTROL: Tailwind must translate into useful actions. Opposing Trick Room setter presence alone does not forbid Tailwind; check whether Room can be denied, whether it is expiring and the actual future move order.',
      'SWITCH SAFETY: evaluate both opposing slots and our partner. Immunity to one attack does not prove a safe switch.',
      'CURRENT ROSTER: Charizard, Dragonite, Gholdengo, Incineroar, Rillaboom, Kingambit. Read live moves/items rather than assuming older Garchomp variants.'
    ];
    if (battle.field.terrain === 'psychicterrain') notes.push('TERRAIN WAR: preserve Rillaboom if restoring Grassy Terrain is essential. KOing Indeedee does not erase Psychic Terrain. Check target grounding for priority.');
    if (battle.field.terrain === 'grassyterrain') notes.push('Grassy Terrain weakens Earthquake against grounded targets, not High Horsepower. Include recovery in damage thresholds.');
    if (battle.field.pseudoWeather.trickroom) notes.push('ACTIVE TRICK ROOM: slower moves first within each priority bracket. Do not reflexively Tailwind; count remaining Room turns and evaluate the expiration turn. Consider leaving passive support alive to deny a free sweeper entry.');
    if (battle.field.weather === 'sunnyday') notes.push('SUN: Hurricane normally has 50% accuracy. Do not rely on it as guaranteed progress. Check weather changes for Weather Ball and Solar Beam.');
    return notes;
  }
};
