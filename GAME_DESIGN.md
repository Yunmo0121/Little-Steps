# Little Steps — Season One Design (v0.3)

## Core concept

**Every little step helps Kristie grow.**

A cozy, watercolor storybook adventure where a small robot called Kristie learns to navigate a garden, find friends, cope with change, and trust herself. The game uses real shortest-path planning and reinforcement-learning experiments to express a gentle growth narrative.

## Three-season narrative vision

1. **Season One — The Wondergarden Adventures** (five playable prototype chapters): learn to explore independently.
2. **Season Two — Beyond the Garden** (not implemented): travel beyond familiar surroundings into distant floating islands and skies; possible future expansion into complex RL tasks.
3. **Season Three — Little Robots, Big Dreams** (not implemented): meet and cooperate with other robots; possible multi-agent RL experiments.

These are story intentions; only Season One is implemented in v0.3.

## Season One chapters

| # | Name | Narrative | Playable mechanics | Trait |
|---|---|---|---|---|
| 1 | The First Flower | Start an adventure by finding a flower | Pathfinding + Q-Learning | Courage |
| 2 | Muddy Meadow | The easiest-looking route may be costly | Weighted mud comparison | Wisdom |
| 3 | Mushroom Village | Help a lost rabbit find the cottage | Required checkpoint and two-stage RL state | Kindness |
| 4 | Whispering Woods | Weather shifts the hedges | Wind-triggered map change and replanning | Adaptability |
| 5 | Starlight Garden | Find a star and look toward a wider world | Final navigation challenge and epilogue | Confidence |

### Season One closing scene

Kristie stands among the lights of the Starlight Garden. Beyond the familiar paths is a distant island that she has never visited. The ending line is:

> *“The world is bigger than I ever imagined.”*

The new island foreshadows the future (not-yet-developed) Season Two rather than opening a playable level immediately.

## Actual implementation

- 10×8 grid with passable grass, non-passable hedges, weighted mud, and drag-free click-to-edit terrain tools.
- BFS / Dijkstra / A* path search with an animated search/route display.
- Q-Learning over grid states and four discrete actions. Chapter 3 expands the state to `(cell, hasFoundRabbit)`; reaching the rabbit switches the reward target, and only reaching the cottage after the rabbit counts as episode success.
- Sequential chapter unlocks, 50 XP once per chapter, chapter-best scores, localStorage, diary and first-season finale dialog.
- Chapter 4 has a manual wind button to toggle selected hedges and invalidate outdated routes and learned policies. More natural dynamic events may be implemented later.

## Limitations / priorities

- Background illustrations are static. The in-grid robot is currently a CSS miniature; sprite-sheet locomotion is planned.
- XP currently records chapter completion; there is no combat system, inventory, or equipment progression yet.
- The Garden Builder edits the active level; maps are not yet managed as separate permanent saved creations.
- The reinforcement-learning reward includes distance-based shaping; it is intended for an accessible demonstrator, not proof that RL is superior to informed classical search.
- Dijkstra and A* use movement costs (grass=1, mud=3); BFS optimises step count, not total cost.

## Version plan

**v0.3** — five playable chapter tasks, story progression, saved XP, simple finale.  
**v0.4 proposal** — consistent Kristie walk/think/celebrate sprites, polished chapter illustrations, optional sound.  
**v0.5 proposal** — more meaningful challenges and friend interactions, better game progression / XP and Challenge Mode.
