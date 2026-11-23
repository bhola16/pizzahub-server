
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
import { verifyToken } from "../middleware/verifyAPI.js";
import { verifyCustomer } from "../middleware/verifyCustomer.js";
import { verifyVendor } from "../middleware/verifyVendor.js";

const router = express.Router();

router.get("/check", verifyToken, checkExistingOrder);
router.patch("/:id/withdraw", verifyToken, verifyCustomer,  withdrawOrder);
router.post("/", verifyToken, verifyCustomer, placeOrder);

router.delete("/:id/rejected", verifyToken, verifyCustomer, deleteRejectedOrder);

router.get("/customer/:email", verifyToken, verifyCustomer, getCustomerOrders);


router.get("/vendor/:email", verifyToken, verifyVendor, getVendorOrders);
router.patch("/:id/vendor-status", verifyToken, verifyVendor, updateVendorOrderStatus);




export default router;
