import express from "express";

import {
    getVendorDashboard,
    getCustomerDashboard,
    postCustomerDashboard,
} from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/verifyAPI.js";
import { verifyCustomer } from "../middleware/verifyCustomer.js";
import { verifyVendor } from "../middleware/verifyVendor.js";


const vendorRouter = express.Router();
const customerRouter = express.Router();


// Vendor dashboard
vendorRouter.get("/:email", verifyToken, verifyVendor, getVendorDashboard);

// Customer dashboard
customerRouter.get("/:email", verifyToken, verifyCustomer, getCustomerDashboard);
customerRouter.post("/", verifyToken, verifyCustomer, postCustomerDashboard);

export { vendorRouter, customerRouter };
