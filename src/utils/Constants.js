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
