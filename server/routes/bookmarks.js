const express = require('express');
const Bookmark = require('../models/Bookmark');
const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const Flashcard = require('../models/Flashcard');
const RoadmapNode = require('../models/RoadmapNode');

const router = express.Router();

// Toggle bookmark (create if doesn't exist, delete if exists)
router.post('/toggle', async (req, res) => {
  try {
    const { userId, contentType, contentId } = req.body;

    if (!userId || !contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      userId,
      contentType,
      contentId
    });

    if (existingBookmark) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      return res.json({
        success: true,
        bookmarked: false,
        message: 'Bookmark removed'
      });
    } else {
      // Create bookmark
      const bookmark = await Bookmark.create({
        userId,
        contentType,
        contentId
      });
      return res.status(201).json({
        success: true,
        bookmarked: true,
        bookmark
      });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Check if content is bookmarked
router.get('/check', async (req, res) => {
  try {
    const { userId, contentType, contentId } = req.query;

    if (!userId || !contentType || !contentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const bookmark = await Bookmark.findOne({
      userId,
      contentType,
      contentId
    });

    res.json({
      bookmarked: !!bookmark,
      bookmark: bookmark || null
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all bookmarks for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const bookmarks = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Populate content details and group by type
    const bookmarksWithContent = {
      book: [],
      chapter: [],
      topic: [],
      flashcard: [],
      roadmapNode: [],
      resource: []
    };

    for (const bookmark of bookmarks) {
      let contentDetails = null;

      try {
        switch (bookmark.contentType) {
          case 'book': {
            const book = await Book.findById(bookmark.contentId)
              .populate('subject')
              .lean();
            if (book) {
              contentDetails = {
                _id: book._id,
                title: book.title,
                author: book.author,
                coverImage: book.coverImage,
                subject: book.subject?.name || 'Unknown'
              };
            }
            break;
          }
          case 'chapter': {
            const chapter = await Chapter.findById(bookmark.contentId)
              .populate('book')
              .lean();
            if (chapter && chapter.book) {
              contentDetails = {
                _id: chapter._id,
                title: chapter.title,
                chapterNumber: chapter.chapterNumber,
                bookTitle: chapter.book.title,
                bookId: chapter.book._id
              };
            }
            break;
          }
          case 'flashcard': {
            const flashcard = await Flashcard.findById(bookmark.contentId).lean();
            if (flashcard) {
              contentDetails = {
                _id: flashcard._id,
                front: flashcard.front,
                topic: flashcard.topic
              };
            }
            break;
          }
          case 'roadmapNode': {
            const node = await RoadmapNode.findById(bookmark.contentId)
              .populate('roadmap')
              .lean();
            if (node) {
              contentDetails = {
                _id: node._id,
                title: node.title,
                description: node.description,
                phase: node.phase,
                roadmapTitle: node.roadmap?.title || 'Unknown Roadmap',
                roadmapId: node.roadmap?._id
              };
            }
            break;
          }
          case 'topic':
          case 'resource':
            // Placeholder for future content types
            contentDetails = {
              _id: bookmark.contentId,
              title: 'Content not available'
            };
            break;
        }

        if (contentDetails) {
          bookmarksWithContent[bookmark.contentType].push({
            bookmarkId: bookmark._id,
            createdAt: bookmark.createdAt,
            ...contentDetails
          });
        }
      } catch (err) {
        console.warn(`Failed to populate ${bookmark.contentType} bookmark:`, err.message);
      }
    }

    res.json(bookmarksWithContent);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a bookmark
router.delete('/:bookmarkId', async (req, res) => {
  try {
    const { bookmarkId } = req.params;

    const bookmark = await Bookmark.findByIdAndDelete(bookmarkId);

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.json({
      success: true,
      message: 'Bookmark removed'
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
