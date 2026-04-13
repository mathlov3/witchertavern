/**
 * Recipe Cards block
 *
 * Input format per row (single cell):
 *   <div>
 *     <picture><img src="..." alt="..."/></picture>  <!-- optional -->
 *     <p><a href="/recipes/..."><strong>Title</strong></a></p>
 *     <p>Description</p>
 *     <p>Category</p>
 *     <p>4 servings · Medium</p>
 *     <p>Universe</p>
 *   </div>
 *
 * Block variants (add as extra class on the block div):
 *   featured     — curated grid, no category filter
 *   query-index  — auto-populated from a query-index.json endpoint
 *                  Row 1 (required): /path/to/query-index.json URL
 *                  Row 2 (optional): max number of cards to show (e.g. 4)
 *                  Row 3 (optional): world slug to filter by (e.g. witcher, game-of-thrones)
 *   random           — (combine with query-index) shuffle results before applying the limit
 *   category-{slug}  — (combine with query-index) filter by category slug (e.g. category-maindishes)
 */

import { createPicture } from '../../scripts/utils/picture.js';
import { i18n } from '../../scripts/utils/placeholders.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const UNIVERSE_SLUGS = {
  відьмак: 'witcher',
  'гра престолів': 'game-of-thrones',
};

function universeSlug(universe) {
  const key = universe.toLowerCase().trim();
  return UNIVERSE_SLUGS[key] ?? key.replace(/\s+/g, '-').replace(/[''`]/g, '');
}


// ── Card builder ──────────────────────────────────────────────────────────────

async function buildCard(recipe) {
  const card = document.createElement('a');
  card.className = 'recipe-card';
  card.href = recipe.href;
  if (recipe.category) card.dataset.category = recipe.category;

  // ── Image ────────────────────────────────────────────────
  const imgWrap = document.createElement('div');
  imgWrap.className = 'recipe-card-image';

  if (recipe.picture) {
    const img = recipe.picture.querySelector('img');
    if (img) img.loading = 'lazy';
    imgWrap.append(recipe.picture);
  } else if (recipe.image) {
    imgWrap.append(createPicture({ src: recipe.image, alt: recipe.title }));
  }

  if (recipe.universe) {
    const badge = document.createElement('span');
    badge.className = `recipe-card-badge recipe-card-badge-${universeSlug(recipe.universe)}`;
    badge.textContent = await i18n(`facet-name.universe.${recipe.universe}`, recipe.universe);
    imgWrap.append(badge);
  }

  // ── Body ─────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'recipe-card-body';

  const title = document.createElement('h3');
  title.textContent = recipe.title;
  body.append(title);

  if (recipe.description) {
    const desc = document.createElement('p');
    desc.textContent = recipe.description;
    body.append(desc);
  }

  // ── Meta ─────────────────────────────────────────────────
  const meta = document.createElement('div');
  meta.className = 'recipe-card-meta';

  if (recipe.category) {
    const catPill = document.createElement('span');
    catPill.className = 'recipe-card-category';
    catPill.textContent = await i18n(`facet-name.category.${recipe.category}`);
    meta.append(catPill);
  }

  if (recipe.servings) {
    const metaSpan = document.createElement('span');
    metaSpan.className = 'recipe-card-servings';
    metaSpan.textContent = await i18n(`recipe-search.servings-count`) + recipe.servings;
    if (recipe.difficulty) {
      metaSpan.textContent += ' · ' + await i18n(`facet-name.difficalty.${recipe.difficulty}`)
    }
    meta.append(metaSpan);

  }

  if (recipe.difficulty)

  body.append(meta);
  card.append(imgWrap, body);
  return card;
}

// ── Parse manually-authored rows ──────────────────────────────────────────────

function parseRecipe(row) {
  const cell = row.querySelector(':scope > div');
  if (!cell) return null;

  const picture = cell.querySelector('picture');
  const ps = [...cell.querySelectorAll('p')];
  const link = ps[0]?.querySelector('a');
  const title = ps[0]?.querySelector('strong')?.textContent?.trim()
    ?? ps[0]?.textContent?.trim()
    ?? '';

  if (!title) return null;

  return {
    picture: picture ? picture.cloneNode(true) : null,
    image: null,
    href: link?.getAttribute('href') ?? '#',
    title,
    description: ps[1]?.textContent?.trim() ?? '',
    category: ps[2]?.textContent?.trim() ?? '',
    meta: ps[3]?.textContent?.trim() ?? '',
    universe: ps[4]?.textContent?.trim() ?? '',
  };
}

// ── Map query-index record to recipe shape ────────────────────────────────────

function mapRecord(item) {
  return {
    picture: null,
    image: item.image ?? '',
    href: item.path ?? '#',
    title: item.title ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    servings: item.servings,
    difficulty: item.difficulty,
    universe: item.world ?? '',
    template: item.template,
    lastModified: item.lastModified ? Number(item.lastModified) : 0,
  };
}

// ── Fetch query-index.json ────────────────────────────────────────────────────

async function fetchQueryIndex(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const json = await res.json();
  return (json.data ?? [])
    .filter((item) => item.template === 'recipe')
    .map(mapRecord);
}

// ── Shuffle (Fisher-Yates) ────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Grid + empty state ────────────────────────────────────────────────────────

async function buildGrid(recipes) {
  const grid = document.createElement('div');
  grid.className = 'recipe-cards-grid';
  recipes.forEach(async (r) => grid.append(await buildCard(r)));
  return grid;
}

// ── decorate ──────────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const isFeatured = block.classList.contains('featured');
  const isQueryIndex = block.classList.contains('query-index');

  // ── Featured: curated grid, no filter ────────────────────
  if (isFeatured) {
    const recipes = [...block.querySelectorAll(':scope > div')]
      .map(parseRecipe)
      .filter(Boolean);
    if (!recipes.length) return;
    block.replaceChildren(await buildGrid(recipes, dictionary));
    return;
  }

  // ── Query-index variant ───────────────────────────────────
  if (isQueryIndex) {
    const rows = [...block.querySelectorAll(':scope > div > div')];
    const url = rows[0]?.textContent?.trim() || '/query-index.json';
    const classList = [...block.classList];
    const worldClass = classList.find((c) => c.startsWith('world-'))?.slice('world-'.length) || '';
    const maxResultsClass = classList.find((c) => c.startsWith('max-results-'))?.slice('max-results-'.length) || '';
    const limit = parseInt(maxResultsClass, 10) || parseInt(rows[1]?.textContent?.trim(), 10) || 0;
    const worldFilter = worldClass || rows[2]?.textContent?.trim().toLowerCase() || '';
    const categoryFilter = classList.find((c) => c.startsWith('category-'))?.slice('category-'.length) || '';
    const isRandom = block.classList.contains('random');
    block.replaceChildren();

    let recipes = [];
    try {
      recipes = await fetchQueryIndex(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[recipe-cards]', err);
    }

    recipes = recipes.filter(recipe => recipe.template === 'recipe');

    if (worldFilter) {
      recipes = recipes.filter((r) => universeSlug(r.universe) === worldFilter
        || r.universe.toLowerCase() === worldFilter);
    }
    if (categoryFilter) {
      recipes = recipes.filter((r) => r.category.toLowerCase().replace(/\s+/g, '-') === categoryFilter);
    }
    if (isRandom) {
      recipes = shuffle(recipes);
    } else {
      recipes = recipes.sort((a, b) => b.lastModified - a.lastModified);
    }
    if (limit > 0) recipes = recipes.slice(0, limit);

    block.replaceChildren(await buildGrid(recipes));
    return;
  }

  // ── Default (manual) variant ──────────────────────────────
  const recipes = [...block.querySelectorAll(':scope > div')]
    .map(parseRecipe)
    .filter(Boolean);
  if (!recipes.length) return;
  block.replaceChildren(await buildGrid(recipes));
}
