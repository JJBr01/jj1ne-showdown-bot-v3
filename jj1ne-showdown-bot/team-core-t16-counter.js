// team-core-t16-counter.js  (v2 - rebuilt after reviewing Frankfurt/Brisbane Top 16 pastes)
// CORE: Mega Charizard Y + Mega Dragonite (one Mega per game, picked per matchup)
//
// Top-cut facts this is built against:
//  - Rillaboom 7/12, Sneasler 7/12, Incineroar 8/12 of Frankfurt Top 12
//  - Floette-Eternal-Mega on 5/6 Brisbane top cut
//  - Garchompite Z won Frankfurt (1st + 2nd): Power Gem = 121-144% on Mega Zard-Y (calc verified)
//
// Role of each slot:
//  Charizard-Y : sun Heat Wave OHKOs Rillaboom (146-172%, calc verified), Sneasler, Kommo-o, Gholdengo-ish
//  Dragonite   : Multiscale Tailwind attacker for rain / Floette / Basculegion. NEVER lead into Fake Out.
//  Incineroar  : Fake Out + Intimidate + Parting Shot. Trades Fake Outs with Rillaboom/Sneasler/Raichu.
//  Rillaboom   : Fake Out + Grassy Terrain + Grassy Glide priority. Halves their Earthquake.
//  Kingambit   : Chople. Iron Head 75-89% on bulky Floette (2HKO). Defiant eats Intimidate.
//  Whimsicott  : Prankster Tailwind / Encore (Calm Mind Floette, Trick Room setters).
// Gholdengo was cut: Rillaboom + Incineroar already cover Fake Out, and Kingambit is the Floette answer.

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
EVs: 32 HP / 20 Def / 14 SpD
Impish Nature
- Fake Out
- Parting Shot
- Flare Blitz
- Throat Chop

Rillaboom (M) @ Miracle Seed
Ability: Grassy Surge
Level: 50
EVs: 26 HP / 30 Atk / 4 SpD / 6 Spe
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- High Horsepower

Kingambit (M) @ Chople Berry
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Whimsicott (F) @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect`;
