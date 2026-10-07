const { Dex } = require('../ps/dist/sim/dex');
const dex = Dex.forFormat('gen9championsvgc2026regmc');

console.log('Assault Vest item:', dex.items.get('assaultvest'));
console.log('Clear Amulet item:', dex.items.get('clearamulet'));
console.log('Life Orb item:', dex.items.get('lifeorb'));
console.log('Sitrus Berry item:', dex.items.get('sitrusberry'));
console.log('Leftovers item:', dex.items.get('leftovers'));
console.log('Focus Sash item:', dex.items.get('focussash'));
console.log('Lum Berry item:', dex.items.get('lumberry'));
console.log('Safety Goggles item:', dex.items.get('safetygoggles'));
console.log('Black Glasses item:', dex.items.get('blackglasses'));
console.log('Expert Belt item:', dex.items.get('expertbelt'));
