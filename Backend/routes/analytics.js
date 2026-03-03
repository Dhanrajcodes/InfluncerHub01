//backend/routes/analytics.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import Sponsorship from "../models/Sponsorship.js";
import BrandProfile from "../models/BrandProfile.js";
import InfluencerProfile from "../models/InfluencerProfile.js";

const router = express.Router();

const getMonthRange = () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { thisMonthStart, prevMonthStart };
};

const sumBudget = async (match) => {
  const agg = await Sponsorship.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$budget", 0] } } } },
  ]);
  return agg[0]?.total || 0;
};

router.get("/brand", auth, async (req, res) => {
  try {
    if (req.user.role !== "brand") {
      return res.status(403).json({ message: "Only brand users can access brand analytics" });
    }

    const profile = await BrandProfile.findOne({ user: req.user._id }).select("_id");
    if (!profile) {
      return res.status(404).json({ message: "Brand profile not found" });
    }

    const { thisMonthStart, prevMonthStart } = getMonthRange();

    const [activeSponsorships, campaignsThisMonth, prevMonthCampaigns, totalBudget, monthBudget, prevMonthBudget] =
      await Promise.all([
        Sponsorship.countDocuments({
          brand: profile._id,
          status: { $in: ["pending", "accepted"] },
        }),
        Sponsorship.countDocuments({
          brand: profile._id,
          createdAt: { $gte: thisMonthStart },
        }),
        Sponsorship.countDocuments({
          brand: profile._id,
          createdAt: { $gte: prevMonthStart, $lt: thisMonthStart },
        }),
        sumBudget({ brand: profile._id }),
        sumBudget({ brand: profile._id, createdAt: { $gte: thisMonthStart } }),
        sumBudget({ brand: profile._id, createdAt: { $gte: prevMonthStart, $lt: thisMonthStart } }),
      ]);

    const budgetChange =
      prevMonthBudget > 0 ? Math.round(((monthBudget - prevMonthBudget) / prevMonthBudget) * 100) : 0;

    res.json({
      activeSponsorships,
      totalBudget,
      campaignsThisMonth,
      activeSponsorshipsChange: campaignsThisMonth - prevMonthCampaigns,
      budgetChange,
      campaignsChange: campaignsThisMonth - prevMonthCampaigns,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/influencer", auth, async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencer users can access influencer analytics" });
    }

    const profile = await InfluencerProfile.findOne({ user: req.user._id }).select(
      "_id followerCount averageEngagementRate"
    );
    if (!profile) {
      return res.status(404).json({ message: "Influencer profile not found" });
    }

    const { thisMonthStart, prevMonthStart } = getMonthRange();

    const [totalOffers, activeCollaborations, thisMonthAccepted, prevMonthAccepted, thisMonthEarnings, prevMonthEarnings] =
      await Promise.all([
        Sponsorship.countDocuments({ influencer: profile._id }),
        Sponsorship.countDocuments({ influencer: profile._id, status: "accepted" }),
        Sponsorship.countDocuments({
          influencer: profile._id,
          status: "accepted",
          createdAt: { $gte: thisMonthStart },
        }),
        Sponsorship.countDocuments({
          influencer: profile._id,
          status: "accepted",
          createdAt: { $gte: prevMonthStart, $lt: thisMonthStart },
        }),
        sumBudget({
          influencer: profile._id,
          status: { $in: ["accepted", "completed"] },
          createdAt: { $gte: thisMonthStart },
        }),
        sumBudget({
          influencer: profile._id,
          status: { $in: ["accepted", "completed"] },
          createdAt: { $gte: prevMonthStart, $lt: thisMonthStart },
        }),
      ]);

    const responseRate = totalOffers > 0 ? Math.round((activeCollaborations / totalOffers) * 100) : 0;

    res.json({
      activeCollaborations,
      earningsThisMonth: thisMonthEarnings,
      followerGrowth: 0,
      engagementRate: profile.averageEngagementRate || 0,
      responseRate,
      collaborationsChange: thisMonthAccepted - prevMonthAccepted,
      earningsChange: thisMonthEarnings - prevMonthEarnings,
      followerGrowthChange: 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Role-scoped overview to avoid leaking cross-tenant data
router.get("/overview", auth, async (req, res) => {
  try {
    if (req.user.role === "brand") {
      const profile = await BrandProfile.findOne({ user: req.user._id }).select("_id");
      const asBrand = profile ? await Sponsorship.countDocuments({ brand: profile._id }) : 0;
      const byStatus = profile
        ? await Sponsorship.aggregate([
            { $match: { brand: profile._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ])
        : [];
      return res.json({ asBrand, byStatus });
    }

    const profile = await InfluencerProfile.findOne({ user: req.user._id }).select("_id");
    if (!profile) {
      return res.json({ asInfluencer: 0, byStatus: [] });
    }

    const asInfluencer = await Sponsorship.countDocuments({ influencer: profile._id });
    const byStatus = await Sponsorship.aggregate([
      { $match: { influencer: profile._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    return res.json({ asInfluencer, byStatus });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


