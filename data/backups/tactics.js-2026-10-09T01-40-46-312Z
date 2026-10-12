// tactics.js — Autonomously maintained and updated by the Coach after every game.
// Hot-reloaded at runtime without requiring a bot restart.
// Codified with Wolfe Glick VGC Masterclass principles from 34 championship lessons.

module.exports = {
  version: 3,
  lastUpdated: new Date().toISOString(),
  lastBattle: "VGC Masterclass Distillation (34 Lessons) + Life Orb Garchomp Core",
  changelog: [
    "Initial baseline tactics module with anti-Trick Room, anti-priority, and anti-sand rules",
    "Codified Wolfe Masterclass rules: safe play bias when ahead (anti-dice roll), speed control setter denial, Multiscale win-con preservation, Trick Room Encore reversal",
    "Added Life Orb Garchomp & Grassy Terrain rules: penalize Earthquake under Grassy Terrain (-2.5), prefer Stomping Tantrum (+1.5); updated lead preferences for Incineroar/Rillaboom core; enforce Chople Kingambit survival priority"
  ],

  // 1. Dynamic Matchup Lead & Bench Preferences (Wolfe Preview Elimination Technique)
  getLeadPreference: function(arch, oppSets) {
    if (arch === 'trickroom') {
      return { lead: 'zk', prefer: ['Kingambit', 'Incineroar', 'Dragonite'], avoid: ['Charizard'] };
    }
    if (arch === 'sand') {
      return { lead: 'zg', prefer: ['Garchomp', 'Dragonite', 'Rillaboom'], avoid: ['Charizard'] };
    }
    if (arch === 'psyterrain') {
      return { lead: 'zk', prefer: ['Kingambit', 'Charizard', 'Rillaboom'], avoid: ['Dragonite'] };
    }
    if (arch === 'rain') {
      return { lead: 'dr', prefer: ['Dragonite', 'Rillaboom', 'Incineroar'], avoid: ['Charizard'] };
    }
    return null;
  },

  // 2. Score adjustments for candidate moves evaluated by Wolfe engine
  // returns a delta number added to candidate.score
  adjustScore: function(battle, mon, move, target, currentScore) {
    let delta = 0;
    const oppActive = (battle.sides[1] && battle.sides[1].active || []).filter(x => x && !x.fainted);
    const myAlive = (battle.sides[0] && battle.sides[0].pokemon || []).filter(x => x && !x.fainted).length;
    const oppAlive = (battle.sides[1] && battle.sides[1].pokemon || []).filter(x => x && !x.fainted).length;

    // Rule 1: Avoid setting Tailwind into Trick Room
    if (move.id === 'tailwind') {
      const isTR = !!battle.field.pseudoWeather.trickroom;
      const hasTRSetter = oppActive.some(f => ['farigiraf','porygon2','dusclops','hatterene','bronzong','oranguru'].includes((f.species.baseSpecies || f.species.name || '').toLowerCase()));
      if (isTR || hasTRSetter) return -10.0;
    }

    // Rule 2: Sucker Punch into priority blockers fails (Psychic Terrain, Armor Tail, Dazzling, Queenly Majesty)
    if (move.id === 'suckerpunch') {
      const isTerrain = battle.field.terrain === 'psychicterrain';
      const hasArmorTail = oppActive.some(f => ['armortail','dazzling','queenlymajesty'].includes(f.getAbility().id));
      if (isTerrain || hasArmorTail) return -10.0;

      // Under Trick Room, Kingambit naturally outspeeds fast foes: prefer Kowtow Cleave (85 BP, never fails) over Sucker Punch (70 BP)
      if (battle.field.pseudoWeather.trickroom) {
        return -2.5;
      }
    }

    // Rule 3: Under Trick Room, boost Kowtow Cleave for Kingambit (100% accurate, unblockable STAB)
    if (move.id === 'kowtowcleave' && battle.field.pseudoWeather.trickroom) {
      delta += 1.5;
    }

    // Rule 4: Wolfe Safe Play Bias when Ahead (Finding Safe Plays & When to Predict)
    // When ahead in mon count (e.g. 4v2, 4v1, 3v1), never gamble: reward 100% accuracy, penalize accuracy variance
    if (myAlive >= 3 && oppAlive <= 2) {
      if (move.accuracy === true || move.accuracy === 100) {
        delta += 0.4;
      } else if (typeof move.accuracy === 'number' && move.accuracy < 100) {
        delta -= 0.6; // Avoid rolling dice when already winning
      }
    }

    // Rule 5: Speed Control Setter Denial (Wolfe's Guide to Speed Control)
    // Prioritize eliminating unactivated TR or Tailwind setters before they move
    const isSetter = oppActive.some(f => ['whimsicott','tornadus','porygon2','farigiraf','dusclops'].includes((f.species.baseSpecies || f.species.name || '').toLowerCase()));
    if (isSetter && !battle.field.pseudoWeather.trickroom && (!battle.sides[1].sideConditions || !battle.sides[1].sideConditions.tailwind)) {
      if (move.category !== 'Status') {
        delta += 0.5; // Boost offensive pressure on setter
      }
    }

    // Rule 6: Win-Condition Preservation (Mega Multiscale & Sun Protection)
    if (move.id === 'protect') {
      // In Sand, Protect Charizard from Tyranitar Rock Slide OHKO
      if (mon.species.name === 'Charizard') {
        const isSand = battle.field.weather === 'sandstorm' || oppActive.some(f => /tyranitar|hippowdon/i.test(f.species.name));
        if (isSand) delta += 0.8;
      }
      // Mega Dragonite at full HP: Protect Multiscale from turn 1 chip / Fake Out
      if (mon.species.name === 'Dragonite-Mega' && mon.hp === mon.maxhp) {
        if (oppActive.some(f => f.activeTurns === 0 && f.moveSlots && f.moveSlots.some(x => x.id === 'fakeout'))) {
          delta += 0.7;
        }
      }
    }

    // Rule 7: Whimsicott Encore on Trick Room Setter (Reverses TR immediately)
    if (move.id === 'encore' && mon.species.name === 'Whimsicott') {
      const justTR = oppActive.find(f => f.lastMove && f.lastMove.id === 'trickroom');
      if (justTR && battle.field.pseudoWeather.trickroom) {
        delta += 1.8;
      }
    }

    // Rule 8: Grassy Terrain halves Earthquake damage (100 -> 50 BP)
    // Stomping Tantrum (75 BP single target) is NOT halved and avoids hitting partners
    if (battle.field.terrain === 'grassyterrain') {
      if (move.id === 'earthquake') {
        delta -= 2.5;
      }
      if (move.id === 'stompingtantrum') {
        delta += 1.5;
      }
    }

    // Rule 9: Life Orb Garchomp Protect preservation vs faster threats without Tailwind
    if (mon.species.name === 'Garchomp' && move.id === 'protect') {
      const isFasterThreat = oppActive.some(f => /sneasler|salamence|dragapult/i.test(f.species.name));
      const hasTailwind = battle.sides[0] && battle.sides[0].sideConditions && battle.sides[0].sideConditions.tailwind;
      if (isFasterThreat && !hasTailwind) {
        delta += 1.0;
      }
    }

    return delta;
  },

  // 3. Move Guardrail - should this move be blocked completely?
  shouldBlockMove: function(battle, mon, move, target) {
    const oppActive = (battle.sides[1] && battle.sides[1].active || []).filter(x => x && !x.fainted);

    // Sucker Punch blocked by Armor Tail or Psychic Terrain
    if (move.id === 'suckerpunch') {
      if (battle.field.terrain === 'psychicterrain') return true;
      if (oppActive.some(f => ['armortail','dazzling','queenlymajesty'].includes(f.getAbility().id))) return true;
    }

    // Tailwind into active Trick Room
    if (move.id === 'tailwind' && battle.field.pseudoWeather.trickroom) return true;

    return false;
  },

  // 4. Custom Tactical Directives injected into Claude's prompt
  getTacticalNotes: function(battle, req) {
    const notes = [];
    const oppActive = (battle.sides[1] && battle.sides[1].active || []).filter(x => x && !x.fainted);
    const myAlive = (battle.sides[0] && battle.sides[0].pokemon || []).filter(x => x && !x.fainted).length;
    const oppAlive = (battle.sides[1] && battle.sides[1].pokemon || []).filter(x => x && !x.fainted).length;

    if (battle.field.terrain === 'grassyterrain') {
      notes.push("Under Grassy Terrain: Earthquake is HALVED (50 BP); prefer Stomping Tantrum (75 BP single target) or Dragon Claw.");
    }
    if (battle.field.pseudoWeather.trickroom) {
      notes.push("Under Trick Room: Kingambit moves before fast attackers; prefer 100% accurate Kowtow Cleave (85 BP) over Sucker Punch (fails on status/Protect); do NOT click Tailwind.");
    }
    if (oppActive.some(f => /tyranitar/i.test(f.species.name))) {
      notes.push("Mega Tyranitar present: Protect Charizard from Rock Slide; attack with Garchomp Ground move or Incineroar/Rillaboom.");
    }
    if (myAlive >= 3 && oppAlive <= 2) {
      notes.push(`WOLFE SAFE PLAY DIRECTIVE: Ahead in Pokémon count (${myAlive} vs ${oppAlive}). Do NOT make risky predictions. Take 100% accurate damage and safe Protect lines to close out the win.`);
    }
    notes.push("Garchomp is on Life Orb (no Choice Scarf): relies on Dragonite Tailwind to outrun Sneasler/Salamence; use Protect safely against faster threats.");
    notes.push("Kingambit holds Chople Berry: survives 4x Fighting moves (Sneasler Close Combat, Kommo-o Aura Sphere); prioritize Iron Head into Floette-Mega and Sneasler.");
    notes.push("Kingambit Sucker Punch rules: Only hits if foe attacks; never click into Psychic Terrain, Armor Tail, or obvious Protect/status turns.");
    return notes;
  }
};
