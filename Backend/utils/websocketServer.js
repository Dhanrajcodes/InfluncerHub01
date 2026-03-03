import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

let wss;
const clients = new Map();

const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.CLIENT_ORIGIN || process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = [
    "https://influncerhub.vercel.app",
    "https://influencerhub.vercel.app",
    "http://localhost:3000",
  ];

  return new Set([...defaultOrigins, ...configuredOrigins]);
};

const allowedOrigins = getAllowedOrigins();

const parseBearerToken = (headerValue) => {
  if (!headerValue || typeof headerValue !== "string") return null;
  if (!headerValue.startsWith("Bearer ")) return null;
  return headerValue.substring(7);
};

const authenticateSocket = (ws, token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  ws.userId = String(decoded.id);
  clients.set(ws.userId, ws);
  return ws.userId;
};

export const initializeWebSocketServer = (server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws, request) => {
    try {
      const origin = request.headers.origin;
      if (origin && !allowedOrigins.has(origin)) {
        ws.close(1008, "Origin not allowed");
        return;
      }

      const url = new URL(request.url, `http://${request.headers.host}`);
      const tokenFromQuery = url.searchParams.get("token");
      const tokenFromHeader = parseBearerToken(request.headers.authorization);
      const token = tokenFromQuery || tokenFromHeader;

      if (!token) {
        ws.close(1008, "Authentication token required");
        return;
      }

      authenticateSocket(ws, token);
    } catch (err) {
      console.error("WebSocket authentication error:", err);
      ws.close(1008, "Invalid authentication token");
      return;
    }

    ws.on("message", (rawData) => {
      try {
        const payload = JSON.parse(rawData.toString());

        // Support token refresh without enabling client-side message persistence.
        if (payload.type === "auth" && payload.token) {
          try {
            authenticateSocket(ws, payload.token);
          } catch (err) {
            console.error("WebSocket re-authentication error:", err);
            ws.close(1008, "Invalid authentication token");
          }
        } else if (payload.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        }
      } catch (err) {
        console.error("Error parsing WebSocket payload:", err);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });
  });
};

export const sendToUser = (userId, payload) => {
  const normalizedUserId = userId ? String(userId) : null;
  if (!normalizedUserId) return false;

  const client = clients.get(normalizedUserId);
  if (!client || client.readyState !== WebSocket.OPEN) return false;

  client.send(JSON.stringify(payload));
  return true;
};

export const publishSponsorshipUpdate = ({ event, data, recipient = null }) => {
  if (!wss) {
    console.warn("WebSocket server not initialized");
    return;
  }

  const payload = { event, data, recipient };

  if (recipient) {
    sendToUser(recipient, payload);
    return;
  }

  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export const setWebSocketUserId = (ws, userId) => {
  ws.userId = String(userId);
};
