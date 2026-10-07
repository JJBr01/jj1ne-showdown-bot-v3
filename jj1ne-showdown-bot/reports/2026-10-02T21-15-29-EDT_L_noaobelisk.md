# LOSS vs NoaObelisk — 20 turns
2026-10-02T21-15-29-EDT · battle-gen9championsvgc2026regmc-2691952218 · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691952218)

Full battle log: battlelogs/2026-10-02T21-15-29-EDT_L_noaobelisk_gen9championsvgc2026regmc-2691952218.log

**Opponent archetype:** trickroom  ·  **Plan:** Mega Dragonite, Kingambit lead  ·  **Brought:** Kingambit, Garchomp, Whimsicott, Dragonite
**Opponent team:** Raichu, Basculegion, Torkoal, Sylveon, Farigiraf, Staraptor  ·  **Opp brought:** Farigiraf, Torkoal, Sylveon, Staraptor

## KO timeline
- T1: **Farigiraf** (theirs) fainted — last hit by Kingambit (Kowtow Cleave)
- T4: **Sylveon** (theirs) fainted — last hit by Kingambit (Iron Head)
- T4: **Kingambit** (ours) fainted — last hit by Sylveon Quick Attack
- T6: **Torkoal** (theirs) fainted — last hit by Dragonite (Dragon Pulse)
- T12: **Whimsicott** (ours) fainted — last hit by Staraptor-Mega Close Combat
- T16: **Garchomp** (ours) fainted — last hit by Torkoal Eruption
- T20: **Dragonite** (ours) fainted — last hit by Staraptor-Mega Close Combat

**First KO:** theirs: Farigiraf · **Tailwind turns:** us 6, them 0 · **Our Mega evolved:** turn 5

## Biggest hits
- T4: Kingambit Iron Head → Sylveon: 100%
- T10: Staraptor-Mega Brave Bird → Whimsicott: 99%
- T2: Torkoal Eruption → Kingambit: 78%
- T17: Dragonite Dragon Pulse → Staraptor-Mega: 78%
- T1: Kingambit Kowtow Cleave → Farigiraf: 67%
- T2: Garchomp Stomping Tantrum → Torkoal: 56%
- T8: Staraptor-Mega Brave Bird → Dragonite: 54%
- T12: Whimsicott Moonblast → Staraptor-Mega: 47%

## Damage dealt by our Pokémon
- Dragonite: 192% total (KOs: 1)
- Kingambit: 167% total (KOs: 2)
- Garchomp: 153% total (KOs: 0)
- Whimsicott: 47% total (KOs: 0)

## Damage-calc checks (our attacks: predicted range vs actual)
- 9 checked, 8 inside the predicted range, 1 outside
  - T17 Dragonite Dragon Pulse → Staraptor-Mega: predicted 15%–26%, actual 78% (more bulk/boost/crit? → their set may differ)

## Claude pilot — 21 calls, 20 used, 15 overrides of the engine, 1 fallbacks
- Preview: team 5342 — Kingambit leads vs Farigiraf Trick Room (Armor Tail blocks our priority but Kowtow Cleave hits hard); Garchomp pressures Raichu/Torkoal; Whimsicott Encore; Mega Dragonite sheltered in back. [2109ms]
- T1: move 1 1, move 4 1 (override; engine wanted move 1 1, move 2 1) — Garchomp (fastest) chips Farigiraf first, then Kingambit's Kowtow Cleave guarantees the KO on the Trick Room setter before it can move. [2181ms]
    Action: Kingambit: Kowtow Cleave -> Farigiraf (86-113% (OHKO 48%)) | Garchomp: Stomping Tantrum -> Farigiraf (25-34%)
    Threats: Kingambit threatened by Torkoal Eruption (122-184% OHKO); Garchomp threatened by Farigiraf Psychic (30-54%)
- T2: move 3 1, move 4 2 — Iron Head guarantees KO on Sylveon; Garchomp chunks Torkoal past 50%, setting up next-turn KO. Removes the Pixilate threat immediately. [2153ms]
    Action: Kingambit: Iron Head -> Sylveon (101-150% OHKO) | Garchomp: Stomping Tantrum -> Torkoal (47-66%)
    Threats: Kingambit threatened by Torkoal Eruption (122-184% KO); Garchomp threatened by Sylveon Hyper Beam (136-244% OHKO)
- T3: fallback to engine (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T4: move 3 1, move 4 2 — Iron Head OHKOs Sylveon; Garchomp's Stomping Tantrum KOs Torkoal at 44%. Both foes removed this turn before they can act meaningfully. [2236ms]
    Action: Kingambit: Iron Head -> Sylveon (101-150% OHKO) | Garchomp: Stomping Tantrum -> Torkoal (47-66% KO)
    Threats: Kingambit threatened by Torkoal Weather Ball (107-165% KO); Garchomp threatened by Sylveon Hyper Beam (136-244% KO)
- T5: move 1 1 mega, move 4 1 (override; engine wanted move 1 1 mega, move 4 2) — Garchomp's Tantrum is useless vs Flying Staraptor; focus both actions on Torkoal (44%) — combined 79-120% likely KOs the Drought/Eruption threat. [2609ms]
    Action: Dragonite: Dragon Pulse [Mega] -> Torkoal (38-59% (KO 72%)) | Garchomp: Stomping Tantrum -> Torkoal (31-44% (KO 4%))
    Threats: Dragonite threatened by Staraptor Brave Bird (36-65%); Garchomp threatened by Staraptor Brave Bird (33-59%)
- T6: move 1 1, move 4 1 (override; engine wanted move 1 1, move 4 2) — Torkoal at 44% is sub-50 and Protect just used; combined Dragon Pulse + Stomping Tantrum guarantees the KO, removing sun/Eruption. [2156ms]
    Action: Dragonite: Dragon Pulse -> Torkoal (48-76% KO) | Garchomp: Stomping Tantrum -> Torkoal (31-44% (KO 4%))
    Threats: Dragonite threatened by Staraptor Brave Bird (16-27%); Garchomp threatened by Staraptor Brave Bird (33-59%)
- T7: move 3, move 4 2 — Garchomp's Ground move does nothing to Flying Staraptor; no OHKO threat on us, so cash Tailwind to outspeed it permanently. [1838ms]
    Action: Dragonite: Tailwind | Garchomp: Stomping Tantrum -> Staraptor-Mega (0-0%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63%); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T8: move 1 2, move 4 2 (override; engine wanted move 4, move 4 2) — Staraptor is their last mon and Contrary-boosting; Dragon Pulse chips 25-42% now. Garchomp's Ground move does nothing but it's Choice-locked. [2013ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (25-42%) | Garchomp: Stomping Tantrum -> Staraptor-Mega (0-0%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63%); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T9: move 4, move 4 2 — Stomping Tantrum is Ground — zero damage on Flying Staraptor. Dragonite at 33% dies to Brave Bird; Protect is mandatory. [1802ms]
    Action: Dragonite: Protect | Garchomp: Stomping Tantrum -> Staraptor-Mega (0-0%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T10: switch 3, move 4 2 (override; engine wanted move 1 2, move 4 2) — Dragonite at 33% dies to Brave Bird; Stomping Tantrum does nothing to Flying Staraptor. Bring Whimsicott in to Moonblast/Tailwind safely. [1899ms]
    Action: Dragonite switches to Whimsicott | Garchomp: Stomping Tantrum -> Staraptor-Mega (0-0%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T11: move 2 2, move 4 2 (override; engine wanted move 4, move 4 2) — Whimsicott at 1% dies to anything anyway; Moonblast chips Staraptor up to 57% since Stomping Tantrum does nothing. Protect only delays one turn. [1721ms]
    Action: Whimsicott: Moonblast -> Staraptor-Mega (34-57%) | Garchomp: Stomping Tantrum -> Staraptor-Mega (0-0%)
    Threats: Whimsicott threatened by Staraptor-Mega Brave Bird (104-197% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T12: move 2 2, move 4 2 (override; engine wanted move 4, move 4 2) — Whimsicott dies to anything anyway; Moonblast's 34-57% plus chip is our only path to removing the Contrary Staraptor before it sweeps. [2156ms]
    Action: Whimsicott: Moonblast -> Staraptor-Mega (34-57%) | Garchomp: Stomping Tantrum -> Staraptor-Mega (0-0%)
    Threats: Whimsicott threatened by Staraptor-Mega Brave Bird (104-197% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T13: move 1 2, move 1 (override; engine wanted move 4, move 1) — Staraptor at 29%; Dragon Pulse has 25% KO chance plus Struggle chip. Protect only delays; we must convert damage now. [1924ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (19-32% (KO 25%)) | Garchomp: Struggle -> Staraptor-Mega (4-7%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66%)
- T14: move 1 2, move 1 (override; engine wanted move 4, move 1) — Only Staraptor left at 44%; it Roosts otherwise. Dragon Pulse + Struggle chips toward KO; Protect just gives free Roost. [1957ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (19-32%) | Garchomp: Struggle -> Staraptor-Mega (4-7%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66% (KO 47%))
- T15: move 3, move 1 (override; engine wanted move 4, move 1) — Staraptor Roost-stalls faster than we chip; Tailwind lets Dragonite outspeed and double-Pulse before Brave Bird KOs. Garchomp Struggles for extra chip. [2711ms]
    Action: Dragonite: Tailwind | Garchomp: Struggle -> Staraptor-Mega (4-7%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66% KO)
- T16: move 1 2, move 1 (override; engine wanted move 4, move 1) — Both our mons die to Brave Bird anyway; Protect only saves one turn. Max chip now: Dragon Pulse + Struggle, hope to whittle Staraptor down. [1816ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (15-26%) | Garchomp: Struggle -> Staraptor-Mega (3-6%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO); Garchomp threatened by Staraptor-Mega Brave Bird (37-66% KO)
- T17: move 1 2, pass (override; engine wanted move 4, pass) — Dragonite at 4% dies to anything; Protect only delays one turn. Attack for chip and hope — Dragon Pulse is our only damage. [1642ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (15-26%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO)
- T18: move 1 2, pass (override; engine wanted move 4, pass) — Staraptor at 52% after Roost; we're faster with Tailwind. Protect only delays — it Roosts back. Dragon Pulse chips; only offense can win. [2144ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (15-26%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO)
- T19: move 4, pass — Dragonite at 4% dies to anything; Staraptor just Protected so it will attack. Protect, forcing it to waste a turn; Dragon Pulse can't KO 52%. [1871ms]
    Action: Dragonite: Protect
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO)
- T20: move 1 2, pass (override; engine wanted move 3, pass) — Protect was used last turn; Staraptor at 52% KOs us regardless. Only win path is chipping it with Dragon Pulse. [1995ms]
    Action: Dragonite: Dragon Pulse -> Staraptor-Mega (15-26%)
    Threats: Dragonite threatened by Staraptor-Mega Brave Bird (36-63% KO)

## Opponent info revealed this game
- Torkoal: (Drought) Protect / Eruption
- Farigiraf: 
- Sylveon: Protect / Quick Attack
- Staraptor: @ Staraptite Close Combat / Protect / Brave Bird / Roost