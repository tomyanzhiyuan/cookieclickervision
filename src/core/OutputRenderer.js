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
