
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
} from "../controllers/admin.controller.js";

const router = express.Router();

// Users
router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

// Menu items
router.get("/menu-items", getAllMenuItems);
router.patch("/menu-items/:id/review", reviewMenuItem);
router.patch("/menu-items/:id/availability", updateMenuAvailability);
router.delete("/menu-items/:id", deleteMenuItem);

// Dashboard
router.get("/dashboard/stats", getAdminDashboardStats);

export default router;
