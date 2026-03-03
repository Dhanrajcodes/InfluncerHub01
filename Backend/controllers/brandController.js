// backend/controllers/brandController.js
import BrandProfile from "../models/BrandProfile.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// Helper function for sending error responses
const sendError = (res, status, message, error = null) => {
  console.error(`Error ${status}: ${message}`, error ? '\n' + error.stack : '');
  return res.status(status).json({ 
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && error && { stack: error.stack })
  });
};

// Create or Update brand profile
export const createOrUpdateProfile = async (req, res) => {
  const {
    companyName,
    industry,
    description,
    logoUrl,
    website,
    contactEmail,
    socialLinks,
    budgetPerPost,
  } = req.body;

  // Validate required fields
  if (!companyName || !industry || !contactEmail) {
    return sendError(res, 400, 'Company name, industry and contact email are required');
  }

  // Ensure user exists
  const user = await User.findById(req.user.id);
  if (!user) {
    return sendError(res, 404, 'User not found');
  }

  const profileFields = { user: req.user.id };

  // Required fields
  profileFields.companyName = companyName;
  profileFields.industry = industry;
  profileFields.contactEmail = contactEmail;

  // Optional fields
  if (description !== undefined) profileFields.description = description || "";
  if (logoUrl !== undefined) profileFields.logoUrl = logoUrl || "";
  if (website) profileFields.website = website;
  if (budgetPerPost !== undefined) profileFields.budgetPerPost = budgetPerPost;

  // Handle socialLinks
  if (socialLinks) {
    profileFields.socialLinks = {};
    if (socialLinks.instagram) profileFields.socialLinks.instagram = socialLinks.instagram;
    if (socialLinks.twitter) profileFields.socialLinks.twitter = socialLinks.twitter;
    if (socialLinks.linkedin) profileFields.socialLinks.linkedin = socialLinks.linkedin;
  }

  try {
    let profile = await BrandProfile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("user", ["name", "email", "phone", "avatar"]);

    res.json({ success: true, profile });
  } catch (err) {
    if (err.name === "ValidationError") {
      return sendError(res, 400, 'Validation error', err);
    }
    return sendError(res, 500, 'Server error', err);
  }
};

// Get current user's brand profile
export const getMyProfile = async (req, res) => {
  try {
    const profile = await BrandProfile.findOne({ user: req.user.id })
      .populate("user", ["name", "email", "phone", "avatar"]);

    if (!profile) {
      return sendError(res, 400, 'There is no profile for this user');
    }

    res.json({ success: true, profile });
  } catch (err) {
    return sendError(res, 500, 'Server error', err);
  }
};

// Delete brand profile
export const deleteProfile = async (req, res) => {
  try {
    await BrandProfile.findOneAndRemove({ user: req.user.id });
    res.json({ success: true, msg: "Profile deleted" });
  } catch (err) {
    return sendError(res, 500, 'Server error', err);
  }
};

// Get profile by user ID
export const getProfileById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return sendError(res, 400, 'Invalid user ID');
    }

    // Check if user exists
    const user = await User.findById(req.params.userId).select(['_id']);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const profile = await BrandProfile.findOne({ user: req.params.userId })
      .populate("user", ["_id", "name", "avatar"])
      .exec();
    
    if (!profile) {
      return sendError(res, 404, 'Brand profile not found');
    }
    
    res.json({ success: true, profile });
  } catch (err) {
    if (err.name === 'CastError') {
      return sendError(res, 400, 'Invalid user ID format', err);
    }
    return sendError(res, 500, 'Server error', err);
  }
};

// Get all brands with search, filter, and pagination
export const searchBrands = async (req, res) => {
  try {
    const { q, industry, minBudget, maxBudget, page = 1, limit = 20 } = req.query;
    
    // Validate pagination parameters
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const pageNumber = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const pageSize = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 20;
    
    // Build filter criteria
    const filter = {};
    
    // Text search across multiple fields
    if (q) {
      filter.$or = [
        { companyName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { industry: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Industry filter
    if (industry) {
      filter.industry = industry;
    }
    
    // Budget range filter
    if (minBudget || maxBudget) {
      filter.budgetPerPost = {};
      if (minBudget) filter.budgetPerPost.$gte = Number(minBudget);
      if (maxBudget) filter.budgetPerPost.$lte = Number(maxBudget);
    }
    
    // Apply filters with pagination
    const docs = await BrandProfile.find(filter)
      .populate('user', ['_id', 'name', 'avatar'])
      .sort('-createdAt')
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();
      
    // Get total count matching the filter
    const total = await BrandProfile.countDocuments(filter);
    
    res.json({ 
      success: true,
      total, 
      page: pageNumber, 
      limit: pageSize, 
      results: docs 
    });
    
  } catch (error) {
    return sendError(res, 500, 'Error in brand search', error);
  }
};

// Get all brands (latest)
export const getAllBrands = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Validate pagination parameters
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const pageNumber = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const pageSize = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 20;
    
    const docs = await BrandProfile.find()
      .populate('user', ['_id', 'name', 'avatar'])
      .sort('-createdAt')
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const total = await BrandProfile.countDocuments();

    res.json({ 
      success: true,
      total, 
      page: pageNumber, 
      limit: pageSize, 
      results: docs 
    });
  } catch (err) {
    return sendError(res, 500, 'Server error', err);
  }
};

export default {
  createOrUpdateProfile,
  getMyProfile,
  deleteProfile,
  getProfileById,
  searchBrands,
  getAllBrands
};
