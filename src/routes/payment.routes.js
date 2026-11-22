
import express from "express";

import {
    createCheckoutSession,
    getSubscription,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.get("/subscription", getSubscription);

export default router;
