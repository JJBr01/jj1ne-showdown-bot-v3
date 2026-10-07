const fs = require('fs');
const path = require('path');
const Exp = require('../experiments.js');

function getLadderStats() {
  const csvPath = path.join(__dirname, '../results.csv');
  if (!fs.existsSync(csvPath)) return { total: 0, w: 0, l: 0, archetypes: {} };
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
  let w = 0, l = 0;
  const archs = {};
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 4) continue;
    const res = parts[3];
    const arch = parts[5] || 'unknown';
    if (res === 'W') w++;
    else if (res === 'L') l++;
    archs[arch] = archs[arch] || { w: 0, l: 0 };
    if (res === 'W') archs[arch].w++;
    else if (res === 'L') archs[arch].l++;
  }
  return { total: w + l, w, l, rate: (w + l > 0 ? (w / (w + l) * 100).toFixed(1) : '0.0'), archetypes: archs };
}

function getLastBattleInfo() { return null; }

// Test the logic from chat.js
const stats = getLadderStats();
const activeVariant = Exp.getActiveVariant();
const teamText = Exp.getActiveTeamText();
const lastBattle = getLastBattleInfo();

let coachNotes = '';
try {
  const kf = path.join(__dirname, '../knowledge', '05-coach-notes.md');
  if (fs.existsSync(kf)) coachNotes = fs.readFileSync(kf, 'utf8').slice(-1200);
} catch (e) {}

let teamPerf = '';
try {
  const pf = path.join(__dirname, '../data', 'team_performance.json');
  if (fs.existsSync(pf)) teamPerf = fs.readFileSync(pf, 'utf8').slice(0, 1000);
} catch (e) {}

let projectDocs = '';
const vgcDoc = path.join(__dirname, '../data', 'vgcpastes_mc.txt');
if (fs.existsSync(vgcDoc)) {
  try {
    const topMeta = fs.readFileSync(vgcDoc, 'utf8').trim().split('\n').slice(0, 15).join('\n');
    projectDocs += `\n\nMETAGAME CONTEXT (Top 15 Meta Pokemon from data/vgcpastes_mc.txt):\n${topMeta}`;
  } catch(e) {}
}
const docsDir = path.join(__dirname, '../docs');
if (fs.existsSync(docsDir)) {
  try {
    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
    if (docFiles.length > 0) {
      projectDocs += `\n\nAVAILABLE PROJECT DOCUMENTS IN docs/ (${docFiles.length} files — call read_project_file to inspect any doc):\n${docFiles.join(', ')}`;
    }
  } catch(e) {}
}

const totalChars = (teamText + coachNotes + teamPerf + projectDocs).length + 3000;
console.log('New System Prompt Size:', totalChars, 'characters');
console.log('Approximate Tokens:', Math.round(totalChars / 3.8));
