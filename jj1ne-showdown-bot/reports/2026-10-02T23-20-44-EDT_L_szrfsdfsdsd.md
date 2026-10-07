# LOSS vs szrfsdfsdsd — 7 turns
2026-10-02T23-20-44-EDT · battle-gen9championsvgc2026regmc-2691997930 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691997930)

Full battle log: battlelogs/2026-10-02T23-20-44-EDT_L_szrfsdfsdsd_gen9championsvgc2026regmc-2691997930.log

**Opponent archetype:** rain  ·  **Plan:** Mega Charizard, Tailwind (Whimsicott) lead  ·  **Brought:** Whimsicott, Drogon, Kingambit, Garchomp
**Opponent team:** Alcremie-Caramel-Swirl, Inteleon, Pelipper, Golisopod, Maushold-Four, Blaziken  ·  **Opp brought:** Inteleon, Blaziken, Golisopod, Alcremie

## KO timeline
- T4: **Drogon** (ours) fainted — last hit by Blaziken-Mega Rock Slide
- T4: **Whimsicott** (ours) fainted — last hit by Inteleon Ice Beam
- T5: **Inteleon** (theirs) fainted — last hit by Garchomp (Earthquake)
- T5: **Blaziken-Mega** (theirs) fainted — last hit by Garchomp (Earthquake)
- T6: **Garchomp** (ours) fainted — last hit by Alcremie-Caramel-Swirl Draining Kiss
- T6: **Alcremie-Caramel-Swirl** (theirs) fainted — last hit by Kingambit (Iron Head)
- T7: **Kingambit** (ours) fainted — last hit by Golisopod Liquidation

**First KO:** ours: Drogon · **Tailwind turns:** us 3, them 0 · **Our Mega evolved:** turn 1

## Biggest hits
- T4: Blaziken-Mega Rock Slide → Drogon: 100%
- T5: Garchomp Earthquake → Blaziken-Mega: 100%
- T6: Kingambit Iron Head → Alcremie-Caramel-Swirl: 83%
- T7: Kingambit Kowtow Cleave → Golisopod: 62%
- T6: Golisopod First Impression → Garchomp: 59%
- T4: Whimsicott Moonblast → Inteleon: 57%
- T6: Garchomp Earthquake → Alcremie-Caramel-Swirl: 45%
- T6: Alcremie-Caramel-Swirl Draining Kiss → Garchomp: 41%

## Damage dealt by our Pokémon
- Garchomp: 195% total (KOs: 2)
- Kingambit: 145% total (KOs: 1)
- Whimsicott: 57% total (KOs: 0)

## Damage-calc checks (our attacks: predicted range vs actual)
- 4 checked, 2 inside the predicted range, 2 outside
  - T6 Garchomp Earthquake → Alcremie-Caramel-Swirl: predicted 57%–68%, actual 45% (more bulk than assumed?)
  - T7 Kingambit Kowtow Cleave → Golisopod: predicted 36%–52%, actual 62% (more bulk/boost/crit? → their set may differ)

## Claude pilot — 8 calls, 5 used, 4 overrides of the engine, 3 fallbacks
- Preview: team 4153 — Rain team: Charizard's Drought overrides Drizzle, halving Hydro Cannon and powering Heat Wave. Whimsicott Tailwind leads; Garchomp and Kingambit answer Pelipper/Inteleon late. [2170ms]
- T1: move 1, move 4 mega (override; engine wanted move 4, move 4 mega) — Mega Blaziken Rock Slide likely OHKOs Drogon, so Protect it while Whimsicott gets the critical turn-1 Tailwind up for speed control. [1716ms]
    Action: Whimsicott: Tailwind | Drogon: Protect [Mega]
    Threats: Whimsicott threatened by Blaziken Flare Blitz (111-212% OHKO); Drogon threatened by Inteleon Hydro Cannon (129-241% OHKO)
- T2: move 2 1, move 1 1 (override; engine wanted move 4, move 2) — Inteleon has Focus Energy (crit-boosted Ice Beam OHKOs Whimsicott); focus fire both attacks to KO it now while Tailwind gives us the first move. [1657ms]
    Action: Whimsicott: Moonblast -> Inteleon (33-66%) | Drogon: Weather Ball -> Inteleon (47-93%)
    Threats: Whimsicott threatened by Blaziken-Mega Flare Blitz (206-390% KO); Drogon threatened by Blaziken-Mega Rock Slide (84-136% (OHKO 70%))
- T3: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T4: fallback to engine (no JSON in reply)
- T5: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T6: move 1, move 3 2 — Iron Head OHKOs Alcremie; Earthquake chips Golisopod. EQ hits Kingambit but it survives easily at full HP, and we go 2v1 up. [1964ms]
    Action: Garchomp: Earthquake (spread) -> Golisopod (11-16%), Alcremie-Caramel-Swirl (57-68%) | Kingambit: Iron Head -> Alcremie-Caramel-Swirl (177-211% OHKO)
    Threats: Garchomp threatened by Alcremie-Caramel-Swirl Alluring Voice (82-98%); Kingambit threatened by Alcremie-Caramel-Swirl Alluring Voice (37-43%)
- T7: pass, move 1 1 (override; engine wanted pass, move 4) — 1v1: Kingambit outspeeds Golisopod; Kowtow Cleave hits hardest and Protect only delays. Race to KO before First Impression chips us out. [1625ms]
    Action: Kingambit: Kowtow Cleave -> Golisopod (36-52%)
    Threats: Kingambit threatened by Golisopod First Impression (28-41% (KO 67%))

## Opponent info revealed this game
- Blaziken: @ Blazikenite (Speed Boost) Rock Slide / Detect / Close Combat
- Inteleon: @ Life Orb Focus Energy / Protect / Ice Beam
- Golisopod: First Impression / Liquidation
- Alcremie: Draining Kiss