// backend/routes/influencers.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import role from "../middleware/roleMiddleware.js";
import influencerController from "../controllers/influencerController.js";

const router = express.Router();

// Create or Update influencer profile
router.post("/me", auth, role(["influencer"]), influencerController.createOrUpdateProfile);
router.put("/me", auth, role(["influencer"]), influencerController.createOrUpdateProfile); // ✅ Added PUT support

// Get own profile - also adding role middleware for consistency
router.get("/me", auth, role(["influencer"]), influencerController.getMyProfile);

// Get profile by handle - this is a public route, so no role required
router.get("/handle/:handle", influencerController.getProfileByHandle);

// Search influencers - this is a public route, so no role required
router.get("/", influencerController.searchInfluencers);

// Get all influencers (latest) - this is a public route, so no role required
router.get("/all", influencerController.getAllInfluencers);

export default router;