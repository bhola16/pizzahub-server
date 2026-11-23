
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
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// User management
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.patch("/users/:id/block", verifyToken, verifyAdmin, blockUser);
router.patch("/users/:id/unblock", verifyToken, verifyAdmin, unblockUser);

// Menu management
router.get("/menu-items", verifyToken, verifyAdmin,  getAllMenuItems);
router.patch("/menu-items/:id/review", verifyToken, verifyAdmin, reviewMenuItem);
router.patch("/menu-items/:id/availability", verifyToken, verifyAdmin, updateMenuAvailability);
router.delete("/menu-items/:id", verifyToken, verifyAdmin, deleteMenuItem);


// Dashboard
router.get("/dashboard/stats", verifyToken, verifyAdmin, getAdminDashboardStats);

// Payment transactions
router.get("/transactions", verifyToken, verifyAdmin, getAdminTransactions);

export default router;

