import { io } from "socket.io-client";

// Use the socket URL if provided, otherwise fallback to the API URL or localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:3001";

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 8,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => console.log("🔌 Socket connected:", socket.id));
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));
  socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
