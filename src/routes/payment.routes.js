import express from "express";

import {
    createCheckoutSession,
    getSubscription,
    cancelSubscription,
} from "../controllers/payment.controller.js";


const router = express.Router();

router.post(
    "/create-checkout-session",
    createCheckoutSession,
);


router.get(
    "/subscription",
    getSubscription,
);

router.post(
    "/cancel-subscription",
    cancelSubscription,
);

export default router;