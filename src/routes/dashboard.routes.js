
import express from "express";

import {
    getVendorDashboard,
    getCustomerDashboard,
    postCustomerDashboard,
} from "../controllers/dashboard.controller.js";

const vendorRouter = express.Router();
const customerRouter = express.Router();

// Vendor dashboard
vendorRouter.get("/:email", getVendorDashboard);

// Customer dashboard
customerRouter.get("/:email", getCustomerDashboard);
customerRouter.post("/", postCustomerDashboard);

export { vendorRouter, customerRouter };
