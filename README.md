# 🍪 Cookie Clicker ROI Advisor

A JavaScript-based ROI (Return on Investment) advisor that analyzes Cookie Clicker gameplay and recommends optimal purchases.

**This is an ADVISOR system only** - no automation, no clicking, just smart recommendations.

## What It Does

The Cookie Clicker ROI Advisor:
- Reads your live Cookie Clicker game state
- Calculates ROI for all available buildings and upgrades
- Recommends the single best next investment based on payback time
- Displays clean, formatted recommendations in your browser console

**Key Features:**
- 🎯 Greedy ROI strategy (lowest payback time first)
- 📊 Top 5 alternative recommendations
- 🔒 Read-only (never modifies your game)
- 🚀 Fast (<10ms analysis time)
- 🧩 Modular, extensible architecture
- 📚 No external dependencies (pure vanilla JavaScript)

## How to Use

### 🚀 Quick Start (Easiest Method - Recommended for New Users)

1. **Open Cookie Clicker** → <https://orteil.dashnet.org/cookieclicker/>

2. **Open Browser Console:**
   - Windows/Linux: Press `F12`
   - Mac: Press `Cmd+Option+J`
   - Or right-click → "Inspect" → "Console" tab

3. **Copy & Paste the Easy-Start File:**
   - Open [`cookie-advisor-easy-start.js`](cookie-advisor-easy-start.js)
   - Select all (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)
   - Paste into the browser console
   - Press Enter

4. **Run Analysis:**
   ```javascript
   CookieAdvisor.analyze()
   ```

That's it! You now have access to all commands including:

```javascript
CookieAdvisor.analyze()    // Show best investment (1-hour filter)
CookieAdvisor.showAll()    // Show ALL options (no time filter)
CookieAdvisor.help()       // View all commands
```

---

### 🔧 Advanced Method (For Developers)

If you want to understand the modular architecture, you can load files individually:

```javascript
// Paste these files in order:
// 1. src/utils/Constants.js
// 2. src/utils/Validators.js
// 3. src/core/GameStateAdapter.js
// 4. src/core/EconomicModel.js
// 5. src/core/StrategyEngine.js
// 6. src/core/OutputRenderer.js
// 7. src/advisor.js

// You should see:
// ✓ Cookie Clicker ROI Advisor loaded successfully!
```

Then run:
```javascript
CookieAdvisor.analyze()
```

### Step 5: Follow Recommendation
The console will show output like:

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
    Status: ✓ Affordable now!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TOP 5 ALTERNATIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. [Upgrade] Wizard efficiency
   Cost: 50K | +500 CPS | ROI: 100s

2. Mine (#7)
   Cost: 60K | +400 CPS | ROI: 150s

...
```

**Manually click the recommended building/upgrade in the game**, then run `CookieAdvisor.analyze()` again to get the next recommendation.

## How ROI is Calculated

### The Formula

```
ROI Time = Cost / Delta CPS
```

**Example:**
- Building costs **1,000 cookies**
- Adds **+10 CPS** (cookies per second)
- ROI Time = 1,000 / 10 = **100 seconds**

This means the investment pays for itself in 100 seconds. After that, it's pure profit.

**Lower ROI time = better investment** (pays back faster)

### Building ROI (Straightforward)

```javascript
// 1. Get current cost (increases with each purchase)
cost = building.price

// 2. Calculate multiplier from current state
// (Accounts for all active upgrades)
if (building.amount > 0 && building.storedCps > 0) {
  multiplier = building.storedCps / (building.cps * building.amount)
} else {
  multiplier = 1.0
}

// 3. Delta CPS from buying one more
deltaCPS = building.cps * multiplier

// 4. ROI time
roiTime = cost / deltaCPS
```

### Upgrade ROI (Heuristic-Based)

Upgrades are trickier because their effects vary wildly. We use pattern matching:

```javascript
// Pattern 1: "Grandmas are 2x as efficient"
if (description.match(/(\d+)x as efficient/)) {
  multiplier = extractedNumber
  affectedBuilding = findBuilding(description)
  deltaCPS = affectedBuilding.totalCPS * (multiplier - 1)
}

// Pattern 2: "Cursors gain 50% of your CPS"
else if (description.match(/(\d+)%/)) {
  percent = extractedNumber
  deltaCPS = currentCPS * (percent / 100)
}

// Pattern 3: Unknown upgrade
else {
  // Conservative fallback: 2% boost to total CPS
  deltaCPS = currentCPS * 0.02
}

roiTime = cost / deltaCPS
```

**Note:** Upgrade estimation is heuristic-based and may not be perfectly accurate. The algorithm errs on the conservative side.

## Advanced Usage

### Get Recommendation Without Output
```javascript
const rec = CookieAdvisor.getRecommendation()
console.log(rec)
// { id: '...', name: 'Wizard Tower', cost: 123400, ... }
```

### Get All Recommendations
```javascript
const all = CookieAdvisor.getAllRecommendations(10)
// Returns top 10 recommendations
```

### Change Strategy
```javascript
// Switch to lookahead strategy (future implementation)
CookieAdvisor.setStrategy(new LookaheadStrategy())
CookieAdvisor.analyze()
```

### Debug Mode
```javascript
CookieAdvisor.debug()
// Shows detailed game state and candidate information
```

### Help
```javascript
CookieAdvisor.help()
// Shows all available commands
```

### Auto-Refresh (Advanced)
```javascript
// Run analysis every 30 seconds
setInterval(() => CookieAdvisor.analyze(), 30000)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CookieAdvisor (IIFE)                     │
│                  Public API: analyze()                       │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│GameStateAdapter │  │ StrategyEngine  │  │ OutputRenderer  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │
         │                    ▼
         │           ┌─────────────────┐
         └──────────>│ EconomicModel   │
                     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Utils           │
                     │ (Constants,     │
                     │  Validators)    │
                     └─────────────────┘
```

### Modules

**Utils Layer:**
- `Constants.js` - Configuration (thresholds, patterns, display settings)
- `Validators.js` - Input validation (Game object, buildings, upgrades, ROI)

**Core Layer:**
- `GameStateAdapter.js` - Extracts and normalizes game state (read-only)
- `EconomicModel.js` - Calculates ROI for all purchase candidates
- `StrategyEngine.js` - Pluggable strategy pattern for ranking
- `OutputRenderer.js` - Formats console output

**Entry Point:**
- `advisor.js` - Orchestrates all modules, exposes public API

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Current Strategy: Greedy

The v1 implementation uses a **greedy strategy**:

1. Filter out invalid candidates (Infinity ROI, locked, >1 hour payback)
2. Sort by ascending ROI time (lowest first)
3. Return top recommendation

**Pros:**
- Simple and intuitive
- Optimal for single-purchase horizon
- Fast (O(n log n) sorting)

**Cons:**
- Doesn't consider synergies between purchases
- No lookahead (might miss better multi-step sequences)

## Future Enhancements (TODOs)

### 1. Lookahead Strategy
Simulate the next N purchases to optimize for cumulative CPS gain:
```javascript
class LookaheadStrategy extends Strategy {
  evaluate(candidates) {
    // For each candidate:
    //   1. Simulate purchasing it
    //   2. Calculate next best N purchases
    //   3. Rank by total CPS gain over sequence
  }
}
```

### 2. Synergy Analysis
Detect upgrade-building combos:
```javascript
class SynergyAnalyzer {
  detectSynergies(candidates, gameState) {
    // Example: "Grandma upgrade" + "Many grandmas owned"
    // → Boost upgrade's ROI
  }
}
```

### 3. Golden Cookie Modeling
Factor in click value when evaluating cursor upgrades:
```javascript
class GoldenCookieAnalyzer {
  adjustROI(candidate, gameState) {
    // Increase cursor upgrade value based on:
    // - Golden cookie frequency
    // - Click value multipliers
  }
}
```

### 4. Real-Time Monitoring
Auto-refresh and notifications:
```javascript
class AutoMonitor {
  start(intervalMs) {
    setInterval(() => {
      const topRec = CookieAdvisor.analyze()
      if (recommendationChanged) {
        notify('New recommendation: ' + topRec.name)
      }
    }, intervalMs)
  }
}
```

### 5. Time-Discounted Strategies
Factor in opportunity cost and time value:
```javascript
// Prefer investments that pay back faster, even if absolute ROI is slightly worse
// Discount future CPS gains by time factor
```

### 6. Bookmarklet
One-click load:
```javascript
javascript:(function(){/* minified code */})();
```

### 7. Browser Extension
Auto-inject into Cookie Clicker:
- Persistent settings
- UI panel overlay
- Automatic analysis

## Testing

### Manual Testing Checklist

1. **Early game** (0-2 buildings)
   - Should recommend Cursor or Grandma
   - ROI times should be short (10-60 seconds)

2. **Mid game** (5-50 buildings)
   - Should show mix of buildings and upgrades
   - Upgrades should have non-zero CPS estimates

3. **Late game** (expensive buildings)
   - ROI times should be < 1 hour
   - No Infinity or NaN values

4. **After purchase**
   - Buy recommended item in game
   - Run `CookieAdvisor.analyze()` again
   - Recommendation should change

5. **Edge cases**
   - New game (0 cookies) → Should handle gracefully
   - All upgrades purchased → Should only show buildings
   - Game not loaded → Should show error message

### Test Scenarios

See [examples/test-scenarios.js](examples/test-scenarios.js) for detailed test cases.

## Contributing

This project is designed for:
- Clear, readable code
- No magic numbers (all constants explained)
- Modular architecture
- Extensibility for future strategies

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for the complete implementation plan.

## Why This Exists

Cookie Clicker is a game of exponential growth. Early decisions have compounding effects. Choosing the right purchase order can dramatically accelerate your progress.

**The greedy approach (lowest ROI first) is provably optimal** for maximizing CPS in single-step horizon scenarios. This tool automates that calculation so you can focus on enjoying the game.

## License

MIT License - Free to use, modify, and distribute.

## Acknowledgments

- [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) by Orteil
- Inspired by optimal ROI theory from economics and operations research

---

**Made with ☕ and 🍪 by a software engineer who takes idle games very seriously.**

Run `CookieAdvisor.help()` for more information.
