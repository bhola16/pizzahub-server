
import { fromNodeHeaders } from "better-auth/node";
import { getDB } from "../config/db.js";
import stripe from "../config/stripe.js";
import { auth } from "../lib/auth.js";
import { ObjectId } from "mongodb";

const getAuthenticatedVendor = async (req) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.email) {
        return null;
    }

    const db = getDB();

    const vendor = await db.collection("user").findOne({
        email: session.user.email,
        role: "vendor",
    });

    return vendor || null;
};


const isSubscriptionActive = (status) => {
    return ["active", "trialing"].includes(status);
};


export const createCheckoutSession = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                message: "Unauthorized vendor",
            });
        }

        if (
            vendor.premium === true &&
            vendor.subscriptionPlan === "premium" &&
            ["active", "trialing"].includes(vendor.subscriptionStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "You already have an active Premium subscription.",
            });
        }

        const checkoutSession =
            await stripe.checkout.sessions.create({
                mode: "subscription",

                customer_email: vendor.email,

                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: "PizzaHub Premium",
                                description:
                                    "Monthly Premium Vendor Subscription",
                            },
                            unit_amount: 2000, // $20.00
                            recurring: {
                                interval: "month",
                            },
                        },
                        quantity: 1,
                    },
                ],

                metadata: {
                    vendorId: String(vendor._id),
                    vendorEmail: vendor.email,
                },

                subscription_data: {
                    metadata: {
                        vendorId: String(vendor._id),
                        vendorEmail: vendor.email,
                    },
                },

                success_url:
                    `${process.env.CLIENT_URL}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,

                cancel_url:
                    `${process.env.CLIENT_URL}/dashboard/payment/cancel`,
            });

        return res.status(200).json({
            message: "Checkout session created successfully",
            url: checkoutSession.url,
        });

    } catch (error) {
        console.error("Stripe checkout error:", error);

        return res.status(500).json({
            message: "Unable to create checkout session",
        });
    }
};


export const getSubscription = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                message: "Unauthorized vendor",
            });
        }

        return res.status(200).json({
            subscription: {
                subscriptionPlan:
                    vendor.subscriptionPlan || "free",

                premium: vendor.premium === true,

                subscriptionStatus:
                    vendor.subscriptionStatus || "inactive",

                stripeSubscriptionId:
                    vendor.stripeSubscriptionId || null,

                cancelAtPeriodEnd:
                    vendor.cancelAtPeriodEnd === true,

                currentPeriodEnd:
                    vendor.currentPeriodEnd || null,
            },
        });

    } catch (error) {
        console.error("Get subscription error:", error);

        return res.status(500).json({
            message: "Unable to retrieve subscription",
        });
    }
};


export const cancelSubscription = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: "Vendor authentication required.",
            });
        }

        if (!vendor.stripeSubscriptionId) {
            return res.status(400).json({
                success: false,
                message: "No active subscription found.",
            });
        }

        const subscriptionId = vendor.stripeSubscriptionId;

        const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

        // Verify subscription ownership
        if (
            subscription.metadata?.vendorId !== String(vendor._id) &&
            subscription.metadata?.vendorEmail !== vendor.email
        ) {
            return res.status(403).json({
                success: false,
                message: "Subscription ownership verification failed.",
            });
        }

        if (!isSubscriptionActive(subscription.status)) {
            return res.status(400).json({
                success: false,
                message: "Subscription is not active.",
            });
        }

        // Cancel immediately
        await stripe.subscriptions.cancel(subscriptionId);

        const db = getDB();

        await db.collection("user").updateOne(
            {
                _id: vendor._id,
                stripeSubscriptionId: subscriptionId,
            },
            {
                $set: {
                    premium: false,
                    subscriptionPlan: "free",
                    subscriptionStatus: "free",
                    stripeSubscriptionId: null,
                    cancelAtPeriodEnd: false,
                    currentPeriodEnd: null,
                    updatedAt: new Date(),
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "Premium subscription cancelled successfully.",
        });

    } catch (error) {
        console.error("Cancel subscription error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel subscription.",
        });
    }
};




export const stripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    // 1. Verify Stripe webhook signature
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature error:", error.message);

        return res.status(400).send(
            `Webhook Error: ${error.message}`
        );
    }

    const db = getDB();
    const usersCollection = db.collection("user");
    const paymentsCollection = db.collection("payments");

    try {
        switch (event.type) {

            // ==========================================
            // CHECKOUT SESSION COMPLETED
            // ==========================================

            case "checkout.session.completed": {
                const checkout = event.data.object;

                console.log("Checkout completed:", checkout.id);

                const subscriptionId =
                    typeof checkout.subscription === "string"
                        ? checkout.subscription
                        : checkout.subscription?.id || null;

                if (!subscriptionId) {
                    throw new Error("Subscription ID missing.");
                }

                const subscription =
                    await stripe.subscriptions.retrieve(subscriptionId);

                const vendorId =
                    checkout.metadata?.vendorId ||
                    subscription.metadata?.vendorId;

                const vendorEmail =
                    checkout.metadata?.vendorEmail ||
                    subscription.metadata?.vendorEmail;

                if (!vendorId || !ObjectId.isValid(vendorId)) {
                    throw new Error("Valid vendor ID missing from metadata.");
                }

                if (!vendorEmail) {
                    throw new Error("Vendor email missing from metadata.");
                }

                const customerId =
                    typeof checkout.customer === "string"
                        ? checkout.customer
                        : checkout.customer?.id || null;

                const active = isSubscriptionActive(subscription.status);

                // Activate Premium only for an active subscription.
                if (active) {
                    const userResult = await usersCollection.updateOne(
                        {
                            _id: new ObjectId(vendorId),
                            email: vendorEmail,
                            role: "vendor",
                            $or: [
                                { stripeSubscriptionId: subscriptionId },
                                { stripeSubscriptionId: null },
                                { stripeSubscriptionId: { $exists: false } },
                            ],
                        },
                        {
                            $set: {
                                subscriptionPlan: "premium",
                                premium: true,
                                subscriptionStatus: subscription.status,

                                stripeCustomerId: customerId,
                                stripeSubscriptionId: subscriptionId,

                                cancelAtPeriodEnd:
                                    subscription.cancel_at_period_end === true,

                                currentPeriodEnd:
                                    subscription.current_period_end
                                        ? new Date(
                                            subscription.current_period_end * 1000
                                        )
                                        : null,

                                updatedAt: new Date(),
                            },
                        }
                    );

                    if (userResult.matchedCount === 0) {
                        console.warn(
                            "Checkout activation ignored: vendor not found or another subscription is current.",
                            { vendorId, vendorEmail, subscriptionId }
                        );
                    }
                }

                // Save payment record idempotently.
                const paymentData = {
                    vendorId,
                    vendorEmail,

                    amount: `$${((checkout.amount_total ?? 0) / 100).toFixed(2)}`,
                    currency: (checkout.currency || "usd").toUpperCase(),

                    paymentStatus: checkout.payment_status,

                    stripeSessionId: checkout.id,

                    stripePaymentIntent:
                        typeof checkout.payment_intent === "string"
                            ? checkout.payment_intent
                            : checkout.payment_intent?.id || null,

                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,

                    createdAt: new Date(),
                };

                await paymentsCollection.updateOne(
                    { stripeSessionId: checkout.id },
                    { $setOnInsert: paymentData },
                    { upsert: true }
                );

                console.log("Checkout processed:", {
                    vendorEmail,
                    subscriptionId,
                    active,
                });

                break;
            }

            // ==========================================
            // SUBSCRIPTION UPDATED
            // ==========================================

            case "customer.subscription.updated": {
                const subscription = event.data.object;

                const vendorId = subscription.metadata?.vendorId;
                const vendorEmail = subscription.metadata?.vendorEmail;

                if (!vendorId || !ObjectId.isValid(vendorId) || !vendorEmail) {
                    throw new Error("Valid vendor metadata missing.");
                }

                const active = isSubscriptionActive(subscription.status);

                const customerId =
                    typeof subscription.customer === "string"
                        ? subscription.customer
                        : subscription.customer?.id || null;

                const userResult = await usersCollection.updateOne(
                    {
                        _id: new ObjectId(vendorId),
                        email: vendorEmail,
                        role: "vendor",
                        $or: [
                            { stripeSubscriptionId: subscription.id },
                            { stripeSubscriptionId: null },
                            { stripeSubscriptionId: { $exists: false } },
                        ],
                    },
                    {
                        $set: {
                            subscriptionPlan: active ? "premium" : "free",
                            premium: active,

                            subscriptionStatus: active
                                ? subscription.status
                                : "free",

                            stripeCustomerId: customerId,

                            stripeSubscriptionId: active
                                ? subscription.id
                                : null,

                            cancelAtPeriodEnd: active
                                ? subscription.cancel_at_period_end === true
                                : false,

                            currentPeriodEnd:
                                active && subscription.current_period_end
                                    ? new Date(
                                        subscription.current_period_end * 1000
                                    )
                                    : null,

                            updatedAt: new Date(),
                        },
                    }
                );

                console.log("Subscription updated:", {
                    vendorEmail,
                    subscriptionId: subscription.id,
                    stripeStatus: subscription.status,
                    premium: active,
                    matchedCount: userResult.matchedCount,
                });

                if (userResult.matchedCount === 0) {
                    console.warn(
                        "Subscription update ignored: subscription is no longer current.",
                        subscription.id
                    );
                }

                break;
            }

            // ==========================================
            // SUBSCRIPTION DELETED / CANCELLED
            // ==========================================

            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                const vendorId = subscription.metadata?.vendorId;
                const vendorEmail = subscription.metadata?.vendorEmail;

                if (!vendorId || !ObjectId.isValid(vendorId) || !vendorEmail) {
                    throw new Error("Valid vendor metadata missing.");
                }

                const userResult = await usersCollection.updateOne(
                    {
                        _id: new ObjectId(vendorId),
                        email: vendorEmail,
                        role: "vendor",
                        stripeSubscriptionId: subscription.id,
                    },
                    {
                        $set: {
                            subscriptionPlan: "free",
                            premium: false,
                            subscriptionStatus: "free",

                            stripeSubscriptionId: null,

                            cancelAtPeriodEnd: false,
                            currentPeriodEnd: null,

                            updatedAt: new Date(),
                        },
                    }
                );

                console.log("Subscription cancelled:", {
                    vendorEmail,
                    subscriptionId: subscription.id,
                    matchedCount: userResult.matchedCount,
                });

                if (userResult.matchedCount === 0) {
                    console.warn(
                        "Cancellation ignored: subscription is no longer current or vendor is already on Free.",
                        subscription.id
                    );
                }

                break;
            }

            // ==========================================
            // INVOICE PAYMENT SUCCEEDED
            // ==========================================

            case "invoice.payment_succeeded": {
                const invoice = event.data.object;

                const subscriptionId =
                    typeof invoice.subscription === "string"
                        ? invoice.subscription
                        : invoice.subscription?.id || null;

                if (!subscriptionId) {
                    console.log("Invoice has no subscription:", invoice.id);
                    break;
                }

                const subscription =
                    await stripe.subscriptions.retrieve(subscriptionId);

                const vendorId = subscription.metadata?.vendorId;
                const vendorEmail = subscription.metadata?.vendorEmail;

                if (!vendorId || !ObjectId.isValid(vendorId) || !vendorEmail) {
                    throw new Error("Valid vendor metadata missing.");
                }

                const customerId =
                    typeof invoice.customer === "string"
                        ? invoice.customer
                        : invoice.customer?.id || null;

                const active = isSubscriptionActive(subscription.status);

                if (active) {
                    await usersCollection.updateOne(
                        {
                            _id: new ObjectId(vendorId),
                            email: vendorEmail,
                            role: "vendor",
                            stripeSubscriptionId: subscriptionId,
                        },
                        {
                            $set: {
                                subscriptionPlan: "premium",
                                premium: true,
                                subscriptionStatus: subscription.status,
                                stripeCustomerId: customerId,
                                currentPeriodEnd:
                                    subscription.current_period_end
                                        ? new Date(
                                            subscription.current_period_end * 1000
                                        )
                                        : null,
                                updatedAt: new Date(),
                            },
                        }
                    );
                }

                // Save each successful invoice only once.
                await paymentsCollection.updateOne(
                    { stripeInvoiceId: invoice.id },
                    {
                        $setOnInsert: {
                            vendorId,
                            vendorEmail,
                            amount: `$${((invoice.amount_paid ?? 0) / 100).toFixed(2)}`,
                            currency: (invoice.currency || "usd").toUpperCase(),
                            paymentStatus: "paid",
                            stripeInvoiceId: invoice.id,
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: subscriptionId,
                            createdAt: new Date(),
                        },
                    },
                    { upsert: true }
                );

                console.log("Invoice payment succeeded:", invoice.id);

                break;
            }

            // ==========================================
            // INVOICE PAYMENT FAILED
            // ==========================================

            case "invoice.payment_failed": {
                const invoice = event.data.object;

                const subscriptionId =
                    typeof invoice.subscription === "string"
                        ? invoice.subscription
                        : invoice.subscription?.id || null;

                if (!subscriptionId) {
                    console.log("Failed invoice has no subscription:", invoice.id);
                    break;
                }

                const subscription =
                    await stripe.subscriptions.retrieve(subscriptionId);

                const vendorId = subscription.metadata?.vendorId;
                const vendorEmail = subscription.metadata?.vendorEmail;

                if (!vendorId || !ObjectId.isValid(vendorId) || !vendorEmail) {
                    throw new Error("Valid vendor metadata missing.");
                }

                // Record the failed payment without automatically
                // removing Premium access.
                await paymentsCollection.updateOne(
                    { stripeInvoiceId: invoice.id },
                    {
                        $setOnInsert: {
                            vendorId,
                            vendorEmail,
                            amount: `$${((invoice.amount_due ?? 0) / 100).toFixed(2)}`,
                            currency: (invoice.currency || "usd").toUpperCase(),
                            paymentStatus: "failed",
                            stripeInvoiceId: invoice.id,
                            stripeCustomerId:
                                typeof invoice.customer === "string"
                                    ? invoice.customer
                                    : invoice.customer?.id || null,
                            stripeSubscriptionId: subscriptionId,
                            createdAt: new Date(),
                        },
                    },
                    { upsert: true }
                );

                console.warn("Invoice payment failed:", {
                    vendorEmail,
                    subscriptionId,
                    invoiceId: invoice.id,
                });

                break;
            }

            // ==========================================
            // OTHER EVENTS
            // ==========================================

            default: {
                console.log(`Unhandled Stripe event: ${event.type}`);
            }
        }

        return res.status(200).json({
            received: true,
        });

    } catch (error) {
        console.error("Webhook processing error:", error);

        return res.status(500).json({
            message: "Webhook processing failed",
        });
    }
};

