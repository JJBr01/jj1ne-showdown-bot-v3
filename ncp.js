// Nerd of Now's VGC Damage Calculator (tools/ncp-calc, Champions mode = "gen 10") running headless in Node.
// The calculator is browser code, so its data + damage scripts are loaded into a vm sandbox with a no-op jQuery stub,
// and the DOM-built Pokemon/Field objects it normally reads are constructed directly from the bot's battle state.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = path.join(__dirname, 'tools', 'ncp-calc', 'script_res');
const FILES = ['stat_data.js', 'type_data.js', 'nature_data.js', 'ability_data.js', 'item_data.js', 'move_data.js', 'pokedex.js',
  'damage_MASTER.js', 'damage_SV.js'];

let ctx = null, loadError = null;
function stub() {
  // No-op jQuery result: reads of page state come back empty (val -> undefined, prop/is -> false, text -> '', length -> 0)
  const READ = { val: () => undefined, prop: () => false, is: () => false, text: () => '', html: () => '', attr: () => undefined, hasClass: () => false };
  const chain = new Proxy(function () {}, {
    get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : k === 'find' ? () => chain : READ[k] || (() => chain)),
    apply: () => chain });
  const $ = function () { return chain; };
  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  $.extend = function (...a) {
    let deep = false; if (typeof a[0] === 'boolean') { deep = a.shift(); }
    const target = a.shift() || {};
    for (const src of a) for (const k of Object.keys(src || {})) {
      if (deep && isObj(src[k]) && isObj(target[k])) $.extend(true, target[k], src[k]);
      else if (deep && isObj(src[k])) target[k] = $.extend(true, {}, src[k]);
      else target[k] = src[k];
    }
    return target;
  };
  $.isEmptyObject = o => !o || !Object.keys(o).length;
  $.each = (o, f) => { for (const k of Object.keys(o)) f(k, o[k]); };
  return $;
}
function load() {
  if (ctx || loadError) return ctx;
  try {
    const $ = stub();
    ctx = vm.createContext({ console, $, jQuery: $, document: { getElementById: () => ({ value: '' }) }, localStorage: { getItem: () => null, setItem() {} }, isCustomMods: false, mechanicsTests: {}, transformSpecies: {} });
    for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f });
    // gen 10 = Pokémon Champions ruleset (mirrors the "case 10" branch of the calculator's gen switch)
    vm.runInContext(`gen = 10; pokedex = POKEDEX_CHAMPIONS; typeChart = TYPE_CHART_SV; moves = MOVES_CHAMPIONS; items = ITEMS_CHAMPIONS; abilities = ABILITIES_CHAMPIONS; STATS = STATS_GSC; calcHP = CALC_HP_CHAMP; calcStat = CALC_STAT_CHAMP; var lastHighestStat = [0,0]; var resultDisplayMode = 'raw'; var calcQueue = 0;`, ctx);
  } catch (e) { loadError = e; ctx = null; }
  return ctx;
}
const available = () => !!load();

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const STAT_KEYS = ['hp', 'at', 'df', 'sa', 'sd', 'sp'];
const SHOWDOWN_TO_NCP = { atk: 'at', def: 'df', spa: 'sa', spd: 'sd', spe: 'sp', hp: 'hp' };
const STATUS = { brn: 'Burned', par: 'Paralyzed', psn: 'Poisoned', tox: 'Badly Poisoned', slp: 'Asleep', frz: 'Frozen' };
const WEATHER = { sunnyday: 'Sun', desolateland: 'Harsh Sun', raindance: 'Rain', primordialsea: 'Heavy Rain', sandstorm: 'Sand', snowscape: 'Snow', snow: 'Snow', hail: 'Hail', deltastream: 'Strong Winds' };
const TERRAIN = { electricterrain: 'Electric', grassyterrain: 'Grassy', psychicterrain: 'Psychic', mistyterrain: 'Misty' };

// case-insensitive lookup into one of the calculator's name-keyed tables
function find(table, name) {
  if (!name) return undefined;
  if (table[name]) return name;
  const n = norm(name);
  for (const k of Object.keys(table)) if (norm(k) === n) return k;
  return undefined;
}
const inList = (list, name) => { const n = norm(name); return (list || []).find(x => norm(x) === n); };

// Showdown Mega names ("Charizard-Mega-Y") -> calculator names ("Mega Charizard Y")
function speciesName(c, sdName) {
  const dex = c.pokedex;
  let k = find(dex, sdName); if (k) return k;
  const m = String(sdName).match(/^(.*?)-Mega(?:-([XYZ]))?$/);
  if (m) { k = find(dex, `Mega ${m[1]}${m[2] ? ' ' + m[2] : ''}`); if (k) return k; }
  k = find(dex, String(sdName).replace(/-/g, ' ')); if (k) return k;
  return undefined;
}

// stats exactly as the calculator computes them (HP + 5 stats from Stat Points / nature / level 50)
function buildPokemon(c, battle, m, set, o = {}) {
  const sp = speciesName(c, m.species.name);
  if (!sp) throw new Error('species ' + m.species.name);
  const dex = c.pokedex[sp];
  const raw = (set && set.evs) || {};
  const sps = {};
  for (const [sd, k] of Object.entries(SHOWDOWN_TO_NCP)) sps[k] = Math.max(0, Math.min(32, (raw[sd] !== undefined ? raw[sd] : raw[k]) | 0));
  if (m.evOverride) for (const k of Object.keys(m.evOverride)) sps[SHOWDOWN_TO_NCP[k] || k] = Math.min(32, Math.round(m.evOverride[k] / 8));
  if (o.spOverride) Object.assign(sps, o.spOverride);
  const itemName = m.item ? battle.dex.items.get(m.item).name : '';
  const ability = (m.getAbility ? m.getAbility().name : (set && set.ability)) || '';
  const nature = (set && set.nature) || 'Serious';
  const p = {
    name: sp, type1: dex.t1, type2: dex.t2 || '', tera_type: dex.t1, level: 50,
    HPSPs: sps.hp, HPEVs: 0, HPIVs: 31, isDynamax: false, gmax_factor: false, isTerastalize: false,
    rawStats: {}, boosts: {}, stats: {}, sps: {}, evs: {}, ivs: {},
    nature, ability: find(c.abilities.reduce((a, x) => (a[x] = 1, a), {}), ability) || ability, abilityOn: true,
    supremeOverlord: 0, rivalryGender: '', highestStat: -1,
    item: (inList(c.items, itemName) || itemName), status: STATUS[m.status] || 'Healthy', toxicCounter: 0,
    glaiveRushMod: false, weight: dex.w || 0, canEvolve: !!dex.canEvolve, isTransformed: false, moves: [],
    hasType: function (...ts) { return ts.some(t => t && (this.type1 === t || this.type2 === t)); }
  };
  p.HPIVs = 31;
  for (const k of ['at', 'df', 'sa', 'sd', 'sp']) { p.sps[k] = sps[k]; p.evs[k] = 0; p.ivs[k] = 31; p.boosts[k] = (m.boosts && m.boosts[{ at: 'atk', df: 'def', sa: 'spa', sd: 'spd', sp: 'spe' }[k]]) | 0; }
  // Champions stat formulas, copied from the calculator's CALC_HP_CHAMP / CALC_STAT_CHAMP (those read the page DOM)
  const bs = dex.bs;
  p.maxHP = bs.hp === 1 ? 1 : Math.floor((bs.hp * 2 + 31) * 50 / 100) + 50 + 10 + sps.hp;
  p.HPraw = p.maxHP;
  const cur = Math.max(0, Math.round(p.maxHP * (m.hp / m.maxhp)));
  p.curHP = o.fullHP ? p.maxHP : Math.max(1, cur);
  const nat = c.NATURES[nature] || ['', ''];
  for (const k of ['at', 'df', 'sa', 'sd', 'sp']) {
    const mod = nat[0] === k ? 1.1 : nat[1] === k ? 0.9 : 1;
    p.rawStats[k] = Math.floor(((Math.floor((bs[k] * 2 + 31) * 50 / 100) + 5) + sps[k]) * mod);
  }
  return p;
}
const NO_MOVE = { name: '(No Move)', bp: 0, type: 'Normal', category: 'Status', isCrit: false, isZ: false, hits: 1, isDouble: 0, combinePledge: 0, timesAffected: 0, usedOppMoveIndex: 0, getsStellarBoost: false, isPlusMove: false };
function buildMove(c, name) {
  const key = find(c.moves, name);
  if (!key) return null;
  const d = c.moves[key];
  const hr = d.hitRange;
  return Object.assign({}, d, { name: key, bp: d.bp | 0, type: d.type, category: d.category, isCrit: false, isZ: false,
    hits: hr ? (hr.length === 2 ? hr[1] : hr) : 1, isDouble: 0, combinePledge: 0, timesAffected: 0, usedOppMoveIndex: 0, getsStellarBoost: false, isPlusMove: false });
}
function buildField(c, battle, atkSide, defSide) {
  const f = battle.field;
  const weather = WEATHER[f.weather] || '';
  const terrain = TERRAIN[f.terrain] || '';
  const sc = s => (s && s.sideConditions) || {};
  const A = sc(atkSide), D = sc(defSide);
  // The calculator indexes sides as [attacker(L), defender(R)]; getSide(1) = the side the defender stands on.
  const arr = (a, d) => [!!a, !!d];
  const cond = {
    isSR: arr(0, 0), isProtect: arr(0, 0), isReflect: arr(A.reflect, D.reflect), isLightScreen: arr(A.lightscreen, D.lightscreen),
    isAuroraVeil: arr(A.auroraveil, D.auroraveil), isTailwind: arr(A.tailwind, D.tailwind), isForesight: arr(0, 0),
    isHelpingHand: arr(0, 0), isFriendGuard: arr(0, 0), isBattery: arr(0, 0), isPowerSpot: arr(0, 0), isSteelySpirit: arr(0, 0), isFlowerGiftSpD: arr(0, 0), isFlowerGiftAtk: arr(0, 0),
    isSaltCure: arr(0, 0), isSwamp: arr(0, 0), isSeaFire: arr(0, 0), isRedItem: arr(0, 0), isBlueItem: arr(0, 0), isCharge: arr(0, 0), isLeechSeed: arr(0, 0), isIngrain: arr(0, 0), isCurse: arr(0, 0), isBinding: arr(0, 0), isAquaRing: arr(0, 0), isNightmare: arr(0, 0), isGMaxField: arr(0, 0)
  };
  const gravity = !!(f.pseudoWeather && f.pseudoWeather.gravity);
  let w = weather, t = terrain;
  const side = i => ({ format: 'Doubles', terrain: t, weather: w, isGravity: gravity, spikes: 0, isNeutralizingGas: false,
    ...Object.fromEntries(Object.entries(cond).map(([k, v]) => [k, k === 'isSR' || k === 'isProtect' ? false : v[i]])) });
  return {
    getNeutralGas: () => false, getTailwind: i => cond.isTailwind[i], getWeather: () => w, getTerrain: () => t, getSwamp: () => false,
    clearWeather: () => { w = ''; }, clearTerrain: () => { t = ''; }, getSide: i => side(i)
  };
}

// Range for one attacker -> defender move, in the shadow battle's HP units. Returns null when unsupported (caller falls back).
function ncpRange(battle, a, t, moveId, spread) {
  const c = load(); if (!c) return null;
  try {
    const mv = battle.dex.moves.get(moveId);
    const A = buildPokemon(c, battle, a, a.set);
    const D = buildPokemon(c, battle, t, t.set);
    const mvObj = buildMove(c, mv.name);
    if (!mvObj) return null;
    A.moves = [mvObj, NO_MOVE, NO_MOVE, NO_MOVE];
    D.moves = [NO_MOVE, NO_MOVE, NO_MOVE, NO_MOVE];
    const field = buildField(c, battle, a.side, t.side);
    // p1 = attacker, p2 = defender; the calculator reads field sides as getSide(1) for p1's attacks.
    c.__r = null;
    c.__A = A; c.__D = D; c.__F = field;
    const res = vm.runInContext('(()=>{const r=CALCULATE_ALL_MOVES_SV(__A,__D,__F);return r[0][0]})()', c);
    let dmg = res && res.damage;
    if (!Array.isArray(dmg) || !dmg.length) return null;
    dmg = dmg.map(Number).filter(x => isFinite(x));
    if (!dmg.length) return null;
    const hits = A.moves[0].hits | 0 || 1;
    let lo = Math.min(...dmg), hi = Math.max(...dmg);
    if (hits > 1 && !(mvObj.hitRange && mvObj.hitRange.length !== 2)) { lo *= hits; hi *= hits; }
    const scale = t.maxhp / D.maxHP;
    const out = { min: Math.floor(lo * scale), max: Math.floor(hi * scale), src: 'ncp', desc: res.description };
    // bulky variant (max HP + max Def/SpD), same widening the Smogon path applies so misread sets don't over-commit
    try {
      const isSp = mvObj.category === 'Special';
      const Db = buildPokemon(c, battle, t, t.set, { spOverride: { hp: 32, [isSp ? 'sd' : 'df']: 32 } });
      Db.moves = [NO_MOVE, NO_MOVE, NO_MOVE, NO_MOVE];
      const Ab = buildPokemon(c, battle, a, a.set); Ab.moves = [mvObj, NO_MOVE, NO_MOVE, NO_MOVE];
      c.__A = Ab; c.__D = Db; c.__F = buildField(c, battle, a.side, t.side);
      const rb = vm.runInContext('(()=>CALCULATE_ALL_MOVES_SV(__A,__D,__F)[0][0])()', c);
      const nb = (rb.damage || []).map(Number).filter(x => isFinite(x));
      if (nb.length) { let l2 = Math.min(...nb); if (hits > 1) l2 *= hits; out.min = Math.min(out.min, Math.floor(l2 * (t.maxhp / Db.maxHP))); }
    } catch (e) {}
    return out;
  } catch (e) { ncpRange.lastError = e.message; return null; }
}

module.exports = { ncpRange, available, load, _loadError: () => loadError, buildPokemon, buildMove, speciesName };
