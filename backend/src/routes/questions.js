const router = require("express").Router();
const Question = require("../models/Question");
const Category = require("../models/Category");
const { authMiddleware, optionalAuth } = require("../middleware/auth");

router.get("/categories", optionalAuth, async (req, res) => {
  try {
    // Exclusively return the user's private libraries.
    // If not logged in, they see nothing.
    if (!req.user || !req.user.id || req.user.isGuest) {
       return res.json({ categories: [] });
    }

    const categories = await Category.find({ createdBy: req.user.id }).sort({ name: 1 });
    
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

  const quizName = req.body.quizName || req.files.file.name.replace('.csv', '');
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
        
        // 1. Ensure the Library/Category exists exactly once for this CSV upload scopes exclusively to the user
        let cat = await Category.findOne({ name: { $regex: new RegExp(`^${quizName}$`, 'i') }, createdBy: req.user.id });
        if (!cat) {
          cat = await Category.create({
            name: quizName,
            slug: quizName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + req.user.id.slice(-6),
            icon: '📚', // Default icon for imported libraries
            color: '#8884d8',
            createdBy: req.user.id
          });
        }

        // 2. Map all rows into this specific Library/Category
        for (const row of results) {
          const questionText = row.question || row.questionText;
          const diff = row.difficulty || 'MEDIUM';
          const opt1 = row.optionA || row.option1;
          const opt2 = row.optionB || row.option2;
          const opt3 = row.optionC || row.option3;
          const opt4 = row.optionD || row.option4;
          const correctKey = row.correctOption || row.correctIndex;
          const expl = row.explanation;

          if (!questionText || !opt1 || !correctKey) continue;

          // Robustly parse the correct option index (handling 0-3, 1-4, or A, B, C, D)
          let cIndex = 0;
          if (typeof correctKey === 'string' || typeof correctKey === 'number') {
            const strKey = String(correctKey).trim().toUpperCase();
            if (strKey === 'A' || strKey === '1' || strKey === 'OPTION A') cIndex = 0;
            else if (strKey === 'B' || strKey === '2' || strKey === 'OPTION B') cIndex = 1;
            else if (strKey === 'C' || strKey === '3' || strKey === 'OPTION C') cIndex = 2;
            else if (strKey === 'D' || strKey === '4' || strKey === 'OPTION D') cIndex = 3;
            else {
              const raw = parseInt(strKey);
              if (!isNaN(raw) && raw >= 0) {
                cIndex = raw > 0 && raw <= 4 ? raw - 1 : 0;
              }
            }
          }

          const options = [
            { optionText: opt1, isCorrect: cIndex === 0 },
            { optionText: opt2, isCorrect: cIndex === 1 },
            { optionText: opt3, isCorrect: cIndex === 2 },
            { optionText: opt4, isCorrect: cIndex === 3 },
          ].filter(o => o.optionText);

          // Failsafe (fallback to A if somehow everything failed)
          if (!options.some(o => o.isCorrect) && options.length > 0) {
            options[0].isCorrect = true;
          }

          await Question.create({
            categoryId: cat._id,
            subTopic: 'Imported',
            questionText,
            difficulty: diff.toUpperCase(),
            options,
            explanation: expl,
            isActive: true
          });
          importedCount++;
        }
        res.json({ message: `Successfully added ${importedCount} questions to the "${quizName}" library!` });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to process CSV data" });
      }
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: "Failed to parse CSV file" });
    });
});

module.exports = router;
