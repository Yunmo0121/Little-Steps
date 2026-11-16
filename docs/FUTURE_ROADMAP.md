# Little Steps · Future Roadmap 🏝️

**Status (v1.2.3):** Season One's five chapters are playable. The Cozy Cottage interlude has two switchable, illustrated, **daytime** home scenes. Furniture placement, customizable homes, and the Season Two World Map are still plans, not shipped features.

## Between seasons · My Little Wondergarden

Our longer-term goal is to turn the current **Outdoor / Indoor Loft** home previews into a calm, optional decorating mode. Potential features include movable potted plants, rose beds, picket fences, room furniture, unlockable roof styles, and mementos earned through adventures. Kristie might eventually wander around her home.

This design should remain separate from the editable pathfinding maps. It should be comfortable, saveable, and free of failure penalties.

## Season Two · The Enchanted Isles

A combination of **small islands** and a **gentle magical world**, connected by a new **World Map**. Kristie could travel by boat and return to her cottage with souvenirs. A five-island concept:

| Chapter concept | Story hook | Possible algorithm / gameplay theme |
| --- | --- | --- |
| **The First Voyage ⛵** | Set sail for a distant island. | Ocean currents and weighted navigation. |
| **The Tidal Island 🐚** | Paths appear and disappear with the tide. | Dynamic obstacles, timing and waiting. |
| **The Forgotten Lighthouse 🪔** | Find a lighthouse through the fog. | Exploration under partial information. |
| **The Cloudbridge ✨** | Cross magical islands through portals. | Special edges and graph traversal. |
| **The Heart of the Isles 💗** | Help new friends restore a fading world. | Sequential goals and cooperative mechanics. |

A more advanced RL method (such as function approximation) may be explored eventually, but **none of those future techniques are claimed as implemented here**.

## Far-future dream · Little Robots, Big Dreams

Friendship and cooperation between robots could provide a story setting for more complex agents. This is an idea, not a development commitment.

## Development principles

1. Keep each new chapter coherent, playable and testable before adding more content.
2. Preserve accessible controls and saved progress.
3. Let the story motivate the algorithm instead of making the game feel like a collection of disconnected demos.
4. Maintain a consistent, softly illustrated storybook aesthetic.
