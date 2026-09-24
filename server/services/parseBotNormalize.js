/**
 * Normalizes parse.bot's roadmap.sh topic data into the shape our
 * RoadmapNode schema expects (parentId, nodeType, status).
 *
 * IMPORTANT: written defensively because the exact field names coming back
 * from get_roadmap_topics aren't confirmed yet. It checks several common
 * candidates for each field. Once you've called the real endpoint and
 * shared a sample response, tighten this to the exact keys and delete the
 * fallback chains.
 */

function firstDefined(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

// Flattens topics into a flat array if the API nested them as { id, children: [...] }
// instead of a flat list with parentId pointers. Handles either shape.
function flattenTopics(rawTopics) {
  const flat = [];

  function walk(topic, parentId) {
    const id = firstDefined(topic, ['id', '_id', 'topicId', 'nodeId']);
    const explicitParent = firstDefined(topic, ['parentId', 'parentTopicId', 'parent_id', 'parent']);
    const resolvedParent = explicitParent !== undefined ? explicitParent : parentId || null;

    flat.push({ ...topic, __resolvedParentId: resolvedParent, __resolvedId: id });

    const children = firstDefined(topic, ['children', 'subTopics', 'topics', 'items']);
    if (Array.isArray(children)) {
      children.forEach((child) => walk(child, id));
    }
  }

  (Array.isArray(rawTopics) ? rawTopics : []).forEach((t) => walk(t, null));
  return flat;
}

/**
 * @param {Array|Object} rawTopics - whatever get_roadmap_topics returns
 *   (accepts either the raw response or its .topics/.data array)
 * @param {String} roadmapObjectId - our own Mongo Roadmap _id these nodes belong to
 * @returns {Array} objects shaped for RoadmapNode.insertMany, with a temporary
 *   __parseId / __parseParentId kept so the caller can resolve real
 *   parentId ObjectIds after insertion (Mongo ids don't exist until insert).
 */
function normalizeTopicsToNodes(rawTopics, roadmapObjectId) {
  const container = firstDefined(rawTopics, ['topics', 'data', 'items']) || rawTopics;
  const flat = flattenTopics(container);

  return flat.map((topic, index) => {
    const title = firstDefined(topic, ['title', 'label', 'name']) || 'Untitled topic';
    const description = firstDefined(topic, ['description', 'summary']) || '';
    const isOptional = !!firstDefined(topic, ['isOptional', 'optional']);
    const hasParent = !!topic.__resolvedParentId;

    return {
      roadmap: roadmapObjectId,
      title,
      description,
      order: index + 1,
      // Top-level topics (no parent) are the main spine; everything else
      // branches off its parent.
      nodeType: !hasParent ? 'milestone' : isOptional ? 'optional' : 'topic',
      status: 'not-started',
      __parseId: String(topic.__resolvedId),
      __parseParentId: topic.__resolvedParentId ? String(topic.__resolvedParentId) : null,
    };
  });
}

module.exports = { normalizeTopicsToNodes, flattenTopics, firstDefined };
