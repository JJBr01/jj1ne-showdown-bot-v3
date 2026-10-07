# WIN vs equis boquis — 15 turns
2026-10-02T19-20-09-EDT · battle-gen9championsvgc2026regmc-2691909505-t5g5ymsx1qqndo50wcyuylo1rlqyuovpw · [replay](https://replay.pokemonshowdown.com/gen9championsvgc2026regmc-2691909505-t5g5ymsx1qqndo50wcyuylo1rlqyuovpw)

Full battle log: battlelogs/2026-10-02T19-20-09-EDT_W_equisboquis_gen9championsvgc2026regmc-2691909505-t5g5ymsx1qqndo50wcyuylo1rlqyuovpw.log

**Opponent archetype:** standard  ·  **Plan:** Mega Charizard, Tailwind (Whimsicott) lead  ·  **Brought:** Whimsicott, Drogon, Kingambit, Garchomp
**Opponent team:** Raichu, Milotic, Rillaboom, Floette-Eternal, Incineroar, Gholdengo  ·  **Opp brought:** Raichu, Milotic, Incineroar, Rillaboom

## KO timeline
- T8: **Garchomp** (ours) fainted — last hit by Rillaboom Grassy Glide
- T9: **Rillaboom** (theirs) fainted — last hit by Kingambit (Kowtow Cleave)
- T11: **Incineroar** (theirs) fainted — last hit by Kingambit (Kowtow Cleave)
- T12: **Whimsicott** (ours) fainted — last hit by Raichu-Mega-Y Zap Cannon
- T12: **Raichu-Mega-Y** (theirs) fainted — last hit by Kingambit (Kowtow Cleave)
- T15: **Milotic** (theirs) fainted — last hit by Drogon (Weather Ball)

**First KO:** ours: Garchomp · **Tailwind turns:** us 6, them 0 · **Our Mega evolved:** turn 1

## Biggest hits
- T12: Kingambit Kowtow Cleave → Raichu-Mega-Y: 100%
- T7: Rillaboom Wood Hammer → Garchomp: 97%
- T6: Rillaboom Wood Hammer → Whimsicott: 72%
- T6: Garchomp Stomping Tantrum → Incineroar: 49%
- T7: Garchomp Stomping Tantrum → Incineroar: 46%
- T12: Raichu-Mega-Y Zap Cannon → Whimsicott: 45%
- T3: Incineroar Flare Blitz → Drogon: 44%

## Damage dealt by our Pokémon
- Kingambit: 219% total (KOs: 3)
- Garchomp: 114% total (KOs: 0)
- Drogon: 80% total (KOs: 1)

## Damage-calc checks (our attacks: predicted range vs actual)
- 4 checked, 4 inside the predicted range, 0 outside

## Claude pilot — 16 calls, 15 used, 10 overrides of the engine, 1 fallbacks
- Preview: fallback (HTTP 429: {"error":{"code":"RateLimitReached","message":"Rate limit of 40000 per)
- T1: move 1, move 4 mega — Turn-1 Tailwind mandate with Whimsicott; Protect Drogon since Mega Raichu's Zap Cannon likely OHKOs it this turn. [2185ms]
    Action: Whimsicott: Tailwind | Drogon: Protect [Mega]
    Threats: Whimsicott threatened by Milotic Icy Wind (21-41%); Drogon threatened by Raichu Zap Cannon (59-111% (OHKO 22%))
- T2: move 2 1, move 1 1 (override; engine wanted move 4, move 1 1) — Raichu-Y No Guard Zap Cannon OHKOs Drogon; we outspeed under Tailwind. Focus-fire Moonblast + Weather Ball guarantees the KO before it fires. [2215ms]
    Action: Whimsicott: Moonblast -> Raichu-Mega-Y (31-49%) | Drogon: Weather Ball -> Raichu-Mega-Y (90-140% (OHKO 80%))
    Threats: Whimsicott threatened by Incineroar Flare Blitz (133-250% OHKO); Drogon threatened by Raichu-Mega-Y Zap Cannon (78-141% (OHKO 66%))
- T3: move 3 1, move 1 1 (override; engine wanted move 4, move 4) — Raichu Protected last turn; Weather Ball likely KOs or nearly. Encore locks Raichu into Protect, neutralizing Zap Cannon threat while Drogon outspeeds and hits. [1944ms]
    Action: Whimsicott: Encore | Drogon: Weather Ball -> Raichu-Mega-Y (60-92%)
    Threats: Whimsicott threatened by Incineroar Flare Blitz (133-250% KO); Drogon threatened by Raichu-Mega-Y Zap Cannon (78-141% (KO 82%))
- T4: move 4, switch 4 (override; engine wanted move 4, move 4) — Drogon at 46% dies to Flare Blitz; pivot it out to Garchomp while Whimsicott Protects. Garchomp resists Fire and threatens Incineroar. [2089ms]
    Action: Whimsicott: Protect | Drogon switches to Garchomp
    Threats: Whimsicott threatened by Incineroar Flare Blitz (133-250% KO); Drogon threatened by Incineroar Flare Blitz (31-51% (KO 29%))
- T5: move 3 1, move 4 2 (override; engine wanted move 3 1, move 1) — Encore locks Milotic into Protect; Stomping Tantrum hits Incineroar hard without chipping Whimsicott via Earthquake. [2312ms]
    Action: Whimsicott: Encore | Garchomp: Stomping Tantrum -> Incineroar (54-74%)
    Threats: Whimsicott threatened by Incineroar Flare Blitz (133-250% KO); Garchomp threatened by Milotic Icy Wind (31-54%)
- T6: move 3 1, move 4 1 — Milotic just Protected twice; Encore locks it if it Protects again, Stomping Tantrum chips it hardest. Garchomp outspeeds both foes. [1926ms]
    Action: Whimsicott: Encore | Garchomp: Stomping Tantrum -> Milotic (29-39%)
    Threats: Whimsicott threatened by Rillaboom Wood Hammer (39-74%); Garchomp threatened by Rillaboom Wood Hammer (58-101% (KO 14%))
- T7: move 4, move 4 1 — Whimsicott at 27% faces priority Grassy Glide/Fake Out — Protect per low-HP rule; Garchomp keeps pressure, may KO Incineroar at 71%. [2135ms]
    Action: Whimsicott: Protect | Garchomp: Stomping Tantrum -> Incineroar (37-50%)
    Threats: Whimsicott threatened by Incineroar Flare Blitz (90-166% KO); Garchomp threatened by Rillaboom Wood Hammer (58-101% (OHKO 4%))
- T8: move 1, move 4 1 — Garchomp moves first and KOs Incineroar with Stomping Tantrum; Whimsicott sets Tailwind for Kingambit/Drogon before dying. [2123ms]
    Action: Whimsicott: Tailwind | Garchomp: Stomping Tantrum -> Incineroar (37-50% KO)
    Threats: Whimsicott threatened by Incineroar Flare Blitz (90-166% KO); Garchomp threatened by Rillaboom Wood Hammer (58-101% KO)
- T9: move 4, move 1 2 (override; engine wanted move 4, move 2 2) — Kingambit outspeeds under Tailwind; Kowtow Cleave guarantees the KO on Rillaboom while Whimsicott at 39% Protects from Wood Hammer/Icy Wind. [2168ms]
    Action: Whimsicott: Protect | Kingambit: Kowtow Cleave -> Rillaboom (43-65% KO)
    Threats: Whimsicott threatened by Rillaboom Wood Hammer (39-74% KO); Kingambit threatened by Rillaboom Wood Hammer (26-37%)
- T10: move 3 1, move 1 2 (override; engine wanted move 3 1, move 4) — Encore locks Milotic into Coil (no damage); Kingambit outspeeds in Tailwind and likely KOs Raichu before Zap Cannon/Focus Blast. [2088ms]
    Action: Whimsicott: Encore | Kingambit: Kowtow Cleave -> Raichu-Mega-Y (72-106% (OHKO 19%))
    Threats: Whimsicott threatened by Raichu-Mega-Y Zap Cannon (28-55% (KO 42%)); Kingambit threatened by Raichu-Mega-Y Focus Blast (116-174% KO)
- T11: move 3 1, move 1 2 (override; engine wanted move 3 1, move 4) — Encore locks Milotic into Coil (no damage), while Kingambit's Kowtow Cleave can KO Raichu before it fires Focus Blast at Kingambit. [2056ms]
    Action: Whimsicott: Encore | Kingambit: Kowtow Cleave -> Raichu-Mega-Y (72-106% (OHKO 19%))
    Threats: Whimsicott threatened by Raichu-Mega-Y Zap Cannon (28-55% (KO 42%)); Kingambit threatened by Raichu-Mega-Y Focus Blast (116-174% KO)
- T12: move 3 1, move 1 2 (override; engine wanted move 1, move 4) — Milotic at +3 is the win condition — Encore locks it into Coil; Kingambit KOs Raichu with Kowtow Cleave, removing Focus Blast. [2232ms]
    Action: Whimsicott: Encore | Kingambit: Kowtow Cleave -> Raichu-Mega-Y (107-157% OHKO)
    Threats: Whimsicott threatened by Raichu-Mega-Y Zap Cannon (28-55% (KO 42%)); Kingambit threatened by Raichu-Mega-Y Focus Blast (116-174% KO)
- T13: move 1 1, move 1 1 (override; engine wanted move 4, move 1 1) — Last foe is a +4 Coil Milotic; must focus-fire now. Weather Ball + Kowtow Cleave ~52-73%, finishing next turn before it sweeps. [2114ms]
    Action: Drogon: Weather Ball -> Milotic (27-40%) | Kingambit: Kowtow Cleave -> Milotic (25-33%)
    Threats: Drogon threatened by Milotic Scald (20-37%); Kingambit threatened by Milotic Scald (12-17%)
- T14: move 1 1, move 1 1 — Drogon is asleep anyway; Kowtow Cleave plus any Weather Ball roll if it wakes closes out the +4 Coil Milotic, our only remaining threat. [2246ms]
    Action: Drogon: Weather Ball -> Milotic (27-40%) | Kingambit: Kowtow Cleave -> Milotic (25-33%)
    Threats: Drogon threatened by Milotic Scald (20-37%); Kingambit threatened by Milotic Scald (12-17%)
- T15: move 1 1, move 1 1 (override; engine wanted move 4, move 1 1) — Milotic at 21% and boosting; Drogon is asleep anyway so Weather Ball KOs if it wakes, Kowtow Cleave alone likely KOs. Last foe — focus fire. [2389ms]
    Action: Drogon: Weather Ball -> Milotic (27-40% KO) | Kingambit: Kowtow Cleave -> Milotic (25-33% (KO 75%))
    Threats: Drogon threatened by Milotic Muddy Water (17-31% (KO 74%)); Kingambit threatened by Milotic Muddy Water (9-14%)

## Opponent info revealed this game
- Incineroar: @ Sitrus Berry (Intimidate) Snarl / Flare Blitz / Parting Shot
- Raichu: @ Raichunite Y Fake Out / Protect / Zap Cannon
- Milotic: @ Leftovers Protect / Coil / Hypnosis / Muddy Water
- Rillaboom: (Grassy Surge) Wood Hammer / Grassy Glide