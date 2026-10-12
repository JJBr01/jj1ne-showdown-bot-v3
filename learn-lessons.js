// Reads EVERY .txt in knowledge/VGC Lessons (all chunks, no truncation) and distills each into short, actionable rules.
// Output: knowledge/08-vgc-lessons.md (picked up by the preview + coach prompts). Resumable: finished files are skipped.
//   node learn-lessons.js          run / resume
//   node learn-lessons.js --dry    just list files and chunk counts (no API calls)
//   node learn-lessons.js --redo   ignore saved progress and start over
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const LLM = require('./llm.js');

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')).claude || {};
const DIR = path.join(__dirname, 'knowledge', 'VGC Lessons');
const OUT = path.join(__dirname, 'knowledge', '08-vgc-lessons.md');
const PROGRESS = path.join(__dirname, 'data', 'lessons_progress.json');
const CHUNK = 40000;
const dry = process.argv.includes('--dry');
const redo = process.argv.includes('--redo');

const SYSTEM = `You are extracting coaching knowledge from a transcript of a WolfeyVGC (Wolfe Glick) lesson, to help an AI pilot play Pokémon VGC doubles (Champions format: level 50, one Mega per battle).
Pull out only concrete, reusable, actionable principles — decision rules, thresholds, checklists, common mistakes, matchup-evaluation methods. Skip anecdotes, sponsor reads, greetings and tournament stories unless they teach a rule.
Each rule: one sentence, imperative, self-contained, no fluff. Quote nothing verbatim at length.
Reply with ONLY JSON: {"rules": ["...", "..."]} with at most 12 rules. If the excerpt has nothing useful, reply {"rules": []}.`;

function chunks(text) {
  const out = [];
  for (let i = 0; i < text.length; i += CHUNK) out.push(text.slice(i, i + CHUNK));
  return out;
}

(async () => {
  const files = fs.readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.txt')).sort();
  const seen = new Set();
  const todo = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(DIR, f), 'utf8');
    const hash = crypto.createHash('md5').update(text).digest('hex');
    if (seen.has(hash)) { console.log(`skip duplicate: ${f}`); continue; }
    seen.add(hash);
    todo.push({ f, text, hash });
  }
  console.log(`${todo.length} unique files, ${todo.reduce((n, t) => n + chunks(t.text).length, 0)} chunks total`);
  if (dry) { for (const t of todo) console.log(`  ${chunks(t.text).length} chunk(s)  ${t.text.length} chars  ${t.f}`); return; }

  let done = {};
  if (!redo) { try { done = JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); } catch (e) {} }
  else { try { fs.unlinkSync(OUT); } catch (e) {} }
  fs.mkdirSync(path.dirname(PROGRESS), { recursive: true });
  if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, '# VGC lessons (distilled from the full WolfeyVGC lesson files by learn-lessons.js)\n');

  let n = 0;
  for (const t of todo) {
    n++;
    if (done[t.hash]) { console.log(`[${n}/${todo.length}] already done: ${t.f}`); continue; }
    const parts = chunks(t.text);
    const rules = [];
    for (let i = 0; i < parts.length; i++) {
      process.stdout.write(`[${n}/${todo.length}] ${t.f} — part ${i + 1}/${parts.length} ... `);
      let got = null;
      for (let attempt = 1; attempt <= 3 && !got; attempt++) {
        try {
          const r = await LLM.callClaude({ ...CFG, thinking: { coach: 0 } }, {
            role: 'coach', system: SYSTEM, maxTokens: 1500, timeoutMs: 240000,
            user: `Lesson: ${t.f}\nExcerpt ${i + 1} of ${parts.length}:\n\n${parts[i]}`
          });
          got = (LLM.parseJSON(r.text).rules || []).map(x => String(x).trim()).filter(Boolean);
        } catch (e) { console.log(`\n  attempt ${attempt} failed: ${e.message.slice(0, 160)}`); }
      }
      if (!got) { console.log('GAVE UP on this part — rerun the script to retry this file.'); process.exit(1); }
      console.log(`${got.length} rules`);
      rules.push(...got);
    }
    const title = t.f.replace(/\.txt$/i, '').replace(/ _ (Patreon|WolfeyVGC on Patreon).*$/i, '').replace(/\[[^\]]*\]/g, '').trim();
    fs.appendFileSync(OUT, `\n## ${title}\n` + rules.map(r => '- ' + r).join('\n') + '\n');
    done[t.hash] = t.f;
    fs.writeFileSync(PROGRESS, JSON.stringify(done, null, 2));
  }
  console.log(`\nDone. Wrote ${OUT}`);
})().catch(e => { console.error('Failed:', e.message); process.exit(1); });
