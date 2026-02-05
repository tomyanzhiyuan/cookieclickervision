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
