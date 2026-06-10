import {
    Page,
    Card,
    Layout,
    Text,
    InlineStack,
    BlockStack,
    Badge,
    Button,
    Divider,
    Box,
    Icon,
    Banner,
    SkeletonBodyText,
    SkeletonDisplayText,
} from "@shopify/polaris";

import { useState, Suspense } from "react";
import { CheckIcon } from "@shopify/polaris-icons";
import { useLoaderData, useFetcher, Await } from "react-router-dom";
import { authenticate } from "../shopify.server";
import "../index.css";
import { shopLoader } from "./components/shop.server";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: 0,
        period: "forever",
        badge: null,
        description: "Perfect for getting started",
        cta: "Current plan",
        tone: null,
        features: [
            "1 cart drawer",
            "Basic design customization",
            "Cart announcements",
            "Email support",
        ],
    },
    {
        id: "starter",
        name: "Starter",
        price: 9,
        period: "month",
        badge: "Popular",
        description: "For growing stores",
        cta: "Upgrade to Starter",
        tone: "success",
        features: [
            "3 cart drawers",
            "Advanced design customization",
            "Tiered rewards",
            "Upsells & cross-sells",
            "Trust badges",
            "Priority email support",
        ],
    },
    {
        id: "growth",
        name: "Growth",
        price: 29,
        period: "month",
        badge: "Best value",
        description: "For scaling businesses",
        cta: "Upgrade to Growth",
        tone: null,
        features: [
            "Unlimited cart drawers",
            "Everything in Starter",
            "Sticky cart button",
            "Express payments",
            "Discount codes",
            "Add-ons & subscriptions",
            "Custom HTML blocks",
            "Live chat support",
        ],
    },
];

const FAQ = [
    {
        q: "Can I change plans at any time?",
        a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.",
    },
    {
        q: "Is there a free trial?",
        a: "All paid plans come with a 7-day free trial. No credit card required to start.",
    },
    {
        q: "What happens to my carts if I downgrade?",
        a: "Your carts remain intact but only the number allowed by your plan will be active. The rest will be paused.",
    },
    {
        q: "Do you offer annual billing?",
        a: "Yes, annual billing is available with a 20% discount. Contact support to switch.",
    },
];

// ─── API key helper (server-side: read from process.env) ─────────────────────

const apiAuthHeaders = (extra = {}) => ({
    "x-api-key": process.env.API_SECRET_KEY || "",
    ...extra,
});


// ─── Helper ───────────────────────────────────────────────────────────────────

const savePlan = (apiUrl, shop, plan, price, subscriptionId, status) =>
    fetch(`${apiUrl}/api/shop-plan`, {
        method: "POST",
        headers: apiAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ shop, plan, price, subscriptionId, status }),
    });

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
    const { shop, apiUrl, admin } = await shopLoader(request);
    const shopDomain = shop?.myshopifyDomain;

    const dataPromise = (async () => {
        const res = await admin.graphql(`
            query {
                currentAppInstallation {
                    activeSubscriptions {
                        id
                        name
                        status
                        lineItems {
                            plan {
                                pricingDetails {
                                    ... on AppRecurringPricing {
                                        price { amount }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);

        const data = await res.json();
        const subscriptions =
            data?.data?.currentAppInstallation?.activeSubscriptions || [];
        const active = subscriptions.find((s) => s.status === "ACTIVE");

        let activePlan = "free";
        let activePrice = 0;
        let activeSubscriptionId = null;

        if (active) {
            const amount = parseFloat(
                active.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || 0
            );
            activePlan = amount <= 9 ? "starter" : "growth";
            activePrice = amount;
            activeSubscriptionId = active.id;
        }

        savePlan(apiUrl, shopDomain, activePlan, activePrice, activeSubscriptionId, "active")
            .catch((e) => console.error("savePlan error:", e));

        const dbRes = await fetch(
            `${apiUrl}/api/shop-plan?shop=${encodeURIComponent(shopDomain)}`,
            { headers: apiAuthHeaders() },
        );

        const dbData = await dbRes.json();

        return { activePlan, apiUrl, dbRecord: dbData.data };
    })();

    return { dataPromise };
};

// ─── Action ───────────────────────────────────────────────────────────────────

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();
    const formData = await request.formData();
    const actionType = formData.get("_action");

    if (actionType === "cancel") {
        const existingRes = await admin.graphql(`
            query {
                currentAppInstallation {
                    activeSubscriptions { id status }
                }
            }
        `);
        const existingData = await existingRes.json();
        const toCancel =
            existingData?.data?.currentAppInstallation?.activeSubscriptions?.filter(
                (s) => s.status === "ACTIVE"
            ) || [];

        for (const sub of toCancel) {
            await admin.graphql(
                `mutation AppSubscriptionCancel($id: ID!) {
                    appSubscriptionCancel(id: $id) {
                        userErrors { field message }
                        appSubscription { id status }
                    }
                }`,
                { variables: { id: sub.id } }
            );
        }

        await savePlan(apiUrl, session.shop, "free", 0, null, "active");
        return Response.json({ cancelled: true });
    }

    const selectedPlan = formData.get("plan");
    const priceMap = { starter: "9.00", growth: "29.00" };
    const price = priceMap[selectedPlan];
    if (!price) return Response.json({ error: "Invalid plan" }, { status: 400 });

    const returnUrl = `https://${session.shop}/admin/apps/cart-drawer-52/app/pricing?upgraded=${selectedPlan}`;

    const createRes = await admin.graphql(
        `mutation AppSubscriptionCreate(
            $name: String!
            $returnUrl: URL!
            $lineItems: [AppSubscriptionLineItemInput!]!
            $trialDays: Int
            $test: Boolean
        ) {
            appSubscriptionCreate(
                name: $name
                returnUrl: $returnUrl
                lineItems: $lineItems
                trialDays: $trialDays
                test: $test
            ) {
                userErrors { field message }
                confirmationUrl
                appSubscription { id status }
            }
        }`,
        {
            variables: {
                name: `Cart Drawer - ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
                returnUrl,
                trialDays: 7,
                test: true,
                lineItems: [
                    {
                        plan: {
                            appRecurringPricingDetails: {
                                price: { amount: price, currencyCode: "USD" },
                                interval: "EVERY_30_DAYS",
                            },
                        },
                    },
                ],
            },
        }
    );

    const createData = await createRes.json();
    const result = createData?.data?.appSubscriptionCreate;

    if (result?.userErrors?.length > 0) {
        console.error("Subscription errors:", result.userErrors);
        return Response.json({ error: result.userErrors }, { status: 500 });
    }

    const confirmationUrl = result?.confirmationUrl;
    const subscriptionId = result?.appSubscription?.id;

    if (confirmationUrl) {
        await savePlan(apiUrl, session.shop, selectedPlan, parseFloat(price), subscriptionId, "pending");
        return Response.json({ confirmationUrl });
    }

    return Response.json({ error: "No confirmation URL returned" }, { status: 500 });
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PricingSkeleton() {
    return (
        <Page title="Pricing" subtitle="Choose the plan that works best for your store">
            <Layout>
                <Layout.Section>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "16px",
                        }}
                    >
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    border: "1px solid #e1e3e5",
                                    borderRadius: "12px",
                                    padding: "24px",
                                    backgroundColor: "#fff",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                }}
                            >
                                <SkeletonDisplayText size="small" />
                                <SkeletonBodyText lines={5} />
                            </div>
                        ))}
                    </div>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function Pricing() {
    const { dataPromise } = useLoaderData();

    return (
        <Suspense fallback={<PricingSkeleton />}>
            <Await resolve={dataPromise} errorElement={<PricingSkeleton />}>
                {(data) => <PricingInner activePlan={data.activePlan} />}
            </Await>
        </Suspense>
    );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function PricingInner({ activePlan }) {
    const [anyHovered, setAnyHovered] = useState(false);

    return (
        <Page
            title="Pricing"
            subtitle="Choose the plan that works best for your store"
        >
            <Layout>
                {activePlan !== "free" && (
                    <Layout.Section>
                        <Banner tone="success">
                            <Text as="p" variant="bodyMd">
                                You are on the{" "}
                                <strong>
                                    {PLANS.find((p) => p.id === activePlan)?.name} plan
                                </strong>
                                . Thank you for subscribing!
                            </Text>
                        </Banner>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "16px",
                        }}
                        onMouseLeave={() => setAnyHovered(false)}
                    >
                        {PLANS.map((plan) => (
                            <PricingCard
                                key={plan.id}
                                plan={plan}
                                activePlan={activePlan}
                                onCardHover={setAnyHovered}
                                anyHovered={anyHovered}
                            />
                        ))}
                    </div>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="300">
                            <Text as="h2" variant="headingMd">
                                Frequently asked questions
                            </Text>
                            <Divider />
                            {FAQ.map((item) => (
                                <BlockStack key={item.q} gap="100">
                                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                                        {item.q}
                                    </Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        {item.a}
                                    </Text>
                                </BlockStack>
                            ))}
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({ plan, activePlan, onCardHover, anyHovered }) {
    const fetcher = useFetcher();
    const [redirecting, setRedirecting] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const isActive = activePlan === plan.id;
    const isLoading = fetcher.state !== "idle" || redirecting;
    const onPaidPlan = activePlan !== "free";

    const activePlanData = PLANS.find((p) => p.id === activePlan);
    const isDowngrade = plan.price < (activePlanData?.price ?? 0);

    if (fetcher.data?.confirmationUrl && !redirecting) {
        setRedirecting(true);
        window.top.location.href = fetcher.data.confirmationUrl;
    }

    const getBorder = () => {
        if (isActive) return (anyHovered && !hovered) ? "2px solid #e1e3e5" : "2px solid #FD6802";
        return hovered ? "2px solid #FD6802" : "2px solid #e1e3e5";
    };

    // Called when user clicks a downgrade button — shows modal instead of submitting
    const handleDowngradeClick = () => setShowDowngradeModal(true);

    // Called when user confirms in modal — submits the hidden form
    const confirmDowngrade = () => {
        setShowDowngradeModal(false);
        document.getElementById(`downgrade-form-${plan.id}`)?.requestSubmit();
    };

    return (
        <>
            {/* ── Downgrade confirmation modal ── */}
            {showDowngradeModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                    }}
                    onClick={() => setShowDowngradeModal(false)}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "12px",
                            padding: "24px",
                            maxWidth: "400px",
                            width: "90%",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <BlockStack gap="400">
                            <BlockStack gap="100">
                                <Text as="h2" variant="headingMd">
                                    Downgrade to {plan.name}?
                                </Text>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                    {plan.id === "free"
                                        ? "You'll lose access to all paid features. Cart drawers beyond the free limit will be paused."
                                        : `You'll lose access to Growth-only features. Any extras beyond the ${plan.name} plan limits will be paused.`}
                                </Text>
                            </BlockStack>
                            <Divider />
                            <InlineStack gap="200" align="end">
                                <Button onClick={() => setShowDowngradeModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    tone="critical"
                                    onClick={confirmDowngrade}
                                    loading={isLoading}
                                >
                                    Yes, downgrade
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </div>
                </div>
            )}

            {/* ── Card ── */}
            <div
                onMouseEnter={() => { setHovered(true); onCardHover(true); }}
                onMouseLeave={() => setHovered(false)}
                style={{
                    border: getBorder(),
                    borderRadius: "12px",
                    padding: "24px",
                    backgroundColor: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    position: "relative",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease",
                }}
            >
                {plan.badge && (
                    <div style={{ position: "absolute", top: "-12px", left: "20px" }}>
                        <Badge tone={plan.badge === "Popular" ? "success" : "info"}>{plan.badge}</Badge>
                    </div>
                )}
                {isActive && (
                    <div style={{ position: "absolute", top: "-12px", right: "20px" }} className="badge-orange">
                        <Badge tone="info">Active plan</Badge>
                    </div>
                )}

                <BlockStack gap="100">
                    <Text as="h3" variant="headingMd">{plan.name}</Text>
                    <Text as="p" variant="bodySm" tone="subdued">{plan.description}</Text>
                </BlockStack>

                <InlineStack gap="100" blockAlign="end">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                        {plan.price === 0 ? "Free" : `$${plan.price}`}
                    </Text>
                    {plan.price > 0 && (
                        <Text as="p" variant="bodySm" tone="subdued">/ {plan.period}</Text>
                    )}
                </InlineStack>

                <Divider />

                <BlockStack gap="200">
                    {plan.features.map((feature) => (
                        <InlineStack key={feature} gap="200" blockAlign="center">
                            <Box>
                                <span style={{
                                    background: plan.id === "free" ? "#f0f0f0" : plan.id === "starter" ? "#e6f4f0" : "#eff6ff",
                                    color: plan.id === "free" ? "#8c9196" : plan.id === "starter" ? "#008060" : "#2563eb",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: "22px", height: "22px", borderRadius: "100px",
                                }}>
                                    <Icon source={CheckIcon} />
                                </span>
                            </Box>
                            <Text as="p" variant="bodySm">{feature}</Text>
                        </InlineStack>
                    ))}
                </BlockStack>

                <div style={{ marginTop: "auto" }}>
                    {/* Free plan */}
                    {plan.id === "free" && (
                        onPaidPlan ? (
                            <>
                                {/* Hidden form — submitted programmatically after modal confirm */}
                                <fetcher.Form
                                    id={`downgrade-form-${plan.id}`}
                                    method="post"
                                    style={{ display: "none" }}
                                >
                                    <input type="hidden" name="_action" value="cancel" />
                                </fetcher.Form>
                                <Button
                                    fullWidth
                                    variant="secondary"
                                    tone="critical"
                                    loading={isLoading}
                                    onClick={handleDowngradeClick}
                                >
                                    Downgrade to Free
                                </Button>
                            </>
                        ) : (
                            <Button fullWidth disabled>Current plan</Button>
                        )
                    )}

                    {/* Paid plan — currently active */}
                    {plan.id !== "free" && isActive && (
                        <Button fullWidth disabled>Current plan</Button>
                    )}

                    {/* Paid plan — not active */}
                    {plan.id !== "free" && !isActive && (
                        isDowngrade ? (
                            <>
                                <fetcher.Form
                                    id={`downgrade-form-${plan.id}`}
                                    method="post"
                                    style={{ display: "none" }}
                                >
                                    <input type="hidden" name="_action" value="upgrade" />
                                    <input type="hidden" name="plan" value={plan.id} />
                                </fetcher.Form>
                                <Button
                                    fullWidth
                                    variant="primary"
                                    loading={isLoading}
                                    onClick={handleDowngradeClick}
                                >
                                    {plan.cta}
                                </Button>
                            </>
                        ) : (
                            <fetcher.Form method="post">
                                <input type="hidden" name="_action" value="upgrade" />
                                <input type="hidden" name="plan" value={plan.id} />
                                <Button fullWidth variant="primary" submit loading={isLoading}>
                                    {plan.cta}
                                </Button>
                            </fetcher.Form>
                        )
                    )}
                </div>
            </div>
        </>
    );
}