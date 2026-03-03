// Backend/controllers/sponsorshipController.js
import BrandProfile from "../models/BrandProfile.js";
import InfluencerProfile from "../models/InfluencerProfile.js";
import Sponsorship from "../models/Sponsorship.js";

import { publishSponsorshipUpdate } from "../utils/websocketServer.js";

// @desc    Create a sponsorship (Brand side)
// @route   POST /api/sponsorships
// @access  Private (Brand)
export const createSponsorship = async (req, res) => {
  try {
    // Check if user is a brand
    if (req.user.role !== "brand") {
      return res.status(403).json({ message: "Only brands can create sponsorships" });
    }

    const { influencer, title, description, budget, deliverables } = req.body;

    if (!influencer || !title) {
      return res.status(400).json({ message: "influencer and title are required" });
    }

    // Check if brand has a profile
    const brandProfile = await BrandProfile.findOne({ user: req.user._id });
    if (!brandProfile) {
      return res.status(400).json({ message: "Brand profile is required to create sponsorships" });
    }

    const influencerProfile = await InfluencerProfile.findById(influencer);
    if (!influencerProfile) {
      return res.status(404).json({ message: "Influencer profile not found" });
    }

    // Create sponsorship
    const sponsorship = new Sponsorship({
      brand: brandProfile._id,
      influencer,
      title,
      description,
      budget,
      deliverables: deliverables || [],
    });

    const savedSponsorship = await sponsorship.save();

    // Populate the saved sponsorship with brand and influencer details
    await savedSponsorship.populate({
      path: "brand",
      select: "_id user companyName contactEmail",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    await savedSponsorship.populate("influencer", "handle user");
    await savedSponsorship.populate("influencer.user", "name");
    
    // Ensure proper brand name
    if (savedSponsorship.brand) {
      savedSponsorship.brand.name = savedSponsorship.brand.companyName || savedSponsorship.brand.contactEmail || "Unknown Brand";
    }

    // Notify the influencer about the new sponsorship
    publishSponsorshipUpdate({
      event: "new_sponsorship",
      data: savedSponsorship,
      recipient: influencerProfile.user.toString()
    });

    res.status(201).json(savedSponsorship);
  } catch (err) {
    console.error("Error creating sponsorship:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Get a single sponsorship by ID
// @route   GET /api/sponsorships/:id
// @access  Private
export const getSponsorshipById = async (req, res) => {
  try {
    const sponsorship = await Sponsorship.findById(req.params.id)
      .populate({
        path: "brand",
        select: "_id user companyName contactEmail",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate({
        path: "influencer",
        select: "_id handle user",
        populate: {
          path: "user",
          select: "name"
        }
      });

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    // Ensure proper brand name
    if (sponsorship.brand) {
      sponsorship.brand.name = sponsorship.brand.companyName || 
                              sponsorship.brand.contactEmail || 
                              (sponsorship.brand.user?.name) || 
                              "Unknown Brand";
    }

    // Ensure proper influencer name
    if (sponsorship.influencer && sponsorship.influencer.user) {
      sponsorship.influencer.name = sponsorship.influencer.user.name || "Unknown Influencer";
    }

    // Check if user has permission to view this sponsorship
    let hasPermission = false;
    
    if (req.user.role === "brand") {
      const brandProfile = await BrandProfile.findOne({ user: req.user._id });
      if (brandProfile && sponsorship.brand && sponsorship.brand._id.toString() === brandProfile._id.toString()) {
        hasPermission = true;
      }
    } else if (req.user.role === "influencer") {
      const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
      if (influencerProfile && sponsorship.influencer && sponsorship.influencer._id.toString() === influencerProfile._id.toString()) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: "Not authorized to view this sponsorship" });
    }

    res.json(sponsorship);
  } catch (err) {
    console.error("Error fetching sponsorship:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all sponsorships for the logged-in brand
// @route   GET /api/sponsorships/brand/my
// @access  Private (Brand)
export const getMyBrandSponsorships = async (req, res) => {
  try {
    // Check if user is a brand
    if (req.user.role !== "brand") {
      return res.status(403).json({ message: "Only brands can view their sponsorships" });
    }

    // Find brand profile
    const brandProfile = await BrandProfile.findOne({ user: req.user._id });
    if (!brandProfile) {
      return res.status(404).json({ message: "Brand profile not found" });
    }

    // Find all sponsorships for this brand with populated data
    const sponsorships = await Sponsorship.find({ brand: brandProfile._id })
      .populate({
        path: "brand",
        select: "_id user companyName contactEmail",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate({
        path: "influencer",
        select: "handle user",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });

    // Transform sponsorships to ensure proper brand name is used
    const transformedSponsorships = sponsorships.map(sponsorship => {
      const sponsorshipObj = sponsorship.toObject();
      
      // Ensure proper brand name
      if (sponsorshipObj.brand) {
        sponsorshipObj.brand.name = sponsorshipObj.brand.companyName || 
                                  sponsorshipObj.brand.contactEmail || 
                                  (sponsorshipObj.brand.user?.name) || 
                                  "Unknown Brand";
      }
      
      // Ensure proper influencer name
      if (sponsorshipObj.influencer && sponsorshipObj.influencer.user) {
        sponsorshipObj.influencer.name = sponsorshipObj.influencer.user.name;
      }
      
      return sponsorshipObj;
    });

    res.json(transformedSponsorships);
  } catch (err) {
    console.error("Error fetching brand sponsorships:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all sponsorships for the logged-in influencer
// @route   GET /api/sponsorships/my
// @access  Private (Influencer)
export const getMySponsorships = async (req, res) => {
  try {
    // Check if user is an influencer
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can view their sponsorships" });
    }

    // Find influencer profile
    const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!influencerProfile) {
      return res.status(404).json({ message: "Influencer profile not found" });
    }

    // Find all sponsorships for this influencer with populated data
    const sponsorships = await Sponsorship.find({ influencer: influencerProfile._id })
      .populate({
        path: "brand",
        select: "_id user companyName contactEmail",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate({
        path: "influencer",
        select: "handle user",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });

    // Transform sponsorships to ensure proper names are used
    const transformedSponsorships = sponsorships.map(sponsorship => {
      const sponsorshipObj = sponsorship.toObject();
      
      // Ensure proper brand name
      if (sponsorshipObj.brand) {
        sponsorshipObj.brand.name = sponsorshipObj.brand.companyName || 
                                  sponsorshipObj.brand.contactEmail || 
                                  (sponsorshipObj.brand.user?.name) || 
                                  "Unknown Brand";
      }
      
      // Ensure proper influencer name
      if (sponsorshipObj.influencer && sponsorshipObj.influencer.user) {
        sponsorshipObj.influencer.name = sponsorshipObj.influencer.user.name;
      }
      
      return sponsorshipObj;
    });

    res.json(transformedSponsorships);
  } catch (err) {
    console.error("Error fetching influencer sponsorships:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Accept a sponsorship offer
// @route   PATCH /api/sponsorships/:id/accept
// @access  Private (Influencer)
export const acceptSponsorship = async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can accept sponsorships" });
    }

    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    if (sponsorship.status !== "pending") {
      return res.status(400).json({ message: "Only pending sponsorships can be accepted" });
    }

    // Check if the logged in user is the influencer for this sponsorship
    const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!influencerProfile || sponsorship.influencer.toString() !== influencerProfile._id.toString()) {
      return res.status(403).json({ message: "User not authorized to accept this sponsorship" });
    }

    // Update status to accepted
    sponsorship.status = "accepted";
    sponsorship.updatedAt = Date.now();

    const updatedSponsorship = await sponsorship.save();

    // Populate the updated sponsorship with brand and influencer details
    await updatedSponsorship.populate({
      path: "brand",
      select: "_id user companyName contactEmail",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    await updatedSponsorship.populate({
      path: "influencer",
      select: "handle user",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    // Ensure proper brand name
    if (updatedSponsorship.brand) {
      updatedSponsorship.brand.name = updatedSponsorship.brand.companyName || 
                                     updatedSponsorship.brand.contactEmail || 
                                     (updatedSponsorship.brand.user?.name) || 
                                     "Unknown Brand";
    }
    
    // Ensure proper influencer name
    if (updatedSponsorship.influencer && updatedSponsorship.influencer.user) {
      updatedSponsorship.influencer.name = updatedSponsorship.influencer.user.name;
    }

    // Notify the brand about the acceptance
    publishSponsorshipUpdate({
      event: "sponsorship_accepted",
      data: updatedSponsorship,
      recipient: updatedSponsorship.brand.user._id.toString()
    });

    res.json(updatedSponsorship);
  } catch (err) {
    console.error("Error accepting sponsorship:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Reject a sponsorship offer
// @route   PATCH /api/sponsorships/:id/reject
// @access  Private (Influencer)
export const rejectSponsorship = async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can reject sponsorships" });
    }

    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    if (sponsorship.status !== "pending") {
      return res.status(400).json({ message: "Only pending sponsorships can be rejected" });
    }

    // Check if the logged in user is the influencer for this sponsorship
    const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
    if (!influencerProfile || sponsorship.influencer.toString() !== influencerProfile._id.toString()) {
      return res.status(403).json({ message: "User not authorized to reject this sponsorship" });
    }

    // Update status to rejected
    sponsorship.status = "rejected";
    sponsorship.updatedAt = Date.now();

    const updatedSponsorship = await sponsorship.save();

    // Populate the updated sponsorship with brand and influencer details
    await updatedSponsorship.populate({
      path: "brand",
      select: "_id user companyName contactEmail",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    await updatedSponsorship.populate({
      path: "influencer",
      select: "handle user",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    // Ensure proper brand name
    if (updatedSponsorship.brand) {
      updatedSponsorship.brand.name = updatedSponsorship.brand.companyName || 
                                     updatedSponsorship.brand.contactEmail || 
                                     (updatedSponsorship.brand.user?.name) || 
                                     "Unknown Brand";
    }
    
    // Ensure proper influencer name
    if (updatedSponsorship.influencer && updatedSponsorship.influencer.user) {
      updatedSponsorship.influencer.name = updatedSponsorship.influencer.user.name;
    }

    // Notify the brand about the rejection
    publishSponsorshipUpdate({
      event: "sponsorship_rejected",
      data: updatedSponsorship,
      recipient: updatedSponsorship.brand.user._id.toString()
    });

    res.json(updatedSponsorship);
  } catch (err) {
    console.error("Error rejecting sponsorship:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Get all open sponsorships (for influencers)
// @route   GET /api/sponsorships/open
// @access  Private
export const getOpenSponsorships = async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencers can view open sponsorships" });
    }

    const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id }).select("_id");
    if (!influencerProfile) {
      return res.status(404).json({ message: "Influencer profile not found" });
    }

    const sponsorships = await Sponsorship.find({ status: "pending", influencer: influencerProfile._id })
      .populate({
        path: "brand",
        select: "_id user companyName contactEmail",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .populate({
        path: "influencer",
        select: "handle user",
        populate: {
          path: "user",
          select: "name"
        }
      })
      .sort({ createdAt: -1 });

    // Transform sponsorships to ensure proper names are used
    const transformedSponsorships = sponsorships.map(sponsorship => {
      const sponsorshipObj = sponsorship.toObject();
      
      // Ensure proper brand name
      if (sponsorshipObj.brand) {
        sponsorshipObj.brand.name = sponsorshipObj.brand.companyName || 
                                  sponsorshipObj.brand.contactEmail || 
                                  (sponsorshipObj.brand.user?.name) || 
                                  "Unknown Brand";
      }
      
      // Ensure proper influencer name
      if (sponsorshipObj.influencer && sponsorshipObj.influencer.user) {
        sponsorshipObj.influencer.name = sponsorshipObj.influencer.user.name;
      }
      
      return sponsorshipObj;
    });

    res.json(transformedSponsorships);
  } catch (err) {
    console.error("Error fetching open sponsorships:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Cancel a sponsorship
// @route   PUT /api/sponsorships/:id/cancel
// @access  Private (Brand)
export const cancelSponsorship = async (req, res) => {
  try {
    if (req.user.role !== "brand") {
      return res.status(403).json({ message: "Only brands can cancel sponsorships" });
    }

    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    // Check if the logged in user is the brand for this sponsorship
    const brandProfile = await BrandProfile.findOne({ user: req.user._id });
    if (!brandProfile || sponsorship.brand.toString() !== brandProfile._id.toString()) {
      return res.status(403).json({ message: "User not authorized to cancel this sponsorship" });
    }

    if (!["pending", "accepted"].includes(sponsorship.status)) {
      return res.status(400).json({ message: "Only pending or accepted sponsorships can be cancelled" });
    }

    // Update status to cancelled
    sponsorship.status = "cancelled";
    sponsorship.updatedAt = Date.now();

    const updatedSponsorship = await sponsorship.save();

    // Populate the updated sponsorship with brand and influencer details
    await updatedSponsorship.populate({
      path: "brand",
      select: "_id user companyName contactEmail",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    await updatedSponsorship.populate({
      path: "influencer",
      select: "handle user",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    // Ensure proper brand name
    if (updatedSponsorship.brand) {
      updatedSponsorship.brand.name = updatedSponsorship.brand.companyName || 
                                     updatedSponsorship.brand.contactEmail || 
                                     (updatedSponsorship.brand.user?.name) || 
                                     "Unknown Brand";
    }
    
    // Ensure proper influencer name
    if (updatedSponsorship.influencer && updatedSponsorship.influencer.user) {
      updatedSponsorship.influencer.name = updatedSponsorship.influencer.user.name;
    }

    // Notify the influencer about the cancellation
    publishSponsorshipUpdate({
      event: "sponsorship_cancelled",
      data: updatedSponsorship,
      recipient: updatedSponsorship.influencer.user._id.toString()
    });

    res.json(updatedSponsorship);
  } catch (err) {
    console.error("Error cancelling sponsorship:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Complete a sponsorship
// @route   PUT /api/sponsorships/:id/complete
// @access  Private (Brand)
export const completeSponsorship = async (req, res) => {
  try {
    if (req.user.role !== "brand") {
      return res.status(403).json({ message: "Only brands can complete sponsorships" });
    }

    const sponsorship = await Sponsorship.findById(req.params.id);

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    // Check if the logged in user is the brand for this sponsorship
    const brandProfile = await BrandProfile.findOne({ user: req.user._id });
    if (!brandProfile || sponsorship.brand.toString() !== brandProfile._id.toString()) {
      return res.status(403).json({ message: "User not authorized to complete this sponsorship" });
    }

    if (sponsorship.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted sponsorships can be marked as completed" });
    }

    // Update status to completed
    sponsorship.status = "completed";
    sponsorship.updatedAt = Date.now();

    const updatedSponsorship = await sponsorship.save();

    // Populate the updated sponsorship with brand and influencer details
    await updatedSponsorship.populate({
      path: "brand",
      select: "_id user companyName contactEmail",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    await updatedSponsorship.populate({
      path: "influencer",
      select: "handle user",
      populate: {
        path: "user",
        select: "name"
      }
    });
    
    // Ensure proper brand name
    if (updatedSponsorship.brand) {
      updatedSponsorship.brand.name = updatedSponsorship.brand.companyName || 
                                     updatedSponsorship.brand.contactEmail || 
                                     (updatedSponsorship.brand.user?.name) || 
                                     "Unknown Brand";
    } else {
      return res.status(403).json({ message: "Unsupported role for recent activities" });
    }
    
    // Ensure proper influencer name
    if (updatedSponsorship.influencer && updatedSponsorship.influencer.user) {
      updatedSponsorship.influencer.name = updatedSponsorship.influencer.user.name;
    }

    // Notify the influencer about the completion
    publishSponsorshipUpdate({
      event: "sponsorship_completed",
      data: updatedSponsorship,
      recipient: updatedSponsorship.influencer.user._id.toString()
    });

    res.json(updatedSponsorship);
  } catch (err) {
    console.error("Error completing sponsorship:", err);
    res.status(500).send("Server Error");
  }
};

// @desc    Get recent activities for a user
// @route   GET /api/sponsorships/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    let sponsorships = [];
    
    if (req.user.role === "brand") {
      const brandProfile = await BrandProfile.findOne({ user: req.user._id });
      if (brandProfile) {
        sponsorships = await Sponsorship.find({ brand: brandProfile._id })
          .populate({
            path: "brand",
            select: "_id user companyName contactEmail",
            populate: {
              path: "user",
              select: "name"
            }
          })
          .populate({
            path: "influencer",
            select: "handle user",
            populate: {
              path: "user",
              select: "name"
            }
          })
          .sort({ updatedAt: -1 })
          .limit(5);
      }
    } else if (req.user.role === "influencer") {
      const influencerProfile = await InfluencerProfile.findOne({ user: req.user._id });
      if (influencerProfile) {
        sponsorships = await Sponsorship.find({ influencer: influencerProfile._id })
          .populate({
            path: "brand",
            select: "_id user companyName contactEmail",
            populate: {
              path: "user",
              select: "name"
            }
          })
          .populate({
            path: "influencer",
            select: "handle user",
            populate: {
              path: "user",
              select: "name"
            }
          })
          .sort({ updatedAt: -1 })
          .limit(5);
      }
    }

    // Transform sponsorships to ensure proper names are used
    const transformedSponsorships = sponsorships.map(sponsorship => {
      const sponsorshipObj = sponsorship.toObject();
      
      // Ensure proper brand name
      if (sponsorshipObj.brand) {
        sponsorshipObj.brand.name = sponsorshipObj.brand.companyName || 
                                  sponsorshipObj.brand.contactEmail || 
                                  (sponsorshipObj.brand.user?.name) || 
                                  "Unknown Brand";
      }
      
      // Ensure proper influencer name
      if (sponsorshipObj.influencer && sponsorshipObj.influencer.user) {
        sponsorshipObj.influencer.name = sponsorshipObj.influencer.user.name;
      }
      
      return sponsorshipObj;
    });

    res.json(transformedSponsorships);
  } catch (err) {
    console.error("Error fetching recent activities:", err);
    res.status(500).send("Server Error");
  }
};
