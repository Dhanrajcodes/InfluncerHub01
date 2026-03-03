// backend/controllers/influencerController.js
import InfluencerProfile from "../models/InfluencerProfile.js";
import Category from "../models/Category.js";

// Create or Update influencer profile
export const createOrUpdateProfile = async (req, res) => {
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
    other, // Add the missing 'other' social link field
    averageEngagementRate,
  } = req.body;

  const profileFields = { user: req.user.id };
  const existingProfile = await InfluencerProfile.findOne({ user: req.user.id });

  if (!existingProfile && (!handle || !String(handle).trim())) {
    return res.status(400).json({ msg: "Handle is required" });
  }

  if (handle !== undefined) profileFields.handle = String(handle).trim();
  if (bio !== undefined) profileFields.bio = bio;
  if (location !== undefined) profileFields.location = location;
  if (followerCount !== undefined) profileFields.followerCount = followerCount;
  if (pricing !== undefined) profileFields.pricing = pricing;
  if (tags !== undefined) profileFields.tags = tags;
  if (portfolio !== undefined) profileFields.portfolio = portfolio;
  if (averageEngagementRate !== undefined) profileFields.averageEngagementRate = averageEngagementRate;

  // ✅ Always include avatarUrl (empty string if removed)
  profileFields.avatarUrl = avatarUrl || "";

  // ✅ Merge socialLinks safely (don't overwrite missing ones)
  const existingLinks = existingProfile?.socialLinks || {};

  profileFields.socialLinks = {
    instagram: instagram !== undefined ? instagram : existingLinks.instagram || "",
    youtube: youtube !== undefined ? youtube : existingLinks.youtube || "",
    tiktok: tiktok !== undefined ? tiktok : existingLinks.tiktok || "",
    twitter: twitter !== undefined ? twitter : existingLinks.twitter || "",
    other: other !== undefined ? other : existingLinks.other || "", // Add the missing 'other' field handling
  };

  if (categories) {
    const catIds = [];
    for (let c of categories) {
      let cat =
        (await Category.findOne({ name: c })) ||
        (await Category.findById(c).catch(() => null));
      if (!cat) {
        cat = await Category.create({
          name: c,
          slug: c.toLowerCase().replace(/\s+/g, "-"),
        });
      }
      catIds.push(cat._id);
    }
    profileFields.categories = catIds;
  }

  try {
    let profile = await InfluencerProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("user", ["name", "avatar"])
      .populate("categories", "name");

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.name === "ValidationError") {
      return res.status(400).json({ 
        msg: "Validation error", 
        errors: err.errors 
      });
    }
    res.status(500).send("Server Error");
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
