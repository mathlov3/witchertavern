/**
 * Search Input block
 *
 * A search box that works in two modes automatically:
 *
 * 1. Live search (same page as recipe-search):
 *    Dispatches a cancelable `search:query` custom event on every keystroke
 *    (debounced 300 ms). recipe-search listens, calls e.preventDefault(),
 *    and handles live filtering. No page navigation happens.
 *
 * 2. Navigation (any other page, e.g. home page, header):
 *    On form submit (Enter or Search button), dispatches the same event.
 *    If nothing calls e.preventDefault(), navigates to the configured URL
 *    with ?q= appended.
 *
 * Block content (in da.live):
 *   Row 1 — target search page URL  (e.g. /recipes)
 *   Row 2 — placeholder text         (optional, default: 'Search recipes…')
 *
 * The input pre-fills from ?q= so it stays in sync when placed alongside
 * recipe-search on the results page.
 */

import { getSearchQuery, navigateToSearch, SEARCH_QUERY_EVENT, } from '../../scripts/utils/search.js';
import getPlaceholders from '../../scripts/utils/placeholders.js';

const DEBOUNCE_MS = 300;

function dispatch(query) {
  return window.dispatchEvent(
    new CustomEvent(SEARCH_QUERY_EVENT, { detail: { query }, cancelable: true }),
  );
}

export default async function decorate(block) {
  const ph = await getPlaceholders();
  const rows = [...block.querySelectorAll(':scope > div')];
  const targetUrl = rows[0]?.querySelector(':scope > div')?.textContent?.trim() || '/recipes';
  const placeholder = ph['search-input-field.placeholder-text'] || 'Dish name ...';

  block.replaceChildren();

  const form = document.createElement('form');
  form.className = 'si-form';
  form.setAttribute('role', 'search');

  const icon = document.createElement('span');
  icon.className = 'si-icon';
  icon.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'si-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  input.value = getSearchQuery();

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'si-submit';
  btn.textContent = ph['search-input-field.search-button-label'] || 'Search';

  // Live keystrokes — dispatched for recipe-search on the same page.
  // On other pages the event goes unhandled (no navigation on keypress).
  const MIN_CHARS = 3;
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const val = input.value.trim();
    // Always dispatch when cleared; require MIN_CHARS otherwise
    if (val.length > 0 && val.length < MIN_CHARS) return;
    timer = setTimeout(() => dispatch(val), DEBOUNCE_MS);
  });

  // Submit — dispatch first; navigate only if nothing handled it.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    const handled = !dispatch(input.value.trim());
    if (!handled) navigateToSearch(targetUrl, input.value.trim());
  });

  // Keep in sync when browser back/forward changes ?q=
  window.addEventListener('popstate', () => {
    input.value = getSearchQuery();
  });

  form.append(icon, input, btn);
  block.append(form);
}
