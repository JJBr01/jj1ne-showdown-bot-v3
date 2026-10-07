const { Teams } = require('../ps/dist/sim/teams');
const { TeamValidator } = require('../ps/dist/sim/team-validator');

const validator = new TeamValidator('gen9championsvgc2026regmc');

const teams = [
  {
    name: "core_standard",
    text: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Heat Wave
- Solar Beam
- Air Slash
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 32 HP / 32 Atk / 2 Spe
Adamant Nature
- Extreme Speed
- Dragon Claw
- Low Kick
- Protect

Garchomp (M) @ Sitrus Berry
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Stomping Tantrum
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
- Icy Wind
- Recover
- Protect`
  },
  {
    name: "core_scarf_offense",
    text: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Heat Wave
- Solar Beam
- Air Slash
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 32 HP / 32 Atk / 2 Spe
Adamant Nature
- Extreme Speed
- Dragon Claw
- Low Kick
- Protect

Garchomp (M) @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Stomping Tantrum
- Rock Slide
- Dragon Claw

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
- Icy Wind
- Recover
- Protect`
  },
  {
    name: "core_grassy_balance",
    text: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Heat Wave
- Solar Beam
- Air Slash
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 32 HP / 32 Atk / 2 Spe
Adamant Nature
- Extreme Speed
- Dragon Claw
- Low Kick
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
- Stomping Tantrum
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
- Icy Wind
- Recover
- Protect`
  },
  {
    name: "core_lum_tank",
    text: `Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Heat Wave
- Solar Beam
- Air Slash
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 32 HP / 32 Atk / 2 Spe
Adamant Nature
- Extreme Speed
- Dragon Claw
- Low Kick
- Protect

Garchomp (M) @ Choice Scarf
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Stomping Tantrum
- Rock Slide
- Dragon Claw

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
- Icy Wind
- Recover
- Protect`
  }
];

for (const t of teams) {
  const parsed = Teams.import(t.text);
  const probs = validator.validateTeam(parsed);
  console.log(`${t.name}:`, probs ? probs : 'VALID (0 problems)');
}
