import { io } from "socket.io-client";

export const socket = io("http://https://sporto-track.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
});

// ─── Notification listener helper ─────────────────────────────────────────────
// Usage in any component:
//   import { onNotification, offNotification } from "../../Services/socket";
//   useEffect(() => {
//     const unsub = onNotification((notif) => { ... });
//     return unsub;
//   }, []);

export const onNotification = (callback) => {
  socket.on("newNotification", callback);
  // Returns cleanup function
  return () => socket.off("newNotification", callback);
};

export const offNotification = (callback) => {
  socket.off("newNotification", callback);
};