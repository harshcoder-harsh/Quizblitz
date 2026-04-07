const router = require("express").Router();
const Room = require("../models/Room");
const Category = require("../models/Category");
const { authMiddleware } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");
const { setRoomState, getRoomState, deleteRoomState } = require("../redis/roomState");

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/", authMiddleware, validate(schemas.createRoom), async (req, res) => {
  const { categoryId, isPublic, maxPlayers, timerSeconds, difficulty, questionCount } = req.body;
  try {
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });

    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = generateCode();
      const exists = await Room.findOne({ code });
      if (!exists) break;
      attempts++;
    }

    const room = await Room.create({
      code,
      hostId: req.user.id,
      categoryId,
      isPublic,
      maxPlayers,
      timerSeconds,
      difficulty,
      questionCount
    });

    const populatedRoom = await Room.findById(room._id).populate('categoryId');

    await setRoomState(code, {
      roomId: room._id,
      code,
      hostId: req.user.id,
      players: {},
      status: "WAITING",
      settings: { timerSeconds, difficulty, questionCount, categoryId },
      questions: [],
      currentQuestionIndex: -1,
      answers: {},
    });

    res.status(201).json({ room: populatedRoom });
  } catch (err) {
    console.error(err);
    if (err.name === 'CastError') return res.status(400).json({ error: "Invalid category ID" });
    res.status(500).json({ error: "Failed to create room" });
  }
});

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isPublic: true, status: "WAITING" })
      .populate('categoryId')
      .sort({ createdAt: -1 })
      .limit(20);

    const roomsWithPlayers = await Promise.all(
      rooms.map(async (room) => {
        const state = await getRoomState(room.code);
        return {
          ...room.toObject(),
          id: room._id,
          playerCount: state ? Object.keys(state.players).length : 0
        };
      })
    );

    res.json({ rooms: roomsWithPlayers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate('categoryId');
    if (!room) return res.status(404).json({ error: "Room not found" });

    const state = await getRoomState(room.code);
    const playerCount = state ? Object.keys(state.players).length : 0;
    res.json({ room: { ...room.toObject(), id: room._id, playerCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

router.delete("/:code", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.hostId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Only the host can delete this room" });
    }

    await Room.deleteOne({ code: req.params.code });
    await deleteRoomState(req.params.code);
    res.json({ message: "Room deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

module.exports = router;
