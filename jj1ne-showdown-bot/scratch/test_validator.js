const { Dex } = require('../ps/dist/sim/dex');
const { Teams } = require('../ps/dist/sim/teams');
const { TeamValidator } = require('../ps/dist/sim/team-validator');

const validator = new TeamValidator('gen9championsvgc2026regmc');

// Test team-garchomp-sitrus.js
const teamText = require('../team-garchomp-sitrus.js');
const parsed = Teams.import(teamText);
const problems = validator.validateTeam(parsed);
console.log('team-garchomp-sitrus validation problems:', problems);

// Test current team.js
const currentTeam = require('../team.js');
const parsedCurrent = Teams.import(currentTeam);
const currentProblems = validator.validateTeam(parsedCurrent);
console.log('team.js validation problems:', currentProblems);
