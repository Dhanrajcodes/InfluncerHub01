// backend/routes/brands.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import role from "../middleware/roleMiddleware.js";
import { createOrUpdateProfile, deleteProfile, getMyProfile, getProfileById, searchBrands, getAllBrands } 
  from "../controllers/brandController.js";

const router = express.Router();

// Create or Update brand profile
router.post("/me", auth, role(["brand"]), createOrUpdateProfile);
router.put("/me", auth, role(["brand"]), createOrUpdateProfile);

// Get own profile
router.get("/me", auth, role(["brand"]), getMyProfile);

// Get all brands (latest) - public route
router.get("/all", getAllBrands);

// Get profile by user ID - public route
router.get("/:userId", getProfileById);

// Search brands - public route
router.get("/", searchBrands);

// Delete brand profile
router.delete("/me", auth, role(["brand"]), deleteProfile);

export default router;