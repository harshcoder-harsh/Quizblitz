const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { validate, schemas } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/auth");

const prisma = new PrismaClient();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

router.post("/register", validate(schemas.register), async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) {
      const field = existing.email === email ? "email" : "username";
      return res.status(409).json({ error: `This ${field} is already taken` });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: { id: true, username: true, email: true, totalScore: true, gamesPlayed: true, createdAt: true },
    });
    const token = signToken({ id: user.id, username: user.username });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken({ id: user.id, username: user.username });
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/guest", async (req, res) => {
  const { username } = req.body;
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: "Username must be at least 2 characters" });
  }
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const token = signToken({ id: guestId, username: username.trim(), isGuest: true });
  res.json({ user: { id: guestId, username: username.trim(), isGuest: true }, token });
});

router.get("/me", authMiddleware, async (req, res) => {
  if (req.user.isGuest) {
    return res.json({ user: { id: req.user.id, username: req.user.username, isGuest: true } });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, totalScore: true, gamesPlayed: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
