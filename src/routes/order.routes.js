
import express from "express";

import {
    checkExistingOrder,
    withdrawOrder,
    deleteRejectedOrder,
    placeOrder,
    getCustomerOrders,
    getVendorOrders,
    updateVendorOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

router.get("/check", checkExistingOrder);
router.patch("/:id/withdraw", withdrawOrder);
router.delete("/:id/rejected", deleteRejectedOrder);
router.post("/", placeOrder);
router.get("/customer/:email", getCustomerOrders);
router.get("/vendor/:email", getVendorOrders);
router.patch("/:id/vendor-status", updateVendorOrderStatus);

export default router;
