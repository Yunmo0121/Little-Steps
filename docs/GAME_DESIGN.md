# Little Steps — Season One Design (v1.2.3)

## Core concept

**Every little step helps Kristie grow.**

A cozy, watercolor storybook adventure where a small robot called Kristie learns to navigate a garden, find friends, cope with change, and trust herself. The game uses real shortest-path planning and reinforcement-learning experiments to express a gentle growth narrative.

## Three-season narrative vision

1. **Season One — The Wondergarden Adventures** (five playable prototype chapters): learn to explore independently.
2. **Season Two — Beyond the Garden** (not implemented): travel beyond familiar surroundings into distant floating islands and skies; possible future expansion into complex RL tasks.
3. **Season Three — Little Robots, Big Dreams** (not implemented): meet and cooperate with other robots; possible multi-agent RL experiments.

Season One has five playable chapters in v1.2.3; Seasons Two and Three are future concepts only. The Season 1.5 cottage is a view-only home preview with outdoor and indoor scenes.

## Season One chapters

| # | Name | Narrative | Playable mechanics | Trait |
|---|---|---|---|---|
| 1 | The First Flower | Start an adventure by finding a flower | Pathfinding + Q-Learning | Courage |
| 2 | Muddy Meadow | The easiest-looking route may be costly | Weighted mud comparison | Wisdom |
| 3 | Mushroom Village | Find and escort a lost rabbit | Required checkpoint, companion illustration, and two-stage RL state | Kindness |
| 4 | Whispering Woods | Wind shifts familiar paths | Automatic shift during manual play or reversible wind control, and replanning | Adaptability |
| 5 | Starlight Garden | Collect lost fragments and glimpse a distant island | Two fragments, bitmask RL state, final navigation and epilogue | Confidence |

### Season One closing scene

Kristie stands among the lights of the Starlight Garden. Beyond the familiar paths is a distant island that she has never visited. The ending line is:

> *“The world is bigger than I ever imagined.”*

The new island foreshadows the future (not-yet-developed) Season Two rather than opening a playable level immediately.

## Actual implementation

- 10×8 grid with passable grass, non-passable hedges, weighted mud, and drag-free click-to-edit terrain tools.
- BFS / Dijkstra / A* path search with an animated search/route display.
- Q-Learning over grid states and four discrete actions. Chapter 3 expands the state to `(cell, hasFoundRabbit)`; reaching the rabbit switches the reward target, and only reaching the cottage after the rabbit counts as episode success.
- Sequential chapter unlocks, 50 XP once per chapter, chapter-best scores, localStorage, diary and first-season finale dialog.
- Chapter 4 can change hedges automatically during manual navigation and has a reversible wind control for re-planning. Chapter 5 requires collecting two fragments before the final star and gives Q-Learning a two-bit collectible mask.

## Limitations / priorities

- Background illustrations are static. The in-grid robot is currently a CSS miniature; sprite-sheet locomotion is planned.
- XP currently records chapter completion; there is no combat system, inventory, or equipment progression yet.
- The Garden Builder edits the active level; maps are not yet managed as separate permanent saved creations.
- The reinforcement-learning reward includes distance-based shaping; it is intended for an accessible demonstrator, not proof that RL is superior to informed classical search.
- Dijkstra and A* use movement costs (grass=1, mud=3); BFS optimises step count, not total cost.

## Version plan

**v0.3** — five playable chapter tasks, story progression, saved XP, simple finale.  
**v0.4 shipped** — illustrated three-page Chapter 1 opening, skippable/replayable story overlay, expressive Kristie (think, hop, worry, celebrate), contextual speech, and a richer victory scene.
**v0.5 shipped** — six-step optional How to Play in Chapter 1, highlighting targets and BFS, linking first victory to Q-Learning training and the learned route, skip/replay, independent tutorial flag.  
**v0.6 shipped** — Chapter 2 illustrated rainy prologue, interactive manual controls with keyboard / touch D-pad, wooden bridge and clover, 3-star cumulative awards, optional route comparison, story choices, and a special Chapter 2 journal page.
**v0.7 local preview** — three-page stories for Chapters 3–5, rabbit follow animation, automatic wind, starlight collectibles, ending island illustration, extra badges and diary pages.
**Future versions** — a fully editable cottage, additional chapter illustration assets, optional sound, World Map and full Challenge Mode.

## Tutorial learning design (v0.5)

The tutorial introduces **one idea at a time**, only in Chapter 1. First-time play: 3-page story → meet Kristie → locate flower → press BFS → watch explored/route colors → victory → optional Q-Learning lesson → watch learned route. Tutorial prompts are skippable and replayable; they are not modal locks on algorithm buttons. Tutorial state is a separate browser key, leaving Season One save format and earned XP intact. The tutorial only opens Chapter 1 and does not imply later chapters are unfinished.

## Chapter 2 · Muddy Meadow (v0.7)

**Story:** *A Little Rain, A Little Courage.* Kristie explores a rain-soaked meadow and wonders if a short, muddy path is truly the best choice. Three illustrated story pages introduce the chapter and may be skipped or replayed.

**Mechanics:** Players can switch to manual movement using arrows/WASD or a D-pad; grass and bridge have cost 1 while mud costs 3. Default BFScost is 26 for a 14-step route, while Dijkstra and A* obtain minimum cost 16. A collectible clover is a side challenge, and two dialogue choices encourage Kristie without penalties.

**Three stars** (persistent, cumulative across replays): reach destination; finish with cost <= current Dijkstra optimum + 2; visit lucky clover during manual exploration before finishing. The reference table shows planner paths on the active map and the manual best only on a matching map signature.

**Limitations:** star criteria are prototype mechanics, not a formal difficulty assessment; all chapters still use a 10×8 grid. The three later chapters now have bespoke tasks and stories, with deeper custom illustrations planned later.
