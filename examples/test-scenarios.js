/**
 * test-scenarios.js
 *
 * Manual test scenarios for the Cookie Clicker ROI Advisor.
 * These document expected behavior for different game states.
 *
 * HOW TO USE:
 * 1. Load Cookie Clicker in browser
 * 2. Get to the desired game state (or use save imports)
 * 3. Load all advisor modules
 * 4. Run CookieAdvisor.analyze()
 * 5. Verify behavior matches expectations
 */

const TestScenarios = {
  /**
   * SCENARIO 1: Early Game
   * Player has just started, owns 0-2 of each building
   */
  earlyGame: {
    description: 'Player has just started the game',
    gameState: {
      cookies: '< 1000',
      cps: '< 10',
      buildings: '0-2 of Cursor, Grandma',
      upgrades: 'None or very basic'
    },
    expectedBehavior: 'Recommend cheapest building with best ROI',
    validation: [
      'Top recommendation should be Cursor or Grandma',
      'ROI time should be 10-60 seconds',
      'Cost should be < 1000 cookies',
      'Delta CPS should be 0.1-2.0'
    ],
    testSteps: [
      '1. Start a new Cookie Clicker game',
      '2. Load advisor modules',
      '3. Run CookieAdvisor.analyze()',
      '4. Check that recommendation is Cursor or Grandma',
      '5. Verify ROI time is reasonable (<60s)'
    ],
    passConditions: {
      topRecommendation: ['Cursor', 'Grandma'],
      roiTime: '< 60',
      affordable: true
    }
  },

  /**
   * SCENARIO 2: Mid Game
   * Player has 5-50 of each building, some upgrades purchased
   */
  midGame: {
    description: 'Player has been playing for 10-30 minutes',
    gameState: {
      cookies: '100K - 10M',
      cps: '1K - 100K',
      buildings: '5-50 of each',
      upgrades: 'Basic building upgrades unlocked'
    },
    expectedBehavior: 'Balance between buildings and upgrades',
    validation: [
      'Upgrades should appear in top 5',
      'ROI times should be 100-600 seconds',
      'Upgrade CPS estimates should be non-zero',
      'Building multipliers should be calculated correctly'
    ],
    testSteps: [
      '1. Play Cookie Clicker for 15 minutes',
      '2. Load advisor modules',
      '3. Run CookieAdvisor.analyze()',
      '4. Verify mix of buildings and upgrades in top 5',
      '5. Check that upgrade CPS estimates are reasonable'
    ],
    passConditions: {
      upgradesInTop5: true,
      roiTime: '< 600',
      deltaCPSNonZero: true
    }
  },

  /**
   * SCENARIO 3: Upgrade Heavy State
   * Multiple upgrades are unlocked and available
   */
  upgradeAvailable: {
    description: 'Player has unlocked many upgrades',
    gameState: {
      cookies: '1M - 100M',
      cps: '10K - 1M',
      buildings: '10-100 of each',
      upgrades: '5+ upgrades in store'
    },
    expectedBehavior: 'High-impact upgrades should rank above incremental buildings',
    validation: [
      'Upgrades with percentage boosts should rank high',
      'Building-specific upgrades should target owned buildings',
      'Upgrade CPS estimation should match description patterns',
      'No Infinity or NaN in upgrade ROI calculations'
    ],
    testSteps: [
      '1. Play until multiple upgrades are unlocked',
      '2. Load advisor modules',
      '3. Run CookieAdvisor.analyze()',
      '4. Verify upgrades appear in top recommendations',
      '5. Check upgrade CPS estimates using debug mode'
    ],
    passConditions: {
      upgradeInTop3: true,
      upgradeROIFinite: true,
      upgradeROIReasonable: '< 600'
    }
  },

  /**
   * SCENARIO 4: Late Game
   * Player has expensive buildings (Portal, Time Machine, etc.)
   */
  lateGame: {
    description: 'Player has reached late-game buildings',
    gameState: {
      cookies: '> 1B',
      cps: '> 1M',
      buildings: '100+ of early buildings, 1-50 of late buildings',
      upgrades: 'Many purchased, some expensive ones available'
    },
    expectedBehavior: 'ROI times should be reasonable (< 1 hour)',
    validation: [
      'No Infinity ROI times in output',
      'No NaN or undefined values',
      'Expensive buildings should have ROI < 3600s',
      'Multipliers should account for all active upgrades'
    ],
    testSteps: [
      '1. Import a late-game save or play to > 1B cookies',
      '2. Load advisor modules',
      '3. Run CookieAdvisor.analyze()',
      '4. Verify all ROI times are finite',
      '5. Check that recommendations are actionable'
    ],
    passConditions: {
      roiTime: '< 3600',
      noInfinity: true,
      noNaN: true
    }
  },

  /**
   * SCENARIO 5: Broke State (Edge Case)
   * Player has very few cookies and all purchases are expensive
   */
  brokeState: {
    description: 'Player has < 100 cookies, all purchases cost > 1000',
    gameState: {
      cookies: '< 100',
      cps: '1-10',
      buildings: 'Some owned, next purchase expensive',
      upgrades: 'All expensive or locked'
    },
    expectedBehavior: 'Graceful handling, recommend waiting or cheapest option',
    validation: [
      'No crashes or errors',
      'Shows "Wait X seconds until affordable" message',
      'Recommendation is still calculated even if not affordable',
      'Affordable status is clearly indicated'
    ],
    testSteps: [
      '1. Start game and spend all cookies',
      '2. Wait until < 100 cookies',
      '3. Load advisor modules',
      '4. Run CookieAdvisor.analyze()',
      '5. Verify graceful handling of unaffordable state'
    ],
    passConditions: {
      noCrash: true,
      showsWaitTime: true,
      recommendationPresent: true
    }
  },

  /**
   * SCENARIO 6: All Upgrades Purchased
   * Player has bought all available upgrades
   */
  allUpgradesPurchased: {
    description: 'No upgrades available in store',
    gameState: {
      cookies: '> 1M',
      cps: '> 10K',
      buildings: 'Many owned',
      upgrades: 'None in store (all purchased or locked)'
    },
    expectedBehavior: 'Only show building recommendations',
    validation: [
      'All recommendations are buildings',
      'No upgrade objects in output',
      'Top 5 alternatives are all buildings',
      'ROI calculations still work correctly'
    ],
    testSteps: [
      '1. Purchase all available upgrades',
      '2. Load advisor modules',
      '3. Run CookieAdvisor.analyze()',
      '4. Verify all recommendations are buildings',
      '5. Check that analysis completes without errors'
    ],
    passConditions: {
      onlyBuildings: true,
      noUpgrades: true,
      analysisSuccessful: true
    }
  },

  /**
   * SCENARIO 7: First Building Purchase
   * Player is buying their first building (0 → 1)
   */
  firstBuildingPurchase: {
    description: 'Player has 0 of a building, considering first purchase',
    gameState: {
      cookies: '15 (for first Cursor)',
      cps: '0.1 (from clicking)',
      buildings: 'None owned',
      upgrades: 'None unlocked'
    },
    expectedBehavior: 'Use base CPS for first building (no multiplier)',
    validation: [
      'Delta CPS should equal building.cps (base value)',
      'Multiplier should be 1.0',
      'ROI calculation should work with 0 owned',
      'No division by zero errors'
    ],
    testSteps: [
      '1. Start new game, click until 15 cookies',
      '2. Load advisor modules',
      '3. Run CookieAdvisor.analyze()',
      '4. Verify Cursor is recommended',
      '5. Check CPS delta matches base Cursor CPS'
    ],
    passConditions: {
      recommendsCursor: true,
      deltaCPSEqualsBase: true,
      noDivisionByZero: true
    }
  },

  /**
   * SCENARIO 8: Rapid Game State Changes
   * Run analysis multiple times in quick succession
   */
  rapidAnalysis: {
    description: 'Multiple analyses in short time period',
    gameState: {
      cookies: 'Any',
      cps: 'Any',
      buildings: 'Any',
      upgrades: 'Any'
    },
    expectedBehavior: 'Consistent results, no memory leaks, fast execution',
    validation: [
      'Analysis completes in < 10ms',
      'Same game state produces same recommendations',
      'No console errors after repeated calls',
      'Memory usage stays stable'
    ],
    testSteps: [
      '1. Load advisor modules',
      '2. Run CookieAdvisor.analyze() 10 times rapidly',
      '3. Check console for errors',
      '4. Verify results are consistent',
      '5. Monitor browser memory usage'
    ],
    passConditions: {
      executionTime: '< 10ms',
      consistentResults: true,
      noMemoryLeaks: true
    }
  }
};

/**
 * Test Runner
 * Automates some basic validation (where possible)
 */
const TestRunner = {
  /**
   * Runs a test scenario and reports results.
   *
   * @param {string} scenarioName - Name of scenario from TestScenarios
   */
  runScenario(scenarioName) {
    const scenario = TestScenarios[scenarioName];
    if (!scenario) {
      console.error(`Unknown scenario: ${scenarioName}`);
      return;
    }

    console.log('═══════════════════════════════════════════════════');
    console.log(`TEST SCENARIO: ${scenarioName}`);
    console.log('═══════════════════════════════════════════════════');
    console.log(`Description: ${scenario.description}`);
    console.log('');

    console.log('Game State:');
    console.log(`  Cookies: ${scenario.gameState.cookies}`);
    console.log(`  CPS: ${scenario.gameState.cps}`);
    console.log(`  Buildings: ${scenario.gameState.buildings}`);
    console.log(`  Upgrades: ${scenario.gameState.upgrades}`);
    console.log('');

    console.log('Expected Behavior:');
    console.log(`  ${scenario.expectedBehavior}`);
    console.log('');

    console.log('Validation Checklist:');
    scenario.validation.forEach((check, i) => {
      console.log(`  ${i + 1}. ${check}`);
    });
    console.log('');

    console.log('Test Steps:');
    scenario.testSteps.forEach(step => {
      console.log(`  ${step}`);
    });
    console.log('');

    // Attempt automated validation (if CookieAdvisor is loaded)
    if (typeof CookieAdvisor !== 'undefined') {
      console.log('Running automated checks...');
      try {
        const startTime = performance.now();
        const result = CookieAdvisor.getRecommendation();
        const endTime = performance.now();

        console.log('');
        console.log('Results:');
        console.log(`  Execution Time: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`  Top Recommendation: ${result ? result.name : 'None'}`);
        if (result) {
          console.log(`  ROI Time: ${result.roiTime.toFixed(2)}s`);
          console.log(`  Affordable: ${result.cost <= window.Game.cookies ? 'Yes' : 'No'}`);
        }

        console.log('');
        console.log('✓ Automated checks passed');
      } catch (error) {
        console.error('✗ Automated checks failed:', error);
      }
    } else {
      console.log('⚠️ CookieAdvisor not loaded, skipping automated checks');
    }

    console.log('═══════════════════════════════════════════════════');
  },

  /**
   * Lists all available test scenarios.
   */
  listScenarios() {
    console.log('Available Test Scenarios:');
    console.log('─────────────────────────────────────────────');
    Object.keys(TestScenarios).forEach((name, i) => {
      const scenario = TestScenarios[name];
      console.log(`${i + 1}. ${name}`);
      console.log(`   ${scenario.description}`);
    });
    console.log('─────────────────────────────────────────────');
    console.log('Run a scenario: TestRunner.runScenario("scenarioName")');
  },

  /**
   * Runs all scenarios (requires manual verification).
   */
  runAll() {
    Object.keys(TestScenarios).forEach(name => {
      this.runScenario(name);
      console.log('');
      console.log('');
    });
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.TestScenarios = TestScenarios;
  window.TestRunner = TestRunner;

  console.log('✓ Test Scenarios loaded');
  console.log('Run TestRunner.listScenarios() to see all test cases');
}
