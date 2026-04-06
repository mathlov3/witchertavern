# Recipe Search Block — Analysis & Plan

**Date:** 2026-04-01
**Task type:** New block

---

## Task Description

Create a standalone `recipe-search` block that provides a full Algolia-powered search experience with a left-side facet filter sidebar. This replaces the planned `algolia` variant in `recipe-cards`, keeping `recipe-cards` clean as a pure display block.

---

## Architecture Decision

| Block | Responsibility |
|---|---|
| `recipe-cards` | Card grid only. Manual data or query-index. Category pills. No text search. |
| `recipe-search` *(new)* | Full search UX: text input + facet sidebar + active tags + card grid. Algolia only. |

---

## Layout

### Desktop (900px+)
```
[Search input — full width]
[Active filter tags: Main Dish × | Easy ×  Clear all]
┌──────────────┬──────────────────────────────────┐
│ FILTERS      │  [count] recipes found           │
│              │                                  │
│ Category     │  ░░░  ░░░  ░░░                  │
│ □ Main Dish  │  ░░░  ░░░  ░░░                  │
│ □ Soups      │                                  │
│ □ Drinks     │  ░░░  ░░░  ░░░                  │
│              │                                  │
│ Difficulty   │                                  │
│ □ Easy       │                                  │
│ □ Medium     │                                  │
│ □ Hard       │                                  │
│              │                                  │
│ Universe     │                                  │
│ □ Witcher    │                                  │
│ □ GoT        │                                  │
│              │                                  │
│ Cook Time    │                                  │
│ □ Under 30m  │                                  │
│ □ 30–60 min  │                                  │
│ □ Over 60m   │                                  │
└──────────────┴──────────────────────────────────┘
```

### Mobile (<900px)
- Sidebar is hidden; becomes a fixed bottom sheet
- "Filters (N)" button appears above the grid
- Tapping opens the sidebar as a slide-up sheet with a dark overlay
- Sheet has: header (title + close ×), facet groups, "Show N results" apply button
- One sidebar DOM element — CSS positions it differently on mobile vs desktop

---

## Facet Groups

| Group | Algolia field | Type | Values |
|---|---|---|---|
| Category | `category` | Algolia facet (OR) | Derived from initial results |
| Difficulty | `difficulty` | Algolia facet (OR) | Derived from initial results |
| Universe | `world` | Algolia facet (OR) | Derived from initial results |
| Cook Time | `cook-time` | Client-side bucket (OR) | Fixed: <30 / 30–60 / 60+ min |

**Multi-select logic:**
- Within a group: OR (e.g., Main Dish OR Soups)
- Between groups: AND (e.g., (Main Dish OR Soups) AND Easy)
- Cook time filtered client-side after Algolia results arrive

---

## Requirements

### Functional
- [ ] Search input with 300ms debounce queries Algolia on type
- [ ] Category, Difficulty, Universe checkboxes send facetFilters to Algolia
- [ ] Cook time checkboxes filter client-side using minute-bucketing
- [ ] Active filter tags appear above grid; each is dismissible
- [ ] "Clear all" tag appears when 2+ filters active
- [ ] Result count shown above grid ("12 recipes found")
- [ ] Empty state: "No recipes found in the tavern archives…"

### Mobile
- [ ] "Filters (N)" button above grid shows active count
- [ ] Tapping opens sidebar as bottom sheet with overlay
- [ ] Sheet has close button and "Show N results" apply button
- [ ] Body scroll locked while sheet is open
- [ ] Overlay tap closes sheet

### Authoring
- [ ] Block needs no content rows in da.live
- [ ] Config from page Metadata block (algolia-search-key, algolia-app-id, algolia-index)

---

## Acceptance Criteria

1. Search input filters Algolia results by text, debounced 300ms
2. Each facet group: checking multiple boxes = OR within group
3. Multiple active groups = AND between groups
4. Cook time buckets correctly: "45 min" → 30–60 range
5. Active tags reflect all selected filters and are individually dismissible
6. "Clear all" removes all filters and tags
7. Desktop: sidebar visible in left column, grid in right (2-column layout)
8. Mobile: sidebar hidden, filter button shows count, sheet slides up correctly
9. Empty state shown when 0 results
10. `recipe-cards` is unaffected (no regressions)

---

## What Changes to `recipe-cards`

- Remove `algolia` variant (JS + no CSS needed for algolia-specific styles)
- Remove `buildSearch` / search input (search is now in recipe-search only)
- Remove `queryAlgolia` function
- Keep: `featured`, manual default, `query-index`, category pills, empty state
