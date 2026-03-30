/**
 * Algolia indexing script
 *
 * Triggered by GitHub Actions on resource-published / resource-unpublished
 * events sent by AEM when a page is published or unpublished.
 *
 * Environment variables (set by the GitHub Action):
 *   ALGOLIA_APP_ID    — Algolia application ID
 *   ALGOLIA_ADMIN_KEY — Algolia admin API key (kept in GitHub secrets)
 *   PAGE_PATH         — e.g. /recipies/crown-of-pork-ribs
 *   EVENT_TYPE        — resource-published | resource-unpublished
 *   GITHUB_REF_NAME   — branch name, used to pick dev vs prod index
 */

import algoliasearch from 'algoliasearch';

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_KEY,
  PAGE_PATH,
  EVENT_TYPE,
  GITHUB_REF_NAME,
} = process.env;

const IS_PROD = GITHUB_REF_NAME === 'main';
const INDEX_NAME = IS_PROD
  ? 'witchertavern_recipes_prod'
  : 'witchertavern_recipes_dev';

const AEM_ORIGIN = 'https://main--witchertavern--mathlov3.aem.live';
const QUERY_INDEX_URL = `${AEM_ORIGIN}/recipies/query-index.json`;

async function getRecord(path) {
  const res = await fetch(QUERY_INDEX_URL);
  if (!res.ok) throw new Error(`Failed to fetch query-index: ${res.status}`);
  const { data } = await res.json();
  return data.find((r) => r.path === path) ?? null;
}

async function run() {
  if (!PAGE_PATH) throw new Error('PAGE_PATH env var is missing');

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
  const index = client.initIndex(INDEX_NAME);

  // Remove from index when unpublished
  if (EVENT_TYPE === 'resource-unpublished') {
    await index.deleteObject(PAGE_PATH);
    console.log(`Deleted: ${PAGE_PATH} from ${INDEX_NAME}`);
    return;
  }

  // Fetch the record from AEM query index
  const record = await getRecord(PAGE_PATH);
  if (!record) {
    console.warn(`Not found in query-index: ${PAGE_PATH} — skipping`);
    return;
  }

  // objectID is the page path — stable, unique, human-readable
  await index.saveObject({ ...record, objectID: record.path });
  console.log(`Indexed: ${PAGE_PATH} → ${INDEX_NAME}`);
}

run().catch((err) => {
  console.error('[algolia-index]', err.message);
  process.exit(1);
});
