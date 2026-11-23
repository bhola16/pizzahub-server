import express from "express";

import {
    cancelSubscription,
    createCheckoutSession,
    getSubscription,
} from "../controllers/payment.controller.js";
import { verifyVendor } from "../middleware/verifyVendor.js";
import { verifyToken } from "../middleware/verifyAPI.js";


const router = express.Router();

router.post(
    "/create-checkout-session", verifyToken, verifyVendor,
    createCheckoutSession,
);


router.get(
    "/subscription", verifyToken, verifyVendor,
    getSubscription,
);


router.post(
    "/cancel-subscription", verifyToken, verifyVendor,
    cancelSubscription,
);

export default router;