const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const { setRoomState, getRoomState, deleteRoomState } = require("../redis/roomState");

const prisma = new PrismaClient();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/", authMiddleware, validate(schemas.createRoom), async (req, res) => {
  const { categoryId, isPublic, maxPlayers, timerSeconds, difficulty, questionCount } = req.body;
  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(404).json({ error: "Category not found" });

    let code;
    let attempts = 0;
    do {
      code = generateCode();
      const exists = await prisma.room.findUnique({ where: { code } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    const room = await prisma.room.create({
      data: { code, hostId: req.user.id, categoryId, isPublic, maxPlayers, timerSeconds, difficulty, questionCount },
      include: { category: true },
    });

    await setRoomState(code, {
      roomId: room.id,
      code,
      hostId: req.user.id,
      players: {},
      status: "WAITING",
      settings: { timerSeconds, difficulty, questionCount, categoryId },
      questions: [],
      currentQuestionIndex: -1,
      answers: {},
    });

    res.status(201).json({ room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

router.get("/", async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isPublic: true, status: "WAITING" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const roomsWithPlayers = await Promise.all(
      rooms.map(async (room) => {
        const state = await getRoomState(room.code);
        return { ...room, playerCount: state ? Object.keys(state.players).length : 0 };
      })
    );

    res.json({ rooms: roomsWithPlayers });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { code: req.params.code },
      include: { category: true },
    });
    if (!room) return res.status(404).json({ error: "Room not found" });

    const state = await getRoomState(room.code);
    const playerCount = state ? Object.keys(state.players).length : 0;
    res.json({ room: { ...room, playerCount } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

router.delete("/:code", authMiddleware, async (req, res) => {
  try {
    const room = await prisma.room.findUnique({ where: { code: req.params.code } });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.hostId !== req.user.id) return res.status(403).json({ error: "Only the host can delete this room" });

    await prisma.room.delete({ where: { code: req.params.code } });
    await deleteRoomState(req.params.code);
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete room" });
  }
});

module.exports = router;
