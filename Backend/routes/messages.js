import express from "express";
import mongoose from "mongoose";
import auth from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";
import MessageRequest from "../models/MessageRequest.js";
import UserConnection from "../models/UserConnection.js";
import User from "../models/User.js";
import BrandProfile from "../models/BrandProfile.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import Sponsorship from "../models/Sponsorship.js";
import { sendToUser } from "../utils/websocketServer.js";

const router = express.Router();

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
    return null;
  }

  const text = String(value);
  if (text.includes("ObjectId(")) {
    const match = text.match(/'([^']+)'/);
    return match?.[1] || null;
  }

  return text;
};

const currentUserId = (req) => String(req.user.id || req.user._id);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const rolesCanMessage = (roleA, roleB) => {
  return (
    (roleA === "brand" && roleB === "influencer") ||
    (roleA === "influencer" && roleB === "brand")
  );
};

const hasSponsorshipRelationship = async (senderUserId, recipientUserId) => {
  const [senderBrand, senderInfluencer, recipientBrand, recipientInfluencer] = await Promise.all([
    BrandProfile.findOne({ user: senderUserId }).select("_id").lean(),
    InfluencerProfile.findOne({ user: senderUserId }).select("_id").lean(),
    BrandProfile.findOne({ user: recipientUserId }).select("_id").lean(),
    InfluencerProfile.findOne({ user: recipientUserId }).select("_id").lean(),
  ]);

  const relationshipFilters = [];

  if (senderBrand && recipientInfluencer) {
    relationshipFilters.push({ brand: senderBrand._id, influencer: recipientInfluencer._id });
  }

  if (senderInfluencer && recipientBrand) {
    relationshipFilters.push({ brand: recipientBrand._id, influencer: senderInfluencer._id });
  }

  if (relationshipFilters.length === 0) return false;

  const sponsorship = await Sponsorship.findOne({
    $or: relationshipFilters,
    status: { $in: ["pending", "accepted", "completed"] },
  }).select("_id").lean();

  return !!sponsorship;
};

const hasDirectMessagingPermission = async (senderUserId, recipientUserId) => {
  const [connection, acceptedRequest, sponsorship] = await Promise.all([
    UserConnection.findOne({
      $or: [
        { user1: senderUserId, user2: recipientUserId },
        { user1: recipientUserId, user2: senderUserId },
      ],
    })
      .select("_id")
      .lean(),
    MessageRequest.findOne({
      $or: [
        { from: senderUserId, to: recipientUserId, status: "accepted" },
        { from: recipientUserId, to: senderUserId, status: "accepted" },
      ],
    })
      .select("_id")
      .lean(),
    hasSponsorshipRelationship(senderUserId, recipientUserId),
  ]);

  return !!connection || !!acceptedRequest || sponsorship;
};

const formatMessage = (messageDoc) => {
  const senderId = normalizeId(messageDoc.sender);
  const recipientId = normalizeId(messageDoc.recipient);
  const senderName = typeof messageDoc.sender === "object" ? messageDoc.sender?.name : undefined;
  const recipientName = typeof messageDoc.recipient === "object" ? messageDoc.recipient?.name : undefined;

  return {
    ...messageDoc.toObject(),
    id: String(messageDoc._id),
    senderId,
    recipientId,
    senderName: senderName || "Unknown User",
    recipientName: recipientName || "Unknown User",
  };
};

router.get("/", auth, async (req, res) => {
  try {
    const senderUserId = currentUserId(req);
    const recipientId = normalizeId(req.query.recipient);

    if (!recipientId || !isValidObjectId(recipientId)) {
      return res.status(400).json({ error: "Valid recipient ID is required" });
    }

    if (recipientId === senderUserId) {
      return res.status(400).json({ error: "Cannot fetch a conversation with yourself" });
    }

    const recipientUser = await User.findById(recipientId).select("_id role");
    if (!recipientUser) {
      return res.status(404).json({ error: "Recipient user not found" });
    }

    if (!rolesCanMessage(req.user.role, recipientUser.role)) {
      return res.status(403).json({ error: "Messaging is only allowed between brand and influencer accounts" });
    }

    const [connection, request, sponsorship] = await Promise.all([
      UserConnection.findOne({
        $or: [
          { user1: senderUserId, user2: recipientId },
          { user1: recipientId, user2: senderUserId },
        ],
      })
        .select("_id")
        .lean(),
      MessageRequest.findOne({
        $or: [
          { from: senderUserId, to: recipientId, status: { $in: ["pending", "accepted"] } },
          { from: recipientId, to: senderUserId, status: { $in: ["pending", "accepted"] } },
        ],
      })
        .select("_id")
        .lean(),
      hasSponsorshipRelationship(senderUserId, recipientId),
    ]);

    if (!connection && !request && !sponsorship) {
      return res.json([]);
    }

    const userMessages = await Message.find({
      $or: [
        { sender: senderUserId, recipient: recipientId },
        { sender: recipientId, recipient: senderUserId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "name")
      .populate("recipient", "name");

    res.json(userMessages.map(formatMessage));
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender", "name")
      .populate("recipient", "name");

    const conversations = {};

    messages.forEach((message) => {
      const senderId = normalizeId(message.sender);
      const recipientId = normalizeId(message.recipient);
      if (!senderId || !recipientId) return;

      const partnerId = senderId === userId ? recipientId : senderId;
      const partnerName =
        senderId === userId
          ? (typeof message.recipient === "object" ? message.recipient.name : "Unknown User")
          : (typeof message.sender === "object" ? message.sender.name : "Unknown User");

      if (
        !conversations[partnerId] ||
        new Date(message.timestamp) > new Date(conversations[partnerId].timestamp)
      ) {
        conversations[partnerId] = {
          id: partnerId,
          userId: partnerId,
          userName: partnerName || "Unknown User",
          lastMessage: message.content,
          timestamp: message.timestamp,
          unreadCount:
            recipientId === userId && message.status !== "read"
              ? (conversations[partnerId] ? conversations[partnerId].unreadCount + 1 : 1)
              : 0,
        };
      } else if (recipientId === userId && message.status !== "read") {
        conversations[partnerId].unreadCount += 1;
      }
    });

    const conversationsArray = Object.values(conversations).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json(conversationsArray);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const senderUserId = currentUserId(req);
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const recipientId = normalizeId(req.body.recipientId);

    if (!content || !recipientId || !isValidObjectId(recipientId)) {
      return res.status(400).json({ error: "Content and valid recipientId are required" });
    }

    if (recipientId === senderUserId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }

    const recipientUser = await User.findById(recipientId).select("_id name role").lean();
    if (!recipientUser) {
      return res.status(404).json({ error: "Recipient user not found" });
    }

    if (!rolesCanMessage(req.user.role, recipientUser.role)) {
      return res.status(403).json({ error: "Messaging is only allowed between brand and influencer accounts" });
    }

    const canDirectMessage = await hasDirectMessagingPermission(senderUserId, recipientId);
    const [existingPendingRequest, incomingPendingRequest] = await Promise.all([
      MessageRequest.findOne({
        from: senderUserId,
        to: recipientId,
        status: "pending",
      })
        .select("_id")
        .lean(),
      MessageRequest.findOne({
        from: recipientId,
        to: senderUserId,
        status: "pending",
      })
        .select("_id")
        .lean(),
    ]);

    if (!canDirectMessage) {
      if (existingPendingRequest) {
        return res.status(400).json({
          error: "Message request already sent. Waiting for acceptance.",
        });
      }

      if (incomingPendingRequest) {
        return res.status(400).json({
          error: "This user already sent you a message request. Please accept it from Requests.",
        });
      }

      const request = new MessageRequest({
        from: senderUserId,
        to: recipientId,
        content,
      });
      await request.save();

      const requestPayload = {
        id: String(request._id),
        from: senderUserId,
        to: recipientId,
        content: request.content,
        timestamp: request.timestamp,
        status: request.status,
        senderName: req.user.name || "Unknown User",
      };

      sendToUser(recipientId, { type: "messageRequest", data: requestPayload });

      return res.status(201).json({
        ...requestPayload,
        type: "request",
        message: "Message request sent successfully",
      });
    }

    const message = new Message({
      sender: senderUserId,
      recipient: recipientId,
      content,
    });
    await message.save();
    await message.populate("sender", "name");
    await message.populate("recipient", "name");

    const formattedMessage = formatMessage(message);
    sendToUser(recipientId, { type: "message", data: formattedMessage });

    res.status(201).json({
      ...formattedMessage,
      type: "message",
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.get("/requests", auth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const requests = await MessageRequest.find({
      to: userId,
      status: "pending",
    }).populate("from", "name");

    const formattedRequests = requests.map((requestDoc) => ({
      id: String(requestDoc._id),
      from: normalizeId(requestDoc.from),
      to: userId,
      content: requestDoc.content,
      timestamp: requestDoc.timestamp,
      status: requestDoc.status,
      senderName: typeof requestDoc.from === "object" ? requestDoc.from.name : "Unknown User",
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error("Error fetching message requests:", err);
    res.status(500).json({ error: "Failed to fetch message requests" });
  }
});

router.get("/requests/sent", auth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const requests = await MessageRequest.find({
      from: userId,
      status: "pending",
    }).populate("to", "name");

    const formattedRequests = requests.map((requestDoc) => ({
      id: String(requestDoc._id),
      from: userId,
      to: normalizeId(requestDoc.to),
      content: requestDoc.content,
      timestamp: requestDoc.timestamp,
      status: requestDoc.status,
      recipientName: typeof requestDoc.to === "object" ? requestDoc.to.name : "Unknown User",
    }));

    res.json(formattedRequests);
  } catch (err) {
    console.error("Error fetching sent message requests:", err);
    res.status(500).json({ error: "Failed to fetch sent message requests" });
  }
});

router.post("/requests/:requestId/accept", auth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const { requestId } = req.params;

    if (!requestId || !isValidObjectId(requestId)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }

    const request = await MessageRequest.findOne({
      _id: requestId,
      to: userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ error: "Message request not found" });
    }

    const fromUser = await User.findById(request.from).select("_id role").lean();
    if (!fromUser || !rolesCanMessage(req.user.role, fromUser.role)) {
      return res.status(403).json({ error: "Invalid message request for current role pair" });
    }

    request.status = "accepted";
    await request.save();

    const fromUserId = normalizeId(request.from);
    const toUserId = normalizeId(request.to);

    const existingConnection = await UserConnection.findOne({
      $or: [
        { user1: fromUserId, user2: toUserId },
        { user1: toUserId, user2: fromUserId },
      ],
    })
      .select("_id")
      .lean();

    if (!existingConnection) {
      const connection = new UserConnection({
        user1: fromUserId,
        user2: toUserId,
      });
      await connection.save();
    }

    const message = new Message({
      sender: fromUserId,
      recipient: toUserId,
      content: request.content,
    });
    await message.save();
    await message.populate("sender", "name");
    await message.populate("recipient", "name");

    const firstMessage = formatMessage(message);
    sendToUser(fromUserId, { type: "requestAccepted", data: { requestId: String(request._id) } });
    sendToUser(fromUserId, { type: "message", data: firstMessage });

    res.json({
      message: "Message request accepted",
      firstMessage,
    });
  } catch (err) {
    console.error("Error accepting message request:", err);
    res.status(500).json({ error: "Failed to accept message request" });
  }
});

router.post("/requests/:requestId/reject", auth, async (req, res) => {
  try {
    const userId = currentUserId(req);
    const { requestId } = req.params;

    if (!requestId || !isValidObjectId(requestId)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }

    const request = await MessageRequest.findOne({
      _id: requestId,
      to: userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ error: "Message request not found" });
    }

    const fromUser = await User.findById(request.from).select("_id role").lean();
    if (!fromUser || !rolesCanMessage(req.user.role, fromUser.role)) {
      return res.status(403).json({ error: "Invalid message request for current role pair" });
    }

    request.status = "rejected";
    await request.save();

    const fromUserId = normalizeId(request.from);
    sendToUser(fromUserId, { type: "requestRejected", data: { requestId: String(request._id) } });

    res.json({ message: "Message request rejected" });
  } catch (err) {
    console.error("Error rejecting message request:", err);
    res.status(500).json({ error: "Failed to reject message request" });
  }
});

export default router;
