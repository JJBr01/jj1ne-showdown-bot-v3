# JJ1NE Showdown Ladder Bot — v4

## What's new in v4
- **Battle count:** `run.bat` asks how many battles to play (Enter = config.json). Or `run.bat 25`, `node bot.js 25`, `./run.sh 25`. 0 = unlimited.
- **Switching:** every turn each active Pokémon is compared with its healthy teammates (matchup, incoming damage, tempo). It switches out when about to be KO'd without Protect, at −2 or worse in its attacking stat, Choice-locked into a bad move, Yawned, Encored, at Perish count 1, or walled. The best switch for each slot is always shown to Claude, and Claude is told switching is a normal tool.
- **Smogon damage calculator** (`@smogon/calc`) now produces every damage range; the Showdown engine is only a fallback for cases the Smogon calc can't handle. This also fixes a real bug: the engine path ignored Life Orb.
- **Knowledge pack** (`knowledge/`): the project's battle principles, team notes, simulation findings, meta notes and ladder lessons, read by Claude every game. The coach appends durable lessons to `knowledge/05-coach-notes.md`, so learning carries forward.
- **Live meta:** at startup (every 24 h) the bot reads the public VGCPastes Repository sheet (Champions M-C), downloads new pokepastes (cached), and rebuilds `setdb.json` (opponent set guesses incl. EV spreads) and `data/meta.json` (usage %, common pairs — shown to Claude at team preview). Run anytime: `node update-meta.js`.
- **Coach fixes:** JSON proposals come first (never cut off by the token limit); proposals merge and expire after `proposalLifetimeGames` (15) instead of being overwritten; default `coachEvery` is 5 to respect your 13k tokens/min quota.
- **Cost fix:** estimates use `pricing` in config.json (USD per million tokens) with the correct math, plus a running session total. Set the prices to your actual Azure rates.
- **Oct 2 fixes:** Choice-lock flag in Claude's board summary ("LOCKED by Choice Scarf into X — switching resets"), don't lead Garchomp next to Kingambit; Shadow Tag / Arena Trap warning + Perish Song-while-trapped rule; vs Indeedee (psyterrain) teams Kingambit is forced into the lead (engine and Claude previews).
- **Prompt caching** (`"promptCache": true` by default in the claude block): the repeated system prompt is cached, so turns after the first cost ~65% less input. Turned off automatically if the deployment rejects it. Token/cost logs show billed-equivalent input (cache writes 1.25x, reads 0.1x). Damage table trimmed (no near-zero moves, each foe's 2 strongest moves) and expert references default to 2.
- **Tested-and-rejected ideas** (`knowledge/07-tested-ideas.md`): coach proposals matching a `[block: …]` pattern are filtered out and the coach sees why they were rejected (e.g. "no Mega vs sand": tested 61–65% vs Mega Charizard + Tailwind 70.7%).
- **Damage table for Claude:** every turn, Claude gets a full Smogon-calc table — every usable move of ours vs each foe, and each foe's likely moves vs ours — with guaranteed/possible KO marks against current HP, Focus Sash/Sturdy notes, ally damage from spread moves, and Mega-aware forms (a Pokémon about to Mega Evolve is shown as its Mega, with its weather). Claude is told to use these numbers and check any custom choice against them. Adds ~600–800 tokens per turn.
- **Wolfe playbook** (`knowledge/00-wolfe-playbook.md` + `knowledge/06-wolfe-turn-checklist.md`): the WolfeyVGC lessons in this project (speed control, team preview, choosing the move, safe plays, when to predict, Protect, board states, matchups, archetypes) distilled into concrete rules tagged by lesson. The full playbook goes to team preview and the coach; the 9-point checklist goes into every turn prompt (~+400 tokens per turn).
- **Expert replays** (`replays.js`): at startup (every 72 h) the bot downloads high-rated Reg M-C replays from Showdown (rating ≥ 1450, ~2,000 games; cached so later runs only fetch new ones), turns every turn into a decision record (Pokémon on both sides, HP, field, what the expert did, whether they won), and each turn shows Claude the 3 most similar expert positions. First run takes a few minutes and ~20 MB. Settings (optional) in config.json: `"expert": {"enabled": true, "minRating": 1450, "maxPages": 40, "refreshHours": 72, "k": 3}`. Run anytime: `node replays.js`.
- **Contrary detection:** when a foe gets stronger from its own Overheat/Close Combat/Draco Meteor/Superpower (Malamar Skill Swap), the board summary flags it "[CONTRARY — KO it now]" and Claude knows the combo.
- **No overkill:** Draco Meteor/Overheat/Close Combat are avoided when a weaker non-dropping move already guarantees the KO.
- **Coach retry:** if a coach review comes back without its JSON, the bot asks once more for just the proposals, so reviews aren't lost.
- **Choice Scarf lock:** Garchomp switches out to reset its lock when another of its moves (usually Earthquake) has become clearly better than the locked one. Alternative team **`team-garchomp-sitrus.js`** (Sitrus Berry + Protect, no lock) — ties Scarf overall in simulation, much better vs sand, worse vs some Psychic Terrain teams; copy it over `team.js` to use it.
- **Team change — Kingambit replaces Sneasler** (`team.js`). Ladder losses to Indeedee + Psychic Terrain + Expanding Force exposed Sneasler (4x weak to Psychic, Fake Out blocked by the terrain). Simulated vs the 9 ladder teams that beat us: Kingambit 81% vs Sneasler 71%; vs the 40 tournament teams: identical (72.5% each). The Sneasler version is kept as `team-sneasler.js` (copy it over `team.js` to switch back).
- **Psychic Terrain archetype ("psyterrain"):** Indeedee + an Expanding Force user is recognized at team preview; Sneasler is left home if it's on the team; Claude gets the correct Psychic Terrain rule (blocks priority aimed at grounded foes only — Tailwind still works), plus accuracy/evasion, a balanced Protect rule (protect Drogon on turn 1 vs likely OHKOs) and "switch instead of Draco Meteor at −4".
- **Fixes:** the report and preview learning now record Claude's actual team-preview choice (before, a case-sensitivity bug credited wins/losses to the engine's suggested plan). Battles already in progress when the bot (re)starts are resumed properly instead of idling until they're lost.
- **Trick Room handling:** Claude's rules now explain that Trick Room reverses speed order (Tailwind/Scarf make us move later), how to beat it (Fake Out/KO the setter, Encore the setter right after it sets Trick Room to end it, burn turns, use slow bulk), and every turn's board summary shows the actual move order and Trick Room turns left. Team preview classifies Trick Room teams before weather teams (e.g. Indeedee-F + Armarouge + Torkoal is Trick Room, not sun) and starts Trick Room matchups from Mega Dragonite + Fake Out lead.
- **Full battle logs:** every battle's complete Showdown log is saved to `battlelogs/` (one file per battle, kept even if the replay upload fails), with the bot's own decisions interleaved as `|choice|<command>|<claude/engine>|<reason>` lines. Each report links its log, and the coach reads the turn-by-turn logs of the two most recent losses.
- **Thinking per role:** `claude.thinking` in config.json — `{"turn": 0, "preview": 0, "coach": 4000}`. `0` = off (fast, cheap), a number = extended thinking on with that token budget (billed as output tokens; `max_tokens` is raised automatically), `"adaptive"` = let the model decide if your deployment supports it. If the deployment rejects a thinking setting, the bot logs it once and continues with thinking off. Keep turns at 0 unless you raise `turnTimeoutMs` — thinking adds latency against the turn timer.
- **Reliability:** tolerant JSON parsing (extra text around the reply no longer causes a fallback) and one automatic retry on HTTP 429 rate limits within the turn timer.

**Upgrading from v3:** copy these files over your existing folder but **keep your `data/` folder** (that's the bot's memory). Delete `data/active_proposals.json` once — its "0.8 bulk multiplier" advice was a reaction to the Life Orb bug, which v4 fixes. Then run `setup.bat` / `./setup.sh` again (installs `@smogon/calc`).


Plays **[Gen 9 Champions] VGC 2026 Reg M-C** on the real Pokémon Showdown server as **JJ1NE**, headless (no browser), using the final Variant A team.

## Setup (once)
1. Install **Node.js 22 LTS** (https://nodejs.org) and **Git** (https://git-scm.com/download/win).
2. Unzip this folder somewhere (e.g. `C:\jj1ne-bot`).
3. Double-click **setup.bat** (downloads + builds the Showdown engine, ~2 minutes).

## Run
- **Close any browser tab using JJ1NE first** (Showdown won't let two connections share an unregistered name).
- Double-click **run.bat**. Stop with **Ctrl+C**, or create an empty file named `STOP` (stops after the current game).
- Watch live: open Showdown in a browser as a guest or JJBro1 → Find a user → JJ1NE.

## Pilots (`"pilot"` in config.json)
- **`claude`** — Claude Opus 5 via your Microsoft Foundry deployment makes every decision. Each turn it gets the full board plus the engine's top 8 candidate choices with exact damage ranges, and picks one (or writes its own legal choice). It also does team preview. Any timeout, error or invalid answer falls back to the engine pick instantly. Set `AZURE_CLAUDE_KEY` and the `claude` block in config.json — see **AZURE.md**.
- **`wolfe`** — the built-in engine pilot only (no API calls, free).

## Coach
With the Claude pilot, every `coachEvery` games Claude reviews the recent reports and writes `coach/<date>.md` plus `coach/proposals.jsonl` (suggested changes with evidence). Run it any time with `node coach.js`.

## Running 24/7 on Azure
See **AZURE.md** (Ubuntu VM + systemd service; Linux scripts `setup.sh` / `run.sh`). On Windows use `setup.bat` / `run.bat`; set the key first with `setx AZURE_CLAUDE_KEY "your-key"` and open a new window.

## How it decides
- **Damage:** Showdown's own engine damage formula, as a **full range** (min 85% roll → max roll, no crits) like the Smogon calc. KOs only count as guaranteed if the min roll kills; otherwise weighted by KO chance. Incoming threats are judged worst-case. Pokémon that will Mega Evolve this turn are evaluated in Mega form (with Drought sun etc.).
- **Opponent sets:** Open Team Sheets are accepted automatically → exact items/abilities/natures/moves; EVs come from the most common published spread. Without team sheets → the most common full set (item/ability/nature/moves/EVs) from the **VGCPastes Champions M-C repository (409 teams, 2,454 sets)** plus Limitless top-cut data (`setdb.json`), refined by what the bot has learned on ladder.
- **Battle rules:** WolfeyVGC-style — speed control, Protect discipline, focus fire without overkill, Fake Out targeting, Encore punishes, switch when threatened.

## What it learns (files in `data/` and `reports/`)
1. **Team-preview plans** (`data/learning_plans.json`): classifies each opponent (rain / sun / sand / snow / Trick Room / Raichu-Staraptor / standard) and learns which plan wins — Mega Charizard or Mega Dragonite, Tailwind or Fake Out lead — using Thompson sampling seeded with the simulation results (prior worth ~10 games, so ladder data takes over quickly).
2. **Opponent sets** (`data/learned_sets.json`): every move, item, ability and team sheet seen on ladder. After 3+ games of a species, ladder data outweighs the paste data (3×).
3. **Game reports** (`reports/*.md`): one per game — plan used, KO timeline, biggest hits, Tailwind turns, damage dealt per Pokémon, and every attack where the predicted damage range didn't match reality. `data/stats.json` keeps running totals (record by archetype and plan, who KOs us most, first-KO vs win rate, calc accuracy).

## Settings — config.json
| key | meaning |
|---|---|
| `username` | Showdown name (unregistered, no password) |
| `mode` | `ladder`, `challenge` (challenges `challengeUser`), or `accept` (accepts challenges) |
| `games` | games to play (0 = unlimited) |
| `acceptFrom` | accept mode: names to accept from (empty = anyone) |
| `delaySeconds` | pause between games |
| `saveReplays` | upload each replay |

## Send me
`results.csv`, the `data/` folder and the `reports/` folder — I'll analyse them and update the rules/team. Keep `data/` between runs: that's the bot's memory. Delete it to reset learning.

## Notes
- If the server refuses ladder for unregistered names, use `challenge`/`accept` mode or register JJ1NE.
- Damage predictions land inside the predicted range ~68% of the time in testing; most misses are spread moves hitting one target instead of two (or vice-versa) and guessed EVs.
- Edit `team.js` to change the team.
