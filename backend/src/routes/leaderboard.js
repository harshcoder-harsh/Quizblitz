const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.get("/global", async (_req, res) => {
  try {
    const players = await prisma.user.findMany({
      where: { gamesPlayed: { gt: 0 } },
      select: { id: true, username: true, totalScore: true, gamesPlayed: true, avatar: true },
      orderBy: { totalScore: "desc" },
      take: 50,
    });
    res.json({ leaderboard: players.map((p, i) => ({ ...p, rank: i + 1 })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get("/category/:slug", async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
    if (!category) return res.status(404).json({ error: "Category not found" });

    const results = await prisma.gameResult.groupBy({
      by: ["userId"],
      where: { room: { categoryId: category.id } },
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 20,
    });

    const users = await Promise.all(
      results.map(async (r, i) => {
        const user = await prisma.user.findUnique({
          where: { id: r.userId },
          select: { id: true, username: true, avatar: true },
        });
        return { ...user, totalScore: r._sum.score, rank: i + 1 };
      })
    );

    res.json({ category, leaderboard: users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category leaderboard" });
  }
});

router.get("/room/:id", async (req, res) => {
  try {
    const results = await prisma.gameResult.findMany({
      where: { roomId: req.params.id },
      include: { user: { select: { id: true, username: true, avatar: true } } },
      orderBy: { score: "desc" },
    });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch room results" });
  }
});

module.exports = router;
