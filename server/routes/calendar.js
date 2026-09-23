const express = require('express');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Get activity calendar data for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Build query
    const query = { userId };

    // If date range is provided, filter by it
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    } else {
      // Default to last 365 days if no range specified
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      query.date = { $gte: oneYearAgo };
    }

    const activities = await ActivityLog.find(query)
      .sort({ date: 1 })
      .lean();

    // Convert to date -> count map
    const activityMap = {};
    activities.forEach(activity => {
      const dateStr = activity.date.toISOString().split('T')[0]; // YYYY-MM-DD format
      activityMap[dateStr] = activity.count;
    });

    res.json(activityMap);
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
