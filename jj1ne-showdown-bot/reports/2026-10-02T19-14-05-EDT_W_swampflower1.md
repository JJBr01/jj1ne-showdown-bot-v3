# WIN vs swampflower1 — 10 turns
2026-10-02T19-14-05-EDT · battle-gen9championsvgc2026regmc-2691907769 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691907769)

Full battle log: battlelogs/2026-10-02T19-14-05-EDT_W_swampflower1_gen9championsvgc2026regmc-2691907769.log

**Opponent archetype:** trickroom  ·  **Plan:** Mega Charizard, Kingambit lead  ·  **Brought:** Kingambit, Drogon, Whimsicott, Dragonite
**Opponent team:** Inteleon, Pelipper, Golisopod, Indeedee-F, Dragapult, Sceptile  ·  **Opp brought:** Sceptile, Dragapult, Pelipper, Inteleon

## KO timeline
- T4: **Drogon** (ours) fainted — last hit by Dragapult Phantom Force
- T4: **Sceptile-Mega** (theirs) fainted — last hit by Whimsicott (Moonblast)
- T5: **Pelipper** (theirs) fainted — last hit by Dragonite (Dragon Pulse)
- T6: **Whimsicott** (ours) fainted — last hit by Inteleon Ice Beam
- T7: **Dragonite** (ours) fainted — last hit by Inteleon Ice Beam
- T7: **Inteleon** (theirs) fainted — last hit by Kingambit (Kowtow Cleave)
- T10: **Dragapult** (theirs) fainted — last hit by Kingambit (Sucker Punch)

**First KO:** ours: Drogon · **Tailwind turns:** us 0, them 0 · **Our Mega evolved:** turn 1

## Biggest hits
- T7: Kingambit Kowtow Cleave → Inteleon: 100%
- T4: Sceptile-Mega Dragon Pulse → Drogon: 76%
- T6: Inteleon Ice Beam → Whimsicott: 73%
- T4: Whimsicott Moonblast → Sceptile-Mega: 65%
- T1: Sceptile-Mega Earth Power → Kingambit: 65%
- T1: Kingambit Kowtow Cleave → Pelipper: 62%
- T2: Drogon Ancient Power → Dragapult: 53%
- T7: Inteleon Ice Beam → Dragonite: 52%

## Damage dealt by our Pokémon
- Kingambit: 209% total (KOs: 2)
- Drogon: 103% total (KOs: 0)
- Whimsicott: 65% total (KOs: 1)
- Dragonite: 42% total (KOs: 1)

## Damage-calc checks (our attacks: predicted range vs actual)
- 1 checked, 0 inside the predicted range, 1 outside
  - T1 Drogon Heat Wave → Sceptile-Mega: predicted 59%–110%, actual 35% (more bulk than assumed?)

## Claude pilot — 11 calls, 10 used, 7 overrides of the engine, 1 fallbacks
- Preview: team 5142 — Kingambit immune to Psychic/Expanding Force, pressures Indeedee; Whimsicott Encore/Tailwind; Charizard Mega in back resets rain to sun, Garchomp fast cleanup. [2102ms]
- T1: move 1 2, move 2 mega — Kowtow Cleave guarantees Dragapult KO (ignores Protect), Heat Wave in sun OHKOs Sceptile — both threats removed turn 1. [1776ms]
    Action: Kingambit: Kowtow Cleave -> Dragapult (104-194% OHKO) | Drogon: Heat Wave [Mega] (spread) -> Sceptile (59-110% (OHKO 21%)), Dragapult (14-27%)
    Threats: Kingambit threatened by Sceptile Earth Power (42-63%); Drogon threatened by Dragapult Draco Meteor (63-117% (OHKO 32%))
- T2: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T3: switch 3, move 1 2 — Kingambit at 26% dies to Earth Power; switch it to Whimsicott while boosted Drogon outspeeds and likely KOs Dragapult with Weather Ball. [2248ms]
    Action: Kingambit switches to Whimsicott | Drogon: Weather Ball -> Dragapult (39-74% (KO 78%))
    Threats: Kingambit threatened by Sceptile-Mega Earth Power (52-78% KO); Drogon threatened by Dragapult Draco Meteor (35-62%)
- T4: move 2 1, move 3 1 (override; engine wanted move 1, move 1 2) — Dragapult is in Phantom Force semi-invulnerable this turn — attacks at it fail. Focus both actions on Sceptile for a likely KO. [1733ms]
    Action: Whimsicott: Moonblast -> Sceptile-Mega (57-69% (KO 33%)) | Drogon: Ancient Power -> Sceptile-Mega (33-39%)
    Threats: Whimsicott threatened by Dragapult Shadow Ball (46-89% (KO 38%)); Drogon threatened by Dragapult Draco Meteor (35-62%)
- T5: move 2 2, move 1 1 (override; engine wanted move 2 2, move 4) — Moonblast likely KOs Dragapult (56-105% vs 47%); Dragon Pulse likely finishes burned Pelipper at 42%. Double KO attempt wins now. [2076ms]
    Action: Whimsicott: Moonblast -> Dragapult (56-105% KO) | Dragonite: Dragon Pulse -> Pelipper (39-77% (KO 92%))
    Threats: Whimsicott threatened by Pelipper Hurricane (94-184% KO); Dragonite threatened by Dragapult Draco Meteor (107-188% OHKO)
- T6: move 2 2, move 4 — Moonblast likely KOs Dragapult (56-105% vs 47%); Dragonite Protects the Ice Beam/Draco OHKO. Safe, removes their fastest threat. [1975ms]
    Action: Whimsicott: Moonblast -> Dragapult (56-105% KO) | Dragonite: Protect
    Threats: Whimsicott threatened by Inteleon Ice Beam (62-120% (KO 81%)); Dragonite threatened by Dragapult Draco Meteor (107-188% OHKO)
- T7: move 1 1, move 1 2 (override; engine wanted move 4, move 1 2) — 2v2 but we're fragile: Dragon Pulse likely KOs Dragapult (the Draco threat), Kowtow heavily damages/KOs Inteleon. Protect-stalling just loses Dragonite to Draco Meteor. [2498ms]
    Action: Kingambit: Kowtow Cleave -> Inteleon (61-122% (OHKO 37%)) | Dragonite: Dragon Pulse -> Dragapult (65-121% KO)
    Threats: Kingambit threatened by Inteleon Hydro Cannon (58-87% KO); Dragonite threatened by Dragapult Draco Meteor (107-188% KO)
- T8: move 2 2, pass (override; engine wanted move 4, pass) — 1v1: Dragapult outspeeds and Draco Meteor may KO Kingambit (28-43% vs 16%). Sucker Punch hits first if it attacks and KOs. [1748ms]
    Action: Kingambit: Sucker Punch -> Dragapult (85-161% KO)
    Threats: Kingambit threatened by Dragapult Draco Meteor (28-43% KO)
- T9: move 2 2, pass (override; engine wanted move 4, pass) — Dragapult outspeeds; Draco Meteor can KO us. Sucker Punch hits first if it attacks and KOs; Kowtow would move second and lose. [1789ms]
    Action: Kingambit: Sucker Punch -> Dragapult (85-161% KO)
    Threats: Kingambit threatened by Dragapult Draco Meteor (28-43% KO)
- T10: move 2 2, pass (override; engine wanted move 4, pass) — Dragapult has spammed Dragon Cheer twice with no target; but it must attack eventually. Sucker Punch fails on status. Kowtow is slower but guaranteed KO if we survive — Draco only does 28-43%, we have 16%...  [3698ms]
    Action: Kingambit: Sucker Punch -> Dragapult (85-161% KO)
    Threats: Kingambit threatened by Dragapult Draco Meteor (28-43% KO)

## Opponent info revealed this game
- Sceptile: @ Sceptilite Earth Power / Dragon Pulse
- Dragapult: U-turn / Phantom Force / Dragon Cheer
- Pelipper: @ Sitrus Berry (Drizzle)
- Inteleon: Ice Beam