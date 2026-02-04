/**
 * relaxed-advisor.js
 *
 * Temporary helper to see ALL candidates without the 1-hour filter.
 * Paste this AFTER loading the main bundle.
 */

// Create a relaxed strategy that shows everything
class RelaxedStrategy extends Strategy {
  evaluate(candidates) {
    return candidates
      .filter(c => Validators.isValidROI(c.roiTime))
      .filter(c => Validators.isValidCandidate(c))
      .sort((a, b) => a.roiTime - b.roiTime);
  }
}

// Temporarily switch to relaxed mode
CookieAdvisor.setStrategy(new RelaxedStrategy());
console.log('✓ Switched to RelaxedStrategy (no time filter)');
console.log('Run CookieAdvisor.analyze() again to see ALL recommendations.');
