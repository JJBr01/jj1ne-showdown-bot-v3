const { Teams } = require('../ps/dist/sim/teams');
const { TeamValidator } = require('../ps/dist/sim/team-validator');

const validator = new TeamValidator('gen9championsvgc2026regmc');

const testPhysical = `Drogon (Charizard) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 16 Def / 32 SpA / 18 Spe
Modest Nature
- Heat Wave
- Solar Beam
- Ancient Power
- Protect

Dragonite @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 32 HP / 32 Atk / 2 Spe
Adamant Nature
- Extreme Speed
- Dragon Claw
- Low Kick
- Protect

Milotic @ Leftovers
Ability: Competitive
Level: 50
EVs: 32 HP / 18 Def / 16 SpD
Calm Nature
- Scald
- Ice Beam
- Recover
- Protect

Garchomp @ Sitrus Berry
Ability: Rough Skin
Level: 50
EVs: 2 HP / 32 Atk / 32 Spe
Jolly Nature
- Earthquake
- Stomping Tantrum
- Rock Slide
- Protect

Kingambit @ Life Orb
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Whimsicott @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect`;

const parsed = Teams.import(testPhysical);
const problems = validator.validateTeam(parsed);
console.log('testPhysical validation problems:', problems);
