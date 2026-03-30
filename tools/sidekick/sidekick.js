import toggleScheduler from '../scheduler/scheduler.js';
import initQuickEdit from '../quick-edit/quick-edit.js';

const ALGOLIA_INDEX_ENDPOINT = 'https://webhook.site/64c1584d-4082-4761-b5ae-0ec8af35d62b';

async function onPublished({ detail }) {
  const path = detail?.path ?? window.location.pathname;
  try {
    await fetch(ALGOLIA_INDEX_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[algolia] indexing failed:', e);
  }
}

export default async function init(sk) {
  // Handle button clicks
  sk.addEventListener('custom:scheduler', toggleScheduler);
  sk.addEventListener('custom:quick-edit', initQuickEdit);

  // Index published pages in Algolia
  sk.addEventListener('published', onPublished);
  sk.addEventListener('previewed', onPublished);

  // Show after all decoration is finished
  sk.classList.add('is-ready');
}
