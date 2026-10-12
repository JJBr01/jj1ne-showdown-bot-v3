// team-core-antirain.js
// CORE: Mega Charizard Y + Mega Dragonite — "Anti-Rain Balance"
// Target Matchup: Rain Archetype (our lowest win rate at 30%)
//
// Strategy:
// 1. Never Mega Charizard into Rain — Drought loses weather wars on switch-ins and flips Weather Ball to Water.
// 2. Instead, Mega Dragonite: unaffected by rain penalties, keeps Multiscale, sets Tailwind.
// 3. Rillaboom sets Grassy Surge (halving Earthquake) and threatens priority Grassy Glide / Wood Hammer into Pelipper/Basculegion/Swampert.
// 4. Gholdengo (Life Orb) is immune to rain status / Parting Shot / Trick, and fires Make It Rain + Shadow Ball.
// 5. Charizard-Y runs Solar Beam: if sun is active, 1-turn Solar Beam OHKOs Pelipper, Basculegion, and Milotic.

module.exports = `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Weather Ball
- Heat Wave
- Solar Beam
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
EVs: 24 HP / 15 Atk / 14 SpD / 13 Spe
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- U-turn

Gholdengo @ Life Orb
Ability: Good as Gold
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Modest Nature
- Make It Rain
- Shadow Ball
- Nasty Plot
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

Whimsicott (F) @ Covert Cloak
Ability: Prankster
Level: 50
EVs: 2 HP / 32 Def / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect`;
