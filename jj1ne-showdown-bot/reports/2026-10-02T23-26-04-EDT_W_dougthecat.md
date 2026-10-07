# WIN vs DougTheCat — 6 turns
2026-10-02T23-26-04-EDT · battle-gen9championsvgc2026regmc-2692000240 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2692000240)

Full battle log: battlelogs/2026-10-02T23-26-04-EDT_W_dougthecat_gen9championsvgc2026regmc-2692000240.log

**Opponent archetype:** standard  ·  **Plan:** Mega Dragonite, Kingambit lead  ·  **Brought:** Kingambit, Dragonite, Milotic, Garchomp
**Opponent team:** Salamence, Kingambit, Glimmora, Whimsicott, Delphox, Garchomp  ·  **Opp brought:** Whimsicott, Delphox, Garchomp, Kingambit

## KO timeline
- T1: **Delphox-Mega** (theirs) fainted — last hit by Kingambit (Kowtow Cleave)
- T2: **Whimsicott** (theirs) fainted — last hit by Dragonite (Heat Wave)
- T3: **Garchomp** (theirs) fainted — last hit by Milotic (Ice Beam)
- T6: **Kingambit** (theirs) fainted — last hit by Garchomp (Stomping Tantrum)

**First KO:** theirs: Delphox-Mega · **Tailwind turns:** us 0, them 3 · **Our Mega evolved:** turn 1

## Biggest hits
- T1: Dragonite Heat Wave → Whimsicott: 94%
- T1: Kingambit Kowtow Cleave → Delphox-Mega: 84%
- T2: Garchomp Dragon Claw → Dragonite: 82%
- T1: Delphox-Mega Heat Wave → Kingambit: 81%
- T2: Dragonite Dragon Pulse → Garchomp: 75%
- T5: Garchomp Stomping Tantrum → Kingambit: 58%
- T3: Kingambit Kowtow Cleave → Milotic: 40%

## Damage dealt by our Pokémon
- Dragonite: 185% total (KOs: 1)
- Kingambit: 84% total (KOs: 1)
- Garchomp: 66% total (KOs: 1)
- Milotic: 59% total (KOs: 1)

## Damage-calc checks (our attacks: predicted range vs actual)
- 5 checked, 3 inside the predicted range, 2 outside
  - T1 Dragonite Heat Wave → Whimsicott: predicted 42%–82%, actual 94% (more bulk/boost/crit? → their set may differ)
  - T4 Milotic Scald → Kingambit: predicted 13%–24%, actual 34% (more bulk/boost/crit? → their set may differ)

## Claude pilot — 7 calls, 5 used, 3 overrides of the engine, 2 fallbacks
- Preview: fallback (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T1: move 1 2, move 2 mega (override; engine wanted move 2 2, move 1 2 mega) — Kowtow Cleave guarantees KO on Delphox (ignores Protect), Heat Wave breaks Whimsicott's Sash; removes their Mega and pressures speed control immediately. [2305ms]
    Action: Kingambit: Kowtow Cleave -> Delphox (113-217% OHKO) | Dragonite: Heat Wave [Mega] (spread) -> Whimsicott (42-82%), Delphox (7-14%)
    Threats: Kingambit threatened by Delphox Heat Wave (47-71%); Dragonite threatened by Whimsicott Moonblast (46-82%)
- T2: switch 3, move 1 2 (override; engine wanted move 4, move 1 2) — Kingambit at 3% burn dies to burn tick anyway; switch to Milotic (bulky, Competitive) while Dragonite Dragon Pulses Garchomp for likely KO. [1986ms]
    Action: Kingambit switches to Milotic | Dragonite: Dragon Pulse -> Garchomp (70-126% (OHKO 48%))
    Threats: Kingambit threatened by Whimsicott Moonblast (25-38% KO); Dragonite threatened by Garchomp Draco Meteor (67-111% (KO 47%))
- T3: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T4: move 1 1, switch 4 (override; engine wanted move 4, switch 4) — Dragonite at 8% is dead to anything; switch it to Garchomp which resists Kowtow-less... Milotic Scald chips Kingambit and may burn, crippling it. [2083ms]
    Action: Milotic: Scald -> Kingambit (13-24%) | Dragonite switches to Garchomp
    Threats: Milotic threatened by Kingambit Kowtow Cleave (38-50%); Dragonite threatened by Kingambit Kowtow Cleave (29-52% KO)
- T5: move 4, move 4 1 — Only Kingambit left on field; Garchomp's Stomping Tantrum hits hard without damaging Milotic, Protect shields Milotic from the likely Kowtow KO. [1629ms]
    Action: Milotic: Protect | Garchomp: Stomping Tantrum -> Kingambit (43-75% (KO 28%))
    Threats: Milotic threatened by Kingambit Kowtow Cleave (38-50% (KO 80%)); Garchomp threatened by Kingambit Kowtow Cleave (31-55%)
- T6: move 3, move 4 1 — Garchomp outspeeds and KOs Kingambit at 8%; Milotic safely Recovers back to healthy instead of redundant chip. [1691ms]
    Action: Milotic: Recover | Garchomp: Stomping Tantrum -> Kingambit (43-75% KO)
    Threats: Milotic threatened by Kingambit Kowtow Cleave (38-50% (KO 32%)); Garchomp threatened by Kingambit Kowtow Cleave (31-55%)

## Opponent info revealed this game
- Delphox: @ Delphoxite Heat Wave
- Whimsicott: Tailwind / Light Screen
- Garchomp: Dragon Claw
- Kingambit: Kowtow Cleave / Low Kick