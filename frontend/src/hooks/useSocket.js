import { useEffect } from "react";
import { getSocket } from "../socket";

export function useSocket(event, handler, deps = []) {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [event, ...deps]);
}

export function emitSocket(event, data) {
  const socket = getSocket();
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn("Socket not connected, cannot emit:", event);
  }
}
