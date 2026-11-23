import express from "express";

import {
    getVendorDashboard,
    getCustomerDashboard,
    postCustomerDashboard,
} from "../controllers/dashboard.controller.js";

import { verifyToken } from "../middleware/verifyApi.js";

const vendorRouter = express.Router();
const customerRouter = express.Router();

// Vendor dashboard
vendorRouter.get("/:email", verifyToken, getVendorDashboard);

// Customer dashboard
customerRouter.get("/:email", verifyToken, getCustomerDashboard);
customerRouter.post("/", verifyToken, postCustomerDashboard);

export { vendorRouter, customerRouter };