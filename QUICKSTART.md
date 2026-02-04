# Quick Start Guide

Get up and running with Cookie Clicker ROI Advisor in 60 seconds.

## Step-by-Step

### 1. Open Cookie Clicker
Go to: https://orteil.dashnet.org/cookieclicker/

### 2. Open Browser Console
- **Windows/Linux:** Press `F12`
- **Mac:** Press `Cmd+Option+J`
- **Alternative:** Right-click → Inspect → Console tab

### 3. Load the Advisor

**Option A: Load Bundle (Easiest)**
Copy and paste the contents of `cookie-advisor-bundle.js` into the console and press Enter.

**Option B: Load Individual Files**
Copy and paste these files in order:
1. `src/utils/Constants.js`
2. `src/utils/Validators.js`
3. `src/core/GameStateAdapter.js`
4. `src/core/EconomicModel.js`
5. `src/core/StrategyEngine.js`
6. `src/core/OutputRenderer.js`
7. `src/advisor.js`

You should see:
```
✓ Cookie Clicker ROI Advisor loaded successfully!
Run CookieAdvisor.analyze() to get started.
```

### 4. Run Analysis
```javascript
CookieAdvisor.analyze()
```

### 5. Follow Recommendation
The console will show:
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

**Manually click** the recommended building/upgrade in the game.

### 6. Run Again
After purchasing, run:
```javascript
CookieAdvisor.analyze()
```

You'll get a new recommendation based on the updated game state.

## Commands

```javascript
// Get recommendations
CookieAdvisor.analyze()              // Full analysis with output
CookieAdvisor.getRecommendation()    // Just the top pick
CookieAdvisor.getAllRecommendations(10)  // Top 10

// Debug
CookieAdvisor.debug()                // Show detailed info
CookieAdvisor.help()                 // Show all commands

// Auto-refresh (advanced)
setInterval(() => CookieAdvisor.analyze(), 30000)  // Every 30 seconds
```

## Troubleshooting

### "Game object not found"
- Make sure Cookie Clicker is fully loaded
- Try refreshing the page and loading the advisor again

### "No recommendations available"
- All purchases may have ROI > 1 hour
- Try waiting and running analysis again
- Check `CookieAdvisor.debug()` for details

### Strange ROI values
- Make sure you're not in an unusual game state
- Try `CookieAdvisor.debug()` to see raw data
- Report issues at: https://github.com/tomyanzhiyuan/cookieclickervision/issues

## What's Next?

- Read the full [README.md](README.md) for details
- Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical info
- Run [examples/test-scenarios.js](examples/test-scenarios.js) to test different game states

## Tips

1. **Run analysis after every purchase** to get updated recommendations
2. **Don't always follow the top recommendation** - sometimes you want to diversify
3. **Consider wait times** - if top recommendation requires 5 minutes of waiting, check alternatives
4. **Upgrades are permanent** - they often have better long-term value than buildings

Enjoy optimizing your cookie empire! 🍪
