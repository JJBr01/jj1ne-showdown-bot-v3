# LOSS vs joaquinpug — 10 turns
2026-10-02T17-46-47-EDT · battle-gen9championsvgc2026regmc-2691871644 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691871644)

Full battle log: battlelogs/2026-10-02T17-46-47-EDT_L_joaquinpug_gen9championsvgc2026regmc-2691871644.log

**Opponent archetype:** standard  ·  **Plan:** Mega Charizard, Tailwind (Whimsicott) lead  ·  **Brought:** Whimsicott, Drogon, Dragonite, Milotic
**Opponent team:** Metagross, Staraptor, Whimsicott, Grimmsnarl, Rillaboom, Incineroar  ·  **Opp brought:** Staraptor, Grimmsnarl, Incineroar, Whimsicott

## KO timeline
- T5: **Milotic** (ours) fainted — last hit by Staraptor-Mega Close Combat
- T8: **Whimsicott** (ours) fainted — last hit by Grimmsnarl Spirit Break
- T9: **Drogon** (ours) fainted — last hit by Staraptor-Mega Brave Bird
- T10: **Dragonite** (ours) fainted — last hit by Staraptor-Mega Brave Bird

**First KO:** ours: Milotic · **Tailwind turns:** us 3, them 3 · **Our Mega evolved:** turn 2

## Biggest hits
- T5: Staraptor-Mega Close Combat → Milotic: 100%
- T4: Staraptor-Mega Close Combat → Dragonite: 86%
- T2: Staraptor-Mega Close Combat → Drogon: 68%
- T1: Staraptor-Mega Close Combat → Whimsicott: 54%
- T8: Grimmsnarl Spirit Break → Whimsicott: 46%

## Damage dealt by our Pokémon
- Whimsicott: 92% total (KOs: 0)
- Drogon: 65% total (KOs: 0)
- Dragonite: 20% total (KOs: 0)

## Damage-calc checks (our attacks: predicted range vs actual)
- 4 checked, 3 inside the predicted range, 1 outside
  - T8 Whimsicott Moonblast → Grimmsnarl: predicted 50%–68%, actual 38% (more bulk than assumed?)

## Claude pilot — 11 calls, 10 used, 10 overrides of the engine, 1 fallbacks
- Preview: team 4126 — Whimsicott Tailwind + Drogon front; Dragonite Mega sheltered in back. Fire pressures Metagross/Rillaboom; Milotic answers Incineroar Intimidate with Competitive. [2119ms]
- T1: fallback to engine (no JSON in reply)
- T2: move 2 2, move 1 2 mega (override; engine wanted move 4, move 2 mega) — Whimsicott dies to anything anyway; focus Grimmsnarl for a likely KO, removing screens/Parting Shot support before Staraptor snowballs. [1875ms]
    Action: Whimsicott: Moonblast -> Grimmsnarl (34-46%) | Drogon: Weather Ball [Mega] -> Grimmsnarl (8-11%)
    Threats: Whimsicott threatened by Staraptor-Mega Brave Bird (104-197% KO); Drogon threatened by Staraptor-Mega Brave Bird (50-81%)
- T3: switch 4, move 4 (override; engine wanted move 4, move 4) — Drogon at 32% dies to anything; Protect it this turn while swapping fragile Whimsicott for bulky Milotic to absorb Close Combat/Flare Blitz. [2166ms]
    Action: Whimsicott switches to Milotic | Drogon: Protect
    Threats: Whimsicott threatened by Staraptor-Mega Brave Bird (154-291% KO); Drogon threatened by Staraptor-Mega Brave Bird (73-120% KO)
- T4: switch 3, move 2 (override; engine wanted move 4, move 1 2) — Drogon at 32% dies to anything; Milotic dies to +2 CC/Brave Bird. Bring Dragonite (Multiscale, resists Fighting) while Heat Wave chips both. [2949ms]
    Action: Milotic switches to Dragonite | Drogon: Heat Wave (spread) -> Staraptor-Mega (17-28%), Whimsicott (86-170% (OHKO 84%))
    Threats: Milotic threatened by Staraptor-Mega Close Combat (90-118% (OHKO 64%)); Drogon threatened by Staraptor-Mega Brave Bird (99-161% KO)
- T5: switch 3, switch 4 (override; engine wanted default) — Both actives die to any attack; preserve them. Milotic (bulky, resists nothing but survives) and Whimsicott pivot in, resetting the board. [2491ms]
    Action: Dragonite switches to Milotic | Drogon switches to Whimsicott
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (80-145% KO); Drogon threatened by Staraptor-Mega Brave Bird (99-161% KO)
- T6: move 4, move 3 1 (override; engine wanted default) — Staraptor OHKOs Drogon with Brave Bird; Protect it while Whimsicott Encores Staraptor into Close Combat, locking the Contrary threat into a non-KO move. [2371ms]
    Action: Drogon: Protect | Whimsicott: Encore
    Threats: Drogon threatened by Staraptor-Mega Brave Bird (99-161% KO); Whimsicott threatened by Staraptor-Mega Brave Bird (206-390% KO)
- T7: move 4, move 2 2 (override; engine wanted default) — Staraptor Encored into Close Combat KOs whatever it targets; Protect Drogon and Moonblast their Whimsicott to break Sash and remove Tailwind/Charm support. [2082ms]
    Action: Drogon: Protect | Whimsicott: Moonblast -> Whimsicott (33-64%)
    Threats: Drogon threatened by Staraptor-Mega Brave Bird (147-240% KO); Whimsicott threatened by Staraptor-Mega Brave Bird (309-582% KO)
- T8: move 4, move 2 2 (override; engine wanted default) — Staraptor KOs anything it clicks; Protect Drogon, Whimsicott Moonblast likely KOs Grimmsnarl (50-68% vs 53%) to even the board. [2431ms]
    Action: Drogon: Protect | Whimsicott: Moonblast -> Grimmsnarl (50-68% (KO 86%))
    Threats: Drogon threatened by Staraptor-Mega Brave Bird (147-240% KO); Whimsicott threatened by Staraptor-Mega Brave Bird (309-582% KO)
- T9: move 2, move 2 (override; engine wanted default) — Candidates reference dead Pokémon; both Heat Waves KO Grimmsnarl (33-39% on 15%) and chip Staraptor. Protect won't save us; must remove a foe. [2681ms]
    Action: Drogon: Heat Wave (spread) -> Staraptor-Mega (11-19%), Grimmsnarl (33-39% KO) | Dragonite: Heat Wave (spread) -> Staraptor-Mega (6-9%), Grimmsnarl (16-19% KO)
    Threats: Drogon threatened by Staraptor-Mega Brave Bird (147-240% KO); Dragonite threatened by Staraptor-Mega Brave Bird (121-217% KO)
- T10: pass, move 1 1 (override; engine wanted default) — Only Dragonite remains and dies to anything; fire Dragon Pulse at the Contrary Staraptor rather than Protect-stalling a lost position. [2605ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (7-12%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (121-217% KO)

## Opponent info revealed this game
- Staraptor: @ Staraptite Close Combat / Brave Bird
- Grimmsnarl: Light Screen / Parting Shot / Spirit Break
- Incineroar: @ Sitrus Berry (Intimidate) Parting Shot
- Whimsicott: Encore / Tailwind / Charm