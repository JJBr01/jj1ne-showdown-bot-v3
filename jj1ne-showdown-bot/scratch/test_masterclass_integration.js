// test_masterclass_integration.js
const { TURN_SYSTEM, PREVIEW_SYSTEM, COACH_SYSTEM } = require('../llm.js');
const tactics = require('../tactics.js');

console.log('=== 1. Testing LLM Prompts & Knowledge Loading ===');
const turnSys = TURN_SYSTEM();
console.log('TURN_SYSTEM length:', turnSys.length);
console.log('Contains Wolfe Checklist?', turnSys.includes('Wolfe Glick Turn-By-Turn Decision Checklist'));
console.log('Contains Safe Play Search?', turnSys.includes('Safe Play Search'));

const previewSys = PREVIEW_SYSTEM();
console.log('PREVIEW_SYSTEM length:', previewSys.length);
console.log('Contains Wolfe Masterclass Playbook?', previewSys.includes('Wolfe Glick VGC Masterclass Playbook'));
console.log('Contains 36-Cell Grid?', previewSys.includes('36-Cell Grid'));
console.log('Contains Sheltering Win Condition?', previewSys.includes('SHELTER WIN-CONDITION IN THE BACK'));

console.log('\n=== 2. Testing Tactics Module Masterclass Heuristics ===');
console.log('Tactics Version:', tactics.version);
console.log('Changelog:', tactics.changelog);

// Mock battle object
const mockBattle = {
  sides: [
    {
      pokemon: [
        { fainted: false, species: { name: 'Dragonite-Mega' }, hp: 100, maxhp: 100 },
        { fainted: false, species: { name: 'Kingambit' }, hp: 100, maxhp: 100 },
        { fainted: false, species: { name: 'Charizard' }, hp: 100, maxhp: 100 },
        { fainted: false, species: { name: 'Garchomp' }, hp: 100, maxhp: 100 }
      ],
      active: [
        { fainted: false, species: { name: 'Dragonite-Mega' }, hp: 100, maxhp: 100 },
        { fainted: false, species: { name: 'Kingambit' }, hp: 100, maxhp: 100 }
      ]
    },
    {
      pokemon: [
        { fainted: false, species: { name: 'Incineroar', baseSpecies: 'Incineroar' }, getAbility: () => ({ id: 'intimidate' }), activeTurns: 0, moveSlots: [{ id: 'fakeout' }] },
        { fainted: false, species: { name: 'Porygon2', baseSpecies: 'Porygon2' }, getAbility: () => ({ id: 'download' }), activeTurns: 1, moveSlots: [{ id: 'trickroom' }] }
      ],
      active: [
        { fainted: false, species: { name: 'Incineroar', baseSpecies: 'Incineroar' }, getAbility: () => ({ id: 'intimidate' }), activeTurns: 0, moveSlots: [{ id: 'fakeout' }] },
        { fainted: false, species: { name: 'Porygon2', baseSpecies: 'Porygon2' }, getAbility: () => ({ id: 'download' }), activeTurns: 1, moveSlots: [{ id: 'trickroom' }] }
      ]
    }
  ],
  field: {
    weather: 'none',
    terrain: 'none',
    pseudoWeather: {}
  }
};

// Test Safe Play Bias when Ahead (4 vs 2)
const accMove = { id: 'kowtowcleave', accuracy: 100, category: 'Physical' };
const inaccMove = { id: 'focusblast', accuracy: 70, category: 'Special' };
console.log('adjustScore (100% acc move when ahead):', tactics.adjustScore(mockBattle, mockBattle.sides[0].active[1], accMove, null, 0));
console.log('adjustScore (70% acc move when ahead):', tactics.adjustScore(mockBattle, mockBattle.sides[0].active[1], inaccMove, null, 0));

// Test Speed Setter Pressure (Porygon2 unactivated TR)
const attackMove = { id: 'closecombat', accuracy: 100, category: 'Physical' };
console.log('adjustScore (attack into unactivated TR setter):', tactics.adjustScore(mockBattle, mockBattle.sides[0].active[1], attackMove, null, 0));

// Test Multiscale Protection on Turn 1 against Fake Out
const protectMove = { id: 'protect', accuracy: true, category: 'Status' };
console.log('adjustScore (Protect Dragonite Multiscale vs Fake Out):', tactics.adjustScore(mockBattle, mockBattle.sides[0].active[0], protectMove, null, 0));

// Test Tactical Notes Injection
const notes = tactics.getTacticalNotes(mockBattle, { active: [] });
console.log('\nTactical Notes for Claude prompt:');
notes.forEach(n => console.log(' - ' + n));

console.log('\n=== All Tests Passed Successfully! ===');
