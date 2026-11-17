# The Enchanted Isles · Season Two design notes

**Status (v2.0.0):** All five island chapters are implemented and playable. These notes document their educational MDPs and experiment limits.

## Why reinforcement learning is the centre of Season Two

Season One uses pathfinding to show how a planner chooses a route when it is given a map. Season Two explores how Kristie **learns a decision-making policy by interacting with an environment**. These are complementary questions, not a contest where RL must beat Dijkstra.

A quiet hand-drawn island map connects the story. A restrained coastal-paper learning desk contains the algorithm controls, continuing the typography and warm framing of Season One. This avoids making every component a rounded beige card and gives the game a less template-like visual identity.

## Five islands: learning progression

| Island | Story | Planned algorithmic idea | Status |
|---|---|---|---|
| **01 · The First Voyage / Lantern Bay** | Kristie sails past reefs to reach a lighthouse | Finite MDP; tabular Q-Learning vs SARSA; reward shaping; ε-greedy training | **Playable** |
| **02 · The Tidal Island** | Routes open and close with the tide | Position × tide-phase state, WAIT action, and tabular RL | **Playable** |
| **03 · Misty Reef** | Find an ancient silver sea bell in a fogbound coral reef | Exploration vs exploitation, fog-of-war discovery, ε-comparison experiments | **Playable** |
| **04 · Windward Passage** | Gusts and uncertain currents change the result of a move | Stochastic transitions and multi-seed policy evaluation | **Playable** |
| **05 · Starharbor** | Kristie visits several sea beacons and returns home | Multi-goal policies, reward design, sparse rewards and generalisation probes | **Playable** |

**Do not promise DQN, multi-agent RL or a POMDP before a correct baseline is built.** Each new island should come with a documented transition model, tests and an experiment.

## Chapter 01 · Lantern Bay (implemented)

The map is a **7 × 9** deterministic grid. State is the boat's cell. Four actions: north, east, south, west. A reef blocks movement. A current marked `>` carries the boat one additional cell to the east after entering that cell (if safe). The episode ends when the lighthouse is reached or after 72 actions. Invalid moves leave the state unchanged and cause a negative reward.

| Cell | Cost | Note |
|---|---:|---|
| Calm sea | 1 | Default |
| Shallow water `^` | 2 | Slower terrain |
| Rough sea `~` | 4 | Expensive terrain |
| Reef `#` | — | Blocked |
| Eastward current `>` | 1 | Pushes one extra square, when safe |

**Reward function:** goal `+40`; every valid nonterminal move `−0.15 − 0.35 × terrain_cost`; collision `−3.5`.

The formula is not identical to Dijkstra's total-cost objective. Reward discounting, step cost and terminal reward matter, so the learned greedy policy is **not guaranteed** to be the least-cost route. Do not claim the methods optimize exactly the same metric.

### Algorithms

- **BFS**: fewest *actions* according to the environment's transition model (including currents), and ignores terrain weights.
- **Dijkstra**: minimum summed terrain cost under the same deterministic transitions.
- **Q-Learning (off-policy)**: update with `r + γ max_a′ Q(s′, a′)`.
- **SARSA (on-policy)**: update with `r + γ Q(s′, a′)` using the next ε-greedy action actually chosen.

The model's action-selection is **ε-greedy**, with initial ε controlled in the UI and a gradual decay: `max(0.045, initial_ε × 0.992 ^ episode_index)`.

The seeded pseudo-random generator is persisted with each method's model; separate Q-Learning and SARSA experiments can be reproduced with the same seed and parameters. Models save locally in `localStorage` under `little-steps-season-two-lab-v01`, which is **separate from Season One saves**.

**Evaluation caution:** The learning curve shows empirical success rate in batches of **20 training episodes** (those still include exploration); the comparison table shows **one greedy rollout from the starting harbour** after training. These are not the same statistic and should not be confused.

The first map was constructed so BFS gives a **9-action, cost-12** route while Dijkstra gives a **9-action, cost-9** route. The RL policy may or may not match the lower cost after training, depending on the selected method, parameters and experiment seed.

## Test plan

- Unit tests: deterministic transitions, currents, reefs, goals, reward, BFS and Dijkstra correctness.
- RL: both Q-Learning and SARSA modify Q values, improve and learn successful policies with a fixed seed, and reproduce whether run as one 1000-episode batch or 200+800.
- Browser: menu access, World Map, parameter inputs, experiment switching, chart, Q-value inspector, manual keyboard/buttons, save and mobile layout.
- Regression: Season One algorithms, story and home views are unchanged.

## Limitations / next work

This prototype is not a realistic sailing simulator; its dynamics are simplified to teach the core RL loop. The environment is **fully observable, discrete and deterministic**. As we progress toward fog and transfer learning, keep separate training/test protocols and clearly label what each model has seen. Further work: policy step-by-step playback, per-episode reward tracing, seeded benchmark export, improved avatar movement, and a dedicated learner tutorial.


## Chapter 02 · The Tidal Island (implemented in Alpha 1.4)

**Why a new state variable?** A position alone no longer predicts what action is safe: the sandbar is accessible only when the tide is low. We extend the finite state to `(position, phase)`, where the four deterministic phases are `Low ebb → Low turning → High rising → High peak → repeat`. This preserves the Markov property under the simplified model.

- **Map**: 7 rows × 9 columns; fixed rock barrier and a single sandbar crossing, with a longer bypass route.
- **Actions**: up, right, down, left, **Wait** (five discrete actions). Time advances after **every** action, even when blocked.
- **Sandbar `T`**: traversable when the current phase is low. If the phase becomes high while Kristie still occupies the sandbar, the tide returns her to the starting harbour with a penalty.
- **Observations**: complete position and tide phase; no stochasticity or hidden state in this chapter.
- **Rewards**: goal +40; legal movement −0.28 − 0.24 × terrain cost (rough water costs 2, other legal terrain 1); waiting −0.28; invalid reef/high-tide move −2.5; swept back −5.5. Terminal episode ends at goal or after 76 steps.
- **Q-learning and SARSA**: independently trained Q tables (252 states × 5 actions), seeded ε-greedy exploration and decayed ε; training batches and greedy rollout.
- **Benchmarks**: BFS optimizes number of actions including waits, using known transitions. Dijkstra minimizes a planner-specific movement effort (wait edge cost 0.65, normal move 1, rough-water move 2). Its displayed “Travel cost” omits waiting; therefore avoid treating that column as identical to Dijkstra's internal objective or the RL reward.
- **Baseline reference**: for initial low-tide phase, BFS gives 10 moves, 0 waits, travel cost 10. Dijkstra gives 10 actions, 2 waits, travel cost 8 (planning effort 9.3).
- **Data / evaluation**: learning curves average 25 training episodes per point; recent success uses last 50; a greedy route is a single deterministic test, not a statistically robust performance estimate.
- **Save format**: `little-steps-tidal-island-alpha14`, isolated from the first voyage and all Season One data.

Future scope: stochastic tide schedules, better multi-seed evaluation, unseen initial phases, transition visualization and a short explanation of model-based vs model-free planning.

## Season Three direction (planning only)

A separate magical-world season, tentatively **The Starlit Atlas**, follows the five coastal islands. The island sequence remains focused on navigation under uncertainty. Season Three is not playable; the World Book only contains a concept preview. See `FUTURE_ROADMAP.md`.
