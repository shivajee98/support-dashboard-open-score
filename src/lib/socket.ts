import { io } from "socket.io-client";

// Use environment variable or default to localhost for dev
// In production, this should point to your deployed socket server
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: false, // We connect manually when user logs in/mounts
});
