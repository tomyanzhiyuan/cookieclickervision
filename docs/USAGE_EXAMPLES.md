# Usage Examples

Real-world examples of using the Cookie Clicker ROI Advisor.

## Basic Usage

### Example 1: First Analysis

```javascript
// Load the advisor (paste bundle or individual files)
// You should see: ✓ Cookie Clicker ROI Advisor loaded successfully!

// Run your first analysis
CookieAdvisor.analyze()

// Output:
// ═══════════════════════════════════════════════════
//   🍪 COOKIE CLICKER ROI ADVISOR
// ═══════════════════════════════════════════════════
//
// Current Status:
//   Cookies: 523
//   CPS: 15.2/sec
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ BEST INVESTMENT ✨
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
//   → Grandma (#3)
//     Cost: 100 cookies
//     Benefit: +1 CPS
//     ROI Time: 100 seconds
//     Status: ✓ Affordable now!
```

### Example 2: Purchase and Re-analyze

```javascript
// After buying the recommended Grandma...
CookieAdvisor.analyze()

// Output now shows different recommendation:
//   → Farm (#1)
//     Cost: 500 cookies
//     Benefit: +4 CPS
//     ROI Time: 125 seconds
```

## Advanced Usage

### Example 3: Get Recommendation Without Output

```javascript
// Useful for programmatic access
const rec = CookieAdvisor.getRecommendation()

console.log(`Next purchase: ${rec.name}`)
console.log(`Cost: ${rec.cost}`)
console.log(`Will add: ${rec.deltaCPS} CPS`)
console.log(`Pays back in: ${rec.roiTime} seconds`)

// Output:
// Next purchase: Mine
// Cost: 3000
// Will add: 10 CPS
// Pays back in: 300 seconds
```

### Example 4: Compare Multiple Recommendations

```javascript
// Get top 10 recommendations
const all = CookieAdvisor.getAllRecommendations(10)

// Compare ROI times
all.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.name}: ${rec.roiTime.toFixed(1)}s`)
})

// Output:
// 1. Mine: 300.0s
// 2. [Upgrade] Farm efficiency: 320.5s
// 3. Factory: 450.2s
// 4. Bank: 500.0s
// ...
```

### Example 5: Auto-Refresh Monitor

```javascript
// Monitor recommendations every 30 seconds
let lastRec = null

setInterval(() => {
  const rec = CookieAdvisor.getRecommendation()

  // Only log if recommendation changed
  if (!lastRec || rec.id !== lastRec.id) {
    console.log(`New recommendation: ${rec.name} (ROI: ${rec.roiTime.toFixed(0)}s)`)
    lastRec = rec
  }
}, 30000)

// Output (as game progresses):
// New recommendation: Bank (ROI: 500s)
// ... (30 seconds later)
// New recommendation: [Upgrade] Bank interest (ROI: 450s)
```

### Example 6: Debug Mode

```javascript
// See detailed information
CookieAdvisor.debug()

// Output:
// ═══════════════════════════════════════════════════
//   DEBUG INFO
// ═══════════════════════════════════════════════════
// Game State:
//   Cookies: 1234567
//   CPS: 45678
//   Buildings: 12
//   Upgrades: 5
//
// Candidates:
//   Total: 17
//   Buildings: 12
//   Upgrades: 5
//
// Valid Recommendations: 15
//
// Strategy:
//   Current: GreedyStrategy
//
// All Candidates (sorted by ROI):
// ─────────────────────────────────────────────
// Rank  Name                    Cost        CPS         ROI
// ─────────────────────────────────────────────
// 1     Mine                    3.00K       +10.00      300s
// 2     [Upgrade] Farm eff...   5.00K       +15.00      333s
// ...
```

### Example 7: Strategy Comparison

```javascript
// Compare different strategies (future feature)

// Greedy strategy
CookieAdvisor.setStrategy(new GreedyStrategy())
const greedyRec = CookieAdvisor.getRecommendation()
console.log(`Greedy: ${greedyRec.name} (ROI: ${greedyRec.roiTime}s)`)

// Lookahead strategy (when implemented)
CookieAdvisor.setStrategy(new LookaheadStrategy(3))
const lookaheadRec = CookieAdvisor.getRecommendation()
console.log(`Lookahead: ${lookaheadRec.name} (ROI: ${lookaheadRec.roiTime}s)`)

// Switch back to greedy
CookieAdvisor.setStrategy(new GreedyStrategy())
```

## Workflow Examples

### Example 8: Early Game Optimization

```javascript
// Starting a new game
// 1. Click until you have 15 cookies
// 2. Load advisor
// 3. Check recommendation

CookieAdvisor.analyze()
// Recommends: Cursor (#1), Cost: 15, ROI: 150s

// 4. Buy Cursor
// 5. Click to 100 cookies
// 6. Check again

CookieAdvisor.analyze()
// Recommends: Grandma (#1), Cost: 100, ROI: 100s

// 7. Buy Grandma
// 8. Repeat
```

### Example 9: Mid-Game Decision Making

```javascript
// You have 50K cookies and multiple options
CookieAdvisor.analyze()

// Output shows:
// Best: Bank (#4) - Cost: 30K, +200 CPS, ROI: 150s
// Alt 1: [Upgrade] Mine boost - Cost: 20K, +180 CPS, ROI: 111s
// Alt 2: Temple (#1) - Cost: 50K, +300 CPS, ROI: 167s

// Decision factors:
// 1. Bank is affordable now
// 2. Mine upgrade has better ROI but requires owned mines
// 3. Temple has higher CPS but takes longer to pay back

// Choose based on your strategy!
```

### Example 10: Upgrade Analysis

```javascript
// Check what upgrades do
const upgrades = CookieAdvisor.getAllRecommendations(20)
  .filter(r => r.type === 'upgrade')

upgrades.forEach(u => {
  console.log(`${u.name}: +${u.deltaCPS.toFixed(1)} CPS for ${u.cost} cookies`)
})

// Output:
// Grandma boost: +150.5 CPS for 10000 cookies
// Cursor efficiency: +50.2 CPS for 5000 cookies
// Farm multiplier: +200.0 CPS for 15000 cookies
```

## Real-World Scenarios

### Scenario 1: Limited Play Session

You have 15 minutes to play. Optimize for quick gains:

```javascript
// Run analysis every 2 minutes
setInterval(() => {
  const rec = CookieAdvisor.getRecommendation()

  // Only buy if ROI < 120 seconds (2 minutes)
  if (rec.roiTime < 120) {
    console.log(`⚡ QUICK WIN: ${rec.name} - Buy NOW!`)
  } else {
    console.log(`⏳ Save for: ${rec.name} (${rec.roiTime}s)`)
  }
}, 120000)
```

### Scenario 2: Overnight Idle

Setting up for overnight idle play:

```javascript
// Before leaving
const rec = CookieAdvisor.getRecommendation()
console.log(`Best investment: ${rec.name}`)
console.log(`Time to afford: ${(rec.cost / window.Game.cookiesPs / 60).toFixed(0)} minutes`)

// Calculate overnight earnings
const hoursAway = 8
const overnightEarnings = window.Game.cookiesPs * hoursAway * 3600
console.log(`You'll earn ${overnightEarnings.toFixed(0)} cookies overnight`)

// See what you can buy when you return
const future = CookieAdvisor.getAllRecommendations(10)
  .filter(r => r.cost < overnightEarnings)
console.log(`Affordable options tomorrow: ${future.length}`)
```

### Scenario 3: Golden Cookie Farming

During active golden cookie farming:

```javascript
// Check if cursor upgrades are valuable
const cursorUpgrades = CookieAdvisor.getAllRecommendations(20)
  .filter(r => r.name.toLowerCase().includes('cursor'))

if (cursorUpgrades.length > 0) {
  console.log('Cursor upgrades available:')
  cursorUpgrades.forEach(u => {
    console.log(`  ${u.name}: ROI ${u.roiTime}s`)
  })
} else {
  console.log('No cursor upgrades available')
}
```

## Tips from Examples

1. **Check ROI time, not just cost** - A cheap building isn't always the best choice
2. **Consider your play style** - Active players benefit more from click upgrades
3. **Look at alternatives** - Sometimes the #2 recommendation is almost as good and cheaper
4. **Use debug mode** - When recommendations seem off, check the raw data
5. **Monitor changes** - Recommendations shift as you make purchases

## Common Patterns

### Pattern 1: Early Buildings (0-100 cookies/sec)
Typical recommendations: Cursor → Grandma → Cursor → Grandma → Farm

### Pattern 2: First Upgrades (100-1000 cookies/sec)
Typical recommendations: Building-specific upgrades (Grandma boost, Cursor efficiency)

### Pattern 3: Mid-Game Expansion (1K-100K cookies/sec)
Typical recommendations: Mix of new buildings and percentage boosts

### Pattern 4: Late Game Optimization (>100K cookies/sec)
Typical recommendations: Expensive upgrades with high percentage boosts, late-game buildings

## Next Steps

- Try these examples in your own game
- Share your results or interesting scenarios
- Contribute your own usage patterns to the project

Happy cookie clicking! 🍪
