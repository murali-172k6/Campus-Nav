import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import History from '../models/History.js';
import { toggleBlockedEdge, getBlockedEdges } from '../routing.js';

const router = express.Router();

// @route   POST /api/user/favorites
// @access  Private
router.post('/favorites', protect, async (req, res) => {
  const { nodeId } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user.favorites.includes(nodeId)) {
        user.favorites.push(nodeId);
        await user.save();
    }
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/favorites/:nodeId', protect, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      user.favorites = user.favorites.filter(id => id !== req.params.nodeId);
      await user.save();
      res.json(user.favorites);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

// @route   POST /api/user/history
// @access  Private
router.post('/history', protect, async (req, res) => {
  const { startNode, endNode, distanceMeters } = req.body;
  try {
    const history = await History.create({
      user: req.user._id,
      startNode,
      endNode,
      distanceMeters
    });
    res.status(201).json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/user/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const history = await History.find({ user: req.user._id }).sort('-date').limit(10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/user/feedback
// @access  Private
router.post('/feedback', protect, async (req, res) => {
  const { message } = req.body;
  try {
    const fb = await Feedback.create({
      user: req.user._id,
      message
    });
    res.status(201).json({ message: 'Feedback submitted anonymously.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/admin/block_edge
// @access  Private/Admin
router.post('/admin/block_edge', protect, adminOnly, (req, res) => {
    const { u, v } = req.body;
    const isBlocked = toggleBlockedEdge(u, v);
    res.json({ success: true, isBlocked, blockedEdges: getBlockedEdges() });
});

// @route   GET /api/admin/system
// @access  Private/Admin
router.get('/admin/system', protect, adminOnly, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const feedbacks = await Feedback.find().sort('-date').limit(5).populate('user', 'name email');
        const historyCount = await History.countDocuments();
        
        // aggregate most visited
        const mostVisitedAgg = await History.aggregate([
            { $group: { _id: "$endNode", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);

        res.json({
            stats: {
                totalSearches: historyCount,
                mostVisited: mostVisitedAgg.map(i => i._id),
                wheelchairRequests: Math.floor(historyCount * 0.1), // Mock computation
                activeUsers: totalUsers
            },
            feedbacks,
            blockedEdges: getBlockedEdges()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
