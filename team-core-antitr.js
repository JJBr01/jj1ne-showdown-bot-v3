// team-core-antitr.js
// CORE: Mega Charizard Y + Mega Dragonite — "Anti-Trick Room Stall & Reversal"
// Target Matchup: Trick Room Archetype (44% win rate)
//
// Strategy:
// 1. Never Tailwind into Trick Room. Slower Pokémon move first.
// 2. Kingambit thrives under Trick Room: as our slowest attacker, it moves before opposing threats and KOs with Kowtow Cleave / Iron Head.
// 3. Whimsicott Prankster Encore: If the TR setter sets Trick Room on turn 1, clicking Encore on turn 2 locks them into Trick Room, forcing them to reverse their own TR!
// 4. Incineroar Fake Out flinches the setter turn 1, buying a free KO turn for Charizard or Kingambit.
// 5. Milotic (Competitive + Recover) stalls Trick Room turns with Protect cycling.

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

Kingambit (M) @ Clear Amulet
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Brave Nature
IVs: 0 Spe
- Kowtow Cleave
- Iron Head
- Sucker Punch
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

Milotic (F) @ Leftovers
Ability: Competitive
Level: 50
EVs: 32 HP / 18 Def / 16 SpD
Calm Nature
- Scald
- Ice Beam
- Recover
- Protect

Whimsicott (F) @ Covert Cloak
Ability: Prankster
Level: 50
EVs: 2 HP / 32 Def / 32 Spe
Timid Nature
- Encore
- Taunt
- Moonblast
- Protect`;
