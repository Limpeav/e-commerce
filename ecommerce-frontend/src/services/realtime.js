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
  const connectionKey = token || "__guest__";

  if (socketInstance && activeToken === connectionKey) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(resolveSocketBaseUrl(), {
    auth: token ? { token } : {},
    transports: ["websocket", "polling"],
  });
  activeToken = connectionKey;
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

export const subscribeRealtimeDomains = (domains, handler, { debounceMs = 150 } = {}) => {
  const socket = getRealtimeSocket();
  if (!socket || !Array.isArray(domains) || domains.length === 0) {
    return () => {};
  }

  let timeoutId = null;
  let hasConnected = socket.connected;
  const scheduleRefresh = (payload) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => handler(payload), debounceMs);
  };
  const handleConnect = () => {
    if (hasConnected) {
      scheduleRefresh({ domain: "connection", action: "reconnected" });
    }
    hasConnected = true;
  };
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      scheduleRefresh({ domain: "connection", action: "visible" });
    }
  };
  const eventNames = domains.map((domain) => `${domain}:changed`);

  eventNames.forEach((eventName) => socket.on(eventName, scheduleRefresh));
  socket.on("connect", handleConnect);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.clearTimeout(timeoutId);
    eventNames.forEach((eventName) => socket.off(eventName, scheduleRefresh));
    socket.off("connect", handleConnect);
    document.removeEventListener("visibilitychange", handleVisibility);
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
