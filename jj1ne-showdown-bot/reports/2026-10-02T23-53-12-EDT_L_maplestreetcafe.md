# LOSS vs maplestreetcafe — 7 turns
2026-10-02T23-53-12-EDT · battle-gen9championsvgc2026regmc-2692008182 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2692008182)

Full battle log: battlelogs/2026-10-02T23-53-12-EDT_L_maplestreetcafe_gen9championsvgc2026regmc-2692008182.log

**Opponent archetype:** standard  ·  **Plan:** Mega Dragonite, Tailwind (Whimsicott) lead  ·  **Brought:** Milotic, Dragonite, Whimsicott, Garchomp
**Opponent team:** Froslass, Incineroar, Basculegion, Glimmora, Rillaboom, Volcarona  ·  **Opp brought:** Froslass, Basculegion, Rillaboom, Incineroar

## KO timeline
- T3: **Dragonite** (ours) fainted — last hit by Rillaboom Wood Hammer
- T4: **Froslass-Mega** (theirs) fainted — last hit by Whimsicott (Moonblast)
- T5: **Milotic** (ours) fainted — last hit by Rillaboom Wood Hammer
- T5: **Rillaboom** (theirs) fainted — last hit by Milotic (Ice Beam)
- T6: **Whimsicott** (ours) fainted — last hit by Incineroar Fake Out
- T7: **Garchomp** (ours) fainted — last hit by Basculegion Last Respects

**First KO:** ours: Dragonite · **Tailwind turns:** us 5, them 0 · **Our Mega evolved:** turn 1

## Biggest hits
- T5: Rillaboom Wood Hammer → Milotic: 100%
- T5: Basculegion Last Respects → Whimsicott: 99%
- T6: Basculegion Last Respects → Garchomp: 98%
- T2: Froslass-Mega Blizzard → Dragonite: 82%
- T6: Garchomp Stomping Tantrum → Incineroar: 57%
- T3: Dragonite Heat Wave → Rillaboom: 54%
- T7: Garchomp Stomping Tantrum → Incineroar: 49%
- T2: Dragonite Heat Wave → Froslass-Mega: 47%

## Damage dealt by our Pokémon
- Garchomp: 106% total (KOs: 0)
- Dragonite: 101% total (KOs: 0)
- Milotic: 60% total (KOs: 1)
- Whimsicott: 31% total (KOs: 1)

## Damage-calc checks (our attacks: predicted range vs actual)
- 6 checked, 3 inside the predicted range, 3 outside
  - T3 Dragonite Heat Wave → Rillaboom: predicted 31%–37%, actual 54% (more bulk/boost/crit? → their set may differ)
  - T5 Milotic Ice Beam → Rillaboom: predicted 22%–27%, actual 38% (more bulk/boost/crit? → their set may differ)
  - T6 Garchomp Stomping Tantrum → Incineroar: predicted 37%–50%, actual 57% (more bulk/boost/crit? → their set may differ)

## Claude pilot — 8 calls, 7 used, 4 overrides of the engine, 1 fallbacks
- Preview: team 6243 — Milotic gets Competitive +2 from Incineroar Intimidate; Dragonite Mega sheltered-ish with Tailwind. Whimsicott speed control, Scarf Garchomp revenge-kills Volcarona/Froslass late. [1796ms]
- T1: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T2: move 4, move 2 — Wood Hammer/Grassy Glide OHKO-range Milotic, so Protect it; Heat Wave chips both foes behind veil while Dragonite outspeeds under Tailwind. [2152ms]
    Action: Milotic: Protect | Dragonite: Heat Wave (spread) -> Froslass-Mega (29-48%), Rillaboom (31-37%)
    Threats: Milotic threatened by Rillaboom Wood Hammer (139-183% OHKO); Dragonite threatened by Froslass-Mega Blizzard (45-76%)
- T3: move 1 1, move 2 (override; engine wanted move 1 1, move 1 1) — Dragonite at 18% dies to Blizzard; Heat Wave likely KOs burned Froslass before it moves, Scald adds damage to guarantee removal. [1605ms]
    Action: Milotic: Scald -> Froslass-Mega (13-23%) | Dragonite: Heat Wave (spread) -> Froslass-Mega (29-48% (KO 90%)), Rillaboom (31-37%)
    Threats: Milotic threatened by Rillaboom Wood Hammer (139-183% OHKO); Dragonite threatened by Froslass-Mega Blizzard (90-152% KO)
- T4: move 4, move 2 1 (override; engine wanted move 4, move 4) — Froslass at 31% burned: Moonblast 18-29% plus burn likely finishes it; Milotic Protects to dodge Wood Hammer KO. Removes Blizzard threat on Whimsicott. [2398ms]
    Action: Milotic: Protect | Whimsicott: Moonblast -> Froslass-Mega (18-29%)
    Threats: Milotic threatened by Rillaboom Wood Hammer (139-183% OHKO); Whimsicott threatened by Froslass-Mega Blizzard (73-145% (OHKO 63%))
- T5: move 2 2, move 1 — Tailwind flips speed so Milotic outruns both; Ice Beam chips Rillaboom toward Moonblast KO range next turn. Wood Hammer recoil helps too. [1883ms]
    Action: Milotic: Ice Beam -> Rillaboom (22-27%) | Whimsicott: Tailwind
    Threats: Milotic threatened by Rillaboom Wood Hammer (139-183% OHKO); Whimsicott threatened by Basculegion Wave Crash (46-88%)
- T6: move 4 2, move 2 1 (override; engine wanted move 4 2, move 4) — Whimsicott at 1 HP dies to anything; Protect only delays. Use its action now — Moonblast chip on Basculegion while Garchomp hits Incineroar. [1838ms]
    Action: Garchomp: Stomping Tantrum -> Incineroar (37-50%) | Whimsicott: Moonblast -> Basculegion (24-44%)
    Threats: Garchomp threatened by Basculegion Wave Crash (68-118% (OHKO 36%)); Whimsicott threatened by Incineroar Flare Blitz (90-166% KO)
- T7: move 4 2, pass — Last Pokemon, choice-locked, dying anyway; Stomping Tantrum into Incineroar at 43% has best chance to KO something. [2002ms]
    Action: Garchomp: Stomping Tantrum -> Incineroar (37-50%)
    Threats: Garchomp threatened by Basculegion Wave Crash (68-118% KO)

## Opponent info revealed this game
- Rillaboom: (Grassy Surge) Wood Hammer
- Froslass: @ Froslassite (Snow Warning) Aurora Veil / Blizzard / Protect
- Basculegion: Last Respects
- Incineroar: @ Sitrus Berry (Intimidate) Fake Out