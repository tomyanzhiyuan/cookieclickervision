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
 * - CookieAdvisor.analyze()              → Show best investment
 * - CookieAdvisor.help()                 → View all commands
 * - CookieAdvisor.showAll()              → Show ALL candidates (no time filter)
 * - CookieAdvisor.useGreedy()            → Use default strategy (1-hour filter)
 * - CookieAdvisor.useRelaxed()           → See all options (no time filter)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: Constants.js
// ═══════════════════════════════════════════════════════════════════════════

const Constants = {
  MAX_REASONABLE_ROI: 3600, // 1 hour
  MIN_VALID_DELTA_CPS: 0.001,

  UPGRADE_PATTERNS: {
    MULTIPLIER: /(\d+)x\s+as\s+efficient/i,
    PERCENTAGE_BOOST: /(\d+)%/,
    FLAT_COOKIE_BONUS: /\+(\d+\.?\d*)\s+cookies?\s+per/i,
    BUILDING_REFERENCE: /(cursor|grandma|farm|mine|factory|bank|temple|wizard tower|shipment|alchemy lab|portal|time machine|antimatter condenser|prism|chancemaker|fractal engine|javascript console|idleverse)/i
  },

  UPGRADE_ESTIMATES: {
    CONSERVATIVE_BOOST: 0.02,
    CLICK_UPGRADE_WEIGHT: 0.01,
    SYNERGY_MULTIPLIER: 0.5
  },

  TOP_ALTERNATIVES_COUNT: 5,
  NUMBER_PRECISION: 2,

  NUMBER_SUFFIXES: [
    { threshold: 1e15, suffix: 'Qa' },
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' }
  ],

  BUILDINGS: [
    'Cursor', 'Grandma', 'Farm', 'Mine', 'Factory', 'Bank', 'Temple',
    'Wizard tower', 'Shipment', 'Alchemy lab', 'Portal', 'Time machine',
    'Antimatter condenser', 'Prism', 'Chancemaker', 'Fractal engine',
    'Javascript console', 'Idleverse'
  ],

  BORDERS: {
    DOUBLE_LINE: '═',
    SINGLE_LINE: '━',
    THIN_LINE: '─'
  },

  ICONS: {
    COOKIE: '🍪',
    BEST: '✨',
    ALTERNATIVES: '📊',
    ARROW: '→',
    BUILDING: '🏢',
    UPGRADE: '⬆️'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: Validators.js
// ═══════════════════════════════════════════════════════════════════════════

const Validators = {
  isValidGameObject(game) {
    if (!game) return false;
    if (typeof game.cookies !== 'number') return false;
    if (typeof game.cookiesPs !== 'number') return false;
    if (!game.Objects || typeof game.Objects !== 'object') return false;
    if (!game.UpgradesInStore || !Array.isArray(game.UpgradesInStore)) return false;
    return true;
  },

  isValidBuilding(building) {
    if (!building) return false;
    if (typeof building.name !== 'string' || building.name.length === 0) return false;
    if (typeof building.amount !== 'number') return false;
    if (typeof building.price !== 'number' || building.price < 0) return false;
    if (typeof building.cps !== 'function' && typeof building.storedCps !== 'number') return false;
    return true;
  },

  isValidUpgrade(upgrade) {
    if (!upgrade) return false;
    if (typeof upgrade.name !== 'string' || upgrade.name.length === 0) return false;
    if (typeof upgrade.getPrice !== 'function' && typeof upgrade.basePrice !== 'number') return false;
    return true;
  },

  isValidROI(roiTime) {
    if (typeof roiTime !== 'number') return false;
    if (!isFinite(roiTime)) return false;
    if (roiTime <= 0) return false;
    return true;
  },

  isValidDeltaCPS(deltaCPS) {
    if (typeof deltaCPS !== 'number') return false;
    if (!isFinite(deltaCPS)) return false;
    if (deltaCPS <= 0) return false;
    return true;
  },

  isAffordable(cost, cookies) {
    if (typeof cost !== 'number' || typeof cookies !== 'number') return false;
    return cost <= cookies;
  },

  isReasonablyAffordable(cost, cookies) {
    if (typeof cost !== 'number' || typeof cookies !== 'number') return false;
    return cost <= cookies * 10;
  },

  isValidGameState(gameState) {
    if (!gameState) return false;
    if (typeof gameState.cookies !== 'number') return false;
    if (typeof gameState.cookiesPerSecond !== 'number') return false;
    if (!Array.isArray(gameState.buildings)) return false;
    if (!Array.isArray(gameState.upgrades)) return false;
    return true;
  },

  isValidCandidate(candidate) {
    if (!candidate) return false;
    const requiredProps = ['id', 'type', 'name', 'cost', 'deltaCPS', 'roiTime'];
    for (const prop of requiredProps) {
      if (!(prop in candidate)) return false;
    }
    if (candidate.type !== 'building' && candidate.type !== 'upgrade') return false;
    if (typeof candidate.cost !== 'number' || candidate.cost <= 0) return false;
    return true;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: GameStateAdapter.js
// ═══════════════════════════════════════════════════════════════════════════

class GameStateAdapter {
  constructor(gameObject) {
    if (!Validators.isValidGameObject(gameObject)) {
      throw new Error('Invalid Game object provided to GameStateAdapter');
    }
    this.game = gameObject;
  }

  getGameState() {
    return {
      cookies: this.game.cookies,
      cookiesPerSecond: this.game.cookiesPs,
      buildings: this._extractBuildings(),
      upgrades: this._extractUpgrades()
    };
  }

  _extractBuildings() {
    const buildings = [];
    for (const buildingKey in this.game.Objects) {
      const building = this.game.Objects[buildingKey];
      if (!Validators.isValidBuilding(building)) {
        console.warn(`Invalid building skipped: ${buildingKey}`);
        continue;
      }
      buildings.push(this._extractBuildingState(building, buildingKey));
    }
    return buildings;
  }

  _extractBuildingState(building, key) {
    const baseCPS = typeof building.cps === 'function'
      ? building.cps(building)
      : (building.cps || 0);

    return {
      id: key,
      name: building.name,
      owned: building.amount,
      cost: building.price,
      baseCPS: baseCPS,
      totalCPS: building.storedCps || 0,
      unlocked: building.unlocked !== 0,
      bought: building.bought
    };
  }

  _extractUpgrades() {
    const upgrades = [];
    for (let i = 0; i < this.game.UpgradesInStore.length; i++) {
      const upgrade = this.game.UpgradesInStore[i];
      if (!Validators.isValidUpgrade(upgrade)) {
        console.warn(`Invalid upgrade skipped: ${upgrade?.name || 'unknown'}`);
        continue;
      }
      upgrades.push(this._extractUpgradeState(upgrade, i));
    }
    return upgrades;
  }

  _extractUpgradeState(upgrade, index) {
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
      description: upgrade.desc || '',
      descriptionDetail: upgrade.ddesc || '',
      pool: upgrade.pool || 'standard',
      unlocked: this._isUpgradeUnlocked(upgrade)
    };
  }

  _isUpgradeUnlocked(upgrade) {
    if (upgrade.unlocked === false) return false;
    if (upgrade.bought) return false;
    return true;
  }

  getBuilding(buildingName) {
    const building = this.game.Objects[buildingName];
    if (!building || !Validators.isValidBuilding(building)) {
      return null;
    }
    return this._extractBuildingState(building, buildingName);
  }

  getFinancialState() {
    return {
      cookies: this.game.cookies,
      cps: this.game.cookiesPs
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: EconomicModel.js
// ═══════════════════════════════════════════════════════════════════════════

class EconomicModel {
  constructor(gameState) {
    if (!Validators.isValidGameState(gameState)) {
      throw new Error('Invalid game state provided to EconomicModel');
    }
    this.gameState = gameState;
  }

  getAllCandidates() {
    const candidates = [];
    for (const building of this.gameState.buildings) {
      const roi = this.calculateBuildingROI(building);
      if (roi) candidates.push(roi);
    }
    for (const upgrade of this.gameState.upgrades) {
      const roi = this.calculateUpgradeROI(upgrade);
      if (roi) candidates.push(roi);
    }
    return candidates;
  }

  calculateBuildingROI(building) {
    const cost = building.cost;
    const baseCPS = building.baseCPS;
    const owned = building.owned;
    const totalCPS = building.totalCPS;

    if (cost <= 0 || baseCPS < 0) return null;

    let multiplier = 1.0;
    if (owned > 0 && totalCPS > 0) {
      const baseTotal = baseCPS * owned;
      if (baseTotal > 0) {
        multiplier = totalCPS / baseTotal;
      }
    }

    const deltaCPS = baseCPS * multiplier;
    const roiTime = this._calculateROITime(cost, deltaCPS);

    return {
      id: building.id,
      type: 'building',
      name: building.name,
      cost: cost,
      deltaCPS: deltaCPS,
      roiTime: roiTime,
      currentOwned: owned,
      displayName: `${building.name} (#${owned + 1})`
    };
  }

  calculateUpgradeROI(upgrade) {
    const cost = upgrade.cost;
    const description = upgrade.descriptionDetail || upgrade.description || '';

    if (cost <= 0) return null;

    const deltaCPS = this._estimateUpgradeCPS(upgrade, description);
    const roiTime = this._calculateROITime(cost, deltaCPS);

    return {
      id: upgrade.id,
      type: 'upgrade',
      name: upgrade.name,
      cost: cost,
      deltaCPS: deltaCPS,
      roiTime: roiTime,
      isPermanent: true,
      displayName: `[Upgrade] ${upgrade.name}`
    };
  }

  _estimateUpgradeCPS(upgrade, description) {
    const desc = description.toLowerCase();
    const currentCPS = this.gameState.cookiesPerSecond;

    const multiplierMatch = desc.match(Constants.UPGRADE_PATTERNS.MULTIPLIER);
    if (multiplierMatch) {
      const multiplier = parseFloat(multiplierMatch[1]);
      const affectedBuilding = this._findAffectedBuilding(desc);
      if (affectedBuilding) {
        return affectedBuilding.totalCPS * (multiplier - 1);
      }
    }

    const percentMatch = desc.match(Constants.UPGRADE_PATTERNS.PERCENTAGE_BOOST);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      const affectedBuilding = this._findAffectedBuilding(desc);
      if (affectedBuilding) {
        return affectedBuilding.totalCPS * (percent / 100);
      } else {
        return currentCPS * (percent / 100);
      }
    }

    const flatMatch = desc.match(Constants.UPGRADE_PATTERNS.FLAT_COOKIE_BONUS);
    if (flatMatch) {
      const bonusPerClick = parseFloat(flatMatch[1]);
      const estimatedClicksPerSec = 1.5;
      return bonusPerClick * estimatedClicksPerSec;
    }

    const affectedBuilding = this._findAffectedBuilding(desc);
    if (affectedBuilding) {
      return affectedBuilding.totalCPS * Constants.UPGRADE_ESTIMATES.SYNERGY_MULTIPLIER;
    }

    if (desc.includes('click') || desc.includes('cursor')) {
      return currentCPS * Constants.UPGRADE_ESTIMATES.CLICK_UPGRADE_WEIGHT;
    }

    return currentCPS * Constants.UPGRADE_ESTIMATES.CONSERVATIVE_BOOST;
  }

  _findAffectedBuilding(description) {
    const buildingMatch = description.match(Constants.UPGRADE_PATTERNS.BUILDING_REFERENCE);
    if (!buildingMatch) return null;

    const buildingName = buildingMatch[1];
    for (const building of this.gameState.buildings) {
      if (building.name.toLowerCase() === buildingName.toLowerCase()) {
        return building;
      }
    }
    return null;
  }

  _calculateROITime(cost, deltaCPS) {
    if (deltaCPS < Constants.MIN_VALID_DELTA_CPS) return Infinity;
    const roiTime = cost / deltaCPS;
    if (!isFinite(roiTime) || roiTime < 0) return Infinity;
    return roiTime;
  }

  getCandidate(id) {
    const candidates = this.getAllCandidates();
    return candidates.find(c => c.id === id) || null;
  }

  getCandidatesByType(type) {
    return this.getAllCandidates().filter(c => c.type === type);
  }

  getAffordableCandidates() {
    const currentCookies = this.gameState.cookies;
    return this.getAllCandidates().filter(c =>
      Validators.isAffordable(c.cost, currentCookies)
    );
  }

  getValidCandidates() {
    return this.getAllCandidates().filter(c =>
      Validators.isValidROI(c.roiTime) &&
      c.roiTime <= Constants.MAX_REASONABLE_ROI
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: StrategyEngine.js
// ═══════════════════════════════════════════════════════════════════════════

class Strategy {
  evaluate(candidates) {
    throw new Error('Strategy.evaluate() must be implemented by subclass');
  }

  getName() {
    return this.constructor.name;
  }
}

class GreedyStrategy extends Strategy {
  evaluate(candidates) {
    return candidates
      .filter(c => Validators.isValidROI(c.roiTime))
      .filter(c => c.roiTime <= Constants.MAX_REASONABLE_ROI)
      .filter(c => Validators.isValidCandidate(c))
      .sort((a, b) => {
        if (a.roiTime !== b.roiTime) {
          return a.roiTime - b.roiTime;
        }
        return b.deltaCPS - a.deltaCPS;
      });
  }
}

class RelaxedStrategy extends Strategy {
  evaluate(candidates) {
    return candidates
      .filter(c => Validators.isValidROI(c.roiTime))
      .filter(c => Validators.isValidCandidate(c))
      .sort((a, b) => a.roiTime - b.roiTime);
  }
}

class StrategyEngine {
  constructor(strategy = null) {
    this.strategy = strategy || new GreedyStrategy();
    if (!(this.strategy instanceof Strategy)) {
      throw new Error('Strategy must extend Strategy base class');
    }
  }

  recommend(candidates) {
    if (!Array.isArray(candidates)) {
      throw new Error('Candidates must be an array');
    }

    try {
      const recommendations = this.strategy.evaluate(candidates);
      if (!Array.isArray(recommendations)) {
        throw new Error('Strategy.evaluate() must return an array');
      }
      return recommendations;
    } catch (error) {
      console.error('Strategy execution failed:', error);
      if (!(this.strategy instanceof GreedyStrategy)) {
        console.warn('Falling back to GreedyStrategy');
        this.strategy = new GreedyStrategy();
        return this.strategy.evaluate(candidates);
      }
      throw error;
    }
  }

  setStrategy(newStrategy) {
    if (!(newStrategy instanceof Strategy)) {
      throw new Error('Strategy must extend Strategy base class');
    }
    this.strategy = newStrategy;
  }

  getStrategyName() {
    return this.strategy.getName();
  }

  getTopRecommendations(candidates, count = Constants.TOP_ALTERNATIVES_COUNT) {
    const all = this.recommend(candidates);
    return all.slice(0, count);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: OutputRenderer.js
// ═══════════════════════════════════════════════════════════════════════════

class OutputRenderer {
  renderRecommendation(topChoice, alternatives, gameState) {
    this._renderHeader();
    this._renderGameStatus(gameState);

    if (topChoice) {
      this._renderBestChoice(topChoice, gameState);
    } else {
      this._renderNoRecommendation();
    }

    if (alternatives && alternatives.length > 0) {
      this._renderAlternatives(alternatives);
    }

    this._renderFooter();
  }

  _renderHeader() {
    const line = this._repeat(Constants.BORDERS.DOUBLE_LINE, 51);
    console.log(line);
    console.log(`  ${Constants.ICONS.COOKIE} COOKIE CLICKER ROI ADVISOR`);
    console.log(line);
    console.log('');
  }

  _renderGameStatus(gameState) {
    console.log('Current Status:');
    console.log(`  Cookies: ${this._formatCurrency(gameState.cookies)}`);
    console.log(`  CPS: ${this._formatCurrency(gameState.cookiesPerSecond)}/sec`);
    console.log('');
  }

  _renderBestChoice(choice, gameState) {
    const line = this._repeat(Constants.BORDERS.SINGLE_LINE, 51);
    console.log(line);
    console.log(`${Constants.ICONS.BEST} BEST INVESTMENT ${Constants.ICONS.BEST}`);
    console.log(line);
    console.log('');

    const affordable = Validators.isAffordable(choice.cost, gameState.cookies);
    const timeToAfford = affordable
      ? 0
      : (choice.cost - gameState.cookies) / gameState.cookiesPerSecond;

    console.log(`  ${Constants.ICONS.ARROW} ${choice.displayName || choice.name}`);
    console.log(`    Cost: ${this._formatCurrency(choice.cost)} cookies`);
    console.log(`    Benefit: +${this._formatCurrency(choice.deltaCPS)} CPS`);
    console.log(`    ROI Time: ${this._formatTime(choice.roiTime)}`);

    if (!affordable && timeToAfford < 3600) {
      console.log(`    Wait: ${this._formatTime(timeToAfford)} until affordable`);
    } else if (!affordable) {
      console.log(`    Status: Not yet affordable`);
    } else {
      console.log(`    Status: ✓ Affordable now!`);
    }

    console.log('');
  }

  _renderNoRecommendation() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('No recommendations available.');
    console.log('This might mean:');
    console.log('  - All purchases have very long ROI times (>1 hour)');
    console.log('  - No purchases are currently unlocked');
    console.log('  - Game state could not be read properly');
    console.log('');
  }

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

  _renderFooter() {
    const line = this._repeat(Constants.BORDERS.THIN_LINE, 51);
    console.log(line);
    console.log('Run CookieAdvisor.analyze() again after purchasing.');
    console.log(line);
  }

  _formatCurrency(amount) {
    if (amount === 0) return '0';
    if (amount < 1000) return amount.toFixed(Constants.NUMBER_PRECISION);

    for (const { threshold, suffix } of Constants.NUMBER_SUFFIXES) {
      if (amount >= threshold) {
        const scaled = amount / threshold;
        return scaled.toFixed(Constants.NUMBER_PRECISION) + suffix;
      }
    }

    return amount.toFixed(Constants.NUMBER_PRECISION);
  }

  _formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '∞';
    if (seconds < 1) return '<1s';
    if (seconds < 60) return `${Math.round(seconds)}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && hours === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  _repeat(char, count) {
    return char.repeat(count);
  }

  renderSummary(recommendation) {
    if (!recommendation) return 'No recommendation available';
    return `${recommendation.name}: Cost ${this._formatCurrency(recommendation.cost)}, ` +
           `+${this._formatCurrency(recommendation.deltaCPS)} CPS, ` +
           `ROI ${this._formatTime(recommendation.roiTime)}`;
  }

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

  renderCandidateTable(candidates) {
    if (candidates.length === 0) {
      console.log('No candidates available.');
      return;
    }

    console.log('All Candidates (sorted by ROI):');
    console.log('─────────────────────────────────────────────');

    const sorted = [...candidates].sort((a, b) => a.roiTime - b.roiTime);

    console.log(
      'Rank'.padEnd(6) +
      'Name'.padEnd(25) +
      'Cost'.padEnd(12) +
      'CPS'.padEnd(12) +
      'ROI'.padEnd(10)
    );
    console.log('─────────────────────────────────────────────');

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

// ═══════════════════════════════════════════════════════════════════════════
// MODULE: CookieAdvisor (Main API)
// ═══════════════════════════════════════════════════════════════════════════

const CookieAdvisor = (function() {
  'use strict';

  let currentStrategy = new GreedyStrategy();
  let lastRecommendation = null;

  function analyze() {
    try {
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

      const adapter = new GameStateAdapter(window.Game);
      const gameState = adapter.getGameState();

      if (!Validators.isValidGameState(gameState)) {
        console.error('❌ Failed to extract valid game state.');
        return null;
      }

      const model = new EconomicModel(gameState);
      const candidates = model.getAllCandidates();

      if (candidates.length === 0) {
        console.warn('⚠️ No purchase candidates found.');
        console.log('This might mean all buildings/upgrades are locked or unavailable.');
        return null;
      }

      const engine = new StrategyEngine(currentStrategy);
      const recommendations = engine.recommend(candidates);

      if (recommendations.length === 0) {
        console.warn('⚠️ No valid recommendations after filtering.');
        console.log('All available purchases may have very long ROI times (>1 hour).');
        console.log('Try: CookieAdvisor.showAll() to see all options.');
        return null;
      }

      const renderer = new OutputRenderer();
      const topChoice = recommendations[0];
      const alternatives = recommendations.slice(1, Constants.TOP_ALTERNATIVES_COUNT + 1);

      renderer.renderRecommendation(topChoice, alternatives, gameState);

      lastRecommendation = topChoice;
      return topChoice;

    } catch (error) {
      console.error('❌ Error during analysis:', error);
      console.error(error.stack);
      return null;
    }
  }

  function showAll() {
    console.log('🔍 Showing ALL candidates (no time filter)...');
    const previousStrategy = currentStrategy;
    currentStrategy = new RelaxedStrategy();
    const result = analyze();
    currentStrategy = previousStrategy;
    return result;
  }

  function getRecommendation() {
    try {
      if (typeof window === 'undefined' || !window.Game) return null;

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

  function getAllRecommendations(limit = 10) {
    try {
      if (typeof window === 'undefined' || !window.Game) return [];

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

  function setStrategy(strategy) {
    if (!(strategy instanceof Strategy)) {
      console.error('❌ Invalid strategy. Must be an instance of Strategy class.');
      console.log('Available strategies: GreedyStrategy, RelaxedStrategy');
      return;
    }

    currentStrategy = strategy;
    console.log(`✓ Strategy changed to: ${strategy.getName()}`);
  }

  function useGreedy() {
    setStrategy(new GreedyStrategy());
    console.log('✓ Now using GreedyStrategy (filters to 1-hour ROI)');
  }

  function useRelaxed() {
    setStrategy(new RelaxedStrategy());
    console.log('✓ Now using RelaxedStrategy (shows all options)');
  }

  function getStrategyName() {
    return currentStrategy.getName();
  }

  function getLastRecommendation() {
    return lastRecommendation;
  }

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

      const renderer = new OutputRenderer();
      renderer.renderCandidateTable(validCandidates.slice(0, 10));

    } catch (error) {
      console.error('Error in debug:', error);
    }
  }

  function help() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🍪 COOKIE CLICKER ROI ADVISOR - HELP');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('QUICK START COMMANDS:');
    console.log('  CookieAdvisor.analyze()');
    console.log('    → Show best investment (with 1-hour filter)');
    console.log('');
    console.log('  CookieAdvisor.showAll()');
    console.log('    → Show ALL options (no time filter)');
    console.log('');
    console.log('STRATEGY COMMANDS:');
    console.log('  CookieAdvisor.useGreedy()');
    console.log('    → Use default strategy (filters to 1-hour ROI)');
    console.log('');
    console.log('  CookieAdvisor.useRelaxed()');
    console.log('    → Show all options (no time limit)');
    console.log('');
    console.log('ADVANCED COMMANDS:');
    console.log('  CookieAdvisor.getRecommendation()');
    console.log('    → Get top recommendation without output');
    console.log('');
    console.log('  CookieAdvisor.setStrategy(new RelaxedStrategy())');
    console.log('    → Manually change strategy');
    console.log('');
    console.log('  CookieAdvisor.debug()');
    console.log('    → Show detailed debug information');
    console.log('');
    console.log('HOW ROI WORKS:');
    console.log('  ROI Time = Cost / Delta CPS');
    console.log('  Example: 1,000 cookies / 10 CPS = 100 seconds');
    console.log('  Lower ROI time = better investment (pays back faster)');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
  }

  function version() {
    return 'Cookie Clicker ROI Advisor v1.1.0 - Easy Start Edition';
  }

  // Welcome message
  console.log('✓ Cookie Clicker ROI Advisor loaded successfully!');
  console.log('Run CookieAdvisor.analyze() to get started.');
  console.log('Run CookieAdvisor.help() for more information.');
  console.log('');

  return {
    analyze,
    showAll,
    getRecommendation,
    getAllRecommendations,
    setStrategy,
    useGreedy,
    useRelaxed,
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

})();

// ═══════════════════════════════════════════════════════════════════════════
// 🎉 READY TO USE!
// ═══════════════════════════════════════════════════════════════════════════
console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  🍪 Cookie Clicker ROI Advisor - Ready!                  ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log('Quick Start:');
console.log('  → CookieAdvisor.analyze()     - Get best investment');
console.log('  → CookieAdvisor.showAll()     - See ALL options');
console.log('  → CookieAdvisor.help()        - View all commands');
console.log('');
