import express from "express";

import {
    getMenuItems,
    getFeaturedMenuItems,
    addMenuItem,
    getVendorMenuItemCount,
    getVendorMenuItems,
    updateMenuItem,
    deleteVendorMenuItem,
    updateVendorMenuAvailability,
    getSingleMenuItem,
} from "../controllers/menu.controller.js";
import { verifyToken } from "../middleware/verifyAPI.js";

const router = express.Router();
const vendorRouter = express.Router();

// Menu routes
router.get("/", getMenuItems);
router.get("/featured", getFeaturedMenuItems);
router.get("/:id", verifyToken, getSingleMenuItem);

router.put("/:id", verifyToken, updateMenuItem);
router.delete("/:id", verifyToken, deleteVendorMenuItem);
router.patch("/:id/availability", updateVendorMenuAvailability);

router.post("/",verifyToken , addMenuItem);
router.get("/count/:email", getVendorMenuItemCount);

// Vendor menu routes
vendorRouter.get("/:email", verifyToken, getVendorMenuItems);

export { vendorRouter };
export default router;