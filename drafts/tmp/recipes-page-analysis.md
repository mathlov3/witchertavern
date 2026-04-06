# Recipes Page — Analysis & Plan

**Date:** 2026-04-01
**Task type:** New page design + block enhancement

---

## Task Description

Design and implement a Recipes listing/browse page for Witcher Tavern. The page should allow users to:
- Browse all recipes
- Filter by dish category (Main Dish, Drinks, Soups, etc.)
- Optionally search recipes by name or ingredient

---

## Existing Assets (already built)

| Block | Status | Relevant capability |
|---|---|---|
| `recipe-listing-hero` | ✅ Built | Full-bleed atmospheric hero with stats row (# recipes, categories, universes) |
| `recipe-cards` | ✅ Built | Card grid + category filter pills (client-side filtering) |
| Algolia indexing | ✅ Built | Indexes title, description, category, world, difficulty, cook-time, servings |

---

## Architecture Decision: Single Page vs Separate Search Page

**Recommendation: Single combined Recipes page.**

Reasons:
1. The recipe catalog is focused (themed fantasy site, not a massive store)
2. Browse + filter + search are one mental model: "I want to find a recipe"
3. `recipe-cards` already has category filter infrastructure
4. A separate search page would feel like a dead-end and duplicate the recipe grid
5. Algolia-powered search can live in the same page

---

## Page Structure

```
/recipes (AEM document)
├── Section 1
│   └── recipe-listing-hero     ← atmospheric hero (already built)
│       ├── Eyebrow: "The Witcher Tavern Kitchen"
│       ├── H1: "All Recipes"
│       ├── Subtitle: flavour text
│       └── Stats: [48 Recipes] [7 Categories] [2 Universes]
│
└── Section 2
    └── recipe-cards             ← enhanced version
        ├── Search input          ← NEW: text filter input
        ├── Category filter pills ← EXISTS: "All | Main Dish | Drinks | Soups | ..."
        └── Recipe card grid      ← EXISTS: 1→2→3 col responsive grid
```

---

## What Needs to Be Built

### `recipe-cards` block — 3 data source variants

The block needs to support three modes of operation, selected via a block variant class:

| Variant class | Data source | Use case |
|---|---|---|
| *(default)* | Manually authored rows in the document | Curated/featured lists, home page picks |
| `query-index` | Fetches `/query-index.json` from AEM | Full recipe listing page — auto-populates as new recipes are published |
| `algolia` | Queries Algolia search index | Search results page, search-as-you-type filtering |

### Filtering behaviour per variant

- **Default (manual):** Category filter pills + text search both filter the authored card list client-side. Fast, no network request.
- **Query-index:** Fetches the full index on load, then filters client-side by category + text search. Index is small so this is fine.
- **Algolia:** Search input and category filter send queries to Algolia. Results replace the card grid dynamically. Supports pagination.

---

## Requirements

### Functional
- [ ] Users can filter recipes by category using pill buttons
- [ ] "All" pill shows all recipes (default state)
- [ ] Category pills are auto-generated from the recipe data (already works)
- [ ] Users can type in a search box to filter recipes by title/description
- [ ] Search and category filter work together (AND logic: show cards matching BOTH)
- [ ] Clearing search restores the previous category filter state
- [ ] URL does NOT need to reflect filter state (client-side only is fine for now)

### Visual / Layout
- [ ] Search input styled consistently with the dark Witcher theme (ink/gold palette)
- [ ] Search input sits above the category filter bar
- [ ] Category pills: horizontal scrollable row on mobile, wrapping on desktop
- [ ] "No results" state: friendly message (themed, e.g. "No recipes found in the tavern archives...")
- [ ] Card grid: 1 col (mobile) → 2 col (600px+) → 3 col (900px+)
- [ ] Hero occupies full viewport width, atmospheric with glows + embers (already built)

### Responsive
- [ ] Mobile: stacked search input + scrollable filter pills + single column grid
- [ ] Tablet (600px+): 2-column grid
- [ ] Desktop (900px+): 3-column grid, filter pills may wrap

### Author Experience
- [ ] Page is a standard AEM document
- [ ] Author adds `recipe-listing-hero` block with title and stats
- [ ] Author adds `recipe-cards` block with one row per recipe
- [ ] Categories are derived automatically from the recipe rows (no separate config)
- [ ] Search is automatically present whenever there are recipes (no flag needed)

---

## Acceptance Criteria

1. **Category filter works** — clicking a category pill hides all cards not in that category; "All" shows everything
2. **Search filters correctly** — typing in the input filters visible cards by title and description text (case-insensitive)
3. **Combined filter** — category + search work together (e.g. filtering "Soup" + typing "mushroom" shows only mushroom soups)
4. **No results state** — when no cards match, a styled empty-state message appears
5. **Search input is themed** — matches dark ink/gold palette, visible focus ring
6. **Mobile layout correct** — search input full width, pills scrollable, single column grid
7. **Desktop layout correct** — 3-column grid, pills visible without horizontal scroll (or graceful scroll)
8. **Existing recipe-cards variants unaffected** — `featured` variant still works without filter/search
9. **Performance** — no layout shift; filtering is instant (no network request)

---

## Open Questions / Assumptions

| Question | Decision |
|---|---|
| Separate search page? | No — combine with recipes page |
| Algolia-powered search? | Not now — client-side filtering is sufficient for current scale |
| Should URL update with filter state? | No — not needed at this stage |
| Should search apply to `featured` variant? | No — featured is for curated picks, no filter needed |
| What categories exist? | Derived from recipe data; examples: Головні страви (Main Dishes), Напої (Drinks), Супи (Soups), Закуски (Starters) |
| Empty state copy? | Themed: "No recipes found in the tavern archives…" |
