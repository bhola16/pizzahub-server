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
import { verifyVendor } from "../middleware/verifyVendor.js";

const router = express.Router();
const vendorRouter = express.Router();

// Menu routes
router.get("/", getMenuItems);
router.get("/featured", getFeaturedMenuItems);
router.get("/:id", verifyToken, getSingleMenuItem);

router.put("/:id", verifyToken, verifyVendor, updateMenuItem);
router.delete("/:id", verifyToken, verifyVendor, deleteVendorMenuItem);
router.patch("/:id/availability", verifyToken, verifyVendor, updateVendorMenuAvailability);

router.post("/",verifyToken , verifyVendor, addMenuItem);
router.get("/count/:email",  verifyToken, verifyVendor, getVendorMenuItemCount);

// Vendor menu routes
vendorRouter.get("/:email", verifyToken, verifyVendor, getVendorMenuItems);

export { vendorRouter };
export default router;