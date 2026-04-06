// In-memory Room State Store (Replacing Redis)
const rooms = new Map();
const ROOM_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

async function setRoomState(code, state) {
  // Add an expiry timestamp
  const expiry = Date.now() + ROOM_TTL_MS;
  rooms.set(code, { state, expiry });
}

async function getRoomState(code) {
  const entry = rooms.get(code);
  if (!entry) return null;
  
  if (Date.now() > entry.expiry) {
    rooms.delete(code);
    return null;
  }
  
  return entry.state;
}

async function deleteRoomState(code) {
  rooms.delete(code);
}

async function updateRoomState(code, updater) {
  const entry = rooms.get(code);
  if (!entry) return null;
  
  if (Date.now() > entry.expiry) {
    rooms.delete(code);
    return null;
  }
  
  const updated = updater(entry.state);
  entry.state = updated;
  return updated;
}

// Optional periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of rooms.entries()) {
    if (now > entry.expiry) rooms.delete(code);
  }
}, 1000 * 60 * 60);

module.exports = { setRoomState, getRoomState, deleteRoomState, updateRoomState };
