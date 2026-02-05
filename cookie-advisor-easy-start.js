/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🍪 COOKIE CLICKER ROI ADVISOR - EASY START BUNDLE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single-paste solution for Cookie Clicker console!
 *
 * USAGE:
 * 1. Copy this entire file (Ctrl+A, Ctrl+C)
 * 2. Open Cookie Clicker in your browser
 * 3. Open browser console (F12 or Ctrl+Shift+J)
 * 4. Paste and press Enter
 * 5. Run: CookieAdvisor.analyze()
 *
 * COMMANDS:
 * - CookieAdvisor.analyze()              → Show best investment (1-hour filter)
 * - CookieAdvisor.showAll()              → Show ALL options (no time filter)
 * - CookieAdvisor.help()                 → View all commands
 * - CookieAdvisor.debug()                → Show debug information
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

/**
 * Constants.js
 *
 * Central configuration for the Cookie Clicker ROI Advisor.
 * All magic numbers and thresholds are defined here with explanations.
 */

const Constants = {
  // ═══════════════════════════════════════════════════════════════
  // ROI THRESHOLDS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Maximum reasonable ROI time (in seconds).
   * Investments with ROI time > 1 hour are considered too long-term
   * and filtered out of recommendations.
   */
  MAX_REASONABLE_ROI: 3600, // 1 hour

  /**
   * Minimum meaningful CPS delta.
   * Purchases that increase CPS by less than this are considered
   * negligible and assigned Infinity ROI to filter them out.
   */
  MIN_VALID_DELTA_CPS: 0.001,

  // ═══════════════════════════════════════════════════════════════
  // UPGRADE PATTERN RECOGNITION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Regular expressions for parsing upgrade descriptions.
   * Used to estimate CPS impact from upgrade text.
   */
  UPGRADE_PATTERNS: {
    // Matches: "Grandmas are 2x as efficient"
    MULTIPLIER: /(\d+)x\s+as\s+efficient/i,

    // Matches: "Cursors gain 50% of CPS"
    PERCENTAGE_BOOST: /(\d+)%/,

    // Matches: "gains +10 cookies per click"
    FLAT_COOKIE_BONUS: /\+(\d+\.?\d*)\s+cookies?\s+per/i,

    // Matches building names in descriptions
    BUILDING_REFERENCE: /(cursor|grandma|farm|mine|factory|bank|temple|wizard tower|shipment|alchemy lab|portal|time machine|antimatter condenser|prism|chancemaker|fractal engine|javascript console|idleverse)/i
  },

  /**
   * Default CPS estimation multipliers for upgrades.
   * Used when description doesn't match any pattern.
   */
  UPGRADE_ESTIMATES: {
    CONSERVATIVE_BOOST: 0.02,  // 2% of total CPS for unknown upgrades
    CLICK_UPGRADE_WEIGHT: 0.01, // Click upgrades valued at 1% of CPS
    SYNERGY_MULTIPLIER: 0.5    // 50% boost for building-specific upgrades
  },

  // ═══════════════════════════════════════════════════════════════
  // DISPLAY SETTINGS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Number of alternative recommendations to show.
   */
  TOP_ALTERNATIVES_COUNT: 5,

  /**
   * Decimal places for displaying numbers.
   */
  NUMBER_PRECISION: 2,

  /**
   * Suffixes for formatting large numbers.
   * K = thousand, M = million, B = billion, T = trillion, Qa = quadrillion
   */
  NUMBER_SUFFIXES: [
    { threshold: 1e15, suffix: 'Qa' },
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' }
  ],

  // ═══════════════════════════════════════════════════════════════
  // COOKIE CLICKER BUILDING NAMES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Standard building names in Cookie Clicker (for validation and matching).
   * Order matches the in-game building progression.
   */
  BUILDINGS: [
    'Cursor',
    'Grandma',
    'Farm',
    'Mine',
    'Factory',
    'Bank',
    'Temple',
    'Wizard tower',
    'Shipment',
    'Alchemy lab',
    'Portal',
    'Time machine',
    'Antimatter condenser',
    'Prism',
    'Chancemaker',
    'Fractal engine',
    'Javascript console',
    'Idleverse'
  ],

  // ═══════════════════════════════════════════════════════════════
  // CONSOLE OUTPUT STYLING
  // ═══════════════════════════════════════════════════════════════

  /**
   * Characters for ASCII art borders.
   */
  BORDERS: {
    DOUBLE_LINE: '═',
    SINGLE_LINE: '━',
    THIN_LINE: '─'
  },

  /**
   * Emoji icons for visual hierarchy.
   */
  ICONS: {
    COOKIE: '🍪',
    BEST: '✨',
    ALTERNATIVES: '📊',
    ARROW: '→',
    BUILDING: '🏢',
    UPGRADE: '⬆️'
  }
};

// Export for use in other modules
// (In browser console, this becomes a global)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Constants;
}
/**
 * Validators.js
 *
 * Input validation helpers for the Cookie Clicker ROI Advisor.
 * All validation logic is centralized here to ensure consistent error handling.
 */

const Validators = {
  /**
   * Validates that the Game object exists and has required properties.
   *
   * @param {Object} game - The Cookie Clicker Game object
   * @returns {boolean} True if valid, false otherwise
   */
  isValidGameObject(game) {
    if (!game) {
      return false;
    }

    // Check for essential properties
    if (typeof game.cookies !== 'number') {
      return false;
    }

    if (typeof game.cookiesPs !== 'number') {
      return false;
    }

    // Check for Objects (buildings)
    if (!game.Objects || typeof game.Objects !== 'object') {
      return false;
    }

    // Check for UpgradesInStore (available upgrades)
    if (!game.UpgradesInStore || !Array.isArray(game.UpgradesInStore)) {
      return false;
    }

    return true;
  },

  /**
   * Validates a building object from Game.Objects.
   *
   * @param {Object} building - A building object
   * @returns {boolean} True if valid, false otherwise
   */
  isValidBuilding(building) {
    if (!building) {
      return false;
    }

    // Must have a name
    if (typeof building.name !== 'string' || building.name.length === 0) {
      return false;
    }

    // Must have owned amount (even if 0)
    if (typeof building.amount !== 'number') {
      return false;
    }

    // Must have a price
    if (typeof building.price !== 'number' || building.price < 0) {
      return false;
    }

    // Must have CPS - either as a function (Cookie Clicker) or stored value
    // In Cookie Clicker, building.cps is a function, and storedCps is the actual value
    if (typeof building.cps !== 'function' && typeof building.storedCps !== 'number') {
      return false;
    }

    return true;
  },

  /**
   * Validates an upgrade object from Game.UpgradesInStore.
   *
   * @param {Object} upgrade - An upgrade object
   * @returns {boolean} True if valid, false otherwise
   */
  isValidUpgrade(upgrade) {
    if (!upgrade) {
      return false;
    }

    // Must have a name
    if (typeof upgrade.name !== 'string' || upgrade.name.length === 0) {
      return false;
    }

    // Must have a getPrice method or basePrice property
    if (typeof upgrade.getPrice !== 'function' && typeof upgrade.basePrice !== 'number') {
      return false;
    }

    return true;
  },

  /**
   * Validates that a number is a valid ROI time.
   * ROI time must be positive and finite.
   *
   * @param {number} roiTime - ROI time in seconds
   * @returns {boolean} True if valid, false otherwise
   */
  isValidROI(roiTime) {
    if (typeof roiTime !== 'number') {
      return false;
    }

    if (!isFinite(roiTime)) {
      return false;
    }

    if (roiTime <= 0) {
      return false;
    }

    return true;
  },

  /**
   * Validates that a number is a valid CPS delta.
   * Delta must be positive and finite.
   *
   * @param {number} deltaCPS - Change in cookies per second
   * @returns {boolean} True if valid, false otherwise
   */
  isValidDeltaCPS(deltaCPS) {
    if (typeof deltaCPS !== 'number') {
      return false;
    }

    if (!isFinite(deltaCPS)) {
      return false;
    }

    if (deltaCPS <= 0) {
      return false;
    }

    return true;
  },

  /**
   * Checks if a purchase is affordable given current cookies.
   *
   * @param {number} cost - Cost of the purchase
   * @param {number} cookies - Current cookie count
   * @returns {boolean} True if affordable, false otherwise
   */
  isAffordable(cost, cookies) {
    if (typeof cost !== 'number' || typeof cookies !== 'number') {
      return false;
    }

    return cost <= cookies;
  },

  /**
   * Checks if a purchase is reasonably affordable (within 10x current cookies).
   * Used to filter out purchases that are way too expensive.
   *
   * @param {number} cost - Cost of the purchase
   * @param {number} cookies - Current cookie count
   * @returns {boolean} True if reasonably affordable, false otherwise
   */
  isReasonablyAffordable(cost, cookies) {
    if (typeof cost !== 'number' || typeof cookies !== 'number') {
      return false;
    }

    // Allow purchases up to 10x current cookies
    // (Player will earn cookies while waiting)
    return cost <= cookies * 10;
  },

  /**
   * Validates a normalized game state object.
   *
   * @param {Object} gameState - Normalized game state
   * @returns {boolean} True if valid, false otherwise
   */
  isValidGameState(gameState) {
    if (!gameState) {
      return false;
    }

    if (typeof gameState.cookies !== 'number') {
      return false;
    }

    if (typeof gameState.cookiesPerSecond !== 'number') {
      return false;
    }

    if (!Array.isArray(gameState.buildings)) {
      return false;
    }

    if (!Array.isArray(gameState.upgrades)) {
      return false;
    }

    return true;
  },

  /**
   * Validates a candidate object (building or upgrade with ROI data).
   *
   * @param {Object} candidate - Candidate with ROI calculation
   * @returns {boolean} True if valid, false otherwise
   */
  isValidCandidate(candidate) {
    if (!candidate) {
      return false;
    }

    // Must have essential properties
    const requiredProps = ['id', 'type', 'name', 'cost', 'deltaCPS', 'roiTime'];
    for (const prop of requiredProps) {
      if (!(prop in candidate)) {
        return false;
      }
    }

    // Type must be 'building' or 'upgrade'
    if (candidate.type !== 'building' && candidate.type !== 'upgrade') {
      return false;
    }

    // Cost must be positive
    if (typeof candidate.cost !== 'number' || candidate.cost <= 0) {
      return false;
    }

    return true;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validators;
}
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
    // In Cookie Clicker, building.cps is a FUNCTION that returns base CPS
    const baseCPS = typeof building.cps === 'function'
      ? building.cps(building)
      : (building.cps || 0);

    return {
      id: key,
      name: building.name,
      owned: building.amount,
      cost: building.price,
      baseCPS: baseCPS, // Base CPS per individual building
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
    // In Cookie Clicker, building.cps is a FUNCTION
    const baseCPS = typeof building.cps === 'function'
      ? building.cps(building)
      : (building.cps || 0);
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
    // In Cookie Clicker, building.cps is a FUNCTION
    const baseCPS = typeof building.cps === 'function'
      ? building.cps(building)
      : (building.cps || 0);

    // If building has some owned and has storedCps, we can calculate multiplier
    if (building.amount > 0 && building.storedCps > 0 && baseCPS > 0) {
      const baseTotal = baseCPS * building.amount;
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
/**
 * EconomicModel.js
 *
 * Calculates ROI (Return on Investment) metrics for all purchase candidates.
 *
 * ROI Formula: roiTime = cost / deltaCPS
 * - Lower ROI time = better investment (pays back faster)
 * - deltaCPS = increase in cookies per second from purchase
 *
 * Buildings: Straightforward calculation using base CPS and multipliers
 * Upgrades: Heuristic-based estimation by parsing upgrade descriptions
 */

class EconomicModel {
  /**
   * Creates a new EconomicModel.
   *
   * @param {Object} gameState - Normalized game state from GameStateAdapter
   */
  constructor(gameState) {
    if (!Validators.isValidGameState(gameState)) {
      throw new Error('Invalid game state provided to EconomicModel');
    }
    this.gameState = gameState;
  }

  /**
   * Gets all purchase candidates with ROI calculations.
   *
   * @returns {Array<Object>} Array of candidates (buildings + upgrades) with ROI data
   */
  getAllCandidates() {
    const candidates = [];

    // Add all buildings
    for (const building of this.gameState.buildings) {
      const roi = this.calculateBuildingROI(building);
      if (roi) {
        candidates.push(roi);
      }
    }

    // Add all upgrades
    for (const upgrade of this.gameState.upgrades) {
      const roi = this.calculateUpgradeROI(upgrade);
      if (roi) {
        candidates.push(roi);
      }
    }

    return candidates;
  }

  /**
   * Calculates ROI for purchasing one more of a building.
   *
   * @param {Object} building - Normalized building object
   * @returns {Object|null} ROI data, or null if invalid
   */
  calculateBuildingROI(building) {
    // Extract building properties
    const cost = building.cost;
    const baseCPS = building.baseCPS;
    const owned = building.owned;
    const totalCPS = building.totalCPS;

    // Guard: invalid data
    if (cost <= 0 || baseCPS < 0) {
      return null;
    }

    // Calculate multiplier from current state
    // Multiplier accounts for all upgrades affecting this building
    let multiplier = 1.0;
    if (owned > 0 && totalCPS > 0) {
      const baseTotal = baseCPS * owned;
      if (baseTotal > 0) {
        multiplier = totalCPS / baseTotal;
      }
    }

    // Delta CPS = what we gain from buying one more
    const deltaCPS = baseCPS * multiplier;

    // Calculate ROI time
    const roiTime = this._calculateROITime(cost, deltaCPS);

    return {
      id: building.id,
      type: 'building',
      name: building.name,
      cost: cost,
      deltaCPS: deltaCPS,
      roiTime: roiTime,
      currentOwned: owned,
      // Metadata for display
      displayName: `${building.name} (#${owned + 1})`
    };
  }

  /**
   * Calculates ROI for purchasing an upgrade.
   * Uses heuristic pattern matching to estimate CPS impact.
   *
   * @param {Object} upgrade - Normalized upgrade object
   * @returns {Object|null} ROI data, or null if invalid
   */
  calculateUpgradeROI(upgrade) {
    // Extract upgrade properties
    const cost = upgrade.cost;
    const description = upgrade.descriptionDetail || upgrade.description || '';

    // Guard: invalid data
    if (cost <= 0) {
      return null;
    }

    // Estimate CPS delta using pattern matching
    const deltaCPS = this._estimateUpgradeCPS(upgrade, description);

    // Calculate ROI time
    const roiTime = this._calculateROITime(cost, deltaCPS);

    return {
      id: upgrade.id,
      type: 'upgrade',
      name: upgrade.name,
      cost: cost,
      deltaCPS: deltaCPS,
      roiTime: roiTime,
      isPermanent: true, // Upgrades are permanent
      // Metadata for display
      displayName: `[Upgrade] ${upgrade.name}`
    };
  }

  /**
   * Estimates CPS increase from an upgrade by parsing its description.
   * This is heuristic-based since upgrade effects vary wildly.
   *
   * @private
   * @param {Object} upgrade - Upgrade object
   * @param {string} description - Upgrade description text
   * @returns {number} Estimated deltaCPS
   */
  _estimateUpgradeCPS(upgrade, description) {
    const desc = description.toLowerCase();
    const currentCPS = this.gameState.cookiesPerSecond;

    // Pattern 1: Multiplier upgrades (e.g., "Grandmas are 2x as efficient")
    const multiplierMatch = desc.match(Constants.UPGRADE_PATTERNS.MULTIPLIER);
    if (multiplierMatch) {
      const multiplier = parseFloat(multiplierMatch[1]);
      const affectedBuilding = this._findAffectedBuilding(desc);
      if (affectedBuilding) {
        // Increase is (multiplier - 1) * current CPS from that building
        return affectedBuilding.totalCPS * (multiplier - 1);
      }
    }

    // Pattern 2: Percentage boost (e.g., "Cursors gain 50% of your CPS")
    const percentMatch = desc.match(Constants.UPGRADE_PATTERNS.PERCENTAGE_BOOST);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      const affectedBuilding = this._findAffectedBuilding(desc);

      if (affectedBuilding) {
        // Percentage boost to specific building
        return affectedBuilding.totalCPS * (percent / 100);
      } else {
        // General percentage boost to all CPS
        return currentCPS * (percent / 100);
      }
    }

    // Pattern 3: Flat bonus (e.g., "Cursors gain +0.1 cookies per click")
    const flatMatch = desc.match(Constants.UPGRADE_PATTERNS.FLAT_COOKIE_BONUS);
    if (flatMatch) {
      // Click bonuses are harder to value, use conservative estimate
      // Assume player clicks 1-2 times per second when active
      const bonusPerClick = parseFloat(flatMatch[1]);
      const estimatedClicksPerSec = 1.5;
      return bonusPerClick * estimatedClicksPerSec;
    }

    // Pattern 4: Building-specific upgrade (e.g., "Steel-plated rolling pins")
    const affectedBuilding = this._findAffectedBuilding(desc);
    if (affectedBuilding) {
      // Assume 50% boost to that building type
      return affectedBuilding.totalCPS * Constants.UPGRADE_ESTIMATES.SYNERGY_MULTIPLIER;
    }

    // Pattern 5: Click upgrade (e.g., mentions "clicking" or "cursor")
    if (desc.includes('click') || desc.includes('cursor')) {
      // Click upgrades have indirect value, assign conservative estimate
      return currentCPS * Constants.UPGRADE_ESTIMATES.CLICK_UPGRADE_WEIGHT;
    }

    // Fallback: Unknown upgrade type
    // Assign conservative 2% boost to total CPS
    return currentCPS * Constants.UPGRADE_ESTIMATES.CONSERVATIVE_BOOST;
  }

  /**
   * Finds which building is affected by an upgrade based on description.
   *
   * @private
   * @param {string} description - Upgrade description (lowercase)
   * @returns {Object|null} Affected building, or null if none/unknown
   */
  _findAffectedBuilding(description) {
    // Check if description mentions any building name
    const buildingMatch = description.match(Constants.UPGRADE_PATTERNS.BUILDING_REFERENCE);
    if (!buildingMatch) {
      return null;
    }

    const buildingName = buildingMatch[1];

    // Find the building in our game state
    // Need to match case-insensitively
    for (const building of this.gameState.buildings) {
      if (building.name.toLowerCase() === buildingName.toLowerCase()) {
        return building;
      }
    }

    return null;
  }

  /**
   * Calculates ROI time with safety checks.
   *
   * @private
   * @param {number} cost - Cost of purchase
   * @param {number} deltaCPS - CPS increase
   * @returns {number} ROI time in seconds, or Infinity if invalid
   */
  _calculateROITime(cost, deltaCPS) {
    // Guard against zero or negative deltaCPS
    if (deltaCPS < Constants.MIN_VALID_DELTA_CPS) {
      return Infinity;
    }

    // ROI time = how many seconds until investment pays for itself
    const roiTime = cost / deltaCPS;

    // Sanity check
    if (!isFinite(roiTime) || roiTime < 0) {
      return Infinity;
    }

    return roiTime;
  }

  /**
   * Gets candidate by ID.
   *
   * @param {string} id - Candidate ID
   * @returns {Object|null} Candidate with ROI data, or null if not found
   */
  getCandidate(id) {
    const candidates = this.getAllCandidates();
    return candidates.find(c => c.id === id) || null;
  }

  /**
   * Filters candidates by type.
   *
   * @param {string} type - 'building' or 'upgrade'
   * @returns {Array<Object>} Filtered candidates
   */
  getCandidatesByType(type) {
    return this.getAllCandidates().filter(c => c.type === type);
  }

  /**
   * Gets only affordable candidates (can be purchased now).
   *
   * @returns {Array<Object>} Affordable candidates
   */
  getAffordableCandidates() {
    const currentCookies = this.gameState.cookies;
    return this.getAllCandidates().filter(c =>
      Validators.isAffordable(c.cost, currentCookies)
    );
  }

  /**
   * Gets only valid candidates (finite ROI, reasonable time).
   *
   * @returns {Array<Object>} Valid candidates for recommendation
   */
  getValidCandidates() {
    return this.getAllCandidates().filter(c =>
      Validators.isValidROI(c.roiTime) &&
      c.roiTime <= Constants.MAX_REASONABLE_ROI
    );
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EconomicModel;
}
/**
 * StrategyEngine.js
 *
 * Pluggable strategy pattern for ranking purchase candidates.
 *
 * Architecture:
 * - Strategy base class defines interface
 * - Concrete strategies implement different ranking algorithms
 * - StrategyEngine orchestrates strategy execution
 *
 * v1: GreedyStrategy (lowest ROI time first)
 * Future: LookaheadStrategy, SynergyStrategy, BalancedStrategy
 */

/**
 * Base Strategy class (interface).
 * All strategies must implement the evaluate() method.
 */
class Strategy {
  /**
   * Evaluates and ranks purchase candidates.
   *
   * @param {Array<Object>} candidates - Array of candidates with ROI data
   * @returns {Array<Object>} Sorted array of recommendations
   */
  evaluate(candidates) {
    throw new Error('Strategy.evaluate() must be implemented by subclass');
  }

  /**
   * Gets the strategy name.
   *
   * @returns {string} Human-readable strategy name
   */
  getName() {
    return this.constructor.name;
  }
}

/**
 * Greedy Strategy: Recommend purchase with lowest ROI time.
 *
 * Algorithm:
 * 1. Filter out invalid candidates (Infinity ROI, too expensive, locked)
 * 2. Sort by ascending ROI time (lower = better)
 * 3. Return ordered recommendations
 *
 * Pros: Simple, intuitive, optimal for single-purchase horizon
 * Cons: Doesn't consider synergies or lookahead
 */
class GreedyStrategy extends Strategy {
  /**
   * Evaluates candidates using greedy algorithm.
   *
   * @param {Array<Object>} candidates - Array of candidates with ROI data
   * @returns {Array<Object>} Sorted recommendations (best first)
   */
  evaluate(candidates) {
    return candidates
      // Filter 1: Valid ROI (finite, positive)
      .filter(c => Validators.isValidROI(c.roiTime))

      // Filter 2: Reasonable timeframe (< 1 hour)
      .filter(c => c.roiTime <= Constants.MAX_REASONABLE_ROI)

      // Filter 3: Valid candidate structure
      .filter(c => Validators.isValidCandidate(c))

      // Sort: Ascending by ROI time (lowest first)
      .sort((a, b) => {
        // Primary: ROI time (lower is better)
        if (a.roiTime !== b.roiTime) {
          return a.roiTime - b.roiTime;
        }

        // Tiebreaker: Higher absolute CPS gain
        return b.deltaCPS - a.deltaCPS;
      });
  }
}

/**
 * Lookahead Strategy (Future implementation).
 *
 * Algorithm:
 * 1. Simulate purchasing each candidate
 * 2. For each purchase, calculate next N best purchases
 * 3. Rank by cumulative CPS gain over sequence
 *
 * Pros: Considers multi-step optimization
 * Cons: More complex, computationally expensive
 */
class LookaheadStrategy extends Strategy {
  constructor(depth = 3) {
    super();
    this.depth = depth; // How many purchases to look ahead
  }

  evaluate(candidates) {
    // TODO: Implement lookahead simulation
    // For now, fall back to greedy
    console.warn('LookaheadStrategy not yet implemented, using greedy fallback');
    return new GreedyStrategy().evaluate(candidates);
  }
}

/**
 * Synergy Strategy (Future implementation).
 *
 * Algorithm:
 * 1. Identify upgrades that combo with owned buildings
 * 2. Boost ROI for synergistic purchases
 * 3. Rank considering synergy multipliers
 *
 * Example: If you own many grandmas, prioritize grandma upgrades
 *
 * Pros: Maximizes building-upgrade synergies
 * Cons: Requires synergy database/detection
 */
class SynergyStrategy extends Strategy {
  evaluate(candidates) {
    // TODO: Implement synergy detection
    console.warn('SynergyStrategy not yet implemented, using greedy fallback');
    return new GreedyStrategy().evaluate(candidates);
  }
}

/**
 * Balanced Strategy (Future implementation).
 *
 * Algorithm:
 * 1. Mix ROI optimization with diversification
 * 2. Avoid over-investing in single building type
 * 3. Balance short-term and long-term gains
 *
 * Pros: More robust, reduces variance
 * Cons: May not be pure optimal
 */
class BalancedStrategy extends Strategy {
  evaluate(candidates) {
    // TODO: Implement balanced approach
    console.warn('BalancedStrategy not yet implemented, using greedy fallback');
    return new GreedyStrategy().evaluate(candidates);
  }
}

/**
 * StrategyEngine orchestrates strategy execution.
 * Allows hot-swapping strategies at runtime.
 */
class StrategyEngine {
  /**
   * Creates a new StrategyEngine.
   *
   * @param {Strategy} strategy - Initial strategy (defaults to Greedy)
   */
  constructor(strategy = null) {
    this.strategy = strategy || new GreedyStrategy();

    // Validate strategy
    if (!(this.strategy instanceof Strategy)) {
      throw new Error('Strategy must extend Strategy base class');
    }
  }

  /**
   * Gets recommendations using current strategy.
   *
   * @param {Array<Object>} candidates - Array of candidates with ROI data
   * @returns {Array<Object>} Sorted recommendations
   */
  recommend(candidates) {
    // Validate input
    if (!Array.isArray(candidates)) {
      throw new Error('Candidates must be an array');
    }

    // Execute strategy
    try {
      const recommendations = this.strategy.evaluate(candidates);

      // Validate output
      if (!Array.isArray(recommendations)) {
        throw new Error('Strategy.evaluate() must return an array');
      }

      return recommendations;
    } catch (error) {
      console.error('Strategy execution failed:', error);
      // Fallback to greedy if strategy fails
      if (!(this.strategy instanceof GreedyStrategy)) {
        console.warn('Falling back to GreedyStrategy');
        this.strategy = new GreedyStrategy();
        return this.strategy.evaluate(candidates);
      }
      // Re-throw if greedy also fails
      throw error;
    }
  }

  /**
   * Changes the active strategy.
   *
   * @param {Strategy} newStrategy - New strategy to use
   */
  setStrategy(newStrategy) {
    if (!(newStrategy instanceof Strategy)) {
      throw new Error('Strategy must extend Strategy base class');
    }
    this.strategy = newStrategy;
  }

  /**
   * Gets the current strategy name.
   *
   * @returns {string} Strategy name
   */
  getStrategyName() {
    return this.strategy.getName();
  }

  /**
   * Gets the top N recommendations.
   *
   * @param {Array<Object>} candidates - Candidates to evaluate
   * @param {number} count - Number of recommendations to return
   * @returns {Array<Object>} Top N recommendations
   */
  getTopRecommendations(candidates, count = Constants.TOP_ALTERNATIVES_COUNT) {
    const all = this.recommend(candidates);
    return all.slice(0, count);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Strategy,
    GreedyStrategy,
    LookaheadStrategy,
    SynergyStrategy,
    BalancedStrategy,
    StrategyEngine
  };
}
/**
 * OutputRenderer.js
 *
 * Formats recommendations for console output with clean, readable display.
 *
 * Features:
 * - ASCII art borders for visual hierarchy
 * - Number formatting (K, M, B, T suffixes)
 * - Time formatting (seconds → human readable)
 * - Color-coded output (where supported)
 */

class OutputRenderer {
  /**
   * Renders the main recommendation output to console.
   *
   * @param {Object} topChoice - Best recommendation
   * @param {Array<Object>} alternatives - Alternative recommendations (top 5)
   * @param {Object} gameState - Current game state
   */
  renderRecommendation(topChoice, alternatives, gameState) {
    // Clear console for clean output (optional)
    // console.clear();

    // Header
    this._renderHeader();

    // Current game status
    this._renderGameStatus(gameState);

    // Best investment
    if (topChoice) {
      this._renderBestChoice(topChoice, gameState);
    } else {
      this._renderNoRecommendation();
    }

    // Top alternatives
    if (alternatives && alternatives.length > 0) {
      this._renderAlternatives(alternatives);
    }

    // Footer (optional tips)
    this._renderFooter();
  }

  /**
   * Renders the header banner.
   *
   * @private
   */
  _renderHeader() {
    const line = this._repeat(Constants.BORDERS.DOUBLE_LINE, 51);
    console.log(line);
    console.log(`  ${Constants.ICONS.COOKIE} COOKIE CLICKER ROI ADVISOR`);
    console.log(line);
    console.log('');
  }

  /**
   * Renders current game status.
   *
   * @private
   * @param {Object} gameState - Current game state
   */
  _renderGameStatus(gameState) {
    console.log('Current Status:');
    console.log(`  Cookies: ${this._formatCurrency(gameState.cookies)}`);
    console.log(`  CPS: ${this._formatCurrency(gameState.cookiesPerSecond)}/sec`);
    console.log('');
  }

  /**
   * Renders the best investment recommendation.
   *
   * @private
   * @param {Object} choice - Top recommendation
   * @param {Object} gameState - Current game state
   */
  _renderBestChoice(choice, gameState) {
    const line = this._repeat(Constants.BORDERS.SINGLE_LINE, 51);
    console.log(line);
    console.log(`${Constants.ICONS.BEST} BEST INVESTMENT ${Constants.ICONS.BEST}`);
    console.log(line);
    console.log('');

    // Determine if affordable
    const affordable = Validators.isAffordable(choice.cost, gameState.cookies);
    const timeToAfford = affordable
      ? 0
      : (choice.cost - gameState.cookies) / gameState.cookiesPerSecond;

    // Main recommendation
    console.log(`  ${Constants.ICONS.ARROW} ${choice.displayName || choice.name}`);
    console.log(`    Cost: ${this._formatCurrency(choice.cost)} cookies`);
    console.log(`    Benefit: +${this._formatCurrency(choice.deltaCPS)} CPS`);
    console.log(`    ROI Time: ${this._formatTime(choice.roiTime)}`);

    // Affordability message
    if (!affordable && timeToAfford < 3600) {
      console.log(`    Wait: ${this._formatTime(timeToAfford)} until affordable`);
    } else if (!affordable) {
      console.log(`    Status: Not yet affordable`);
    } else {
      console.log(`    Status: ✓ Affordable now!`);
    }

    console.log('');
  }

  /**
   * Renders message when no recommendation is available.
   *
   * @private
   */
  _renderNoRecommendation() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('No recommendations available.');
    console.log('This might mean:');
    console.log('  - All purchases have very long ROI times (>1 hour)');
    console.log('  - No purchases are currently unlocked');
    console.log('  - Game state could not be read properly');
    console.log('');
  }

  /**
   * Renders alternative recommendations.
   *
   * @private
   * @param {Array<Object>} alternatives - Top alternatives
   */
  _renderAlternatives(alternatives) {
    const line = this._repeat(Constants.BORDERS.SINGLE_LINE, 51);
    console.log(line);
    console.log(`${Constants.ICONS.ALTERNATIVES} TOP ${alternatives.length} ALTERNATIVES`);
    console.log(line);
    console.log('');

    alternatives.forEach((alt, index) => {
      const rank = index + 1;
      const displayName = alt.displayName || alt.name;
      const cost = this._formatCurrency(alt.cost);
      const deltaCPS = this._formatCurrency(alt.deltaCPS);
      const roi = this._formatTime(alt.roiTime);

      console.log(`${rank}. ${displayName}`);
      console.log(`   Cost: ${cost} | +${deltaCPS} CPS | ROI: ${roi}`);
    });

    console.log('');
  }

  /**
   * Renders footer with tips.
   *
   * @private
   */
  _renderFooter() {
    const line = this._repeat(Constants.BORDERS.THIN_LINE, 51);
    console.log(line);
    console.log('Run CookieAdvisor.analyze() again after purchasing.');
    console.log(line);
  }

  /**
   * Formats a number as currency with K/M/B/T suffixes.
   *
   * @private
   * @param {number} amount - Number to format
   * @returns {string} Formatted string (e.g., "1.23M")
   */
  _formatCurrency(amount) {
    if (amount === 0) {
      return '0';
    }

    if (amount < 1000) {
      return amount.toFixed(Constants.NUMBER_PRECISION);
    }

    // Find appropriate suffix
    for (const { threshold, suffix } of Constants.NUMBER_SUFFIXES) {
      if (amount >= threshold) {
        const scaled = amount / threshold;
        return scaled.toFixed(Constants.NUMBER_PRECISION) + suffix;
      }
    }

    // Fallback: no suffix
    return amount.toFixed(Constants.NUMBER_PRECISION);
  }

  /**
   * Formats time in seconds to human-readable format.
   *
   * @private
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted string (e.g., "1h 23m 45s")
   */
  _formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) {
      return '∞';
    }

    if (seconds < 1) {
      return '<1s';
    }

    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (secs > 0 && hours === 0) {
      // Only show seconds if < 1 hour
      parts.push(`${secs}s`);
    }

    return parts.join(' ');
  }

  /**
   * Repeats a character N times.
   *
   * @private
   * @param {string} char - Character to repeat
   * @param {number} count - Number of repetitions
   * @returns {string} Repeated string
   */
  _repeat(char, count) {
    return char.repeat(count);
  }

  /**
   * Renders a simple summary (for programmatic use).
   *
   * @param {Object} recommendation - Top recommendation
   * @returns {string} Summary string
   */
  renderSummary(recommendation) {
    if (!recommendation) {
      return 'No recommendation available';
    }

    return `${recommendation.name}: Cost ${this._formatCurrency(recommendation.cost)}, ` +
           `+${this._formatCurrency(recommendation.deltaCPS)} CPS, ` +
           `ROI ${this._formatTime(recommendation.roiTime)}`;
  }

  /**
   * Renders detailed candidate information (for debugging).
   *
   * @param {Object} candidate - Candidate with ROI data
   */
  renderCandidateDetail(candidate) {
    console.log('─────────────────────────────────────────────');
    console.log(`${candidate.type.toUpperCase()}: ${candidate.name}`);
    console.log('─────────────────────────────────────────────');
    console.log(`ID: ${candidate.id}`);
    console.log(`Cost: ${this._formatCurrency(candidate.cost)} cookies`);
    console.log(`Delta CPS: +${this._formatCurrency(candidate.deltaCPS)}`);
    console.log(`ROI Time: ${this._formatTime(candidate.roiTime)}`);

    if (candidate.type === 'building') {
      console.log(`Currently Owned: ${candidate.currentOwned}`);
    }

    if (candidate.type === 'upgrade') {
      console.log(`Permanent: ${candidate.isPermanent ? 'Yes' : 'No'}`);
    }

    console.log('─────────────────────────────────────────────');
  }

  /**
   * Renders a comparison table of all candidates (for debugging).
   *
   * @param {Array<Object>} candidates - All candidates
   */
  renderCandidateTable(candidates) {
    if (candidates.length === 0) {
      console.log('No candidates available.');
      return;
    }

    console.log('All Candidates (sorted by ROI):');
    console.log('─────────────────────────────────────────────');

    // Sort by ROI
    const sorted = [...candidates].sort((a, b) => a.roiTime - b.roiTime);

    // Table header
    console.log(
      'Rank'.padEnd(6) +
      'Name'.padEnd(25) +
      'Cost'.padEnd(12) +
      'CPS'.padEnd(12) +
      'ROI'.padEnd(10)
    );
    console.log('─────────────────────────────────────────────');

    // Table rows
    sorted.forEach((candidate, index) => {
      const rank = (index + 1).toString().padEnd(6);
      const name = candidate.name.substring(0, 22).padEnd(25);
      const cost = this._formatCurrency(candidate.cost).padEnd(12);
      const cps = ('+' + this._formatCurrency(candidate.deltaCPS)).padEnd(12);
      const roi = this._formatTime(candidate.roiTime).padEnd(10);

      console.log(rank + name + cost + cps + roi);
    });

    console.log('─────────────────────────────────────────────');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OutputRenderer;
}
/**
 * advisor.js
 *
 * Main entry point for the Cookie Clicker ROI Advisor.
 * Orchestrates all modules and exposes a clean public API.
 *
 * Usage:
 *   CookieAdvisor.analyze()           - Run analysis and show recommendations
 *   CookieAdvisor.setStrategy(strat)  - Change ranking strategy
 *   CookieAdvisor.getRecommendation() - Get top recommendation without rendering
 *
 * This file should be loaded AFTER all other modules.
 */

const CookieAdvisor = (function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE STATE
  // ═══════════════════════════════════════════════════════════════

  let currentStrategy = new GreedyStrategy();
  let lastRecommendation = null;

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  /**
   * Runs full analysis and displays recommendations to console.
   *
   * @returns {Object|null} Top recommendation, or null if none available
   */
  function analyze() {
    try {
      // Step 1: Validate Game object exists
      if (typeof window === 'undefined' || !window.Game) {
        console.error('❌ Cookie Clicker Game object not found!');
        console.log('Make sure you are running this in the Cookie Clicker browser console.');
        return null;
      }

      if (!Validators.isValidGameObject(window.Game)) {
        console.error('❌ Game object is invalid or incomplete.');
        console.log('Make sure Cookie Clicker has finished loading.');
        return null;
      }

      // Step 2: Extract game state
      const adapter = new GameStateAdapter(window.Game);
      const gameState = adapter.getGameState();

      // Validate extracted state
      if (!Validators.isValidGameState(gameState)) {
        console.error('❌ Failed to extract valid game state.');
        return null;
      }

      // Step 3: Calculate ROI for all candidates
      const model = new EconomicModel(gameState);
      const candidates = model.getAllCandidates();

      if (candidates.length === 0) {
        console.warn('⚠️ No purchase candidates found.');
        console.log('This might mean all buildings/upgrades are locked or unavailable.');
        return null;
      }

      // Step 4: Apply strategy to rank candidates
      const engine = new StrategyEngine(currentStrategy);
      const recommendations = engine.recommend(candidates);

      if (recommendations.length === 0) {
        console.warn('⚠️ No valid recommendations after filtering.');
        console.log('All available purchases may have very long ROI times (>1 hour).');
        console.log('Try: CookieAdvisor.showAll() to see all options.');
        return null;
      }

      // Step 5: Render output
      const renderer = new OutputRenderer();
      const topChoice = recommendations[0];
      const alternatives = recommendations.slice(1, Constants.TOP_ALTERNATIVES_COUNT + 1);

      renderer.renderRecommendation(topChoice, alternatives, gameState);

      // Cache result
      lastRecommendation = topChoice;

      return topChoice;

    } catch (error) {
      console.error('❌ Error during analysis:', error);
      console.error(error.stack);
      return null;
    }
  }

  /**
   * Gets the top recommendation without rendering output.
   * Useful for programmatic access or monitoring.
   *
   * @returns {Object|null} Top recommendation, or null if none available
   */
  function getRecommendation() {
    try {
      if (typeof window === 'undefined' || !window.Game) {
        return null;
      }

      const adapter = new GameStateAdapter(window.Game);
      const gameState = adapter.getGameState();
      const model = new EconomicModel(gameState);
      const candidates = model.getAllCandidates();
      const engine = new StrategyEngine(currentStrategy);
      const recommendations = engine.recommend(candidates);

      return recommendations.length > 0 ? recommendations[0] : null;

    } catch (error) {
      console.error('Error getting recommendation:', error);
      return null;
    }
  }

  /**
   * Gets all recommendations (not just top one).
   *
   * @param {number} limit - Maximum number of recommendations to return
   * @returns {Array<Object>} Array of recommendations
   */
  function getAllRecommendations(limit = 10) {
    try {
      if (typeof window === 'undefined' || !window.Game) {
        return [];
      }

      const adapter = new GameStateAdapter(window.Game);
      const gameState = adapter.getGameState();
      const model = new EconomicModel(gameState);
      const candidates = model.getAllCandidates();
      const engine = new StrategyEngine(currentStrategy);
      const recommendations = engine.recommend(candidates);

      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Shows ALL recommendations without time filtering.
   * Useful when all normal recommendations have very long ROI times.
   *
   * @returns {Object|null} Top recommendation (unfiltered), or null if none available
   */
  function showAll() {
    try {
      // Step 1: Validate Game object exists
      if (typeof window === 'undefined' || !window.Game) {
        console.error('❌ Cookie Clicker Game object not found!');
        console.log('Make sure you are running this in the Cookie Clicker browser console.');
        return null;
      }

      if (!Validators.isValidGameObject(window.Game)) {
        console.error('❌ Game object is invalid or incomplete.');
        console.log('Make sure Cookie Clicker has finished loading.');
        return null;
      }

      // Step 2: Extract game state
      const adapter = new GameStateAdapter(window.Game);
      const gameState = adapter.getGameState();

      // Validate extracted state
      if (!Validators.isValidGameState(gameState)) {
        console.error('❌ Failed to extract valid game state.');
        return null;
      }

      // Step 3: Calculate ROI for all candidates
      const model = new EconomicModel(gameState);
      const candidates = model.getAllCandidates();

      if (candidates.length === 0) {
        console.warn('⚠️ No purchase candidates found.');
        console.log('This might mean all buildings/upgrades are locked or unavailable.');
        return null;
      }

      // Step 4: Use relaxed strategy (no time filter)
      console.log('🔎 Showing ALL candidates (no time filter)...');

      // Create inline RelaxedStrategy to avoid dependency issues
      const relaxedRecommendations = candidates
        .filter(c => Validators.isValidROI(c.roiTime))
        .filter(c => Validators.isValidCandidate(c))
        .sort((a, b) => a.roiTime - b.roiTime);

      if (relaxedRecommendations.length === 0) {
        console.warn('⚠️ No valid candidates found even without time filter.');
        console.log('This might indicate an issue with game state extraction.');
        return null;
      }

      // Step 5: Render output
      const renderer = new OutputRenderer();
      const topChoice = relaxedRecommendations[0];
      const alternatives = relaxedRecommendations.slice(1, Constants.TOP_ALTERNATIVES_COUNT + 1);

      renderer.renderRecommendation(topChoice, alternatives, gameState);

      // Cache result
      lastRecommendation = topChoice;

      return topChoice;

    } catch (error) {
      console.error('❌ Error during analysis:', error);
      console.error(error.stack);
      return null;
    }
  }

  /**
   * Changes the active ranking strategy.
   *
   * @param {Strategy} strategy - New strategy instance
   */
  function setStrategy(strategy) {
    if (!(strategy instanceof Strategy)) {
      console.error('❌ Invalid strategy. Must be an instance of Strategy class.');
      console.log('Available strategies: GreedyStrategy, LookaheadStrategy, SynergyStrategy');
      return;
    }

    currentStrategy = strategy;
    console.log(`✓ Strategy changed to: ${strategy.getName()}`);
  }

  /**
   * Gets the current strategy name.
   *
   * @returns {string} Strategy name
   */
  function getStrategyName() {
    return currentStrategy.getName();
  }

  /**
   * Gets the last recommendation (cached).
   *
   * @returns {Object|null} Last recommendation
   */
  function getLastRecommendation() {
    return lastRecommendation;
  }

  /**
   * Displays debug information about current game state.
   */
  function debug() {
    try {
      console.log('═══════════════════════════════════════════════════');
      console.log('  DEBUG INFO');
      console.log('═══════════════════════════════════════════════════');

      if (typeof window === 'undefined' || !window.Game) {
        console.log('❌ Game object not found');
        return;
      }

      const adapter = new GameStateAdapter(window.Game);
      const gameState = adapter.getGameState();
      const model = new EconomicModel(gameState);
      const candidates = model.getAllCandidates();

      console.log('Game State:');
      console.log(`  Cookies: ${gameState.cookies}`);
      console.log(`  CPS: ${gameState.cookiesPerSecond}`);
      console.log(`  Buildings: ${gameState.buildings.length}`);
      console.log(`  Upgrades: ${gameState.upgrades.length}`);
      console.log('');

      console.log('Candidates:');
      console.log(`  Total: ${candidates.length}`);
      console.log(`  Buildings: ${candidates.filter(c => c.type === 'building').length}`);
      console.log(`  Upgrades: ${candidates.filter(c => c.type === 'upgrade').length}`);
      console.log('');

      const validCandidates = candidates.filter(c =>
        Validators.isValidROI(c.roiTime) &&
        c.roiTime <= Constants.MAX_REASONABLE_ROI
      );
      console.log(`Valid Recommendations: ${validCandidates.length}`);
      console.log('');

      console.log('Strategy:');
      console.log(`  Current: ${currentStrategy.getName()}`);
      console.log('');

      // Show candidate table
      const renderer = new OutputRenderer();
      renderer.renderCandidateTable(validCandidates.slice(0, 10));

    } catch (error) {
      console.error('Error in debug:', error);
    }
  }

  /**
   * Displays help information.
   */
  function help() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🍪 COOKIE CLICKER ROI ADVISOR - HELP');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('COMMANDS:');
    console.log('  CookieAdvisor.analyze()');
    console.log('    → Run full analysis and show recommendations');
    console.log('');
    console.log('  CookieAdvisor.showAll()');
    console.log('    → Show ALL options (no time filter)');
    console.log('');
    console.log('  CookieAdvisor.getRecommendation()');
    console.log('    → Get top recommendation without output');
    console.log('');
    console.log('  CookieAdvisor.setStrategy(new LookaheadStrategy())');
    console.log('    → Change ranking strategy');
    console.log('');
    console.log('  CookieAdvisor.debug()');
    console.log('    → Show debug information');
    console.log('');
    console.log('  CookieAdvisor.help()');
    console.log('    → Show this help message');
    console.log('');
    console.log('STRATEGIES:');
    console.log('  GreedyStrategy (default) - Lowest ROI time first');
    console.log('  LookaheadStrategy - Simulates N purchases ahead');
    console.log('  SynergyStrategy - Prioritizes building synergies');
    console.log('  BalancedStrategy - Mix ROI with diversification');
    console.log('');
    console.log('HOW ROI WORKS:');
    console.log('  ROI Time = Cost / Delta CPS');
    console.log('  Example: 1,000 cookies / 10 CPS = 100 seconds');
    console.log('  Lower ROI time = better investment (pays back faster)');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
  }

  /**
   * Gets version information.
   *
   * @returns {string} Version string
   */
  function version() {
    return 'Cookie Clicker ROI Advisor v1.0.0 - Greedy Strategy';
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  // Auto-run welcome message on load (optional)
  console.log('✓ Cookie Clicker ROI Advisor loaded successfully!');
  console.log('Run CookieAdvisor.analyze() to get started.');
  console.log('Run CookieAdvisor.help() for more information.');

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API EXPORT
  // ═══════════════════════════════════════════════════════════════

  return {
    analyze,
    getRecommendation,
    getAllRecommendations,
    showAll,
    setStrategy,
    getStrategyName,
    getLastRecommendation,
    debug,
    help,
    version
  };

})();

// Make it global in browser
if (typeof window !== 'undefined') {
  window.CookieAdvisor = CookieAdvisor;
}

// Export for Node.js (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieAdvisor;
}

})();
