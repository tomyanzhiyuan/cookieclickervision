# Cookie Clicker ROI Advisor - Architecture

## Overview

A modular JavaScript system for analyzing Cookie Clicker gameplay and recommending optimal purchases based on ROI (Return on Investment).

**Core Principle:** Read-only analysis. Never mutate game state. No automation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CookieAdvisor (IIFE)                     │
│                  Public API: analyze()                       │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│GameStateAdapter │  │ StrategyEngine  │  │ OutputRenderer  │
│                 │  │                 │  │                 │
│ Extract & norm- │  │ Rank candidates │  │ Format console  │
│ alize game data │  │ by strategy     │  │ output          │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │
         │                    ▼
         │           ┌─────────────────┐
         └──────────>│ EconomicModel   │
                     │                 │
                     │ Calculate ROI   │
                     │ for candidates  │
                     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Constants       │
                     │ Validators      │
                     │ (Utils)         │
                     └─────────────────┘
```

## Module Responsibilities

### Utils Layer (No Dependencies)

**Constants.js**
- ROI thresholds (MAX_REASONABLE_ROI, MIN_VALID_DELTA_CPS)
- Upgrade pattern regex for description parsing
- Display settings (NUMBER_SUFFIXES, ICONS, BORDERS)
- Building names for validation

**Validators.js**
- Game object validation (isValidGameObject)
- Building/upgrade validation
- ROI value validation
- Affordability checks

### Core Layer

**GameStateAdapter.js**
- **Depends on:** Constants, Validators
- **Purpose:** Extract and normalize game state
- **Key Methods:**
  - `getGameState()` - Returns normalized state
  - `_extractBuildings()` - Get all buildings with metadata
  - `_extractUpgrades()` - Get all available upgrades
- **Guarantee:** Read-only, never mutates `Game` object

**EconomicModel.js**
- **Depends on:** Constants, Validators
- **Purpose:** Calculate ROI for all purchase candidates
- **Key Methods:**
  - `calculateBuildingROI(building)` - Straightforward CPS calc
  - `calculateUpgradeROI(upgrade)` - Heuristic pattern matching
  - `getAllCandidates()` - Combined list with ROI data
- **Algorithms:**
  - Building: `roiTime = cost / (baseCPS * multiplier)`
  - Upgrade: Pattern match description → estimate deltaCPS → calculate ROI

**StrategyEngine.js**
- **Depends on:** EconomicModel (types)
- **Purpose:** Pluggable strategy pattern for ranking
- **Architecture:**
  - `Strategy` base class (interface)
  - `GreedyStrategy` implementation (v1)
  - `StrategyEngine` orchestrator
- **Extension Point:** Add new strategies by extending `Strategy`

**OutputRenderer.js**
- **Depends on:** Constants
- **Purpose:** Format recommendations for console
- **Key Methods:**
  - `renderRecommendation()` - Main output with ASCII art
  - `_formatCurrency()` - 1234567 → "1.23M"
  - `_formatTime()` - 3665 → "1h 1m 5s"

### Entry Point

**advisor.js**
- **Depends on:** All core modules + utils
- **Purpose:** Orchestrate and expose public API
- **Pattern:** IIFE (Immediately Invoked Function Expression)
- **Public API:**
  - `CookieAdvisor.analyze()` - Run full analysis
  - `CookieAdvisor.setStrategy(strategy)` - Change strategy

## Data Flow

```
1. User calls: CookieAdvisor.analyze()
        ↓
2. Validate: Check window.Game exists
        ↓
3. Extract: GameStateAdapter.getGameState()
   → {cookies, cookiesPerSecond, buildings[], upgrades[]}
        ↓
4. Calculate: EconomicModel.getAllCandidates()
   → [{id, type, name, cost, deltaCPS, roiTime}, ...]
        ↓
5. Rank: StrategyEngine.recommend()
   → Filter invalid, sort by ROI time
        ↓
6. Display: OutputRenderer.renderRecommendation()
   → Formatted console output
        ↓
7. Return: Top recommendation object
```

## Key Algorithms

### Building ROI

```javascript
// 1. Get current cost (increases with each purchase)
cost = building.price

// 2. Calculate multiplier from current state
if (building.amount > 0 && building.storedCps > 0) {
  multiplier = building.storedCps / (building.cps * building.amount)
} else {
  multiplier = 1.0
}

// 3. Delta CPS from buying one more
deltaCPS = building.cps * multiplier

// 4. ROI time
roiTime = cost / deltaCPS  // Lower is better
```

### Upgrade ROI (Heuristic)

```javascript
// 1. Parse description for patterns
desc = upgrade.descriptionDetail.toLowerCase()

// 2. Pattern matching
if (desc.match(/(\d+)x as efficient/)) {
  // Multiplier upgrade → boost specific building
  multiplier = extractedNumber
  affectedBuilding = findBuilding(desc)
  deltaCPS = affectedBuilding.totalCPS * (multiplier - 1)
}
else if (desc.match(/(\d+)%/)) {
  // Percentage boost
  percent = extractedNumber
  deltaCPS = currentCPS * (percent / 100)
}
else {
  // Conservative fallback: 2% boost
  deltaCPS = currentCPS * 0.02
}

// 3. ROI time
roiTime = cost / deltaCPS
```

### Greedy Ranking Strategy

```javascript
candidates
  .filter(c => c.roiTime < Infinity)           // Valid ROI
  .filter(c => c.roiTime < MAX_REASONABLE_ROI) // < 1 hour
  .sort((a, b) => a.roiTime - b.roiTime)       // Ascending
```

## Design Principles

### 1. Read-Only
- Never mutate `window.Game`
- All data extraction is non-destructive
- User manually clicks purchases

### 2. Modular
- Clear separation of concerns
- Each module has single responsibility
- Explicit dependencies

### 3. Extensible
- Strategy pattern for different ranking algorithms
- Constants centralized for easy tuning
- Upgrade estimation can be improved without breaking other modules

### 4. Defensive
- Validate all inputs
- Guard against divide-by-zero, NaN, Infinity
- Graceful degradation (conservative fallbacks)

### 5. Deterministic
- No randomness in calculations
- Same game state → same recommendations
- All formulas explicit and documented

## Extension Points (Future)

### 1. New Strategies
```javascript
class LookaheadStrategy extends Strategy {
  evaluate(candidates) {
    // Simulate next N purchases
    // Optimize for cumulative CPS gain
  }
}

class SynergyStrategy extends Strategy {
  evaluate(candidates) {
    // Detect upgrade-building combos
    // Boost ROI for synergistic purchases
  }
}
```

### 2. Synergy Analysis
```javascript
class SynergyAnalyzer {
  detectSynergies(candidates, gameState) {
    // Identify upgrades that combo with owned buildings
    // Example: "Grandma upgrade" + "Many grandmas owned"
  }
}
```

### 3. Golden Cookie Modeling
```javascript
class GoldenCookieAnalyzer {
  adjustROI(candidate, gameState) {
    // Factor in click value from golden cookies
    // Boost cursor upgrade value
  }
}
```

### 4. Real-time Monitoring
```javascript
class AutoMonitor {
  start(intervalMs) {
    setInterval(() => {
      const topRec = CookieAdvisor.analyze()
      if (topRec.id !== this.lastRec.id) {
        this.notify('New recommendation: ' + topRec.name)
      }
    }, intervalMs)
  }
}
```

## Testing Strategy

### Manual Testing
1. Load all modules in Cookie Clicker console
2. Run `CookieAdvisor.analyze()`
3. Verify output is correct

### Test Scenarios
- **Early game** (0-2 buildings) → Recommend Cursor/Grandma
- **Mid game** (5-50 buildings) → Mix of buildings/upgrades
- **Late game** (expensive buildings) → ROI < 1 hour
- **Edge cases** (no cookies, no upgrades) → Graceful handling

### Validation Checklist
- [ ] No runtime errors
- [ ] ROI times are finite positive numbers
- [ ] Top recommendation is actionable
- [ ] Recommendations change with game state
- [ ] CPS deltas are reasonable (not 0 or negative)

## Performance Considerations

### Current Implementation
- **Complexity:** O(n) where n = buildings + upgrades (~30-50 items)
- **Runtime:** <10ms on modern browsers
- **No optimization needed** for current scale

### Future Optimizations (if needed)
- Memoize expensive calculations
- Cache Game object references
- Lazy evaluation of candidates

## Security Considerations

### Safe Operations
- ✅ Reading from `window.Game`
- ✅ Console output
- ✅ Pure calculations

### Never Do
- ❌ Modify `window.Game`
- ❌ Execute eval() or Function()
- ❌ Make network requests
- ❌ Access localStorage (future: okay for preferences)

## Dependencies

**Runtime:** Browser with Cookie Clicker loaded
**External libraries:** None (pure vanilla JavaScript)
**Browser APIs:** console.log only

## File Size

Estimated total: ~15KB unminified (~5KB minified)
- Constants: ~2KB
- Validators: ~2KB
- GameStateAdapter: ~3KB
- EconomicModel: ~4KB
- StrategyEngine: ~2KB
- OutputRenderer: ~2KB
- advisor.js: ~1KB

## Browser Compatibility

Tested on:
- Chrome/Edge (modern)
- Firefox (modern)
- Safari (modern)

Requires:
- ES6 classes
- Arrow functions
- Template literals
- Array methods (filter, map, sort)

No polyfills needed for modern browsers (2020+).
