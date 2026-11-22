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

const router = express.Router();
const vendorRouter = express.Router();

// Menu routes
router.get("/", getMenuItems);
router.get("/featured", getFeaturedMenuItems);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteVendorMenuItem);
router.patch("/:id/availability", updateVendorMenuAvailability);
router.get("/:id", getSingleMenuItem);
router.post("/", addMenuItem);
router.get("/count/:email", getVendorMenuItemCount);

// Vendor menu routes
vendorRouter.get("/:email", getVendorMenuItems);

export { vendorRouter };
export default router;