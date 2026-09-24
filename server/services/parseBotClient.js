/**
 * Client for the parse.bot "roadmap.sh API" scraper.
 * API key / scraper ID live in environment variables — never commit real
 * values (only .env.example is tracked).
 *
 * Known endpoints (from the Parse playground, "roadmap.sh API", canonical v0):
 *   GET list_roadmaps        - no params
 *   GET get_roadmap_detail   - params TBD, likely ?roadmapId= or ?slug=
 *   GET get_roadmap_topics   - params TBD, likely ?roadmapId= or ?slug=
 *   GET get_topic_detail     - params TBD, likely ?topicId=
 *   GET list_guides          - params TBD
 *
 * Once you check the "Endpoints" tab in Parse for the exact param names,
 * update PARAM_NAME_CANDIDATES below if they differ from the guesses.
 */

const PARSEBOT_BASE_URL = 'https://api.parse.bot';

function getConfig() {
  const apiKey = process.env.PARSEBOT_API_KEY;
  const scraperId = process.env.PARSEBOT_SCRAPER_ID;
  const snapshotVersion = process.env.PARSEBOT_SNAPSHOT_VERSION || '6';

  if (!apiKey || !scraperId) {
    throw new Error(
      'PARSEBOT_API_KEY and PARSEBOT_SCRAPER_ID must be set in your .env file'
    );
  }

  return { apiKey, scraperId, snapshotVersion };
}

async function callEndpoint(endpointName, params = {}) {
  const { apiKey, scraperId, snapshotVersion } = getConfig();

  const url = new URL(`${PARSEBOT_BASE_URL}/scraper/${scraperId}/${endpointName}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
      'API-Snapshot-Version': snapshotVersion,
    },
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!response.ok) {
    const err = new Error(
      `parse.bot ${endpointName} failed: ${response.status} ${response.statusText}`
    );
    err.status = response.status;
    err.body = body;
    throw err;
  }

  return body;
}

const listRoadmaps = () => callEndpoint('list_roadmaps');

// `identifier` is whatever list_roadmaps gives you as this roadmap's id/slug.
// We send it under a few common param names at once — harmless extra query
// params are ignored by most APIs, and this avoids a round-trip just to
// learn the exact key. Tighten this once you confirm the real name.
const getRoadmapDetail = (identifier) =>
  callEndpoint('get_roadmap_detail', {
    roadmapId: identifier,
    slug: identifier,
    id: identifier,
  });

const getRoadmapTopics = (identifier) =>
  callEndpoint('get_roadmap_topics', {
    roadmapId: identifier,
    slug: identifier,
    id: identifier,
  });

const getTopicDetail = (topicIdentifier) =>
  callEndpoint('get_topic_detail', {
    topicId: topicIdentifier,
    id: topicIdentifier,
  });

const listGuides = () => callEndpoint('list_guides');

module.exports = {
  callEndpoint,
  listRoadmaps,
  getRoadmapDetail,
  getRoadmapTopics,
  getTopicDetail,
  listGuides,
};
