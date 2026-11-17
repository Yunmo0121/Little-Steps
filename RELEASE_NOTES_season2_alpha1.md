# Little Steps · Season Two Alpha 1.2 — Story + Learning Desk (local preview)

This is a **development preview, not a completed Season Two release**.

## New in Alpha 1.2

- Three-page storybook introduction for Lantern Bay, with Back, Turn the Page, Skip, and Replay.
- Original lightweight SVG chapter artwork (harbour, currents, lighthouse); story text is accessible and selectable HTML.
- Structured RL flow: Sail → Train → Observe → Compare.
- Training chart switch: measured success rate or mean episodic reward, both in 20-episode bins.
- Remaining ε estimate for the next training episode, independent greedy-route evaluation, and Q-value visualization bars.
- Uses the existing real Q-Learning/SARSA engine and the same persistent storage key. Nothing is reset on update.

## Playable now

- **The Enchanted Isles World Map** with five story destinations. Only Lantern Bay is unlocked.
- **Chapter 01 — The First Voyage**: a deterministic maritime grid world with reefs, rough water, shallows, a current and a lighthouse goal.
- Hands-on sailing via WASD, arrow keys or on-screen buttons.
- Real tabular **Q-Learning** and **SARSA**, with independent saved models, seed, adjustable α / γ / ε and batch training.
- Inspect Q values, plot empirical success over training episodes, visualize greedy actions and attempt a learned route.
- BFS and Dijkstra reference routes for comparison, with correct caveats about their different assumptions.
- Original Season One, Cozy Cottage, save data and tests preserved.

## Not yet available

Four later islands, a fully connected Season Two narrative, a game economy, deep RL, and multi-agent RL. These are **plans**, not implemented features.

## Run

Open `index.html` in Chrome, or from this folder run `python3 -m http.server 8000` and visit `http://localhost:8000/`.

## Tests

```bash
node tests/test_algorithms.cjs
node tests/test_corner.cjs
node tests/test_homebase.cjs
node tests/test_season2_rl.cjs
```

See `docs/SEASON_TWO_DESIGN.md` and `docs/SEASON_TWO_LAB_CN.md` for methodology and Chinese user instructions.
