const router = require("express").Router();
const Question = require("../models/Question");
const Category = require("../models/Category");
const { authMiddleware } = require("../middleware/auth");

router.get("/categories", async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Question.countDocuments({ categoryId: cat._id, isActive: true });
        return {
          ...cat.toObject(),
          id: cat._id,
          _count: { questions: count }
        };
      })
    );
    
    res.json({ categories: categoriesWithCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/", async (req, res) => {
  const { category, diff, limit = 10 } = req.query;
  try {
    const filter = { isActive: true };
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.categoryId = cat._id;
    }
    if (diff && ["EASY", "MEDIUM", "HARD"].includes(diff.toUpperCase())) {
      filter.difficulty = diff.toUpperCase();
    }
    
    const questions = await Question.find(filter)
      .populate('categoryId')
      .limit(Math.min(parseInt(limit) || 10, 50));
      
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

router.post("/report/:id", authMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { reportCount: 1 } },
      { new: true }
    );
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json({ message: "Question reported. Thank you for your feedback!" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid question ID or queston not found" });
  }
});

module.exports = router;
