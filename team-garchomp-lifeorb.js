// team-garchomp-lifeorb.js — Life Orb Garchomp + Rillaboom + Incineroar variant
// Built by AI Coach from review of ~17 recent losses and Champions Reg M-C calcs.
//
// WHAT CHANGED vs team-garchomp-choicescarf.js (Charizard + Dragonite kept as requested):
//   - Garchomp: Choice Scarf -> Life Orb. Moves: Earthquake / Stomping Tantrum / Dragon Claw / Protect.
//       Rock Slide dropped (11-21% to Rillaboom, Golisopod-Mega; chip only).
//       Protect added (was missing; 66% usage on ladder Garchomp).
//   - Whimsicott -> Incineroar (Fake Out / Intimidate / Parting Shot answers Sneasler,
//       Basculegion, Golisopod, Salamence; Whimsicott died T2-4 with Tailwind never up in most losses).
//       Dragonite already carries Tailwind, so speed control is not lost.
//   - Milotic -> Rillaboom (Milotic was OHKO'd by Wood Hammer 139-183% and dealt little damage;
//       Rillaboom gives Fake Out, Grassy Glide priority, Grassy Terrain recovery).
//
// CALC-VERIFIED NOTES (Nerd-of-Now, Champions M-C, Life Orb Jolly 32 Atk Garchomp):
//   - Stomping Tantrum vs Sneasler under Grassy Terrain: 110-129% = guaranteed OHKO.
//   - Earthquake vs Gholdengo (LO): 97-115%, ~87.5% OHKO.
//   - Dragon Claw vs Basculegion: 64-76% = guaranteed 2HKO.
//   - Dragon Claw vs Salamence-Mega: 83-100%.
//   - Earthquake is HALVED under Grassy Terrain (ours or theirs). With our own Rillaboom
//       on the field, click Stomping Tantrum (not halved), not Earthquake.
//   - Earthquake also hits our own partner: do not click it next to Charizard-Y/Dragonite
//       unless the partner is immune/Flying (Charizard and Dragonite are Flying: safe).
//
// RISKS TO WATCH:
//   - No Scarf: Garchomp is outsped by Sneasler, Salamence, Dragapult. Dragonite Tailwind is the fix.
//   - Life Orb recoil (10%/attack) on a mon that already takes Fake Out leads.
//   - Rillaboom and Incineroar are both Fake Out users: do not lead Dragonite into their Fake Out
//       (Multiscale rule). Lead Incineroar + Charizard by default.
//   - Lost Whimsicott Encore: Trick Room matchup (was 27-35) must be re-checked after ~20 games.
//   - Lost Milotic: no Ice Beam / Scald answer to Garchompite Z; Dragon Claw from Garchomp (2x) is the answer.

module.exports = `Drogon (Charizard) (M) @ Charizardite Y
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

Garchomp (M) @ Life Orb
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Stomping Tantrum
- Dragon Claw
- Protect

Incineroar (M) @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 32 HP / 14 Def / 20 SpD
Careful Nature
- Fake Out
- Parting Shot
- Flare Blitz
- Throat Chop

Rillaboom (M) @ Miracle Seed
Ability: Grassy Surge
Level: 50
EVs: 24 HP / 15 Atk / 14 SpD / 13 Spe
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- U-turn

Kingambit (M) @ Chople Berry
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect
`;
