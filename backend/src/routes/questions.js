const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const prisma = new PrismaClient();

router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { questions: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/", async (req, res) => {
  const { category, diff, limit = 10 } = req.query;
  try {
    const where = { isActive: true };
    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (diff && ["EASY", "MEDIUM", "HARD"].includes(diff.toUpperCase())) {
      where.difficulty = diff.toUpperCase();
    }
    const questions = await prisma.question.findMany({
      where,
      include: { options: true, category: true },
      take: Math.min(parseInt(limit) || 10, 50),
    });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

router.post("/report/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid question ID" });
  try {
    await prisma.question.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
    });
    res.json({ message: "Question reported. Thank you for your feedback!" });
  } catch {
    res.status(404).json({ error: "Question not found" });
  }
});

module.exports = router;
