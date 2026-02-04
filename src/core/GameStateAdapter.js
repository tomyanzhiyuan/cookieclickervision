/**
 * GameStateAdapter.js
 *
 * Extracts and normalizes game state from the Cookie Clicker Game object.
 * This module is READ-ONLY and never mutates the game state.
 *
 * Purpose: Provide a clean, normalized interface to game data for downstream modules.
 */

class GameStateAdapter {
  /**
   * Creates a new GameStateAdapter.
   *
   * @param {Object} gameObject - The Cookie Clicker Game object (window.Game)
   * @throws {Error} If gameObject is invalid
   */
  constructor(gameObject) {
    if (!Validators.isValidGameObject(gameObject)) {
      throw new Error('Invalid Game object provided to GameStateAdapter');
    }
    this.game = gameObject;
  }

  /**
   * Extracts and normalizes the complete game state.
   *
   * @returns {Object} Normalized game state
   * @returns {number} returns.cookies - Current cookie count
   * @returns {number} returns.cookiesPerSecond - Current CPS
   * @returns {Array<Object>} returns.buildings - Array of normalized buildings
   * @returns {Array<Object>} returns.upgrades - Array of normalized upgrades
   */
  getGameState() {
    return {
      cookies: this.game.cookies,
      cookiesPerSecond: this.game.cookiesPs,
      buildings: this._extractBuildings(),
      upgrades: this._extractUpgrades()
    };
  }

  /**
   * Extracts all buildings from Game.Objects.
   *
   * @private
   * @returns {Array<Object>} Array of normalized building objects
   */
  _extractBuildings() {
    const buildings = [];

    // Iterate through all building types
    for (const buildingKey in this.game.Objects) {
      const building = this.game.Objects[buildingKey];

      // Validate before processing
      if (!Validators.isValidBuilding(building)) {
        console.warn(`Invalid building skipped: ${buildingKey}`);
        continue;
      }

      buildings.push(this._extractBuildingState(building, buildingKey));
    }

    return buildings;
  }

  /**
   * Extracts and normalizes a single building's state.
   *
   * @private
   * @param {Object} building - Building object from Game.Objects
   * @param {string} key - Building key/identifier
   * @returns {Object} Normalized building data
   */
  _extractBuildingState(building, key) {
    return {
      id: key,
      name: building.name,
      owned: building.amount,
      cost: building.price,
      baseCPS: building.cps, // Base CPS per individual building
      totalCPS: building.storedCps || 0, // Total CPS from all owned buildings of this type
      // Additional metadata for future use
      unlocked: building.unlocked !== 0,
      bought: building.bought // Total ever purchased (including sold)
    };
  }

  /**
   * Calculates the CPS contribution from a single building type.
   * This accounts for all multipliers currently active.
   *
   * @private
   * @param {Object} building - Building object from Game.Objects
   * @returns {number} Total CPS from this building type
   */
  _calculateBuildingCPS(building) {
    // Cookie Clicker stores total CPS in storedCps
    if (typeof building.storedCps === 'number') {
      return building.storedCps;
    }

    // Fallback: calculate from base CPS and amount
    // (Less accurate due to missing multipliers, but better than nothing)
    const baseCPS = building.cps || 0;
    const amount = building.amount || 0;
    return baseCPS * amount;
  }

  /**
   * Extracts all available upgrades from Game.UpgradesInStore.
   *
   * @private
   * @returns {Array<Object>} Array of normalized upgrade objects
   */
  _extractUpgrades() {
    const upgrades = [];

    // UpgradesInStore contains upgrades that are unlocked and not yet purchased
    for (let i = 0; i < this.game.UpgradesInStore.length; i++) {
      const upgrade = this.game.UpgradesInStore[i];

      // Validate before processing
      if (!Validators.isValidUpgrade(upgrade)) {
        console.warn(`Invalid upgrade skipped: ${upgrade?.name || 'unknown'}`);
        continue;
      }

      upgrades.push(this._extractUpgradeState(upgrade, i));
    }

    return upgrades;
  }

  /**
   * Extracts and normalizes a single upgrade's state.
   *
   * @private
   * @param {Object} upgrade - Upgrade object from Game.UpgradesInStore
   * @param {number} index - Index in UpgradesInStore array
   * @returns {Object} Normalized upgrade data
   */
  _extractUpgradeState(upgrade, index) {
    // Get cost - some upgrades use getPrice(), others have basePrice
    let cost = 0;
    if (typeof upgrade.getPrice === 'function') {
      cost = upgrade.getPrice();
    } else if (typeof upgrade.basePrice === 'number') {
      cost = upgrade.basePrice;
    }

    return {
      id: `upgrade_${index}`,
      name: upgrade.name,
      cost: cost,
      // Description contains hints about what the upgrade does
      description: upgrade.desc || '',
      descriptionDetail: upgrade.ddesc || '',
      // Upgrade type/category if available
      pool: upgrade.pool || 'standard',
      // Is this upgrade unlocked and available?
      unlocked: this._isUpgradeUnlocked(upgrade)
    };
  }

  /**
   * Checks if an upgrade is truly unlocked and available for purchase.
   *
   * @private
   * @param {Object} upgrade - Upgrade object
   * @returns {boolean} True if unlocked, false otherwise
   */
  _isUpgradeUnlocked(upgrade) {
    // If upgrade is in UpgradesInStore, it's already unlocked
    // But we do an additional check for safety
    if (upgrade.unlocked === false) {
      return false;
    }

    // Check if upgrade has been bought already
    if (upgrade.bought) {
      return false;
    }

    return true;
  }

  /**
   * Gets the current multiplier effect on a specific building.
   * This is useful for calculating the actual CPS gain from buying one more.
   *
   * @private
   * @param {Object} building - Building object
   * @returns {number} Multiplier (1.0 = no multiplier, 2.0 = double, etc.)
   */
  _getBuildingMultiplier(building) {
    // If building has some owned and has storedCps, we can calculate multiplier
    if (building.amount > 0 && building.storedCps > 0 && building.cps > 0) {
      const baseTotal = building.cps * building.amount;
      const multiplier = building.storedCps / baseTotal;
      return multiplier;
    }

    // Default: no multiplier
    return 1.0;
  }

  /**
   * Gets a specific building by name.
   *
   * @param {string} buildingName - Name of the building (e.g., "Cursor", "Grandma")
   * @returns {Object|null} Normalized building object, or null if not found
   */
  getBuilding(buildingName) {
    const building = this.game.Objects[buildingName];
    if (!building || !Validators.isValidBuilding(building)) {
      return null;
    }
    return this._extractBuildingState(building, buildingName);
  }

  /**
   * Gets current cookies and CPS (quick access for calculations).
   *
   * @returns {Object} Current financial state
   * @returns {number} returns.cookies - Current cookies
   * @returns {number} returns.cps - Cookies per second
   */
  getFinancialState() {
    return {
      cookies: this.game.cookies,
      cps: this.game.cookiesPs
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStateAdapter;
}
