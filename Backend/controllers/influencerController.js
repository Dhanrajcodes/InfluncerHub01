// backend/controllers/influencerController.js
import InfluencerProfile from "../models/InfluencerProfile.js";
import Category from "../models/Category.js";

// Create or Update influencer profile
export const createOrUpdateProfile = async (req, res) => {
  try {
    const {
      handle,
      bio,
      categories,
      location,
      followerCount,
      pricing,
      tags,
      avatarUrl,
      portfolio,
      instagram,
      youtube,
      tiktok,
      twitter,
      other,
      averageEngagementRate,
    } = req.body;

    const profileFields = { user: req.user.id };
    const existingProfile = await InfluencerProfile.findOne({ user: req.user.id });

    const normalizedHandle = typeof handle === "string" ? handle.trim() : "";
    if (!existingProfile && !normalizedHandle) {
      return res.status(400).json({ msg: "Handle is required" });
    }

    if (handle !== undefined) profileFields.handle = normalizedHandle;
    if (bio !== undefined) profileFields.bio = bio;
    if (location !== undefined) profileFields.location = location;
    if (followerCount !== undefined) profileFields.followerCount = followerCount;
    if (pricing !== undefined) profileFields.pricing = pricing;
    if (tags !== undefined) profileFields.tags = tags;
    if (portfolio !== undefined) profileFields.portfolio = portfolio;
    if (averageEngagementRate !== undefined) profileFields.averageEngagementRate = averageEngagementRate;

    profileFields.avatarUrl = avatarUrl || "";

    const existingLinks = existingProfile?.socialLinks || {};
    profileFields.socialLinks = {
      instagram: instagram !== undefined ? instagram : existingLinks.instagram || "",
      youtube: youtube !== undefined ? youtube : existingLinks.youtube || "",
      tiktok: tiktok !== undefined ? tiktok : existingLinks.tiktok || "",
      twitter: twitter !== undefined ? twitter : existingLinks.twitter || "",
      other: other !== undefined ? other : existingLinks.other || "",
    };

    if (Array.isArray(categories)) {
      const catIds = [];
      for (const rawCategory of categories) {
        const value = String(rawCategory || "").trim();
        if (!value) continue;

        let cat = await Category.findOne({ name: value });
        if (!cat && /^[a-fA-F0-9]{24}$/.test(value)) {
          cat = await Category.findById(value).catch(() => null);
        }

        if (!cat) {
          try {
            cat = await Category.create({ name: value });
          } catch (categoryErr) {
            if (categoryErr?.code === 11000) {
              cat = await Category.findOne({ name: value });
            } else {
              throw categoryErr;
            }
          }
        }

        if (cat) catIds.push(cat._id);
      }
      profileFields.categories = catIds;
    }

    const profile = await InfluencerProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("user", ["name", "avatar"])
      .populate("categories", "name");

    return res.json(profile);
  } catch (err) {
    console.error("createOrUpdateProfile error:", err);

    if (err?.code === 11000 && err?.keyPattern?.handle) {
      return res.status(409).json({ msg: "Handle already taken. Please choose another handle." });
    }

    if (err?.name === "ValidationError") {
      return res.status(400).json({
        msg: "Validation error",
        errors: err.errors,
      });
    }

    return res.status(500).json({ msg: "Server Error" });
  }
};
// Get current user's influencer profile
export const getMyProfile = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .populate("categories", "name");

    if (!profile) {
      return res.status(404).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get profile by handle
export const getProfileByHandle = async (req, res) => {
  try {
    const profile = await InfluencerProfile.findOne({ handle: req.params.handle })
      .populate("user", ["_id", "name", "avatar"])
      .populate("categories", "name");

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid profile handle" });
    }
    res.status(500).send("Server Error");
  }
};

// Search influencers with filters
export const searchInfluencers = async (req, res) => {
  const {
    q,
    categories,
    minFollowers,
    maxFollowers,
    tags,
    page = 1,
    limit = 20,
    sort = "-followerCount",
  } = req.query;
  const filter = {};
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const safeLimit = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 20;

  if (q) {
    filter.$or = [
      { handle: { $regex: q, $options: "i" } },
      { bio: { $regex: q, $options: "i" } },
      { tags: { $in: q.split(",") } },
    ];
  }
  if (tags) filter.tags = { $in: tags.split(",") };
  if (minFollowers) filter.followerCount = { ...filter.followerCount, $gte: Number(minFollowers) };
  if (maxFollowers) filter.followerCount = { ...filter.followerCount, $lte: Number(maxFollowers) };

  if (categories) {
    const categoryNames = categories.split(",");
    const cats = await Category.find({ name: { $in: categoryNames } });
    if (cats.length > 0) {
      filter.categories = { $in: cats.map((c) => c._id) };
    }
  }

  try {
    const skip = (safePage - 1) * safeLimit;
    const docs = await InfluencerProfile.find(filter)
      .populate("user", ["name", "avatar"])
      .populate("categories", "name")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit);

    const total = await InfluencerProfile.countDocuments(filter);

    res.json({ total, page: safePage, limit: safeLimit, results: docs });
  } catch (err) {
    console.error("Error searching influencers:", err.message);
    res.status(500).send("Server Error");
  }
};

// Get all influencers (latest)
export const getAllInfluencers = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "-createdAt" } = req.query;
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const safePage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 20;
    const skip = (safePage - 1) * safeLimit;
    
    const docs = await InfluencerProfile.find()
      .populate("user", ["name", "avatar"])
      .populate("categories", "name")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit);

    const total = await InfluencerProfile.countDocuments();

    res.json({ total, page: safePage, limit: safeLimit, results: docs });
  } catch (err) {
    console.error("Error fetching all influencers:", err.message);
    res.status(500).send("Server Error");
  }
};

export default {
  createOrUpdateProfile,
  getMyProfile,
  getProfileByHandle,
  searchInfluencers,
  getAllInfluencers,
};

