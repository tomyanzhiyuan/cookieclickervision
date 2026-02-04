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

    // Must have base CPS value
    if (typeof building.cps !== 'number' || building.cps < 0) {
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
