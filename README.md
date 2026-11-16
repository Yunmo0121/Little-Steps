# Little Steps — Kristie’s Wondergarden 🌸

**Every little step helps Kristie grow.**  
*A cozy storybook robot adventure powered by pathfinding and reinforcement learning.*

Little Steps follows Kristie, a curious little robot, through a five-chapter watercolor-inspired garden. Each chapter teaches something about growing up while allowing the player to compare real navigation algorithms and train a learning agent.

## 🌷 Play Season One

1. Unzip the project and open `index.html` in a browser. The game runs offline without npm, a backend, or a network connection.
2. Choose **Start Adventure** and complete **Chapter 1 — The First Flower** with BFS, Dijkstra, A* or Q-Learning.
3. Each completed chapter earns **50 XP once**, opens the next chapter and adds a journal entry.
4. Open **Chapters** to continue the story. **Continue** restores the last active chapter, map, trained Q-table (if available), and progress.
5. After Chapter 5, the **storybook finale** hints at the world beyond the garden.

| Chapter | Story and mechanic | Growth theme |
|---|---|---|
| 1. The First Flower 🌼 | Learn pathfinding; reach a glowing flower | Courage |
| 2. Muddy Meadow 🌦️ | Compare fewest steps with weighted terrain cost | Wisdom |
| 3. Mushroom Village 🍄 | Find a lost rabbit *before* reaching the cottage; the planner visits both goals and Q-Learning tracks whether the rabbit was found | Kindness |
| 4. Whispering Woods 🌲 | The **wind** button changes two obstacles; re-plan after the map changes | Adaptability |
| 5. Starlight Garden 🌙 | A longer final route leads to a star and an epilogue | Confidence |

**Season 2 — Beyond the Garden** and **Season 3 — Little Robots, Big Dreams** appear only as *future story teasers*. They are not playable or implemented yet.

## What is implemented

- **BFS**: minimum steps on a grid with obstacles (ignores mud costs).
- **Dijkstra**: minimum movement cost with grass cost 1 and mud cost 3.
- **A\***: weighted search with an admissible Manhattan-distance heuristic.
- **Tabular Q-Learning**: four actions, epsilon-greedy exploration and reward shaping; Chapter 3 uses a two-stage state that tracks whether Kristie has found the rabbit.
- A working animated grid, map editor, training-success chart, **Robot Diary**, XP, sequential chapter unlocks, saved map state and settings.
- A real, clickable multi-screen UI with watercolor artwork, responsive layouts and a storybook ending.

The classical planners know the full map in advance. Q-Learning **does not** search the same way: it interacts with the environment to learn a policy. Their results should be compared with those different assumptions in mind.

### Saves and v0.2 migration

The game saves progress to the browser's `localStorage`. On first load, this version attempts to import an existing v0.2 save (including completion of Chapter 1), preserving the older entry rather than deleting it. Saves from `file://` pages can vary by browser. If saving does not work reliably, serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Note that local file and local server origins may have **different storage**.

- **Start Adventure** intentionally resets progress after confirmation.
- **Continue** resumes the last played chapter.
- **Chapters** lets you replay unlocked chapters without awarding duplicate XP.
- **Settings → Reset save** clears both v0.2 and v0.3 saves after confirmation.
- Garden Builder is currently an editor inside the active chapter; each new chapter loads its own default garden. Individual custom maps for every chapter are not yet stored independently.

### Planned for later updates

- More expressive Kristie sprite animation (walking, thinking, celebrating).
- Story scenes with richer visuals, encounters, challenges, and a fuller RPG-like progression system.
- Optional Challenge Mode, shareable custom maps, SARSA and other learning experiments.
- More story content for Seasons 2 and 3, only **if** we decide to build them later.

## Project structure

```text
little-steps-season1-v0.3/
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── favicon.svg
│   ├── kristie-storybook.webp
│   ├── little-steps-logo.webp
│   └── little-steps-logo-transparent.webp
├── docs/
│   └── GAME_DESIGN.md
├── tests/
│   └── test_algorithms.cjs
└── 开始使用_中文.md
```

## Tests

With Node.js installed, run `node tests/test_algorithms.cjs` from the project folder. This dependency-free suite checks all chapter routes, weighted shortest paths, the rabbit checkpoint, the wind obstacle change, 50-XP-per-chapter progression and the finale.

## Art credits

The watercolor logo and Kristie illustration are AI-generated assets selected and refined for this project. The interactive interface and algorithms are implemented directly in HTML, CSS and JavaScript, without third-party libraries.
