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
