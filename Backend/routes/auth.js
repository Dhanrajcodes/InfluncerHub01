// backend/routes/auth.js
// -----------------
import express from "express";
import { body } from "express-validator";
import { register, login, getMe, deleteAccount } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// register
router.post(
  "/register",
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["brand", "influencer"]),
  ],
  register
);

// login
router.post("/login", login);

// current user
router.get("/me", auth, getMe);

// delete own account
router.delete("/delete-account", auth, deleteAccount);

export default router;
