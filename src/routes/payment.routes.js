import express from "express";

import {
    createCheckoutSession,
    getSubscription,
    cancelSubscription,
} from "../controllers/payment.controller.js";

import { requireVendor } from "../middleware/requireVendor.js";

const router = express.Router();

router.post(
    "/create-checkout-session",
    requireVendor,
    createCheckoutSession,
);

router.get(
    "/subscription",
    requireVendor,
    getSubscription,
);

router.post(
    "/cancel-subscription",
    requireVendor,
    cancelSubscription,
);

export default router;