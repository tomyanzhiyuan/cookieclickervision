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
