/**
 * debug-game-state.js
 *
 * Paste this into the Cookie Clicker console to inspect the actual Game object structure.
 * This will help us understand why buildings are failing validation.
 */

console.log('═════════════════════════════════════════');
console.log('  COOKIE CLICKER GAME STATE INSPECTOR');
console.log('═════════════════════════════════════════');
console.log('');

// Check if Game exists
if (typeof Game === 'undefined') {
  console.error('❌ Game object not found. Make sure Cookie Clicker is loaded!');
} else {
  console.log('✅ Game object found');
  console.log('');

  // Inspect top-level Game properties
  console.log('Game top-level properties:');
  console.log('  cookies:', typeof Game.cookies, '=', Game.cookies);
  console.log('  cookiesPs:', typeof Game.cookiesPs, '=', Game.cookiesPs);
  console.log('  Objects type:', typeof Game.Objects);
  console.log('  UpgradesInStore type:', typeof Game.UpgradesInStore);
  console.log('');

  // Inspect Game.Objects structure
  console.log('Game.Objects structure:');
  if (Game.Objects) {
    const buildingNames = Object.keys(Game.Objects);
    console.log('  Building names:', buildingNames);
    console.log('  Total buildings:', buildingNames.length);
    console.log('');

    // Inspect first building in detail
    if (buildingNames.length > 0) {
      const firstBuildingName = buildingNames[0];
      const firstBuilding = Game.Objects[firstBuildingName];

      console.log(`Detailed inspection of first building: ${firstBuildingName}`);
      console.log('─────────────────────────────────────────');
      console.log('  Properties:');
      Object.keys(firstBuilding).forEach(key => {
        const value = firstBuilding[key];
        const type = typeof value;
        if (type !== 'function' && type !== 'object') {
          console.log(`    ${key}: ${type} = ${value}`);
        } else if (type === 'object' && value !== null && !Array.isArray(value)) {
          console.log(`    ${key}: ${type} (nested)`);
        } else {
          console.log(`    ${key}: ${type}`);
        }
      });
      console.log('');

      // Check for the properties we're looking for
      console.log('  Validation checks:');
      console.log('    Has "name"?', 'name' in firstBuilding, typeof firstBuilding.name);
      console.log('    Has "amount"?', 'amount' in firstBuilding, typeof firstBuilding.amount);
      console.log('    Has "price"?', 'price' in firstBuilding, typeof firstBuilding.price);
      console.log('    Has "basePrice"?', 'basePrice' in firstBuilding, typeof firstBuilding.basePrice);
      console.log('    Has "cps"?', 'cps' in firstBuilding, typeof firstBuilding.cps);
      console.log('    Has "storedCps"?', 'storedCps' in firstBuilding, typeof firstBuilding.storedCps);
      console.log('    Has "storedTotalCps"?', 'storedTotalCps' in firstBuilding, typeof firstBuilding.storedTotalCps);
      console.log('');

      // Inspect Cursor specifically (if it exists)
      if (Game.Objects['Cursor']) {
        const cursor = Game.Objects['Cursor'];
        console.log('Cursor building details:');
        console.log('─────────────────────────────────────────');
        console.log('  name:', cursor.name);
        console.log('  amount:', cursor.amount);
        console.log('  price:', cursor.price);
        console.log('  basePrice:', cursor.basePrice);
        console.log('  cps:', cursor.cps);
        console.log('  storedCps:', cursor.storedCps);
        console.log('  storedTotalCps:', cursor.storedTotalCps);
        console.log('');
      }
    }
  } else {
    console.error('❌ Game.Objects is undefined');
  }

  // Inspect upgrades
  console.log('Game.UpgradesInStore:');
  if (Game.UpgradesInStore) {
    console.log('  Type:', Array.isArray(Game.UpgradesInStore) ? 'Array' : typeof Game.UpgradesInStore);
    console.log('  Length:', Game.UpgradesInStore.length);
    if (Game.UpgradesInStore.length > 0) {
      const firstUpgrade = Game.UpgradesInStore[0];
      console.log('  First upgrade properties:');
      Object.keys(firstUpgrade).forEach(key => {
        const value = firstUpgrade[key];
        const type = typeof value;
        if (type !== 'function' && type !== 'object') {
          console.log(`    ${key}: ${type} = ${value}`);
        } else {
          console.log(`    ${key}: ${type}`);
        }
      });
    }
  } else {
    console.error('❌ Game.UpgradesInStore is undefined');
  }
}

console.log('');
console.log('═════════════════════════════════════════');
console.log('Copy the output above and share with me!');
console.log('═════════════════════════════════════════');
