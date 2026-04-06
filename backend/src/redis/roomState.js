const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

const ROOM_TTL = 60 * 60 * 4; 

async function setRoomState(code, state) {
  await redis.setex(`room:${code}`, ROOM_TTL, JSON.stringify(state));
}

async function getRoomState(code) {
  const data = await redis.get(`room:${code}`);
  return data ? JSON.parse(data) : null;
}

async function deleteRoomState(code) {
  await redis.del(`room:${code}`);
}

async function updateRoomState(code, updater) {
  const current = await getRoomState(code);
  if (!current) return null;
  const updated = updater(current);
  await setRoomState(code, updated);
  return updated;
}

module.exports = { redis, setRoomState, getRoomState, deleteRoomState, updateRoomState };
