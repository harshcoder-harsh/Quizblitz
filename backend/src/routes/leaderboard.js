const router = require("express").Router();
const User = require("../models/User");
const GameResult = require("../models/GameResult");
const Category = require("../models/Category");

router.get("/global", async (_req, res) => {
  try {
    const players = await User.find({ gamesPlayed: { $gt: 0 } })
      .select('username totalScore gamesPlayed avatar')
      .sort({ totalScore: -1 })
      .limit(50);
      
    res.json({ leaderboard: players.map((p, i) => ({ ...p.toObject(), id: p._id, rank: i + 1 })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get("/category/:slug", async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Join with Room to check categoryId
    const results = await GameResult.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      { $match: { 'room.categoryId': category._id } },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 20 }
    ]);

    const users = await Promise.all(
      results.map(async (r, i) => {
        const user = await User.findById(r._id).select('username avatar');
        return { 
          id: r._id,
          username: user?.username || 'Unknown',
          avatar: user?.avatar,
          totalScore: r.totalScore, 
          rank: i + 1 
        };
      })
    );

    res.json({ category, leaderboard: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch category leaderboard" });
  }
});

router.get("/room/:id", async (req, res) => {
  try {
    const results = await GameResult.find({ roomId: req.params.id })
      .populate('userId', 'username avatar')
      .sort({ score: -1 });

    const formatted = results.map(r => ({
      ...r.toObject(),
      id: r._id,
      user: {
        id: r.userId._id,
        username: r.userId.username,
        avatar: r.userId.avatar
      }
    }));

    res.json({ results: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch room results" });
  }
});

module.exports = router;
