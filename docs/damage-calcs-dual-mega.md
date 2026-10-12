# Damage Calc Reference — Dual Mega Suncontrol
Format: [Gen 9 Champions] VGC 2026 Reg M-C
Targets: Frankfurt Regional 2027 Top 4 + Brisbane Top 8

## VERIFIED FORMAT MECHANICS
- 1 SP = exactly +1 stat at Level 50. No EV rounding, no 8-EV steps.
- IVs do not exist; every Pokemon is treated as 31 in all stats.
- 66 SP total per Pokemon, 32 SP hard cap per individual stat.
- Natures are "Stat Alignments" — identical +10%/-10% behaviour.

## VERIFIED BASE STATS (corrected)
- Mega Charizard-Y: 78 / 104 / 78 / 159 / 115 / 100 — **Drought**
- Mega Dragonite:   91 / 124 / 115 / 145 / 125 / 100 — **MULTISCALE** (BST 700)
  - NOT Inner Focus. Inner Focus is base Dragonite only.
  - Mega stat deltas vs base Dragonite: 0 / -10 / +20 / +45 / +25 / +20

---

## 1. CHARIZARD-Y OFFENCE (Modest, 32 SpA SP, self-made Sun)

| Target (top-cut spread)        | Heat Wave (spread)      | Weather Ball (single)   |
|--------------------------------|-------------------------|-------------------------|
| Rillaboom 26/30/4/0/6/0        | 96-114%  OHKO ~75%      | 178-210% GUARANTEED OHKO|
| Sneasler (White Herb) 21/20/7  | 104-123% GUARANTEED OHKO| 193-228% overkill       |
| Gholdengo 14/7/0/0/31/14       | 88-104%  OHKO ~31%      | 163-192% GUARANTEED OHKO|
| Kommo-o (Leftovers)            | 101-119% GUARANTEED OHKO| 187-221% overkill       |
| Excadrill (Focus Sash)         | 118-139% -> SASH @ 1HP  | 219-258% -> SASH @ 1HP  |
| Incineroar (Sitrus) 32/21/8    | 31-37% (resist)         | 57-68%                  |
| Volcarona                      | 24-29% (resist)         | 45-53%                  |
| Opposing Charizard-Y           | 21-25% (resist)         | 39-46%                  |

KEY LINE: One sun Heat Wave threatens 4 of the 6 members of Xeno's Top 4 team
(Rillaboom, Sneasler, Gholdengo, + chip). This is the matchup-defining button.

NOTE ON yvarvgc (3rd place): their Charizard-Y runs 1 SpA SP — it is a pure
BULK/weather-war Charizard, not an attacker. Do not assume their Heat Wave
matches ours; theirs is ~40% weaker. Ours wins the damage race decisively.

---

## 2. MEGA DRAGONITE DEFENCE — MULTISCALE IS THE WHOLE POINT

| Incoming attack                     | No Multiscale    | WITH Multiscale |
|-------------------------------------|------------------|-----------------|
| Archaludon Electro Shot (rain, LO)  | 88-104% KO       | 44-52% SURVIVES |
| Basculegion Wave Crash (rain, LO)   | 94-111% KO roll  | 47-56% SURVIVES |
| Floette-E Dazzling Gleam (+1 CM)    | 72-85%           | 36-43%          |
| Sneasler Rock Tomb                  | 68-81%           | 34-41%          |
| Rillaboom Grassy Glide (priority)   | 38-45%           | 19-23%          |
| Rillaboom Wood Hammer               | 72-86%           | 36-43%          |

HARD RULE: Dragonite is ONLY a Rain/TR answer at FULL HP. Fake Out, Life Orb
recoil, chip, or Grassy Glide removes Multiscale and removes the matchup.
NEVER lead Dragonite into a Fake Out user (Rillaboom / Incineroar / Raichu /
Meowstic / Sneasler). Bring it in on a switch or after their Fake Out is spent.

---

## 3. KINGAMBIT — CHOPLE BERRY CONFIRMED

| Incoming                        | Raw        | Through Chople   |
|---------------------------------|------------|------------------|
| Sneasler Close Combat (Adamant) | 89-105% KO | 45-53% SURVIVES  |
| Kommo-o Aura Sphere (Modest)    | 71-84%     | 36-42%           |

Chople converts two separate guaranteed losses into wins. Keep over Life Orb.

### Kingambit vs Floette-Eternal-Mega (32 HP / 32 Def Bold) — THE KEY MATCHUP
| Move                                  | Damage                |
|---------------------------------------|-----------------------|
| Kowtow Cleave                         | 74-88%                |
| Kowtow Cleave at +2 (their Intimidate) | 148-175% OHKO        |
| Iron Head                             | 51-61%                |
| Kowtow + Sucker Punch same turn       | GUARANTEED KO         |

Floette-E was on 5 of 6 Brisbane top-cut teams. Calm Mind makes it immune to
special pressure. Kingambit 2HKOs it, OHKOs it if they Intimidate first.
Kingambit is MANDATORY on this team for this reason alone.

---

## 4. INCOMING RILLABOOM (model correction)
Coach notes previously flagged our model runs 3 calcs high on Rillaboom.
Quantified here — treat these as the true numbers:

| Our mon                  | Grassy Glide (PRIORITY) | Wood Hammer |
|--------------------------|-------------------------|-------------|
| Charizard-Y              | 22-27%                  | 41-49%      |
| Dragonite (Multiscale)   | 19-23%                  | 36-43%      |
| Dragonite (broken)       | 38-45%                  | 72-86%      |
| Incineroar               | 17-21%                  | 33-39%      |
| Kingambit                | 25-30%                  | 48-57%      |

Their Fake Out -> Grassy Glide sequence is explicitly designed to break
Multiscale then punish. Do not lead Dragonite into Rillaboom.

---

## 5. SPEED BENCHMARKS (Lv50, 1 SP = 1 point)
| Pokemon                        | Speed | Note                          |
|--------------------------------|-------|-------------------------------|
| Sneasler @ +2 Unburden         | ~300  | DO NOT RACE — deny the trigger|
| Whimsicott (32 Spe, Timid)     | 159   | our fastest                   |
| Scarf Indeedee (32 Spe, Timid) | 152   |                               |
| Charizard-Y (20 Spe, Modest)   | 148   | outspeeds Gholdengo + Zard-Y  |
| Kommo-o (32 Spe, Modest)       | 130   | CANNOT catch — do not try     |
| Dragonite-M (20 Spe, Modest)   | 140   | 120 base + 20 SP              |
| Gholdengo (14 Spe, Modest)     | 136   | our Zard must beat this       |
| Incineroar                     | 80    |                               |
| Kingambit                      | 71    |                               |
