
// backend/routes/earnings.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import Sponsorship from "../models/Sponsorship.js";
import InfluencerProfile from "../models/InfluencerProfile.js";

const router = express.Router();

// Earnings summary for influencer based on accepted/completed sponsorship budgets
router.get("/summary", auth, async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can access earnings data" });
    }
    const profile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!profile) return res.json({ total: 0, month: 0, pending: 0 });
    const statuses = ["accepted", "completed"];
    const all = await Sponsorship.aggregate([
      { $match: { influencer: profile._id, status: { $in: statuses } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$budget", 0] } } } },
    ]);
    const total = all[0]?.total || 0;
    // naive month calc: last 30 days
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const monthAgg = await Sponsorship.aggregate([
      { $match: { influencer: profile._id, status: { $in: statuses }, createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$budget", 0] } } } },
    ]);
    const month = monthAgg[0]?.total || 0;
    const pendingAgg = await Sponsorship.aggregate([
      { $match: { influencer: profile._id, status: "pending" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$budget", 0] } } } },
    ]);
    const pending = pendingAgg[0]?.total || 0;
    res.json({ total, month, pending });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/transactions", auth, async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can access earnings data" });
    }
    const profile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!profile) return res.json([]);
    const tx = await Sponsorship.find({ influencer: profile._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const mapped = tx.map((s) => ({
      id: String(s._id),
      date: s.createdAt,
      description: s.title || s.description || "Sponsorship",
      amount: s.budget || 0,
      status: s.status,
    }));
    res.json(mapped);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


