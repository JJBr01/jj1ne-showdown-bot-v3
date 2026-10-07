# WIN vs pixy.flower∆ — 14 turns
2026-10-03T00-05-46-EDT · battle-gen9championsvgc2026regmc-2692011706 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2692011706)

Full battle log: battlelogs/2026-10-03T00-05-46-EDT_W_pixyflower_gen9championsvgc2026regmc-2692011706.log

**Opponent archetype:** trickroom  ·  **Plan:** Mega Charizard, Kingambit lead  ·  **Brought:** Kingambit, Milotic, Drogon, Garchomp
**Opponent team:** Torkoal, Tsareena, Incineroar, Farigiraf, Sylveon, Clawitzer  ·  **Opp brought:** Farigiraf, Tsareena, Clawitzer, Torkoal

## KO timeline
- T1: **Kingambit** (ours) fainted — last hit by Tsareena Low Kick
- T2: **Farigiraf** (theirs) fainted — last hit by Drogon (Heat Wave)
- T2: **Tsareena** (theirs) fainted — last hit by Drogon (Heat Wave)
- T4: **Drogon** (ours) fainted — last hit by Torkoal Weather Ball
- T5: **Garchomp** (ours) fainted — last hit by Clawitzer Ice Beam
- T6: **Torkoal** (theirs) fainted — last hit by Milotic (Scald)

**First KO:** ours: Kingambit · **Tailwind turns:** us 0, them 0 · **Our Mega evolved:** turn 2

## Biggest hits
- T1: Tsareena Low Kick → Kingambit: 100%
- T2: Drogon Heat Wave → Tsareena: 100%
- T5: Clawitzer Ice Beam → Garchomp: 100%
- T2: Drogon Heat Wave → Farigiraf: 70%
- T2: Farigiraf Thunderbolt → Drogon: 59%
- T6: Clawitzer Dragon Pulse → Milotic: 45%
- T3: Clawitzer Dragon Pulse → Milotic: 42%
- T4: Torkoal Weather Ball → Drogon: 41%

## Damage dealt by our Pokémon
- Milotic: 191% total (KOs: 1)
- Drogon: 170% total (KOs: 2)

## Damage-calc checks (our attacks: predicted range vs actual)
- 7 checked, 6 inside the predicted range, 1 outside
  - T1 Milotic Scald → Farigiraf: predicted 20%–27%, actual 30% (more bulk/boost/crit? → their set may differ)

## Claude pilot — 15 calls, 14 used, 4 overrides of the engine, 1 fallbacks
- Preview: team 5613 — Kingambit leads vs Trick Room/Farigiraf (immune to Psychic, Armor Tail blocks nothing of ours but Sucker Punch); Milotic walls Fire/Intimidate; Charizard Mega in back; Garchomp coverage. [1952ms]
- T1: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T2: move 2 mega, move 4 — Heat Wave guarantees KO on Tsareena (the Triple Axel threat that OHKOs Drogon) and chips Farigiraf; Milotic Protects since Drogon moves last under TR. [2140ms]
    Action: Drogon: Heat Wave [Mega] (spread) -> Farigiraf (25-35%), Tsareena (54-92%) | Milotic: Protect
    Threats: Drogon threatened by Tsareena Triple Axel (108-410% OHKO); Milotic threatened by Tsareena Triple Axel (48-150% (OHKO 49%))
- T3: move 4, move 1 2 (override; engine wanted move 2, move 1 2) — Drogon at 41% dies to Eruption or Weather Ball under Trick Room (Torkoal moves first); Protect it, Scald chips Torkoal. [2543ms]
    Action: Drogon: Protect | Milotic: Scald -> Torkoal (25-41%)
    Threats: Drogon threatened by Torkoal Eruption (27-49% (KO 38%)); Milotic threatened by Torkoal Eruption (22-29%)
- T4: move 3 2, move 1 2 — Torkoal at 66% dies to Ancient Power (50-78%) plus Scald (25-41%); focus fire removes the Eruption threat and leaves Clawitzer alone. [1961ms]
    Action: Drogon: Ancient Power -> Torkoal (50-78% (KO 43%)) | Milotic: Scald -> Torkoal (25-41%)
    Threats: Drogon threatened by Clawitzer Dragon Pulse (29-52% (KO 50%)); Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T5: move 4 2, move 3 — Stomping Tantrum guarantees the Torkoal KO without hitting Milotic; Milotic Recovers out of Dragon Pulse range while Trick Room ends. [2446ms]
    Action: Garchomp: Stomping Tantrum -> Torkoal (47-66% KO) | Milotic: Recover
    Threats: Garchomp threatened by Clawitzer Ice Beam (87-158% (OHKO 82%)); Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T6: pass, move 1 2 — Only Milotic left; Scald KOs Torkoal 55% and burn chance is our only path. Must remove the Fire threat now. [2286ms]
    Action: Milotic: Scald -> Torkoal (25-41% (KO 55%))
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T7: pass, move 3 — Milotic outlasts: Recover heals 50% while Clawitzer's best roll is 30%. Stay healthy, burn chances with Scald later. [2167ms]
    Action: Milotic: Recover
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T8: pass, move 1 1 — Last mon vs Clawitzer; Recover outpaces Dragon Pulse but I must deal damage — Scald chips with burn chance to win the stall war. [2393ms]
    Action: Milotic: Scald -> Clawitzer (10-20%)
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T9: pass, move 3 — Recover outpaces Dragon Pulse damage; burn chips Clawitzer each turn, so stalling wins the 1v1 attrition race. [2136ms]
    Action: Milotic: Recover
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T10: pass, move 1 1 — 1v1 Milotic vs burned Clawitzer: Scald chips harder than Ice Beam, burn residual plus Recover cycling wins the stall war. [2169ms]
    Action: Milotic: Scald -> Clawitzer (10-20%)
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T11: pass, move 3 — 1v1 vs burned Clawitzer: Recover outpaces its damage while burn chips it down. Pure stall wins. [2218ms]
    Action: Milotic: Recover
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T12: pass, move 1 1 — Burn ticks 6%/turn; Scald chips Clawitzer while Recover outpaces its damage. Attack now, Recover when low — burn wins this 1v1. [2588ms]
    Action: Milotic: Scald -> Clawitzer (10-20%)
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T13: pass, move 1 1 (override; engine wanted pass, move 3) — Clawitzer at 22% with burn ticking ~6%/turn; Scald's 10-20% plus burn likely finishes it. Recover stalling just risks more chip. [2058ms]
    Action: Milotic: Scald -> Clawitzer (10-20%)
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30%)
- T14: pass, move 1 1 (override; engine wanted pass, move 4) — Clawitzer at 2% with burn; Scald KOs before it can act — burn would also finish it, but attacking guarantees the win. [2109ms]
    Action: Milotic: Scald -> Clawitzer (10-20% KO)
    Threats: Milotic threatened by Clawitzer Dragon Pulse (23-30% KO)

## Opponent info revealed this game
- Farigiraf: Trick Room / Thunderbolt
- Tsareena: Low Kick / Power Whip
- Torkoal: Eruption / Weather Ball / Helping Hand
- Clawitzer: Dragon Pulse / Water Pulse / Ice Beam / Dark Pulse