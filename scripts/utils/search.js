/**
 * Search utilities
 *
 * Shared logic for search inputs across the site.
 * Used by: search-input block, recipe-search block, header (future).
 */

/**
 * Custom event name dispatched by search-input (and header search in future).
 * recipe-search listens for this and calls e.preventDefault() to claim it.
 * If unclaimed, search-input falls back to full-page navigation.
 */
export const SEARCH_QUERY_EVENT = 'search:query';

/**
 * Returns the current ?q= value from the URL, or empty string.
 * @returns {string}
 */
export function getSearchQuery() {
  return new URLSearchParams(window.location.search).get('q') ?? '';
}

/**
 * Builds a URL for the given search page with ?q= applied.
 * Preserves any existing params on baseUrl.
 *
 * @param {string} baseUrl - The search page path (e.g. '/recipes')
 * @param {string} query
 * @returns {string}
 */
export function buildSearchUrl(baseUrl, query) {
  const url = new URL(baseUrl, window.location.origin);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  return url.toString();
}

/**
 * Navigates to the search page with the given query.
 * Full page navigation — recipe-search will read ?q= on arrival.
 *
 * @param {string} baseUrl - The search page path (e.g. '/recipes')
 * @param {string} query
 */
export function navigateToSearch(baseUrl, query) {
  window.location.assign(buildSearchUrl(baseUrl, query));
}
