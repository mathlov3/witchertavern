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
 *   query-index  — first content row is a /path/to/query-index.json URL;
 *                  cards are auto-populated from published recipes
 */

import { createPicture } from '../../scripts/utils/picture.js';

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

function buildCard(recipe) {
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
    badge.textContent = recipe.universe;
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
    catPill.textContent = recipe.category;
    meta.append(catPill);
  }

  if (recipe.meta) {
    const metaSpan = document.createElement('span');
    metaSpan.className = 'recipe-card-servings';
    metaSpan.textContent = recipe.meta;
    meta.append(metaSpan);
  }

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
  const servings = item.servings ? `${item.servings} servings` : '';
  const meta = [servings, item.difficulty].filter(Boolean).join(' · ');
  return {
    picture: null,
    image: item.image ?? '',
    href: item.path ?? '#',
    title: item.title ?? '',
    description: item.description ?? '',
    category: item.category ?? '',
    meta,
    universe: item.world ?? '',
  };
}

// ── Fetch query-index.json ────────────────────────────────────────────────────

async function fetchQueryIndex(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const json = await res.json();
  return (json.data ?? [])
    .filter((item) => !item.template || item.template === 'recipe')
    .map(mapRecord);
}

// ── Category filter bar ───────────────────────────────────────────────────────

function buildFilter(categories, grid) {
  const bar = document.createElement('div');
  bar.className = 'recipe-cards-filter';

  ['', ...categories].forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.textContent = i === 0 ? 'Всі' : cat;
    btn.dataset.filter = cat;
    if (i === 0) btn.classList.add('active');

    btn.addEventListener('click', () => {
      bar.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      grid.querySelectorAll('.recipe-card').forEach((card) => {
        // eslint-disable-next-line no-param-reassign
        card.hidden = cat !== '' && card.dataset.category !== cat;
      });
    });

    bar.append(btn);
  });

  return bar;
}

// ── Grid + empty state ────────────────────────────────────────────────────────

function buildGrid(recipes) {
  const grid = document.createElement('div');
  grid.className = 'recipe-cards-grid';
  recipes.forEach((r) => grid.append(buildCard(r)));
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
    block.replaceChildren(buildGrid(recipes));
    return;
  }

  // ── Query-index variant ───────────────────────────────────
  if (isQueryIndex) {
    const urlCell = block.querySelector(':scope > div > div');
    const url = urlCell?.textContent?.trim() || '/query-index.json';
    block.replaceChildren();

    let recipes = [];
    try {
      recipes = await fetchQueryIndex(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[recipe-cards]', err);
    }

    const grid = buildGrid(recipes);
    const categories = [...new Set(recipes.map((r) => r.category).filter(Boolean))];
    const children = [];
    if (categories.length > 1) children.push(buildFilter(categories, grid));
    children.push(grid);
    block.replaceChildren(...children);
    return;
  }

  // ── Default (manual) variant ──────────────────────────────
  const recipes = [...block.querySelectorAll(':scope > div')]
    .map(parseRecipe)
    .filter(Boolean);
  if (!recipes.length) return;

  const grid = buildGrid(recipes);
  const categories = [...new Set(recipes.map((r) => r.category).filter(Boolean))];
  const children = [];
  if (categories.length > 1) children.push(buildFilter(categories, grid));
  children.push(grid);
  block.replaceChildren(...children);
}
