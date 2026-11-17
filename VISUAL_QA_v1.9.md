# Little Steps v1.9 — visual integration checklist

## Updated story images (actual game files)
- `assets/season2-storybook/s2-ch03-story-page-01.webp` = **A Bell in the Fog** — looking/listening toward distant silver bell.
- `assets/season2-storybook/s2-ch03-story-page-02.webp` = **The Hidden Passage** — kept the earlier wooden-boat passage image.
- `assets/season2-storybook/s2-ch03-story-page-03.webp` = **The Silver Bell** — joyful discovery beside the bell.
- Chapter 4 and 5 keep their six distinct story images from v1.8.

## Code-integrated watercolor game assets
- Actual `assets/maze-icons/*.webp` icons (12 assets) cropped from the latest approved sheet.
- `maze-icons-v1.9.css` loads **after** the old icon CSS and uses the actual assets on Season 2 Chapter 1–5 grids.
- `season2-advanced.js` declares the current chapter on the board for goal-aware icon rendering.

## Blush-page integration
- `pink-pages-v1.9.css` loads last for World Book, Collection, Robot Diary, and Cozy Cottage.
- The three new UI mockups are retained in `docs/design-references/` for side-by-side QA. They are NOT embedded as full-page screenshots, so original buttons remain functional.
- Season One yellow and Season Two ocean colors are preserved in the actual game views.

Run the browser from `index.html` in this folder. Do not upload this to GitHub until reviewed.
