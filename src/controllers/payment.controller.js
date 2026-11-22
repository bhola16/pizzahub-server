
import { fromNodeHeaders } from "better-auth/node";
import { getDB } from "../config/db.js";
import stripe from "../config/stripe.js";
import { auth } from "../lib/auth.js";


// Verify the authenticated vendor using Better Auth
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
    });

    if (!vendor || vendor.role !== "vendor") {
        return null;
    }

    return vendor;
};


// 1. Create Stripe Checkout Session

export const createCheckoutSession = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                message: "Unauthorized vendor",
            });
        }

        if (
            vendor.subscriptionPlan === "premium" &&
            ["active", "trialing"].includes(
                vendor.subscriptionStatus
            )
        ) {
            return res.status(400).json({
                message: "You already have an active Premium subscription.",
            });
        }

        
const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",

    customer_email: vendor.email,

    line_items: [
        {
            price_data: {
                currency: "usd",
                product_data: {
                    name: "PizzaHub Premium",
                    description: "Monthly Premium Vendor Subscription",
                },
                unit_amount: 2000,
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

    success_url: `${process.env.CLIENT_URL}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/dashboard/payment/cancel`,
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


// 2. Get Vendor Subscription

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

                subscriptionStatus:
                    vendor.subscriptionStatus || "inactive",
            },
        });

    } catch (error) {
        console.error("Get subscription error:", error);

        return res.status(500).json({
            message: "Unable to retrieve subscription",
        });
    }
};


// 3. Stripe Webhook
// 3. Stripe Webhook
export const stripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

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

    try {
        switch (event.type) {
            // Successful Checkout
            case "checkout.session.completed": {
                const checkout = event.data.object;

                console.log("Checkout completed event received:", checkout.id);

                const subscriptionId =
                    typeof checkout.subscription === "string"
                        ? checkout.subscription
                        : checkout.subscription?.id;

                let subscription = null;

                if (subscriptionId) {
                    subscription =
                        await stripe.subscriptions.retrieve(subscriptionId);
                }

                // Get vendor information from Checkout metadata,
                // with subscription metadata as a fallback.
                const vendorEmail =
                    checkout.metadata?.vendorEmail ||
                    subscription?.metadata?.vendorEmail;

                const vendorId =
                    checkout.metadata?.vendorId ||
                    subscription?.metadata?.vendorId;

                if (!vendorEmail) {
                    console.error(
                        "Cannot create payment: vendor email missing.",
                        checkout.metadata
                    );
                    break;
                }

                const subscriptionStatus =
                    subscription?.status || "inactive";

                const isActive = [
                    "active",
                    "trialing",
                ].includes(subscriptionStatus);

                // Update vendor subscription
                if (isActive) {
                    const userResult = await db.collection("user").updateOne(
                        {
                            email: vendorEmail,
                            role: "vendor",
                        },
                        {
                            $set: {
                                subscriptionPlan: "premium",
                                subscriptionStatus,
                                stripeCustomerId:
                                    typeof checkout.customer === "string"
                                        ? checkout.customer
                                        : checkout.customer?.id,
                                stripeSubscriptionId: subscriptionId,
                                updatedAt: new Date(),
                            },
                        }
                    );

                    console.log("Vendor subscription update:", {
                        matchedCount: userResult.matchedCount,
                        modifiedCount: userResult.modifiedCount,
                    });
                }

                // Create payment record (idempotent)
                const paymentData = {
                    vendorId,
                    vendorEmail,

                    amount: checkout.amount_total,
                    currency: checkout.currency,

                    paymentStatus: checkout.payment_status,

                    stripeSessionId: checkout.id,

                    stripePaymentIntent:
                        typeof checkout.payment_intent === "string"
                            ? checkout.payment_intent
                            : checkout.payment_intent?.id || null,

                    stripeCustomerId:
                        typeof checkout.customer === "string"
                            ? checkout.customer
                            : checkout.customer?.id || null,

                    stripeSubscriptionId: subscriptionId || null,

                    createdAt: new Date(),
                };

                const paymentResult = await db.collection("payments").updateOne(
                    {
                        stripeSessionId: checkout.id,
                    },
                    {
                        $setOnInsert: paymentData,
                    },
                    {
                        upsert: true,
                    }
                );

                console.log("Payment record result:", {
                    stripeSessionId: checkout.id,
                    matchedCount: paymentResult.matchedCount,
                    modifiedCount: paymentResult.modifiedCount,
                    upsertedId: paymentResult.upsertedId,
                    paymentStatus: checkout.payment_status,
                    amount: checkout.amount_total,
                });

                console.log(`Checkout processed for ${vendorEmail}`);

                break;
            }

            // Subscription status changes
            case "customer.subscription.updated": {
                const subscription = event.data.object;

                const vendorEmail =
                    subscription.metadata?.vendorEmail;

                if (!vendorEmail) {
                    console.error(
                        "Vendor email missing in subscription metadata."
                    );
                    break;
                }

                const active = [
                    "active",
                    "trialing",
                ].includes(subscription.status);

                await db.collection("user").updateOne(
                    {
                        email: vendorEmail,
                        role: "vendor",
                    },
                    {
                        $set: {
                            subscriptionPlan: active ? "premium" : "free",
                            subscriptionStatus: subscription.status,
                            stripeSubscriptionId: subscription.id,
                            updatedAt: new Date(),
                        },
                    }
                );

                console.log(
                    `Subscription updated for ${vendorEmail}: ${subscription.status}`
                );

                break;
            }

            // Subscription canceled or deleted
            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                const vendorEmail =
                    subscription.metadata?.vendorEmail;

                if (!vendorEmail) {
                    console.error(
                        "Vendor email missing in deleted subscription metadata."
                    );
                    break;
                }

                await db.collection("user").updateOne(
                    {
                        email: vendorEmail,
                        role: "vendor",
                    },
                    {
                        $set: {
                            subscriptionPlan: "free",
                            subscriptionStatus: "canceled",
                            stripeSubscriptionId: null,
                            updatedAt: new Date(),
                        },
                    }
                );

                console.log(
                    `Subscription canceled for ${vendorEmail}`
                );

                break;
            }

            default:
                console.log(`Unhandled Stripe event: ${event.type}`);
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
