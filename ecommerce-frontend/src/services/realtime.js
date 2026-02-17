import { io } from "socket.io-client";
import { API_BASE_URL, getPreferredToken } from "./http";

let socketInstance = null;
let activeToken = null;

const resolveSocketBaseUrl = () => {
  if (API_BASE_URL === "/api") {
    return undefined;
  }

  return API_BASE_URL.replace(/\/api\/?$/, "");
};

export const getRealtimeSocket = () => {
  const token = getPreferredToken();
  if (!token) {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      activeToken = null;
    }
    return null;
  }

  if (socketInstance && activeToken === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(resolveSocketBaseUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  activeToken = token;
  return socketInstance;
};

export const subscribeRealtimeEvent = (eventName, handler) => {
  const socket = getRealtimeSocket();
  if (!socket) {
    return () => {};
  }

  socket.on(eventName, handler);

  return () => {
    socket.off(eventName, handler);
  };
};

export const joinOrderRoom = (orderId) => {
  const socket = getRealtimeSocket();
  if (!socket || !orderId) {
    return () => {};
  }

  socket.emit("join:order", orderId);

  return () => {
    socket.emit("leave:order", orderId);
  };
};

export const disconnectRealtime = () => {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance = null;
  activeToken = null;
};
