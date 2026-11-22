
import express from "express";

import {
    getAllUsers,
    blockUser,
    unblockUser,
    getAllMenuItems,
    reviewMenuItem,
    updateMenuAvailability,
    deleteMenuItem,
    getAdminDashboardStats,
    getAdminTransactions,
} from "../controllers/admin.controller.js";

const router = express.Router();

// User management
router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

// Menu management
router.get("/menu-items", getAllMenuItems);
router.patch("/menu-items/:id/review", reviewMenuItem);
router.patch("/menu-items/:id/availability", updateMenuAvailability);
router.delete("/menu-items/:id", deleteMenuItem);

// Dashboard
router.get("/dashboard/stats", getAdminDashboardStats);

// Payment transactions
router.get("/transactions", getAdminTransactions);

export default router;
