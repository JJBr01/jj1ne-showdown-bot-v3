// web-tools.js — Web search & document fetching module for JJ1NE Showdown Bot & Coach
// Provides:
// 1. Google Sheets live fetching (converts public sheets to CSV / Markdown tables)
// 2. Web search via DuckDuckGo Lite (no API key required)
// 3. Pokepaste & URL content fetching

const fs = require('fs');
const path = require('path');

let SmogonCalc = null;
try { SmogonCalc = require('@smogon/calc'); } catch (e) { SmogonCalc = null; }
const calcGen = SmogonCalc ? SmogonCalc.Generations.get(9) : null;

const DOCS_DIR = path.join(__dirname, 'docs');
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

// Basic CSV parser that handles quotes and commas
function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (insideQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  if (currentField.length || currentRow.length) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}

// Format VGCPastes tournament sheets into dense, highly readable markdown
function formatVGCPastesSheet(rows, maxRows = 60) {
  let headerIdx = rows.findIndex(r => r.includes('Team ID'));
  if (headerIdx === -1) headerIdx = 0;
  const header = rows[headerIdx] || [];

  const idIdx = header.indexOf('Team ID');
  const nameIdx = header.indexOf('Full Name');
  const eventIdx = header.indexOf('Tournament / Event');
  const rankIdx = header.indexOf('Rank');
  const pasteIdx = header.indexOf('Pokepaste');
  const pokeIdx = header.indexOf('Pokemon Text for Copypasta');

  const countMap = {};
  const tableRows = [];

  const dataRows = rows.slice(headerIdx + 1);
  for (const r of dataRows) {
    if (!r || !r.length) continue;
    const teamId = idIdx !== -1 ? r[idIdx] : '';
    if (!teamId || !teamId.startsWith('MC')) continue;
    const player = nameIdx !== -1 ? r[nameIdx] : '';
    const event = eventIdx !== -1 ? r[eventIdx] : '';
    const rank = rankIdx !== -1 ? r[rankIdx] : '';
    const paste = pasteIdx !== -1 ? r[pasteIdx] : '';

    let mons = [];
    if (pokeIdx !== -1) {
      mons = r.slice(pokeIdx, pokeIdx + 6).filter(Boolean);
    }
    for (const m of mons) {
      countMap[m] = (countMap[m] || 0) + 1;
    }

    if (tableRows.length < maxRows) {
      tableRows.push({ teamId, player, event, rank, mons: mons.join(', '), paste });
    }
  }

  const topMons = Object.entries(countMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([m, cnt]) => `**${m}** (${cnt})`)
    .join(', ');

  const mdLines = [
    `### Meta Frequency in this Sheet (${dataRows.length} total entries):`,
    topMons || 'N/A',
    '',
    `| Team ID | Player | Tournament / Event | Placement | Pokémon Roster | Pokepaste |`,
    `| --- | --- | --- | --- | --- | --- |`
  ];

  for (const tr of tableRows) {
    mdLines.push(`| ${tr.teamId} | ${tr.player} | ${tr.event} | ${tr.rank} | ${tr.mons} | ${tr.paste} |`);
  }

  if (dataRows.length > maxRows) {
    mdLines.push(`\n*(Showing top ${maxRows} of ${dataRows.length} total entries)*`);
  }

  return mdLines.join('\n');
}

// Format generic sheets while pruning empty filler columns
function formatGenericSheet(rows, maxRows = 60, maxCols = 10) {
  if (!rows || !rows.length) return 'Empty spreadsheet.';

  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const nonEmpty = rows[i].filter(c => c && c.trim().length > 0).length;
    if (nonEmpty > 2) {
      headerIdx = i;
      break;
    }
  }

  const activeCols = [];
  const totalRows = Math.min(rows.length, 30);
  const numCols = Math.max(...rows.slice(headerIdx, totalRows).map(r => r.length));

  for (let c = 0; c < numCols; c++) {
    let filled = 0;
    for (let r = headerIdx; r < totalRows; r++) {
      if (rows[r] && rows[r][c] && rows[r][c].trim().length > 0) filled++;
    }
    if (filled > 0) {
      activeCols.push(c);
      if (activeCols.length >= maxCols) break;
    }
  }

  const selectedCols = activeCols.length ? activeCols : Array.from({ length: Math.min(8, numCols) }, (_, i) => i);
  const headerRow = rows[headerIdx] || [];
  const headers = selectedCols.map(c => (headerRow[c] || `Col_${c + 1}`).replace(/\|/g, '/').replace(/\r?\n/g, ' '));
  const divider = headers.map(() => '---');

  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${divider.join(' | ')} |`
  ];

  const dataRows = rows.slice(headerIdx + 1, headerIdx + 1 + maxRows);
  for (const row of dataRows) {
    const cells = selectedCols.map(c => ((row[c] || '').replace(/\|/g, '/').replace(/\r?\n/g, ' ')));
    if (cells.some(c => c.length > 0)) {
      lines.push(`| ${cells.join(' | ')} |`);
    }
  }

  if (rows.length > headerIdx + 1 + maxRows) {
    lines.push(`\n*(Showing ${maxRows} of ${rows.length - headerIdx - 1} rows)*`);
  }

  return lines.join('\n');
}

// Convert CSV rows into clean Markdown table
function rowsToMarkdown(rows, maxRows = 60) {
  if (!rows || !rows.length) return 'Empty spreadsheet.';
  const isVGC = rows.some(r => r.includes('Pokemon Text for Copypasta') || r.includes('Pokepaste') || r.includes('Team ID'));
  if (isVGC) {
    return formatVGCPastesSheet(rows, maxRows);
  }
  return formatGenericSheet(rows, maxRows);
}

/**
 * Fetch a Google Sheets link via the public CSV export endpoint
 * Works with any sheet shared as "Anyone with link can view"
 * Supports URLs with /d/<id>/, #gid=<tab>, or ?sheet=<name>
 */
async function fetchGoogleSheet(url, customName = null) {
  const m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) {
    throw new Error('Invalid Google Sheets URL (could not find /d/<sheet_id>/ in link)');
  }
  const sheetId = m[1];
  const gidM = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidM ? gidM[1] : null;
  const sheetM = url.match(/[&?]sheet=([^&#]+)/);
  const sheetName = sheetM ? decodeURIComponent(sheetM[1]) : null;

  let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  if (gid) csvUrl += `&gid=${gid}`;
  if (sheetName) csvUrl += `&sheet=${encodeURIComponent(sheetName)}`;

  const res = await fetch(csvUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  if (!res.ok) {
    throw new Error(`Google Sheets returned HTTP ${res.status}. Make sure the sheet is shared as "Anyone with link can view".`);
  }

  const csvText = await res.text();
  const rows = parseCSV(csvText);

  // Generate markdown representation
  const mdTable = rowsToMarkdown(rows);
  const title = customName || `Sheet_${sheetId.slice(0, 8)}${gid ? `_tab${gid}` : ''}`;
  const saveName = `${title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.md`;
  const savedPath = path.join(DOCS_DIR, saveName);

  const fullContent = `# Google Sheet: ${title}\nSource: ${url}\nFetched: ${new Date().toISOString()}\nTotal Rows: ${rows.length}\n\n${mdTable}\n`;
  fs.writeFileSync(savedPath, fullContent, 'utf8');

  return {
    title,
    sheetId,
    gid,
    rowsCount: rows.length,
    savedPath,
    saveName,
    markdown: fullContent,
    preview: mdTable
  };
}

/**
 * Live web search using DuckDuckGo Lite
 */
async function searchWeb(query, maxResults = 5) {
  const res = await fetch('https://lite.duckduckgo.com/lite/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    body: 'q=' + encodeURIComponent(query)
  });

  if (!res.ok) {
    throw new Error(`Search failed with HTTP ${res.status}`);
  }

  const html = await res.text();
  const results = [];
  const linkMatches = [...html.matchAll(/<a\s+[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi)];
  const snippetMatches = [...html.matchAll(/<td\s+[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi)];

  for (let i = 0; i < Math.min(linkMatches.length, maxResults); i++) {
    const fullTag = linkMatches[i][0];
    const title = linkMatches[i][1].replace(/<[^>]+>/g, '').trim();
    const hrefM = fullTag.match(/href=['"]([^'"]+)['"]/i);
    let link = hrefM ? hrefM[1] : '';
    if (link.includes('uddg=')) {
      try {
        link = decodeURIComponent(link.split('uddg=')[1].split('&')[0]);
      } catch (e) {}
    }
    const snippet = (snippetMatches[i] ? snippetMatches[i][1] : '').replace(/<[^>]+>/g, '').trim();
    if (title && link) {
      results.push({ title, snippet, link });
    }
  }

  return results;
}

/**
 * Fetch Pokepastes (pokepast.es) or standard web pages
 */
async function fetchWebPage(url) {
  // 1. Pokepaste handling
  const pokeM = url.match(/pokepast\.es\/([0-9a-f]+)/i);
  if (pokeM) {
    const id = pokeM[1];
    const jsonRes = await fetch(`https://pokepast.es/${id}/json`);
    if (jsonRes.ok) {
      const data = await jsonRes.json();
      const content = `# PokePaste: ${data.title || id}\nAuthor: ${data.author || 'Anonymous'}\nSource: ${url}\n\n\`\`\`\n${data.paste}\n\`\`\`\n`;
      const savePath = path.join(DOCS_DIR, `pokepaste_${id}.md`);
      fs.writeFileSync(savePath, content, 'utf8');
      return { title: data.title || id, type: 'pokepaste', content, savedPath: savePath };
    }
  }

  // 2. Standard web page
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) {
      return {
        title: 'Error',
        type: 'web',
        content: `Could not fetch ${url} (HTTP ${res.status}). The website may be blocking automated requests or requires authentication.`,
        savedPath: null
      };
    }

    const html = await res.text();
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : 'Web Page';

    // Strip script, style, html tags
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000);

    const saveName = `web_${Date.now()}.md`;
    const savePath = path.join(DOCS_DIR, saveName);
    const content = `# ${title}\nSource: ${url}\n\n${clean}\n`;
    fs.writeFileSync(savePath, content, 'utf8');

    return { title, type: 'web', content, savedPath: savePath };
  } catch (err) {
    return {
      title: 'Fetch Error',
      type: 'web',
      content: `Failed to fetch URL ${url}: ${err.message}`,
      savedPath: null
    };
  }
}

const VGC_SHEET_ID = '1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw';

/**
 * Directly fetch the live official VGCPastes Google Spreadsheet repository
 */
async function fetchLiveVGCPastes(sheet = 'Champions M-C') {
  const url = `https://docs.google.com/spreadsheets/d/${VGC_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching VGCPastes live sheet`);
  const text = await res.text();
  const rows = parseCSV(text);
  const mdTable = rowsToMarkdown(rows, 60);
  const savePath = path.join(DOCS_DIR, `vgcpastes_live_${sheet.replace(/[^a-z0-9]/gi, '_')}.md`);
  const fullContent = `# Live VGCPastes: ${sheet}\nFetched: ${new Date().toISOString()}\nTotal Rows: ${rows.length}\nSource: https://docs.google.com/spreadsheets/d/${VGC_SHEET_ID}/\n\n${mdTable}\n`;
  fs.writeFileSync(savePath, fullContent, 'utf8');
  return {
    sheet,
    rowsCount: rows.length,
    savedPath: savePath,
    markdown: fullContent,
    preview: mdTable
  };
}
let NCP_SETS = null;
function getNcpSets() {
  if (NCP_SETS) return NCP_SETS;
  try {
    const f = path.join(__dirname, 'tools', 'ncp-calc', 'script_res', 'setdex_ncp-g10.js');
    if (fs.existsSync(f)) {
      const code = fs.readFileSync(f, 'utf8');
      const box = {};
      const fn = new Function('box', code + '\nbox.SETDEX_GEN10 = SETDEX_GEN10;');
      fn(box);
      NCP_SETS = box.SETDEX_GEN10 || {};
      return NCP_SETS;
    }
  } catch(e) {}
  NCP_SETS = {};
  return NCP_SETS;
}

// Smogon Damage Calculator Runner
function runDamageCalc(opts = {}) {
  if (!SmogonCalc || !calcGen) {
    return { error: '@smogon/calc package is not installed or available.' };
  }
  try {
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizeStatKey = (k) => {
      const s = (k || '').toLowerCase().trim();
      if (s === 'hp') return 'hp';
      if (s === 'at' || s === 'atk' || s === 'attack') return 'atk';
      if (s === 'df' || s === 'def' || s === 'defense') return 'def';
      if (s === 'sa' || s === 'spa' || s === 'spatk' || s === 'specialattack') return 'spa';
      if (s === 'sd' || s === 'spd' || s === 'spdef' || s === 'specialdefense') return 'spd';
      if (s === 'sp' || s === 'spe' || s === 'speed') return 'spe';
      return s;
    };

    const sp2ev = (spObj) => {
      if (!spObj) return {};
      const evs = {};
      for (const [k, v] of Object.entries(spObj)) {
        evs[normalizeStatKey(k)] = Math.min(252, Math.max(0, (v | 0) * 8));
      }
      return evs;
    };

    const normalizeEvObj = (obj) => {
      if (!obj) return null;
      const evs = {};
      for (const [k, v] of Object.entries(obj)) {
        evs[normalizeStatKey(k)] = Math.min(252, Math.max(0, (v | 0)));
      }
      return evs;
    };

    const resolveSpecies = (spc, item) => {
      let n = (spc || '').trim();
      const ni = norm(item);
      if (norm(n) === 'charizard' && (ni === 'charizarditey' || ni === 'charizardite')) return 'Charizard-Mega-Y';
      if (norm(n) === 'dragonite' && ni === 'dragoninite') return 'Dragonite-Mega';
      if (norm(n) === 'drogon' || norm(n) === 'zardy' || norm(n) === 'charizardy' || norm(n) === 'charizardmegay') return 'Charizard-Mega-Y';
      if (norm(n) === 'dnite' || norm(n) === 'megadnite' || norm(n) === 'megadragonite' || norm(n) === 'dragonitemega') return 'Dragonite-Mega';
      if (norm(n) === 'floette' && ni === 'floettite') return 'Floette-Mega';
      if (norm(n) === 'floettemega' || norm(n) === 'floetteeternal' || norm(n) === 'floetteeternalmega' || norm(n) === 'floettee') return 'Floette-Mega';
      if (norm(n) === 'chomp' || norm(n) === 'scarfchomp') return 'Garchomp';
      if (norm(n) === 'garchompmegaz' || norm(n) === 'megagarchompz') return 'Garchomp-Mega-Z';
      if (norm(n) === 'lucariomegaz' || norm(n) === 'megalucarioz') return 'Lucario-Mega-Z';
      if (norm(n) === 'baxcaliburmega' || norm(n) === 'megabaxcalibur') return 'Baxcalibur-Mega';
      if (norm(n) === 'salamencemega' || norm(n) === 'megasalamence') return 'Salamence-Mega';
      if (norm(n) === 'golisopodmega' || norm(n) === 'megagolisopod') return 'Golisopod-Mega';
      if (norm(n) === 'gambit' || norm(n) === 'king') return 'Kingambit';
      if (norm(n) === 'milo') return 'Milotic';
      if (norm(n) === 'whims') return 'Whimsicott';
      if (norm(n) === 'incin') return 'Incineroar';
      if (norm(n) === 'rilla') return 'Rillaboom';
      if (norm(n) === 'arcanineh' || norm(n) === 'harcanine' || norm(n) === 'hisuiarcanine') return 'Arcanine-Hisui';
      return n;
    };

    const atkObj = opts.attacker || {};
    const defObj = opts.defender || {};
    const fieldObj = opts.field || {};

    const aSpecies = resolveSpecies(atkObj.species || opts.attackerSpecies || opts.attackerName || 'Charizard-Mega-Y', atkObj.item);
    const dSpecies = resolveSpecies(defObj.species || opts.defenderSpecies || opts.defenderName || 'Rillaboom', defObj.item);

    const moveName = opts.move || opts.moveName || 'Heat Wave';
    const move = new SmogonCalc.Move(calcGen, moveName);
    const isPhys = move.category === 'Physical';

    const ncp = getNcpSets();
    const aPreset = ncp[aSpecies] ? Object.values(ncp[aSpecies])[0] : null;
    let aEvs = normalizeEvObj(atkObj.evs) || (atkObj.sp ? sp2ev(atkObj.sp) : null);
    let aItem = atkObj.item || (aSpecies === 'Charizard-Mega-Y' ? 'Charizardite Y' : (aSpecies === 'Dragonite-Mega' ? 'Dragoninite' : (aSpecies === 'Floette-Mega' ? 'Floettite' : undefined)));
    let aNature = atkObj.nature;
    let aAbility = atkObj.ability;

    if (!aEvs && aPreset && (aPreset.sps || aPreset.evs)) {
      const sps = aPreset.sps || {};
      const evs = aPreset.evs || {};
      aEvs = {
        hp: sps.hp !== undefined ? (sps.hp * 8) : (evs.hp || 0),
        atk: (sps.at !== undefined ? (sps.at * 8) : (sps.atk !== undefined ? (sps.atk * 8) : (evs.atk || evs.at || 0))),
        def: (sps.df !== undefined ? (sps.df * 8) : (sps.def !== undefined ? (sps.def * 8) : (evs.def || evs.df || 0))),
        spa: (sps.sa !== undefined ? (sps.sa * 8) : (sps.spa !== undefined ? (sps.spa * 8) : (evs.spa || evs.sa || 0))),
        spd: (sps.sd !== undefined ? (sps.sd * 8) : (sps.spd !== undefined ? (sps.spd * 8) : (evs.spd || evs.sd || 0))),
        spe: (sps.sp !== undefined ? (sps.sp * 8) : (sps.spe !== undefined ? (sps.spe * 8) : (evs.spe || evs.sp || 0)))
      };
      if (!aItem && aPreset.item) aItem = aPreset.item;
      if (!aNature && aPreset.nature) aNature = aPreset.nature;
      if (!aAbility && aPreset.ability) aAbility = aPreset.ability;
    } else if (!aEvs) {
      aEvs = isPhys ? { atk: 252, spe: 252 } : { spa: 252, spe: 252 };
    }
    if (!aNature) aNature = isPhys ? 'Jolly' : 'Modest';

    const dPreset = ncp[dSpecies] ? Object.values(ncp[dSpecies])[0] : null;
    let dEvs = normalizeEvObj(defObj.evs) || (defObj.sp ? sp2ev(defObj.sp) : null);
    let dItem = defObj.item;
    let dNature = defObj.nature;
    let dAbility = defObj.ability;

    if (!dEvs && dPreset && (dPreset.sps || dPreset.evs)) {
      const sps = dPreset.sps || {};
      const evs = dPreset.evs || {};
      dEvs = {
        hp: sps.hp !== undefined ? (sps.hp * 8) : (evs.hp || 0),
        atk: (sps.at !== undefined ? (sps.at * 8) : (sps.atk !== undefined ? (sps.atk * 8) : (evs.atk || evs.at || 0))),
        def: (sps.df !== undefined ? (sps.df * 8) : (sps.def !== undefined ? (sps.def * 8) : (evs.def || evs.df || 0))),
        spa: (sps.sa !== undefined ? (sps.sa * 8) : (sps.spa !== undefined ? (sps.spa * 8) : (evs.spa || evs.sa || 0))),
        spd: (sps.sd !== undefined ? (sps.sd * 8) : (sps.spd !== undefined ? (sps.spd * 8) : (evs.spd || evs.sd || 0))),
        spe: (sps.sp !== undefined ? (sps.sp * 8) : (sps.spe !== undefined ? (sps.spe * 8) : (evs.spe || evs.sp || 0)))
      };
      if (!dItem && dPreset.item) dItem = dPreset.item;
      if (!dNature && dPreset.nature) dNature = dPreset.nature;
      if (!dAbility && dPreset.ability) dAbility = dPreset.ability;
    } else if (!dEvs) {
      dEvs = { hp: 252, def: 4, spd: 4 };
    }
    if (!dNature) dNature = 'Adamant';

    const level = opts.level || atkObj.level || defObj.level || 50;

    let autoWeather = fieldObj.weather;
    if (!autoWeather) {
      if (aSpecies === 'Charizard-Mega-Y' || aAbility === 'Drought' || dSpecies === 'Charizard-Mega-Y' || dAbility === 'Drought') autoWeather = 'Sun';
      else if (aSpecies === 'Pelipper' || aSpecies === 'Politoed' || aSpecies === 'Kyogre' || aAbility === 'Drizzle') autoWeather = 'Rain';
      else if (aSpecies === 'Tyranitar' || aSpecies === 'Hippowdon' || aAbility === 'Sand Stream') autoWeather = 'Sand';
      else if (aSpecies === 'Abomasnow' || aSpecies === 'Ninetales-Alola' || aAbility === 'Snow Warning') autoWeather = 'Snow';
    }

    let autoTerrain = fieldObj.terrain;
    if (!autoTerrain) {
      if (aSpecies === 'Rillaboom' || dSpecies === 'Rillaboom' || aAbility === 'Grassy Surge') autoTerrain = 'Grassy';
      else if (aSpecies === 'Indeedee' || aSpecies === 'Indeedee-F' || dSpecies === 'Indeedee' || aAbility === 'Psychic Surge') autoTerrain = 'Psychic';
      else if (aSpecies === 'Miraidon' || aAbility === 'Hadron Engine') autoTerrain = 'Electric';
    }

    const p1 = new SmogonCalc.Pokemon(calcGen, aSpecies, {
      level,
      nature: aNature,
      item: aItem,
      ability: aAbility,
      evs: aEvs,
      boosts: atkObj.boosts || {}
    });

    const p2 = new SmogonCalc.Pokemon(calcGen, dSpecies, {
      level,
      nature: dNature,
      item: dItem,
      ability: dAbility,
      evs: dEvs,
      boosts: defObj.boosts || {},
      curHP: defObj.curHP || undefined
    });

    const field = new SmogonCalc.Field({
      gameType: fieldObj.isDoubles === false ? 'Singles' : 'Doubles',
      weather: autoWeather || undefined,
      terrain: autoTerrain || undefined,
      attackerSide: {
        isTailwind: !!(fieldObj.attackerSide && fieldObj.attackerSide.isTailwind)
      },
      defenderSide: {
        isReflect: !!(fieldObj.defenderSide && fieldObj.defenderSide.isReflect),
        isLightScreen: !!(fieldObj.defenderSide && fieldObj.defenderSide.isLightScreen),
        isAuroraVeil: !!(fieldObj.defenderSide && fieldObj.defenderSide.isAuroraVeil),
        isTailwind: !!(fieldObj.defenderSide && fieldObj.defenderSide.isTailwind)
      }
    });

    const res = SmogonCalc.calculate(calcGen, p1, p2, move, field);
    const desc = res.desc();
    const damage = res.damage;
    const rolls = Array.isArray(damage) ? (Array.isArray(damage[0]) ? damage.map(x => x.reduce((a, b) => a + b, 0)) : damage) : [damage];
    const minDmg = Math.min(...rolls);
    const maxDmg = Math.max(...rolls);
    const maxHP = p2.maxHP();
    const minPct = (minDmg / maxHP * 100).toFixed(1);
    const maxPct = (maxDmg / maxHP * 100).toFixed(1);

    return {
      description: desc,
      minDamage: minDmg,
      maxDamage: maxDmg,
      percentage: `${minPct}% - ${maxPct}%`,
      rolls
    };
  } catch (err) {
    return { error: `Damage calculation error: ${err.message}` };
  }
}

const TOOLS_DEFINITION = [
  {
    name: 'search_web',
    description: 'Searches the live web for current Pokemon VGC information, tournament results, meta trends, player strategies, articles, or team pastes.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query to search the live web for' }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch_google_sheet',
    description: 'Fetches and parses live data from ANY Google Sheets link (e.g. tournament sheets, team sheets, paste repos). Automatically converts to structured tables.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full Google Sheets URL' },
        sheetName: { type: 'string', description: 'Optional tab name to read' }
      },
      required: ['url']
    }
  },
  {
    name: 'fetch_live_vgcpastes',
    description: 'Directly fetches the latest live data from the official VGCPastes Google Spreadsheet repository (sheet ID: 1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw).',
    input_schema: {
      type: 'object',
      properties: {
        sheet: { type: 'string', description: "Tab name (defaults to 'Champions M-C')" }
      }
    }
  },
  {
    name: 'fetch_url',
    description: 'Fetches live webpage content, Pokepaste (pokepast.es), Smogon page, or tournament article from a URL.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to fetch' }
      },
      required: ['url']
    }
  },
  {
    name: 'create_file',
    description: 'Creates or updates a file directly in the bot project directory (e.g. "team-dual-mega.js", "docs/my-notes.md", "tactics.js"). Automatically creates parent folders if needed.',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relative path of the file from project root (e.g. "team-dual-mega.js", "docs/analysis.md")' },
        content: { type: 'string', description: 'The complete text / code content to write to the file' }
      },
      required: ['filePath', 'content']
    }
  },
  {
    name: 'append_coach_notes',
    description: 'Appends tactical coaching lessons or strategic rules directly to the persistent coaching file (knowledge/05-coach-notes.md) so they are referenced by the pilot in real battles.',
    input_schema: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'The coaching notes or rules to append' }
      },
      required: ['notes']
    }
  },
  {
    name: 'read_project_file',
    description: 'Reads any file directly from the bot project directory (e.g. "team.js", "tactics.js", "config.json", "knowledge/05-coach-notes.md").',
    input_schema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Relative path of the file to read' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'list_project_files',
    description: 'Lists files in the project folder or a subfolder (e.g. "docs", "knowledge", "data", ".").',
    input_schema: {
      type: 'object',
      properties: {
        dirPath: { type: 'string', description: 'Relative directory path (defaults to ".")' }
      }
    }
  },
  {
    name: 'make_and_switch_team',
    description: 'Creates a new team variant file (e.g. "team-rain-offense.js"), registers it with the bot\'s variant manager, backs up "team.js", and immediately activates it so the bot plays this roster.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Unique variant identifier name (e.g. "lifeorb_garchomp", "anti_rain", "hyper_sun")' },
        teamText: { type: 'string', description: 'The complete Pokémon team paste (in Pokémon Showdown import/export format or JS code)' },
        description: { type: 'string', description: 'Description of the team strategy, core, and items' },
        activate: { type: 'boolean', description: 'Whether to immediately switch the bot to this variant (defaults to true)' },
        updateTeamJs: { type: 'boolean', description: 'Whether to also back up team.js and update it with this team (defaults to true)' }
      },
      required: ['name', 'teamText']
    }
  },
  {
    name: 'switch_team_variant',
    description: 'Switches the active team variant played by the bot. Can switch to any registered variant, or dynamically register and switch to any team file (e.g. "team-garchomp-lifeorb.js", "team-dual-mega.js", "team-core-antipsy.js"). Automatically backs up and syncs team.js.',
    input_schema: {
      type: 'object',
      properties: {
        variant: { type: 'string', description: 'Name of the variant or team filename to switch to (e.g. "lifeorb_garchomp", "team-garchomp-lifeorb.js", "dual_mega")' },
        reason: { type: 'string', description: 'Reason for switching the active variant' },
        updateTeamJs: { type: 'boolean', description: 'Whether to also back up and update team.js (defaults to true)' }
      },
      required: ['variant']
    }
  },
  {
    name: 'list_team_variants',
    description: 'Lists all available team variant files in the project, registered variants, win rates, and current active team.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'run_bot_battles',
    description: 'Starts autonomous Showdown ladder battles in the background using the active team. Spawns "node bot.js <games>" and reports battle initiation and status.',
    input_schema: {
      type: 'object',
      properties: {
        games: { type: 'number', description: 'Number of battles to play (defaults to 10)' },
        variant: { type: 'string', description: 'Optional variant to activate before starting battles' }
      }
    }
  },
  {
    name: 'update_bot_config',
    description: 'Updates settings in "config.json" (e.g. coachEvery, games, mode, pilot). Automatically creates a backup of config.json.',
    input_schema: {
      type: 'object',
      properties: {
        coachEvery: { type: 'number', description: 'Run coach review every N games (e.g. 1, 5, 10)' },
        games: { type: 'number', description: 'Default number of games to play per session' },
        mode: { type: 'string', description: '"ladder" or "challenge"' },
        pilot: { type: 'string', description: '"claude" or "wolfe"' }
      }
    }
  },
  {
    name: 'calculate_damage',
    description: 'Runs precise Pokémon Champions (Regulation M-C, Level 50, Stat Points 0–32, max 66, 1 Mega Evolution, Doubles spread reduction) damage calculations using the Nerd-of-Now Champions dataset and formulas. Computes exact rolls, percentage ranges, and OHKO/2HKO probabilities.',
    input_schema: {
      type: 'object',
      properties: {
        attacker: {
          type: 'object',
          description: 'Attacker details: species (e.g. "Charizard-Mega-Y", "Dragonite-Mega", "Kingambit", "Floette-Mega"), item, nature, ability, sp (Stat Points 0-32: hp, atk, def, spa, spd, spe) or evs, boosts',
          properties: {
            species: { type: 'string' },
            item: { type: 'string' },
            nature: { type: 'string' },
            ability: { type: 'string' },
            sp: { type: 'object' },
            evs: { type: 'object' },
            boosts: { type: 'object' }
          },
          required: ['species']
        },
        defender: {
          type: 'object',
          description: 'Defender details: species (e.g. "Rillaboom", "Dragonite-Mega", "Incineroar", "Floette-Mega"), item, nature, ability, sp (Stat Points 0-32: hp, atk, def, spa, spd, spe) or evs, boosts, curHP',
          properties: {
            species: { type: 'string' },
            item: { type: 'string' },
            nature: { type: 'string' },
            ability: { type: 'string' },
            sp: { type: 'object' },
            evs: { type: 'object' },
            boosts: { type: 'object' },
            curHP: { type: 'number' }
          },
          required: ['species']
        },
        move: { type: 'string', description: 'Name of the move (e.g. "Heat Wave", "Weather Ball", "Dragon Pulse", "Sucker Punch", "Wood Hammer", "Close Combat")' },
        field: {
          type: 'object',
          description: 'Field conditions: weather ("Sun", "Rain", "Sand", "Snow"), terrain ("Electric", "Grassy", "Psychic", "Misty"), isDoubles (boolean, defaults to true)',
          properties: {
            weather: { type: 'string' },
            terrain: { type: 'string' },
            isDoubles: { type: 'boolean' }
          }
        }
      },
      required: ['attacker', 'defender', 'move']
    }
  }
];

async function executeTool(toolCall) {
  const { name, input = {} } = toolCall;
  try {
    if (name === 'search_web') {
      const results = await searchWeb(input.query || '', 5);
      if (!results.length) return 'No web results found.';
      return JSON.stringify(results, null, 2);
    }
    if (name === 'fetch_google_sheet') {
      const sheet = await fetchGoogleSheet(input.url, input.sheetName);
      return `[Google Sheet "${sheet.title}" fetched (${sheet.rowsCount} rows)]\n\n${sheet.markdown.slice(0, 8000)}`;
    }
    if (name === 'fetch_live_vgcpastes') {
      const sheet = await fetchLiveVGCPastes(input.sheet || 'Champions M-C');
      return `[Live VGCPastes "${sheet.sheet}" fetched (${sheet.rowsCount} rows)]\n\n${sheet.markdown.slice(0, 8000)}`;
    }
    if (name === 'fetch_url') {
      const doc = await fetchWebPage(input.url);
      return `[Webpage "${doc.title}" fetched]\n\n${doc.content.slice(0, 8000)}`;
    }
    if (name === 'create_file' || name === 'write_file' || name === 'update_file') {
      const targetPath = input.filePath || input.file_path || input.filename || input.path;
      if (!targetPath) {
        return `Error: ${name} requires a "filePath" argument.`;
      }
      const rawContent = input.content !== undefined ? input.content : (input.code !== undefined ? input.code : (input.text !== undefined ? input.text : input.data));
      if (rawContent === undefined || rawContent === null) {
        return `Error: ${name} requires a "content" string. Please provide the file content to write to "${targetPath}".`;
      }
      const content = String(rawContent);
      const fullPath = path.resolve(__dirname, targetPath);
      if (!fullPath.startsWith(path.resolve(__dirname))) {
        return `Error: Cannot write outside the project root directory.`;
      }
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // Automatically backup critical files before modifying
      let backupMsg = '';
      if (fs.existsSync(fullPath)) {
        const base = path.basename(fullPath);
        if (base === 'team.js' || base === 'tactics.js' || base === 'config.json') {
          const backupDir = path.join(__dirname, 'data', 'backups');
          if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          fs.copyFileSync(fullPath, path.join(backupDir, `${base}-${ts}`));
          fs.copyFileSync(fullPath, path.join(__dirname, `${base}.backup`));
          backupMsg = ` (Backup saved to "${base}.backup")`;
        }
      }

      fs.writeFileSync(fullPath, content, 'utf8');
      return `Successfully created/updated file "${targetPath}" (${Buffer.byteLength(content, 'utf8')} bytes)${backupMsg}.`;
    }
    if (name === 'make_and_switch_team') {
      const Exp = require('./experiments.js');
      const teamName = input.name || input.variant;
      const teamText = input.teamText || input.content || input.paste || input.team;
      if (!teamName || !teamText) {
        return 'Error: make_and_switch_team requires both "name" and "teamText".';
      }
      const res = Exp.createAndSwitchTeam(teamName, teamText, input.description || '', {
        activate: input.activate !== false,
        updateTeamJs: input.updateTeamJs !== false,
        reason: input.reason || 'Created and activated via AI Coach'
      });
      if (!res.success) {
        return `Error creating team: ${res.error}`;
      }
      return `[Team Successfully Created & Registered]
Variant Name: "${res.variant}"
Saved File: "${res.file}"
Total Pokémon: ${res.pokemonCount} (${res.roster.join(', ')})
Active Loadout: ${res.active ? `"${res.variant}" (Active)` : 'Registered (Inactive)'}
team.js: ${input.updateTeamJs !== false ? 'Safely backed up and synchronized with this roster' : 'Unchanged'}

The bot will now pilot this roster in Showdown ladder matches.`;
    }
    if (name === 'append_coach_notes') {
      const noteContent = input.notes || input.note || input.content || input.text;
      if (!noteContent) return `Error: append_coach_notes requires a "notes" string.`;
      const kf = path.join(__dirname, 'knowledge', '05-coach-notes.md');
      const kDir = path.dirname(kf);
      if (!fs.existsSync(kDir)) fs.mkdirSync(kDir, { recursive: true });
      let existing = '';
      if (fs.existsSync(kf)) existing = fs.readFileSync(kf, 'utf8');
      else existing = '# Coach notes (written automatically after reviews; most recent last)\n';
      
      const newNotes = String(noteContent).trim();
      const updated = existing.trimEnd() + '\n' + newNotes + '\n';
      fs.writeFileSync(kf, updated, 'utf8');
      return `Successfully appended notes to "knowledge/05-coach-notes.md". The pilot and coach will now reference these rules in upcoming battles.`;
    }
    if (name === 'read_project_file') {
      const targetPath = input.filePath || input.file_path || input.filename || input.path;
      if (!targetPath) return `Error: read_project_file requires a "filePath" argument.`;
      const fullPath = path.resolve(__dirname, targetPath);
      if (!fullPath.startsWith(path.resolve(__dirname))) {
        return `Error: Cannot read outside the project root directory.`;
      }
      if (!fs.existsSync(fullPath)) {
        return `Error: File "${targetPath}" does not exist.`;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      return `[File "${targetPath}" (${content.length} chars)]:\n\n${content.slice(0, 10000)}`;
    }
    if (name === 'list_project_files') {
      const relDir = input.dirPath || '.';
      const fullPath = path.resolve(__dirname, relDir);
      if (!fullPath.startsWith(path.resolve(__dirname))) {
        return `Error: Cannot list outside the project root directory.`;
      }
      if (!fs.existsSync(fullPath)) return `Error: Directory "${relDir}" does not exist.`;
      const files = fs.readdirSync(fullPath, { withFileTypes: true }).map(d => (d.isDirectory() ? d.name + '/' : d.name));
      return `Files in "${relDir}":\n` + files.join('\n');
    }
    if (name === 'list_team_variants') {
      const Exp = require('./experiments.js');
      const all = Exp.listAllVariants();
      const active = Exp.getActiveVariant();
      const lines = [`Current Active Variant: [${active}]\nAvailable Variants & Team Files:`];
      for (const v of all) {
        const marker = v.isActive ? '--> (ACTIVE)' : '   ';
        lines.push(`${marker} ${v.id}: ${v.description} [Record: ${v.wins}W-${v.games - v.wins}L, ${v.winRate}]`);
      }
      return lines.join('\n');
    }
    if (name === 'switch_team_variant') {
      const Exp = require('./experiments.js');
      const variant = input.variant || input.name;
      const updateTeamJs = input.updateTeamJs !== false;
      const ok = Exp.switchVariant(variant, input.reason || 'Requested via AI Coach', { updateTeamJs });
      if (ok) {
        const active = Exp.getActiveVariant();
        return `Successfully switched active team variant to "${active}".
"team.js" has been safely backed up and updated with this roster.
The bot will now pilot this loadout in ladder matches.`;
      } else {
        const state = Exp.getExperimentsSummary();
        return `Could not switch to variant "${variant}".
Current status:
${state}`;
      }
    }
    if (name === 'run_bot_battles' || name === 'start_bot') {
      const Exp = require('./experiments.js');
      if (input.variant) {
        Exp.switchVariant(input.variant, 'Pre-battle variant selection');
      }
      const numGames = typeof input.games === 'number' ? input.games : parseInt(input.games, 10) || 10;
      const { spawn } = require('child_process');

      let alreadyRunning = false;
      try {
        const { execSync } = require('child_process');
        const out = execSync('Get-CimInstance Win32_Process -Filter "name = \'node.exe\'" | Select-Object CommandLine', { shell: 'powershell', encoding: 'utf8' });
        if (out.includes('bot.js')) alreadyRunning = true;
      } catch (e) {}

      if (alreadyRunning) {
        return `Showdown bot is already actively playing ladder battles in the background. Output is being logged to "bot.log". Current active loadout is [${Exp.getActiveVariant()}].`;
      }

      const logFile = path.join(__dirname, 'bot.log');
      const outFd = fs.openSync(logFile, 'a');
      const child = spawn(process.execPath, [path.join(__dirname, 'bot.js'), String(numGames)], {
        cwd: __dirname,
        detached: true,
        stdio: ['ignore', outFd, outFd]
      });
      child.unref();

      return `[Showdown Bot Launched Successfully]
Process ID: ${child.pid}
Battles Scheduled: ${numGames}
Active Team Loadout: "${Exp.getActiveVariant()}"
Log Output: "bot.log"
Results File: "results.csv"

The bot is now searching the ladder and playing matches autonomously. You can monitor progress in "bot.log" or review "results.csv".`;
    }
    if (name === 'update_bot_config') {
      const cfgPath = path.join(__dirname, 'config.json');
      let cfg = {};
      try {
        cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      } catch (e) {
        return `Error reading config.json: ${e.message}`;
      }

      const backupDir = path.join(__dirname, 'data', 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(path.join(backupDir, `config-${Date.now()}.json`), JSON.stringify(cfg, null, 2), 'utf8');

      const changes = [];
      if (input.coachEvery !== undefined) {
        changes.push(`coachEvery: ${cfg.coachEvery} -> ${input.coachEvery}`);
        cfg.coachEvery = Number(input.coachEvery);
      }
      if (input.games !== undefined) {
        changes.push(`games: ${cfg.games} -> ${input.games}`);
        cfg.games = Number(input.games);
      }
      if (input.mode !== undefined) {
        changes.push(`mode: "${cfg.mode}" -> "${input.mode}"`);
        cfg.mode = String(input.mode);
      }
      if (input.pilot !== undefined) {
        changes.push(`pilot: "${cfg.pilot}" -> "${input.pilot}"`);
        cfg.pilot = String(input.pilot);
      }

      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
      return `[Config Updated Successfully]
${changes.join('\n')}
Saved to "config.json" (backup created).`;
    }
    if (name === 'calculate_damage') {
      const calcResult = runDamageCalc(input);
      if (calcResult.error) return `Calculation error: ${calcResult.error}`;
      return `[Pokémon Champions Reg M-C Damage Result (Nerd-of-Now Ruleset)]\n${calcResult.description}\nMin Damage: ${calcResult.minDamage} | Max Damage: ${calcResult.maxDamage} (${calcResult.percentage})\nRolls (16): [${calcResult.rolls.join(', ')}]`;
    }
    return `Unknown tool: ${name}`;
  } catch (err) {
    return `Error executing tool ${name}: ${err.message}`;
  }
}

module.exports = {
  fetchGoogleSheet,
  fetchLiveVGCPastes,
  searchWeb,
  fetchWebPage,
  parseCSV,
  rowsToMarkdown,
  runDamageCalc,
  TOOLS_DEFINITION,
  executeTool
};
