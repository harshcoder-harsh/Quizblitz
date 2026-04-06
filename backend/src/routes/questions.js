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

const csv = require("csv-parser");
const { Readable } = require("stream");

router.post("/import", authMiddleware, async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];
  const stream = Readable.from(req.files.file.data);

  stream
    .pipe(csv({ 
      mapHeaders: ({ header }) => header.trim(),
      mapValues: ({ value }) => typeof value === 'string' ? value.trim() : value
    }))
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        let importedCount = 0;
        for (const row of results) {
          let { category, subTopic, questionText, difficulty, option1, option2, option3, option4, correctIndex, explanation } = row;
          
          if (!category || !questionText || !option1 || !correctIndex) continue;

          let cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
          if (!cat) {
            cat = await Category.create({
              name: category,
              slug: category.toLowerCase().replace(/ /g, '-'),
              icon: category.substring(0, 2).toUpperCase(),
              color: '#8884d8'
            });
          }

          const options = [
            { optionText: option1, isCorrect: parseInt(correctIndex) === 0 },
            { optionText: option2, isCorrect: parseInt(correctIndex) === 1 },
            { optionText: option3, isCorrect: parseInt(correctIndex) === 2 },
            { optionText: option4, isCorrect: parseInt(correctIndex) === 3 },
          ].filter(o => o.optionText);

          await Question.create({
            categoryId: cat._id,
            subTopic: subTopic || 'General',
            questionText,
            difficulty: (difficulty || 'MEDIUM').toUpperCase(),
            options,
            explanation,
            isActive: true
          });
          importedCount++;
        }
        res.json({ message: `Successfully imported ${importedCount} questions!` });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process CSV data" });
      }
    });
});

module.exports = router;
