// Backend/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import UserModel from "../models/User.js";
import BrandProfile from "../models/BrandProfile.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import Sponsorship from "../models/Sponsorship.js";
import Message from "../models/Message.js";
import MessageRequest from "../models/MessageRequest.js";
import UserConnection from "../models/UserConnection.js";

const ALLOWED_SELF_SIGNUP_ROLES = ["brand", "influencer"];

const toAuthUser = (user) => ({
  _id: user.id,
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role } = req.body;
  try {
    let user = await UserModel.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const normalizedRole = typeof role === "string" ? role.trim().toLowerCase() : "";
    if (normalizedRole && !ALLOWED_SELF_SIGNUP_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ msg: "Invalid role. Allowed roles: brand, influencer" });
    }
    const safeRole = ALLOWED_SELF_SIGNUP_ROLES.includes(normalizedRole) ? normalizedRole : "brand";

    user = new UserModel({ name, email, password, role: safeRole });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const login = async (req, res) => {
  // Remove logging of sensitive data
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.json({
      token,
      user: toAuthUser(user),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }
    res.json(toAuthUser(req.user));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const deleteAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const userId = req.user._id;

    const [brandProfile, influencerProfile] = await Promise.all([
      BrandProfile.findOne({ user: userId }).select("_id"),
      InfluencerProfile.findOne({ user: userId }).select("_id"),
    ]);

    if (brandProfile) {
      await Sponsorship.deleteMany({ brand: brandProfile._id });
      await BrandProfile.deleteOne({ _id: brandProfile._id });
    }

    if (influencerProfile) {
      await Sponsorship.deleteMany({ influencer: influencerProfile._id });
      await InfluencerProfile.deleteOne({ _id: influencerProfile._id });
    }

    await Promise.all([
      Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      MessageRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] }),
      UserConnection.deleteMany({ $or: [{ user1: userId }, { user2: userId }] }),
      UserModel.deleteOne({ _id: userId }),
    ]);

    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
