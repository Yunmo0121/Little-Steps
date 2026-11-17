# Little Steps · Changelog

## v2.0.0 — The Enchanted Isles (Season Two complete)

- Five playable Season Two chapters: Lantern Bay, Tidal Island, Misty Reef, Windward Passage, Starharbor.
- Complete three-page storybook openings for the five islands; refreshed illustrated World Map.
- Per-island tabular Q-Learning / SARSA experiments, seeded training, training curves, value inspection and manual controls.
- Chapter-specific learning environments: tides and waiting, discovery under fog, stochastic wind, and multi-goal navigation.
- Storybook-style pink main menu, World Book, diary/collection pages, Cozy Cottage scenes, wooden-boat and maze icons.
- Updated English README, Chinese player guide, design notes and release instructions.
- Seven Node.js test scripts run successfully during release packaging.

---

## New main menu and World Book · preview
- Pink storybook main menu with functional navigation and separate Cozy Cottage shortcut.
- Seasonal World Book with playable Season One and Season Two, plus Season Three teaser.
- Collection screen uses saved Season One rewards, stars, clover and completion progress.
- Non-destructive Start / Continue behavior, returns from individual seasons to the World Book.
- Existing Season Two RL chapters and Season One progress storage retained.

## Alpha 1.5.3 — The Secret of the Mist

- Revised Chapter 03 into three illustrated storybook pages: *A Bell in the Fog*, *The Hidden Passage*, *The Silver Bell*.
- Replaced the three Misty Reef images with cohesive watercolor scenes.
- Replaced Chapter 03's lighthouse goal with a silver nautical bell in the map, UI labels and success messages.
- Preserved Chapter 04/05 story art, Chapter 01/02 environments, and all existing RL update rules.

## Season Two Alpha 1.4.1 — Consistent Boat & Roadmap
- Replaced the board-marker emoji with a bright red paper-boat icon inspired by the story illustration, and used it consistently across Season Two game boards.
- Kept the illustrated boats in the storybook scenes untouched.
- Refined future Season Two island concepts around ocean conditions and reinforcement learning; moved the magical world to a proposed Season Three.
- No changes to the RL transition models, reward functions, Q-Learning/SARSA routines or save keys.

## Season Two Alpha 1.4 — The Tidal Island 🌊
- World Map Chapter 02 is now playable, with three watercolor-pencil story pages.
- Added an independently tested time-expanded (position, tide phase) MDP, four tide phases, an actual Wait action and a sandbar crossing.
- Added Q-Learning and SARSA training and separate seeded, resumable local saves for Chapter 02.
- Added live tide indicator, manual sailing controls, learned policy arrows, 25-episode learning charts, a five-action Q inspector and tide-aware search baselines.
- Added Chapter 02 design notes, a Chinese tutorial and deterministic engine tests.
- Season One, Cozy Cottage and Season Two Chapter 01 code remain unchanged.

## Season Two Alpha 1.3 — Matching Storybook Chapters (local preview)

- Matched Season Two chapter opening to Season One's 930px dialogue frame, two-column balance, cream border, title scale, and quote layout.
- Replaced three placeholder SVG story scenes with three hand-painted watercolor-and-pencil illustrations using the same Kristie character and a coherent pastel sea palette.
- Removed the redundant art-label sticker for a cleaner story spread.
- Kept story Next / Back / Skip controls functional and preserved the RL engine and training saves.
- Not yet deployed to GitHub Pages.

## Season Two Alpha 1.2 — Storybook chapter & RL learning desk (local development)

- Added a real three-page story opening to Chapter 01 with next, previous, skip, replay, and keyboard focus management.
- Added original SVG story artwork consistent with the pastel island map.
- Reorganized Lantern Bay around a Sail → Train → Observe → Compare learning sequence.
- Added independent greedy-policy evaluation, current ε estimate and Q-value bars.
- Added chart toggles for empirical success and mean episode reward, preserving real model data and local saves.
- Tested existing Season One chapters, Cottage tabs and Q-Learning/SARSA engine. **GitHub Pages stays on the existing published version.**

## Season Two Alpha 1.1 — Storybook Edition
- Restyled the World Map in muted sea blues with original SVG hand-ink islands, coastlines, and nautical sketches.
- Matched the first season’s Georgia headings, cream-paper framing, and sage/coral accents.
- Rebuilt the reinforcement-learning console visually as a light field notebook, without changing RL computation.
- Added Kristie’s small travel note and improved keyboard-focus and mobile styling.
- Kept Season One, Cozy Cottage, Q-Learning, SARSA, seeded training, and progress storage intact.
- Local preview only; not yet deployed to GitHub Pages.

# Changelog

This file tracks major milestones in **Little Steps · Kristie's Wondergarden**. Season One v1.2.3 remains the stable public version. The new **Season Two Alpha 1** below is a separate local preview, and the Cozy Cottage remains a **view-only** interlude.

## Season Two Alpha 1 — The First Voyage (local development)

- Introduced the **Enchanted Isles World Map** with one playable destination and four clearly marked future islands.
- Implemented a real deterministic sea MDP, Q-Learning and SARSA with independent model saves and seeded reproducible training.
- Added a manual sailing mode, adjustable RL hyperparameters, training-success chart, per-state Q-value inspector, learned policy and BFS/Dijkstra comparison.
- Kept Season One's five chapters and original local progress intact.
- Added methodology and Chinese lab instructions, plus new automated tests.
- **Not yet published online**; this is not a completed five-chapter Season Two.

## v1.2.3 — Storybook home polish and usability fixes

- Fixed **Outdoor / Indoor Loft** switching, including click and keyboard operation, selected-tab feedback, the scene, and the changing quote.
- Updated the **Little Garden Corner** with a softer, less saturated cottage panorama.
- Replaced embedded decorative UI in the cottage previews with real, selectable HTML controls.
- Kept the cottage **daytime-only** to better match the game's pastel storybook palette.
- Clarified that the cottage currently offers **scenic previews**, not furniture placement or drag-and-drop decorating.
- Updated the English and Chinese player documentation and current home-view tests.

## v1.2.2 — Simpler adventure entry

- Removed the extra confirmation dialog when choosing **Start Adventure**. This action **still resets** the adventure save; use Continue to resume.
- Removed the experimental night mode and kept the home views in daylight.

## v1.0–v1.2 — Season One and the cottage concept

- Brought together all five completed Season One chapter tasks, animated Kristie, the tutorial, manual movement, BFS, Dijkstra, A\* and tabular Q-Learning.
- Added the **Little Garden Corner** with chapter quotes, control reminders and live treasure totals.
- Explored multiple garden-builder prototypes before selecting the **Outdoor / Indoor Loft illustrated-home presentation** for v1.2.3.

## v0.7 — Complete five-chapter adventure

- Chapter 3: Rabbit rescue before arrival at the mushroom cottage.
- Chapter 4: Wind changes walkable paths; adapt or replan.
- Chapter 5: Collect two starlight fragments and finish the season with a distant-island epilogue.
- Added distinct story openings, progressive chapters, stars and diary entries.

## v0.6 — Muddy Meadow

- Added manual movement with arrow keys, WASD and on-screen direction pad.
- Added terrain costs, bridge and hidden lucky clover.
- Added three-star replay challenges and comparison with BFS / Dijkstra / A\*.

## v0.5 — First Steps Tutorial

- Added a skippable first-chapter tutorial for BFS and Q-Learning.

## v0.4 — Kristie's first story

- Added animated expressions, opening story pages, speech and chapter celebrations.

---

The Season Two World Map and Lantern Bay RL chapter are available in this **local alpha preview**, not in the previously published v1.2.3. The remaining four islands, editable cottage, and later seasons are future plans.

## v1.7 · Complete Cottage / Character Reference Refresh
- Replaced cropped menu hero with a full cottage watercolor featuring Kristie and three animal companions.
- Fixed desktop/mobile `object-fit` cropping in CSS; softened Season Two chapters 3–5 scene colors.
- Preserved gameplay, previous story images and wooden-boat map icon.


## v1.8 – Storybook & Maze Polish
- Replaced Season 2 Chapter 3/4/5 story illustrations with refined versions using the consistent Kristie face design and stronger action variety.
- Preserved the wooden-boat journey tone and kept the white cat, dark grey cat, and golden puppy across the later chapters.
- Polished maze board icons across Season 2 (home/start, flag goal, lighthouse, reef rocks, sandbar, beacons, gust marker).
- Added `docs/maze-icon-reference-v1.8.png` for visual reference.


## v2.0 — Illustrated Isles Map
- Replaced the five-disc SVG map with a pastel watercolor map aligned to the Season Two blue-green page.
- Removed extra title/footnote outside the map to keep the composition clean.
- Preserved all five season chapter buttons as keyboard-accessible clickable hotspots, with corrected positions.
