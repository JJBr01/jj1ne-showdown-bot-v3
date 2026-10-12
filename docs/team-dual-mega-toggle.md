# Dual-Mega Toggle Team — Reg M-C (USAGE-VERIFIED)
Sources: limitlessvgc.com M-C usage data + VGCPastes Champions M-C repo.
All items/moves verified against live tournament usage. No illegal items.

## CORE PRINCIPLE
1 Mega per game. Charizard-Y and Dragonite are a MATCHUP TOGGLE.
Whimsicott and Incineroar are a MATCHING SUPPORT TOGGLE (they pair 0.81% — never both).

- MEGA CHARIZARD-Y + WHIMSICOTT vs: Rillaboom cores, Sneasler, Kingambit, Snow, Grass, Steel
- MEGA DRAGONITE + INCINEROAR vs: Rain (Pelipper/Archaludon), Trick Room, Basculegion, Psy Terrain

---

## THE PASTE (all items usage-confirmed)

```
Drogon (Charizard) (M) @ Charizardite Y
Ability: Blaze
Level: 50
EVs: 6 HP / 12 Def / 32 SpA / 16 Spe
Modest Nature
- Heat Wave
- Weather Ball
- Solar Beam
- Protect

Dragonite (M) @ Dragoninite
Ability: Inner Focus
Level: 50
EVs: 20 HP / 14 Def / 32 SpA
Modest Nature
- Dragon Pulse
- Heat Wave
- Tailwind
- Protect

Incineroar (M) @ Sitrus Berry
Ability: Intimidate
Level: 50
EVs: 32 HP / 10 Def / 24 SpD
Careful Nature
- Fake Out
- Parting Shot
- Flare Blitz
- Throat Chop

Rillaboom (M) @ Miracle Seed
Ability: Grassy Surge
Level: 50
EVs: 26 HP / 30 Atk / 10 SpD
Adamant Nature
- Fake Out
- Grassy Glide
- Wood Hammer
- High Horsepower

Kingambit (M) @ Life Orb
Ability: Defiant
Level: 50
EVs: 32 HP / 32 Atk / 2 SpD
Adamant Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Protect

Whimsicott (F) @ Focus Sash
Ability: Prankster
Level: 50
EVs: 2 HP / 32 SpA / 32 Spe
Timid Nature
- Tailwind
- Moonblast
- Encore
- Protect
```

### Usage backing (limitlessvgc M-C)
| Mon | Item | Usage | Key move confirmations |
|---|---|---|---|
| Charizard (57) | Charizardite Y | 100% | Heat Wave/Weather Ball/Protect all 100%; Solar Beam 40.35% |
| Dragonite (13) | Dragoninite | 92.31% | Dragon Pulse/Protect 92%, Heat Wave/Tailwind 77% |
| Incineroar (123) | Sitrus Berry | 73.17% | Fake Out 100%, Parting Shot 96%, Flare Blitz 91%, Throat Chop 52% |
| Rillaboom (198) | Miracle Seed | 77.27% | Fake Out/Grassy Glide 100%, Wood Hammer 92%, High Horsepower 72% |
| Kingambit (114) | Life Orb | 35.09% (#1) | Kowtow/Sucker 100%, Protect 62%, Iron Head 54% |
| Whimsicott (17) | Focus Sash | 64.71% | Tailwind 100%, Moonblast/Protect 88%, Encore 76% |

NOTE: Assault Vest, Choice Band/Specs do NOT appear in any M-C usage data — treat as illegal.
Life Orb IS legal and is the #1 Kingambit item. Eject Button and Expert Belt appear on
Rillaboom, confirming the item pool expanded past launch.

---

## VERIFIED CALCS (Smogon engine)

### CRITICAL — threats that OHKO us
| Attack | Target | Result |
|---|---|---|
| **Sneasler Close Combat** | **Kingambit (Life Orb)** | **167.3-197% GUARANTEED OHKO** |
| Sneasler Close Combat | Kingambit (Chople) | 83.6-98.5% — survives, 2HKO |
| Archaludon Electro Shot (+1, sun) | Charizard-Y | 111.7-131.9% GUARANTEED OHKO |
| Basculegion Wave Crash (Scarf, sun) | Charizard-Y | 83.5-98.3% 2HKO (OHKO in rain) |

### Threats that DON'T matter
| Attack | Target | Result |
|---|---|---|
| Sneasler Rock Slide | Dragonite (Multiscale) | 16.8-19.8% — 6HKO, irrelevant |
| Gholdengo Make It Rain (LO) | Charizard-Y | 28.1-33.3% — 3HKO |
| Rillaboom High Horsepower | Kingambit | 47-55.4% — 2HKO only |

### Our offence
| Attack | Target | Result |
|---|---|---|
| Zard-Y Heat Wave (sun) | Rillaboom | OHKO |
| Zard-Y Solar Beam (sun) | Pelipper | 84.5-99.6% — 2HKO, NOT a clean OHKO |
| Zard-Y Heat Wave (sun) | Floette-E (bulky) | 48.2-57% — NO OHKO |
| Kingambit Kowtow Cleave (LO) | Floette-E (bulky Def) | **33.1-39.4% — 3HKO. NOT the answer.** |

---

## KEY RULE 1: KINGAMBIT ITEM IS MATCHUP-DEPENDENT
Life Orb is the #1 usage item BUT Sneasler Close Combat OHKOs it (167-197%).
Sneasler is the #2 Pokemon in the format (41.02% usage).
Chople Berry converts that OHKO into a survive (83.6-98.5%).
=> If Sneasler is on their preview, Kingambit is a LIABILITY. Do not lead it.
=> Consider Chople Berry as the default if laddering into heavy Sneasler.

## KEY RULE 2: FLOETTE-ETERNAL — PREVIOUS PLAN WAS WRONG
Earlier notes claimed Kingambit Kowtow Cleave answers bulky Floette (74-88%).
VERIFIED: vs 27 Def investment it is only 33.1-39.4% — a 3HKO. Kingambit does NOT beat it.
Heat Wave is 48.2-57%. Nothing on this team cleanly removes a bulky Calm Mind Floette.
=> Answer is Whimsicott ENCORE locking it into Calm Mind, or Incineroar Parting Shot
   pivoting out. Do not try to brute-force it.
(Caveat: Floette-Eternal-Mega not in calc DB; Florges used as bulk proxy. Directionally sound.)

## KEY RULE 3: ARCHALUDON
Electro Shot OHKOs Charizard-Y THROUGH SUN. Sun does not reduce Electric damage.
If Archaludon is on preview, Charizard-Y must NOT be the Mega. Bring Dragonite.
This explains the 12W-28L rain record.

## KEY RULE 4: SOLAR BEAM DOES NOT OHKO PELIPPER
84.5-99.6%. Pelipper at full HP survives on the low roll, and Focus Sash survives always.
Do not plan a turn assuming Pelipper dies to one Solar Beam.

---

## LEAD MATRIX
| Their archetype | Our Mega | Lead pair |
|---|---|---|
| Rillaboom/Incineroar glue | Charizard-Y | Zard + Rillaboom |
| Floette + Kingambit + Sneasler | Charizard-Y | Whimsicott + Zard (Encore the Floette) |
| Rain (Pelipper/Archaludon) | **Dragonite** | Rillaboom + Incineroar, Dragonite in on switch |
| Trick Room | **Dragonite** | Whimsicott + Incineroar (Encore the setter) |
| Psychic Terrain | Charizard-Y | Kingambit + Charizard (confirmed 9-6) |
| Snow (Froslass/Ninetales-A) | Charizard-Y | Zard + Incineroar — Drought mandatory |
| Heavy Sneasler | Charizard-Y | Zard + Rillaboom — **bench Kingambit** |
