
import express from "express";

import {
    blockUser,
    deleteMenuItem,
    getAdminDashboardStats,
    getAdminTransactions,
    getAllMenuItems,
    getAllUsers,
    reviewMenuItem,
    unblockUser,
    updateMenuAvailability,
} from "../controllers/admin.controller.js";
import { verifyToken } from "../middleware/verifyAPI.js";

const router = express.Router();

// User management
router.get("/users", verifyToken, getAllUsers);
router.patch("/users/:id/block", verifyToken, blockUser);
router.patch("/users/:id/unblock", verifyToken, unblockUser);

// Menu management
router.get("/menu-items", verifyToken, getAllMenuItems);
router.patch("/menu-items/:id/review", verifyToken, reviewMenuItem);
router.patch("/menu-items/:id/availability", verifyToken, updateMenuAvailability);
router.delete("/menu-items/:id", verifyToken, deleteMenuItem);

// Dashboard
router.get("/dashboard/stats", verifyToken, getAdminDashboardStats);

// Payment transactions
router.get("/transactions", verifyToken, getAdminTransactions);

export default router;

