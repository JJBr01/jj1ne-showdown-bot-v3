# LOSS vs regmc_aipilot_13 — 7 turns
2026-10-02T21-57-53-EDT · battle-gen9championsvgc2026regmc-2691969754 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691969754)

Full battle log: battlelogs/2026-10-02T21-57-53-EDT_L_regmcaipilot13_gen9championsvgc2026regmc-2691969754.log

**Opponent archetype:** sun  ·  **Plan:** Mega Charizard, Tailwind (Whimsicott) lead  ·  **Brought:** Whimsicott, Drogon, Garchomp, Kingambit
**Opponent team:** Charizard, Garchomp, Rillaboom, Sneasler, Kingambit, Swampert  ·  **Opp brought:** Rillaboom, Sneasler, Garchomp, Swampert

## KO timeline
- T1: **Rillaboom** (theirs) fainted — last hit by Drogon (Heat Wave)
- T2: **Drogon** (ours) fainted — last hit by Garchomp-Mega-Z Power Gem
- T3: **Sneasler** (theirs) fainted — last hit by Garchomp (Stomping Tantrum)
- T6: **Garchomp** (ours) fainted — last hit by Garchomp-Mega-Z Draco Meteor
- T6: **Kingambit** (ours) fainted — last hit by Swampert High Horsepower
- T7: **Whimsicott** (ours) fainted — last hit by Garchomp-Mega-Z Power Gem

**First KO:** theirs: Rillaboom · **Tailwind turns:** us 0, them 0 · **Our Mega evolved:** turn 1

## Biggest hits
- T1: Drogon Heat Wave → Rillaboom: 100%
- T2: Garchomp-Mega-Z Power Gem → Drogon: 100%
- T6: Garchomp-Mega-Z Draco Meteor → Garchomp: 100%
- T2: Sneasler Dire Claw → Whimsicott: 99%
- T4: Swampert High Horsepower → Kingambit: 65%
- T3: Garchomp Stomping Tantrum → Sneasler: 63%
- T4: Garchomp Stomping Tantrum → Swampert: 52%
- T6: Swampert High Horsepower → Kingambit: 47%

## Damage dealt by our Pokémon
- Garchomp: 150% total (KOs: 1)
- Drogon: 100% total (KOs: 1)
- Whimsicott: 42% total (KOs: 0)

## Damage-calc checks (our attacks: predicted range vs actual)
- 4 checked, 2 inside the predicted range, 2 outside
  - T4 Garchomp Stomping Tantrum → Swampert: predicted 27%–47%, actual 52% (more bulk/boost/crit? → their set may differ)
  - T6 Garchomp Stomping Tantrum → Swampert: predicted 27%–47%, actual 0% (more bulk than assumed?)

## Claude pilot — 8 calls, 4 used, 3 overrides of the engine, 4 fallbacks
- Preview: fallback (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T1: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T2: move 2 2, move 1 2 (override; engine wanted move 1, move 4) — Garchomp Rock Slide likely OHKOs Drogon; Sneasler is the bigger snowball threat. Moonblast + Weather Ball guarantees removing Sneasler before Unburden sweeps. [1864ms]
    Action: Whimsicott: Moonblast -> Sneasler (27-52%) | Drogon: Weather Ball -> Sneasler (80-149% (OHKO 71%))
    Threats: Whimsicott threatened by Sneasler Dire Claw (160-301% OHKO); Drogon threatened by Garchomp Rock Slide (75-125% (OHKO 51%))
- T3: move 4, move 4 2 — Whimsicott at 7% dies to anything; Protect it while Scarf Garchomp's Stomping Tantrum 73% KOs the Unburden Sneasler before it snowballs. [2105ms]
    Action: Whimsicott: Protect | Garchomp: Stomping Tantrum -> Sneasler (49-99% (KO 73%))
    Threats: Whimsicott threatened by Sneasler Dire Claw (160-301% KO); Garchomp threatened by Garchomp-Mega-Z Dragon Claw (62-110% (OHKO 21%))
- T4: switch 4, move 4 2 (override; engine wanted move 1, switch 4) — Whimsicott at 12% dies to anything; save it by switching Kingambit in, Garchomp chips Swampert. Keeps two healthy Pokemon. [1754ms]
    Action: Whimsicott switches to Kingambit | Garchomp: Stomping Tantrum -> Swampert (27-47%)
    Threats: Whimsicott threatened by Swampert Ice Punch (44-83% KO); Garchomp threatened by Swampert Ice Punch (63-115% (OHKO 29%))
- T5: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T6: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T7: move 2 2, pass (override; engine wanted move 4, pass) — Last Pokémon; Protect only delays. Moonblast guarantees KO on Swampert, leaving 1v1 vs Garchomp — only winning line. [2034ms]
    Action: Whimsicott: Moonblast -> Swampert (23-36% KO)
    Threats: Whimsicott threatened by Swampert Ice Punch (44-83% KO)

## Opponent info revealed this game
- Rillaboom: (Grassy Surge)
- Sneasler: @ Grassy Seed Protect / Dire Claw / Close Combat
- Garchomp: @ Garchompite Z Power Gem / Protect / Draco Meteor / Earth Power
- Swampert: @ Sitrus Berry High Horsepower