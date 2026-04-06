const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validate, schemas } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/auth");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

router.post("/register", validate(schemas.register), async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "email" : "username";
      return res.status(409).json({ error: `This ${field} is already taken` });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });
    
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      createdAt: user.createdAt
    };

    const token = signToken({ id: user._id, username: user.username });
    res.status(201).json({ user: userResponse, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", validate(schemas.login), async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken({ id: user._id, username: user.username });
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
    res.json({ user: userResponse, token });
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
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      totalScore: user.totalScore,
      gamesPlayed: user.gamesPlayed,
      avatar: user.avatar,
      createdAt: user.createdAt
    };
    res.json({ user: userResponse });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
