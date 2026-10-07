# WIN vs Akromancer — 6 turns
2026-10-02T19-57-22-EDT · battle-gen9championsvgc2026regmc-2691925085 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691925085)

Full battle log: battlelogs/2026-10-02T19-57-22-EDT_W_akromancer_gen9championsvgc2026regmc-2691925085.log

**Opponent archetype:** psyterrain  ·  **Plan:** Mega Charizard, Kingambit lead  ·  **Brought:** Kingambit, Drogon, Whimsicott, Milotic
**Opponent team:** Indeedee-F, Torkoal, Sinistcha, Kingambit, Salamence, Gardevoir  ·  **Opp brought:** Indeedee, Gardevoir, Kingambit, Torkoal

## KO timeline
- T1: **Indeedee-F** (theirs) fainted — last hit by Kingambit (Iron Head)
- T2: **Gardevoir-Mega** (theirs) fainted — last hit by Kingambit (Iron Head)
- T2: **Kingambit** (theirs) fainted — last hit by Drogon (Weather Ball)
- T3: **Kingambit** (ours) fainted — last hit by Torkoal Eruption
- T3: **Drogon** (ours) fainted — last hit by Torkoal Eruption
- T6: **Torkoal** (theirs) fainted — last hit by Milotic (Scald)

**First KO:** theirs: Indeedee-F · **Tailwind turns:** us 0, them 0 · **Our Mega evolved:** turn 1

## Biggest hits
- T2: Kingambit Iron Head → Gardevoir-Mega: 100%
- T2: Drogon Weather Ball → Kingambit: 100%
- T5: Torkoal Eruption → Whimsicott: 99%
- T3: Torkoal Eruption → Kingambit: 81%
- T1: Drogon Weather Ball → Indeedee-F: 68%
- T2: Kingambit Kowtow Cleave → Drogon: 67%
- T6: Milotic Scald → Torkoal: 43%

## Damage dealt by our Pokémon
- Drogon: 168% total (KOs: 1)
- Kingambit: 132% total (KOs: 2)
- Milotic: 77% total (KOs: 1)
- Whimsicott: 23% total (KOs: 0)

## Damage-calc checks (our attacks: predicted range vs actual)
- 3 checked, 2 inside the predicted range, 1 outside
  - T1 Drogon Weather Ball → Indeedee-F: predicted 8%–12%, actual 68% (more bulk/boost/crit? → their set may differ)

## Claude pilot — 7 calls, 6 used, 3 overrides of the engine, 1 fallbacks
- Preview: team 5146 — Kingambit immune to Expanding Force/Psychic, hits Indeedee, Sinistcha, Gardevoir super-effectively; Whimsicott Encore stops Trick Room; Drogon sheltered in back; Milotic bulky backup. [2068ms]
- T1: move 3 2, move 1 1 mega (override; engine wanted move 3 2, move 2 mega) — Iron Head OHKOs Gardevoir (the Mega Expanding Force win-con) while Weather Ball chips the terrain setter; Kingambit immune to Psychic anyway. [1981ms]
    Action: Kingambit: Iron Head -> Gardevoir (117-164% OHKO) | Drogon: Weather Ball [Mega] -> Indeedee-F (8-12%)
    Threats: Kingambit threatened by Gardevoir Hyper Voice (8-12%); Drogon threatened by Gardevoir Expanding Force (44-83%)
- T2: move 3 2, move 1 1 (override; engine wanted move 1 2, move 2) — Iron Head (our Kingambit moves first under TR) guaranteed KOs Mega Gardevoir; Weather Ball guaranteed KOs their Kingambit. Double KO, removes terrain-abuser and Dark threat. [2095ms]
    Action: Kingambit: Iron Head -> Gardevoir-Mega (117-164% OHKO) | Drogon: Weather Ball -> Kingambit (139-251% OHKO)
    Threats: Kingambit threatened by Gardevoir-Mega Hyper Voice (35-53%); Drogon threatened by Gardevoir-Mega Expanding Force (45-80%)
- T3: move 1 2, move 3 2 — Torkoal moves first under TR and Eruption OHKOs Kingambit; focus-fire for the KO — Kowtow+Ancient Power 87-132% likely kills immediately. [2126ms]
    Action: Kingambit: Kowtow Cleave -> Torkoal (37-54%) | Drogon: Ancient Power -> Torkoal (50-78%)
    Threats: Kingambit threatened by Torkoal Eruption (100-152% KO); Drogon threatened by Torkoal Eruption (23-41% (KO 48%))
- T4: move 1 2, move 4 — Whimsicott dies to any Eruption; Protect it while Milotic Scalds Torkoal — possible burn cripples Eruption and we out-sustain with Recover. [2113ms]
    Action: Milotic: Scald -> Torkoal (25-41%) | Whimsicott: Protect
    Threats: Milotic threatened by Torkoal Eruption (19-24%); Whimsicott threatened by Torkoal Eruption (133-258% OHKO)
- T5: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T6: move 1 2, move 4 — Scald likely KOs Torkoal (51-81% vs 43%); Whimsicott at 1 HP Protects to survive Eruption and stay alive for later Tailwind. [1514ms]
    Action: Milotic: Scald -> Torkoal (51-81% KO) | Whimsicott: Protect
    Threats: Milotic threatened by Torkoal Solar Beam (35-46%); Whimsicott threatened by Torkoal Eruption (39-74% KO)

## Opponent info revealed this game
- Indeedee: (Psychic Surge) Follow Me
- Gardevoir: @ Gardevoirite Trick Room
- Kingambit: Kowtow Cleave
- Torkoal: @ Air Balloon Eruption / Solar Beam