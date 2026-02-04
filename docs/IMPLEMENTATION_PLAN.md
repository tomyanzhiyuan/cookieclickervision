# Cookie Clicker ROI Advisor - Implementation Plan

## Overview

Build a JavaScript-based ROI (Return on Investment) advisor that analyzes Cookie Clicker gameplay and recommends optimal purchases. This is an **advisor system only** - no automation, no clicking, just analysis and recommendations.

## How You'll Use This (Practical Workflow)

### The 5-Step Process:

1. **Open Cookie Clicker**
   - Navigate to https://orteil.dashnet.org/cookieclicker/ in your browser
   - Play the game normally

2. **Open Browser Console**
   - Press `F12` (Windows/Linux) or `Cmd+Option+J` (Mac)
   - Or Right-click → "Inspect" → "Console" tab

3. **Load the Advisor**
   - Copy the JavaScript code file (we'll create a single bundled version)
   - Paste it into the console and press Enter
   - The code loads into memory (doesn't run yet)

4. **Run Analysis Anytime**
   ```javascript
   CookieAdvisor.analyze()
   ```
   - This reads your current game state from the `Game` object
   - Calculates ROI for all available purchases
   - Outputs a formatted recommendation to the console

5. **Follow Recommendations (Manually)**
   - Console shows: "Best: Wizard Tower, Cost: 123K, ROI: 100s"
   - **You manually click** the building/upgrade in the game
   - System **never** clicks for you - you stay in full control
   - Run `CookieAdvisor.analyze()` again after purchasing to get next recommendation

### What the System Reads (Safe & Non-Invasive)

Cookie Clicker exposes a global `Game` object containing:
- `Game.cookies` - Current cookie count
- `Game.cookiesPs` - Cookies per second
- `Game.Objects` - All buildings (Cursor, Grandma, Farm, etc.)
- `Game.UpgradesInStore` - Available upgrades to purchase

Our code **only reads** this data - it **never modifies** the game state. Completely safe.

### Example Console Session:

```javascript
// After pasting the code...

> CookieAdvisor.analyze()

// Output appears:
// ═══════════════════════════════════════════════════
//   🍪 COOKIE CLICKER ROI ADVISOR
// ═══════════════════════════════════════════════════
//
// Current Status:
//   Cookies: 1.23M
//   CPS: 45.6K/sec
//
// ✨ BEST INVESTMENT ✨
//   → Wizard Tower (#8)
//     Cost: 123.4K
//     +1,234 CPS
//     ROI: 100s
//
// 📊 TOP 5 ALTERNATIVES
// 1. [Upgrade] Wizard efficiency (50K, +500 CPS, 100s)
// 2. Mine (60K, +400 CPS, 150s)
// ...

// You click "Wizard Tower" in the game
// Then run again:

> CookieAdvisor.analyze()

// New recommendation appears based on updated game state
```

### Usage Patterns:

**Manual Mode (Recommended for v1):**
- Call `CookieAdvisor.analyze()` whenever you want guidance
- Good for occasional decision-making

**Periodic Updates (Future Enhancement):**
- Set auto-refresh: `setInterval(() => CookieAdvisor.analyze(), 30000)`
- Gets fresh recommendations every 30 seconds
- Still no automation - just updates the display

**Bookmarklet (Future Convenience):**
- Save as browser bookmark with `javascript:` prefix
- One-click to load and run
- No need to paste code each session

## Your Specification Assessment

**Strengths of your specification:**
- ✅ Extremely well-structured with clear phases
- ✅ Modular architecture that supports future extensions
- ✅ Focuses on greedy ROI first, with clear extension path
- ✅ Emphasizes code quality and clean architecture
- ✅ No magic - everything must be explained
- ✅ Professional quality bar (GitHub-ready)

**The specification is production-ready and requires no changes.**

## Project Structure

```
cookieclickervision/
├── README.md                          # Usage & documentation
├── src/
│   ├── advisor.js                     # Main entry point & orchestrator
│   ├── core/
│   │   ├── GameStateAdapter.js        # Extracts data from Game object
│   │   ├── EconomicModel.js           # ROI calculations & metrics
│   │   ├── StrategyEngine.js          # Strategy interface & greedy impl
│   │   └── OutputRenderer.js          # Console output formatting
│   └── utils/
│       ├── Constants.js               # Shared constants & thresholds
│       └── Validators.js              # Input validation helpers
└── examples/
    └── test-scenarios.js              # Manual test cases
```

## Architecture & Data Flow

```
User calls: CookieAdvisor.analyze()
         ↓
GameStateAdapter.getGameState()
   → Extracts: cookies, CPS, buildings[], upgrades[]
         ↓
EconomicModel.getAllCandidates()
   → Calculates: cost, deltaCPS, roiTime for each
         ↓
StrategyEngine.recommend()
   → Filters & ranks by ROI time (greedy)
         ↓
OutputRenderer.renderRecommendation()
   → Pretty console output with top 5 choices
```

## Critical Files & Responsibilities

### 1. [src/utils/Constants.js](src/utils/Constants.js)
**Purpose:** Central configuration for ROI thresholds, patterns, and display settings

**Key constants:**
- `MAX_REASONABLE_ROI: 3600` - 1 hour threshold
- `MIN_VALID_DELTA_CPS: 0.001` - Minimum meaningful CPS gain
- `UPGRADE_PATTERNS` - Regex for parsing upgrade descriptions
- `TOP_ALTERNATIVES_COUNT: 5` - How many alternatives to show

**Dependencies:** None

---

### 2. [src/utils/Validators.js](src/utils/Validators.js)
**Purpose:** Validate Game object, buildings, upgrades, and calculated values

**Key functions:**
- `isValidGameObject(game)` - Check Game has cookies, cookiesPs, Objects, UpgradesInStore
- `isValidBuilding(building)` - Check building has amount, price, name
- `isValidUpgrade(upgrade)` - Check upgrade has name, getPrice()
- `isValidROI(roiTime)` - Ensure ROI is positive and finite

**Dependencies:** None

---

### 3. [src/core/GameStateAdapter.js](src/core/GameStateAdapter.js)
**Purpose:** Extract and normalize game state WITHOUT mutating the Game object

**Key methods:**
- `getGameState()` → Returns normalized state object
- `_extractBuildingState(building)` → Normalize single building
- `_extractUpgradeState(upgrade)` → Normalize single upgrade
- `_calculateBuildingCPS(building)` → Compute CPS contribution

**Extracts:**
```javascript
{
  cookies: number,           // Game.cookies
  cookiesPerSecond: number,  // Game.cookiesPs
  buildings: [{
    id: string,
    name: string,
    owned: number,
    cost: number,
    baseCPS: number,
    totalCPS: number         // storedCps
  }],
  upgrades: [{
    id: string,
    name: string,
    cost: number,
    description: string,
    unlocked: boolean
  }]
}
```

**Edge cases:**
- Buildings with 0 owned (use base CPS)
- Locked upgrades (filter out)
- Special buildings (Cursor, Grandma) with unique mechanics

**Dependencies:** Constants, Validators

---

### 4. [src/core/EconomicModel.js](src/core/EconomicModel.js)
**Purpose:** Calculate ROI metrics for all purchase candidates

**Key methods:**
- `calculateBuildingROI(building)` → Simple: deltaCPS = building's next CPS gain
- `calculateUpgradeROI(upgrade, gameState)` → Complex: parse description, estimate CPS impact
- `getAllCandidates()` → Combine all buildings + upgrades into unified candidate list

**ROI calculation:**
```javascript
// Buildings (straightforward):
deltaCPS = building.baseCPS * multiplier
roiTime = cost / deltaCPS

// Upgrades (heuristic-based):
// Parse description for patterns:
// - "X% more efficient" → multiply affected building CPS
// - "2x as efficient" → double affected building CPS
// - "gains +X cookies per click" → estimate based on click rate
// - Unknown → conservative 2% CPS boost

deltaCPS = estimateUpgradeCPS(upgrade, gameState)
roiTime = cost / deltaCPS

// Guards:
if (deltaCPS <= 0) roiTime = Infinity
```

**Upgrade CPS estimation strategy:**
1. Pattern match description against common upgrade types
2. Identify affected building (grandma, cursor, etc.)
3. Calculate multiplier effect on that building's CPS
4. Fallback: 2% of total CPS for unknown upgrades

**Output format:**
```javascript
{
  id: string,
  type: 'building' | 'upgrade',
  name: string,
  cost: number,
  deltaCPS: number,
  roiTime: number,  // seconds to pay back investment
  // building-specific:
  currentOwned: number,
  // upgrade-specific:
  isPermanent: boolean
}
```

**Dependencies:** Constants, Validators

---

### 5. [src/core/StrategyEngine.js](src/core/StrategyEngine.js)
**Purpose:** Pluggable strategy pattern for ranking candidates

**Architecture:**
```javascript
// Strategy base class (interface)
class Strategy {
  evaluate(candidates) { }  // Returns sorted recommendations
}

// Greedy implementation (v1)
class GreedyStrategy extends Strategy {
  evaluate(candidates) {
    return candidates
      .filter(c => c.roiTime < Infinity)
      .sort((a, b) => a.roiTime - b.roiTime)
  }
}

// Orchestrator
class StrategyEngine {
  constructor(strategy) { }
  setStrategy(newStrategy) { }  // Hot-swappable
  recommend(candidates) { }
}
```

**Greedy algorithm:**
1. Filter: Remove invalid (Infinity ROI, locked, unaffordable)
2. Sort: Ascending by roiTime (lower is better)
3. Return: Top N recommendations

**Extension points for future strategies:**
- `LookaheadStrategy` - Simulate N purchases ahead, optimize sequence
- `SynergyStrategy` - Boost ROI for upgrades that combo with owned buildings
- `BalancedStrategy` - Mix ROI with diversification across building types

**Dependencies:** EconomicModel (for candidate format)

---

### 6. [src/core/OutputRenderer.js](src/core/OutputRenderer.js)
**Purpose:** Format recommendations for console with clean, readable output

**Key methods:**
- `renderRecommendation(topChoice, alternatives, gameState)` - Main output
- `_formatCurrency(amount)` - 1,234,567 → "1.23M"
- `_formatTime(seconds)` - 3665 → "1h 1m 5s"
- `_formatDeltaCPS(cps)` - Color-coded CPS delta

**Output structure:**
```
═══════════════════════════════════════════════════
  🍪 COOKIE CLICKER ROI ADVISOR
═══════════════════════════════════════════════════

Current Status:
  Cookies: 1.23M
  CPS: 45.6K/sec

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ BEST INVESTMENT ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → Wizard Tower (#8)
    Cost: 123.4K cookies
    Benefit: +1,234 CPS
    ROI Time: 100 seconds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TOP 5 ALTERNATIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Upgrade] Wizard efficiency
   Cost: 50K | +500 CPS | ROI: 100s

2. Mine (#7)
   Cost: 60K | +400 CPS | ROI: 150s

[... 3 more ...]
```

**Dependencies:** Constants (for display settings)

---

### 7. [src/advisor.js](src/advisor.js) ⭐ **MAIN ENTRY POINT**
**Purpose:** Orchestrate all modules and expose clean public API

**Implementation:**
```javascript
const CookieAdvisor = (function() {
  let strategy = new GreedyStrategy();

  function analyze() {
    // 1. Validate & extract game state
    if (!Validators.isValidGameObject(window.Game)) {
      throw new Error('Game object not found');
    }
    const adapter = new GameStateAdapter(window.Game);
    const gameState = adapter.getGameState();

    // 2. Calculate ROI for all candidates
    const model = new EconomicModel(gameState);
    const candidates = model.getAllCandidates();

    // 3. Apply strategy
    const engine = new StrategyEngine(strategy);
    const recommendations = engine.recommend(candidates);

    // 4. Render output
    const renderer = new OutputRenderer();
    renderer.renderRecommendation(
      recommendations[0],
      recommendations.slice(1, 6),
      gameState
    );

    return recommendations[0];
  }

  function setStrategy(newStrategy) {
    strategy = newStrategy;
  }

  return { analyze, setStrategy };
})();
```

**Usage in browser console:**
```javascript
// Paste all source files, then:
CookieAdvisor.analyze()

// Change strategy later:
CookieAdvisor.setStrategy(new LookaheadStrategy())
```

**Dependencies:** ALL core modules + utils

---

### 8. [README.md](README.md)
**Purpose:** Complete documentation for users and developers

**Sections:**
1. **What it does** - High-level overview
2. **Installation** - Copy-paste instructions
3. **Usage** - `CookieAdvisor.analyze()` example
4. **How ROI is calculated** - Math explanation
5. **Architecture** - ASCII diagram + module descriptions
6. **Extension guide** - How to add new strategies
7. **TODOs** - Future enhancements (synergies, lookahead, golden cookies)

**Key explanation (include in README):**
```
ROI Time = Cost / Delta CPS

Example:
- Building costs 1,000 cookies
- Adds +10 CPS
- ROI Time = 1,000 / 10 = 100 seconds

This means the investment pays for itself in 100 seconds.
Lower ROI time = better investment.
```

---

### 9. [examples/test-scenarios.js](examples/test-scenarios.js)
**Purpose:** Document test cases and expected behavior

**Test scenarios:**
- **Early game** (0-2 buildings) → Recommend Cursor/Grandma
- **Mid game** (5-50 buildings) → Balance buildings and upgrades
- **Upgrade-heavy** → Upgrades should rank high
- **Late game** (expensive buildings) → ROI times < 1 hour
- **Edge case** (broke state) → Graceful handling

---

## Implementation Sequence

### Phase 1: Foundation (30 min)
**Files:** Constants.js, Validators.js
- Define thresholds, patterns, validation functions
- No dependencies, pure functions
- **Test:** Load in console, call functions

### Phase 2: Data Extraction (1 hour)
**Files:** GameStateAdapter.js
- Extract cookies, CPS, buildings, upgrades from `Game` object
- **Test:** `new GameStateAdapter(Game).getGameState()` in console
- **Success:** Buildings array populated, CPS values match display

### Phase 3: Economic Calculations (1.5 hours)
**Files:** EconomicModel.js
- Implement building ROI (straightforward)
- Implement upgrade ROI (heuristic pattern matching)
- **Test:** `model.getAllCandidates()`, inspect ROI times
- **Success:** ROI times are reasonable (10s - 3600s)

### Phase 4: Strategy Logic (45 min)
**Files:** StrategyEngine.js
- Define Strategy base class
- Implement GreedyStrategy (filter + sort by ROI time)
- **Test:** `strategy.evaluate(candidates)`, check ordering
- **Success:** Top recommendation has lowest ROI time

### Phase 5: Output Formatting (1 hour)
**Files:** OutputRenderer.js
- Format numbers (K, M, B suffixes)
- Format time (Xs, Xm Ys)
- Create ASCII borders and color styling
- **Test:** Render sample recommendation
- **Success:** Clean, readable console output

### Phase 6: Integration (30 min)
**Files:** advisor.js
- Wire up all modules in IIFE
- Create public API (analyze, setStrategy)
- Add error handling
- **Test:** `CookieAdvisor.analyze()` full flow
- **Success:** Single function call produces output

### Phase 7: Documentation (1 hour)
**Files:** README.md, test-scenarios.js
- Write usage instructions
- Explain ROI math
- Document architecture
- List future TODOs

### Phase 8: Polish (1 hour)
- Edge case handling (no Game object, no affordable purchases)
- Performance optimization
- Helpful error messages
- **Test:** Brand new game, late game, unusual states

---

## Key Algorithms

### Building ROI Calculation
```javascript
// Extract from Game.Objects[buildingName]
const cost = building.price
const baseCPS = building.cps
const currentTotal = building.storedCps || 0
const owned = building.amount

// Calculate multiplier from current state
const multiplier = owned > 0
  ? currentTotal / (owned * baseCPS)
  : 1

// Delta from buying one more
const deltaCPS = baseCPS * multiplier
const roiTime = deltaCPS > 0 ? cost / deltaCPS : Infinity
```

### Upgrade ROI Estimation (Heuristic)
```javascript
const desc = upgrade.ddesc || upgrade.desc || ''
let deltaCPS = 0

// Pattern matching
if (desc.match(/grandma.*efficient/i)) {
  const grandma = findBuilding('Grandma')
  deltaCPS = grandma.storedCps * 0.5  // Assume 50% boost
}
else if (desc.match(/(\d+)%/)) {
  const percent = parseInt(desc.match(/(\d+)%/)[1])
  deltaCPS = gameState.cookiesPerSecond * (percent / 100)
}
else {
  // Conservative fallback
  deltaCPS = gameState.cookiesPerSecond * 0.02  // 2%
}

const roiTime = deltaCPS > 0 ? cost / deltaCPS : Infinity
```

### Greedy Ranking
```javascript
return candidates
  .filter(c => c.roiTime < Infinity)  // Valid ROI
  .filter(c => c.roiTime < 3600)      // < 1 hour
  .sort((a, b) => a.roiTime - b.roiTime)  // Lowest first
```

---

## Verification & Testing

### Manual testing in Cookie Clicker console:

1. **Load script:**
   - Paste all source files into console
   - Verify no syntax errors

2. **Run analysis:**
   ```javascript
   CookieAdvisor.analyze()
   ```

3. **Validation checklist:**
   - [ ] No runtime errors in console
   - [ ] ROI times are positive numbers (not Infinity/NaN)
   - [ ] Top recommendation is affordable (or will be soon)
   - [ ] Output is readable and formatted correctly
   - [ ] Recommendations change as game progresses

4. **Test scenarios:**
   - **Early game:** Start new game, run analyzer → Should recommend Cursor/Grandma
   - **Mid game:** Play for 10 minutes, run analyzer → Should show mix of buildings/upgrades
   - **After purchase:** Buy recommended item, run again → Recommendation should change
   - **Edge case:** New game with 0 cookies → Should handle gracefully

5. **Regression tests:**
   - Check specific buildings (Cursor, Grandma, Farm, Mine)
   - Verify upgrade CPS estimation is non-zero
   - Confirm ROI times match manual calculation

---

## Future Extensions (Architecture Supports)

**Synergy analysis:**
- Add `SynergyAnalyzer` class
- Detect upgrade-building combos (e.g., Grandma + Grandma upgrade)
- Boost deltaCPS for synergistic purchases

**Lookahead strategy:**
- Create `LookaheadStrategy` class
- Simulate next N purchases
- Optimize for cumulative CPS gain over sequence

**Golden cookie modeling:**
- Add `GoldenCookieAnalyzer`
- Factor in click value for cursor upgrades
- Adjust ROI based on golden cookie frequency

**Real-time monitoring:**
- Poll game state every 10s
- Notify when top recommendation changes
- Desktop notifications via Notification API

---

## Dependencies

**Module dependency graph:**
```
advisor.js
├── GameStateAdapter
│   ├── Constants
│   └── Validators
├── EconomicModel
│   ├── Constants
│   └── Validators
├── StrategyEngine
│   └── EconomicModel (types)
└── OutputRenderer
    └── Constants

Utils (no dependencies):
├── Constants
└── Validators
```

**No external libraries required** - Pure vanilla JavaScript

---

## Quality Standards

- **Code style:** Semicolons, 2-space indent, camelCase functions, PascalCase classes
- **Documentation:** JSDoc for all public methods
- **Error handling:** Validate all Game object access, never crash silently
- **Performance:** No nested loops, cache expensive calculations
- **Magic numbers:** All constants explained and defined in Constants.js

---

## Success Criteria

✅ **Functional:**
- Correctly reads Cookie Clicker game state
- Calculates ROI for buildings and upgrades
- Recommends lowest ROI time purchase
- Clean console output with top 5 alternatives

✅ **Architectural:**
- Modular structure (4 core modules + 2 utils)
- Pluggable strategy pattern
- No Game object mutation
- Clear separation of concerns

✅ **Quality:**
- No external dependencies
- No magic numbers without explanation
- Readable code with comments
- README explains usage and math

✅ **Extensible:**
- Easy to add new strategies
- Upgrade CPS estimation can be improved
- Architecture supports lookahead, synergies, etc.

---

## File Creation Order

1. `src/utils/Constants.js` (no dependencies)
2. `src/utils/Validators.js` (no dependencies)
3. `src/core/GameStateAdapter.js` (depends on utils)
4. `src/core/EconomicModel.js` (depends on utils)
5. `src/core/StrategyEngine.js` (depends on EconomicModel types)
6. `src/core/OutputRenderer.js` (depends on Constants)
7. `src/advisor.js` (depends on all core modules)
8. `README.md` (documentation)
9. `examples/test-scenarios.js` (testing)

Total estimated implementation time: **6-8 hours** for complete, polished system.
