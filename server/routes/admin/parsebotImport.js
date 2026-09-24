const express = require('express');
const parseBotClient = require('../../services/parseBotClient');
const { normalizeTopicsToNodes } = require('../../services/parseBotNormalize');
const Roadmap = require('../../models/Roadmap');
const RoadmapNode = require('../../models/RoadmapNode');

const router = express.Router();

// ---- RAW PREVIEWS (read-only, nothing written to the DB) ----
// Use these first to see the real field names/shape before trusting the
// normalizer below.

// GET /api/admin/parsebot/roadmaps
router.get('/roadmaps', async (req, res) => {
  try {
    const data = await parseBotClient.listRoadmaps();
    console.log('[parsebot] list_roadmaps raw response:', JSON.stringify(data, null, 2));
    res.json({ success: true, raw: data });
  } catch (error) {
    console.error('parse.bot list_roadmaps error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch from parse.bot',
      details: error.body,
    });
  }
});

// GET /api/admin/parsebot/roadmaps/:identifier/topics
// :identifier is whatever id/slug list_roadmaps gave you for that roadmap
router.get('/roadmaps/:identifier/topics', async (req, res) => {
  try {
    const data = await parseBotClient.getRoadmapTopics(req.params.identifier);
    console.log('[parsebot] get_roadmap_topics raw response:', JSON.stringify(data, null, 2));
    res.json({ success: true, raw: data });
  } catch (error) {
    console.error('parse.bot get_roadmap_topics error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch from parse.bot',
      details: error.body,
    });
  }
});

// GET /api/admin/parsebot/roadmaps/:identifier/detail
router.get('/roadmaps/:identifier/detail', async (req, res) => {
  try {
    const data = await parseBotClient.getRoadmapDetail(req.params.identifier);
    console.log('[parsebot] get_roadmap_detail raw response:', JSON.stringify(data, null, 2));
    res.json({ success: true, raw: data });
  } catch (error) {
    console.error('parse.bot get_roadmap_detail error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to fetch from parse.bot',
      details: error.body,
    });
  }
});

// ---- ACTUAL IMPORT (writes a new Roadmap + branching RoadmapNodes) ----

// POST /api/admin/parsebot/roadmaps/:identifier/import
// Body (optional): { title, description, category, targetAudience, estimatedDuration }
router.post('/roadmaps/:identifier/import', async (req, res) => {
  try {
    const { identifier } = req.params;
    const overrides = req.body || {};

    const topicsRaw = await parseBotClient.getRoadmapTopics(identifier);

    const roadmap = await Roadmap.create({
      title: overrides.title || `Imported: ${identifier}`,
      description: overrides.description || 'Imported from roadmap.sh via parse.bot',
      category: overrides.category || 'General',
      targetAudience: overrides.targetAudience || '',
      estimatedDuration: overrides.estimatedDuration || '',
    });

    const normalized = normalizeTopicsToNodes(topicsRaw, roadmap._id);

    if (normalized.length === 0) {
      await Roadmap.findByIdAndDelete(roadmap._id);
      return res.status(422).json({
        success: false,
        message:
          'get_roadmap_topics returned no recognizable topics. Check GET /api/admin/parsebot/roadmaps/:identifier/topics first to see the raw shape.',
      });
    }

    // Insert without parentId first so we have real Mongo _ids to map back to
    const inserted = await RoadmapNode.insertMany(
      normalized.map(({ __parseId, __parseParentId, ...node }) => node)
    );

    // Build parse-id -> mongo-id lookup, then patch parentId in a second pass
    const idMap = new Map();
    normalized.forEach((n, i) => idMap.set(n.__parseId, inserted[i]._id));

    const bulkOps = normalized
      .map((n, i) => {
        if (!n.__parseParentId) return null;
        const parentMongoId = idMap.get(n.__parseParentId);
        if (!parentMongoId) return null;
        return {
          updateOne: {
            filter: { _id: inserted[i]._id },
            update: { $set: { parentId: parentMongoId } },
          },
        };
      })
      .filter(Boolean);

    if (bulkOps.length > 0) {
      await RoadmapNode.bulkWrite(bulkOps);
    }

    res.status(201).json({
      success: true,
      roadmap,
      nodesCreated: inserted.length,
      branchesLinked: bulkOps.length,
    });
  } catch (error) {
    console.error('parse.bot import error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Import failed',
      details: error.body,
    });
  }
});

module.exports = router;
