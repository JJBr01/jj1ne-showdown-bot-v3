// ============================================================
// JJ1NE — "DUAL MEGA SUNCONTROL" v2 (calc-tuned)
// Format: [Gen 9 Champions] VGC 2026 Reg M-C (Lv50, 66 SP cap, 32/stat, 1 Mega/game)
// Tuned against Frankfurt Regional 2027 Top 4 + Brisbane Top 8.
// See docs/damage-calcs-dual-mega.md for all supporting numbers.
//
// CORRECTION v2: Mega Dragonite's ability is MULTISCALE, not Inner Focus.
// Mega Dragonite base: 91/124/115/145/125/100 (BST 700).
// ============================================================

module.exports = {
  id: "dual_mega_counter",
  name: "Dual Mega Suncontrol",
  format: "gen9championsvgc2026regmc",

  paste: `
Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 8 HP / 6 Def / 32 SpA / 20 Spe
Modest Nature
- Heat Wave
- Weather Ball
- Ancient Power
- Protect

Viserion (Dragonite) (M) @ Dragoninite
Ability: Multiscale
Level: 50
EVs: 16 HP / 30 SpA / 20 Spe
Modest Nature
- Dragon Pulse
- Heat Wave
- Tailwind
- Protect

Incineroar (M) @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 32 HP / 4 Atk / 20 Def / 10 SpD
Impish Nature
- Fake Out
- Parting Shot
- Flare Blitz
- Throat Chop

Rillaboom (M) @ Miracle Seed
Ability: Grassy Surge
Level: 50
EVs: 26 HP / 30 Atk / 4 Def / 6 SpD
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- High Horsepower

Kingambit (M) @ Chople Berry
Ability: Defiant
Level: 50
EVs: 32 HP / 30 Atk / 4 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Whimsicott (F) @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 30 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect
`,

  // ---------------- SPREAD JUSTIFICATION ----------------
  spreadNotes: {
    Charizard:
      "20 Spe = 148 Speed, clears Modest Gholdengo (136) and mirror Charizard-Y. " +
      "32 SpA is non-negotiable: it is the difference between OHKOing Rillaboom/Sneasler/Kommo-o " +
      "with sun Heat Wave and merely 2HKOing them. Remaining 14 SP into bulk.",
    Dragonite:
      "MULTISCALE means every HP point is worth ~2 while unbroken, so 16 HP is the " +
      "efficient buy over Def. 20 Spe = 140, enough to Tailwind before most non-scarf threats. " +
      "Survives rain Electro Shot (44-52%) and rain Wave Crash (47-56%) at full HP ONLY.",
    Incineroar:
      "32 HP / 20 Def tuned to eat Sneasler Close Combat after its own Intimidate and still " +
      "fire Parting Shot. Knock Off over Darkest Lariat to strip Miracle Seed / Sitrus / Leftovers / " +
      "Chople off the top-cut staples.",
    Kingambit:
      "Chople Berry confirmed by calc: turns Sneasler Close Combat (89-105% KO) into 45-53%, " +
      "and Kommo-o Aura Sphere (71-84%) into 36-42%. Two guaranteed losses become wins. " +
      "30 Atk 2HKOs Floette-E-Mega, OHKOs it at +2 from their Intimidate.",
    Whimsicott:
      "Max Speed (159) is the whole slot. Prankster Encore/Tailwind is our Trick Room and " +
      "Calm Mind answer. Focus Sash guarantees one Encore even into a KO move.",
  },

  // ---------------- MEGA SELECTION ENGINE ----------------
  megaSelect(oppTeam) {
    const has = (n) => oppTeam.some((p) => p.toLowerCase().includes(n));

    // HARD RULE: ladder data — Dragonite into psyterrain is 2-10.
    if (has("indeedee") || has("meowstic") || has("armarouge")) return "Charizard";
    // HARD RULE: snow must be OVERWRITTEN by Drought, never raced.
    if (has("froslass") || has("ninetales") || has("abomasnow")) return "Charizard";
    // HARD RULE: Dragonite needs full HP. Two+ Fake Out users = Multiscale dies turn 1.
    const fakeOutUsers = ["rillaboom", "incineroar", "raichu", "meowstic", "sneasler", "pawmot"];
    if (fakeOutUsers.filter(has).length >= 2) return "Charizard";

    const charizardTriggers = [
      "rillaboom", "sneasler", "gholdengo", "volcarona", "excadrill",
      "tyranitar", "venusaur", "kommo-o", "golisopod", "metagross",
    ];
    const dragoniteTriggers = [
      "pelipper", "politoed", "archaludon", "swampert", "basculegion",
      "floette", "farigiraf", "sinistcha", "hatterene",
    ];

    const z = charizardTriggers.filter(has).length;
    const d = dragoniteTriggers.filter(has).length;
    return d > z ? "Dragonite" : "Charizard";
  },

  // ---------------- LEAD MATRIX ----------------
  leads: {
    default:     ["Incineroar", "Charizard"],
    rillaboom:   ["Incineroar", "Charizard"],  // trade Fake Outs, Heat Wave OHKOs the terrain setter
    sneasler:    ["Incineroar", "Charizard"],  // Intimidate + Fake Out denies the Unburden trigger
    rain:        ["Dragonite", "Rillaboom"],   // Multiscale eats Electro Shot / Wave Crash at FULL HP
    trickroom:   ["Whimsicott", "Incineroar"], // Prankster Encore the setter
    psyterrain:  ["Kingambit", "Charizard"],   // confirmed 9-6 lead
    sun_mirror:  ["Charizard", "Incineroar"],  // our 32 SpA Zard beats their 1 SpA bulk Zard
    sand:        ["Charizard", "Rillaboom"],
    snow:        ["Charizard", "Incineroar"],
    floette:     ["Kingambit", "Incineroar"],  // ONLY Kingambit breaks Calm Mind Floette
    kingambit:   ["Incineroar", "Rillaboom"],
  },

  // ---------------- HARD RULES ----------------
  rules: [
    "NEVER lead Dragonite into any Fake Out user — Multiscale is the entire matchup.",
    "Charizard Heat Wave in sun OHKOs Rillaboom, Sneasler and Kommo-o. It is the best button on the team.",
    "Weather Ball (sun) is the single-target finisher; Heat Wave is the spread. Pick by target count.",
    "Floette-Eternal-Mega is a Kingambit-only problem. Never try to out-damage Calm Mind with Charizard.",
    "Excadrill and Kingambit-Sash survive our Heat Wave at 1 HP — always pair with a second action.",
    "Do not try to outspeed Kommo-o (130) or +2 Sneasler. Deny the trigger instead of racing.",
  ],
};
