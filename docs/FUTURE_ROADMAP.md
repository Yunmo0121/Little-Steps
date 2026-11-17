# Little Steps — Future Roadmap

## Current playable chapters

- **Season One — Kristie’s Wondergarden:** five storybook adventures introducing pathfinding and tabular reinforcement learning.
- **Season 1.5 — Cozy Cottage:** outdoor and indoor loft views, currently a daytime home-base preview (not a drag-and-drop decorating game).
- **Season Two — The Enchanted Isles:** all five island chapters are playable. The first two focus on controlled environments and tide-phase state; the later three introduce exploration, stochastic transitions and multi-goal navigation.

## Season Two — A voyage through the islands 🌊

Season Two is about the **natural world of the sea**, not yet a spellcasting game. The title *The Enchanted Isles* expresses Kristie’s sense of wonder; the actual mechanics are grounded in environmental dynamics, trial-and-error learning and policy evaluation. A small natural wooden boat links the chapters; the game boards use a matching wooden-dinghy marker.

| Chapter | Story | Main learning topic | Status |
| --- | --- | --- | --- |
| 01 · Lantern Bay | Kristie sets sail past reefs and an eastward current | Finite MDP, Q-Learning vs SARSA, reward design | **Playable** |
| 02 · The Tidal Island | The safe crossing appears and disappears | Position × tide phase; WAIT; state design | **Playable** |
| 03 · Misty Reef | Explore mist, find the ancient silver sea bell | Explore vs exploit; fog-of-war discovery; epsilon comparison | Playable |
| 04 · Windward Passage | Sudden gusts shift Kristie’s little boat | Stochastic transitions; robust policy evaluation over seeds | **Playable** |
| 05 · Starharbor | Follow several sea beacons before returning home | Multi-goal reward, generalisation and a season finale | **Playable** |

**Development rule:** each island gets a defined state/action/reward/transition model, tests, evaluation protocol, and understandable learning visualisation. Do not claim advanced methods are implemented before they are built. At the end of Starharbor, Kristie finds a curious map that can introduce Season Three.

## Season Three — The Starlit Atlas (working title) ✨

The magical world gets its **own season**, so it can develop a coherent visual identity rather than arriving abruptly in the middle of an ocean-learning adventure.

Possible places: a floating garden, a library with shifting rooms, a portal maze and a hidden observatory. This remains a concept; it is **not implemented**.

Potential reinforcement-learning directions (subject to prototyping and benchmarks): **sparse/delayed rewards, hierarchical decisions, goal-conditioned policies and transfer** between familiar and unfamiliar worlds. Magical objects should represent well-defined environment rules, not arbitrary visual effects.

## Between adventures — The Cozy Cottage

Longer-term goal: an optional peaceful decorating game with moveable plants, roses, fences, furniture and mementos earned in adventures. Save the layout locally; avoid failure penalties.

## Consistent storybook identity

- Keep Kristie’s design, type scale, modal frame, hand-drawn texture and character voice consistent across seasons.
- Distinguish worlds primarily through restrained palettes: warm garden greens in Season One; misty coastal blue in Season Two; a separate restrained magical palette in Season Three.
- Use the **wooden-dinghy marker** everywhere a live game-board boat icon is needed. Keep full illustrations as illustrations.
