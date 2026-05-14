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
} from "@shopify/polaris";
import { useState } from "react";
import { CheckIcon } from "@shopify/polaris-icons";
import { useLoaderData, useFetcher } from "react-router-dom";
import { authenticate } from "../shopify.server";
import "../index.css";

const apiUrl = process.env.PUBLIC_REACT_APP_API_URL;

const savePlan = (shop, plan, price, subscriptionId, status) =>
    fetch(`${apiUrl}/api/shop-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan, price, subscriptionId, status }),
    });

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

// ─── Loader ──────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop;

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
    const subscriptions = data?.data?.currentAppInstallation?.activeSubscriptions || [];
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

    await savePlan(shop, activePlan, activePrice, activeSubscriptionId, "active");

    const dbRes = await fetch(`${apiUrl}/api/shop-plan?shop=${encodeURIComponent(shop)}`);
    const dbData = await dbRes.json();

    return Response.json({ activePlan, dbRecord: dbData.data });
};

// ─── Action ──────────────────────────────────────────────────────────────────

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("_action");

    // ── Cancel current plan ──────────────────────────────────────────
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

        await savePlan(session.shop, "free", 0, null, "active");
        return Response.json({ cancelled: true });
    }

    // ── Upgrade / switch plan ────────────────────────────────────────
    const selectedPlan = formData.get("plan");
    const priceMap = { starter: "9.00", growth: "29.00" };
    const price = priceMap[selectedPlan];
    if (!price) return Response.json({ error: "Invalid plan" }, { status: 400 });

    const returnUrl = `https://${session.shop}/admin/apps/cart-drawer-52/app/pricing`;

    // Cancel any existing active subscriptions first
    const existingRes = await admin.graphql(`
        query {
            currentAppInstallation {
                activeSubscriptions { id status }
            }
        }
    `);
    const existingData = await existingRes.json();
    const activeSubscriptions =
        existingData?.data?.currentAppInstallation?.activeSubscriptions?.filter(
            (s) => s.status === "ACTIVE"
        ) || [];

    for (const sub of activeSubscriptions) {
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
        await savePlan(session.shop, selectedPlan, parseFloat(price), subscriptionId, "pending");
        return Response.json({ confirmationUrl });
    }

    return Response.json({ error: "No confirmation URL returned" }, { status: 500 });
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Pricing() {
    const { activePlan } = useLoaderData();

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
                    >
                        {PLANS.map((plan) => (
                            <PricingCard key={plan.id} plan={plan} activePlan={activePlan} />
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

function PricingCard({ plan, activePlan }) {
    const fetcher = useFetcher();
    const [redirecting, setRedirecting] = useState(false);
    const isActive = activePlan === plan.id;
    const isHighlighted = plan.badge === "Popular";
    const isLoading = fetcher.state !== "idle" || redirecting;
    const onPaidPlan = activePlan !== "free";

    if (fetcher.data?.confirmationUrl && !redirecting) {
        setRedirecting(true);
        window.top.location.href = fetcher.data.confirmationUrl;
    }

    return (
        <div
            style={{
                border: isHighlighted ? "2px solid #008060" : "1px solid #e1e3e5",
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                position: "relative",
            }}
        >
            {plan.badge && (
                <div style={{ position: "absolute", top: "-12px", left: "20px" }}>
                    <Badge tone={plan.badge === "Popular" ? "success" : "info"}>
                        {plan.badge}
                    </Badge>
                </div>
            )}

            <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                    {plan.name}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                    {plan.description}
                </Text>
            </BlockStack>

            <InlineStack gap="100" blockAlign="end">
                <Text as="p" variant="heading2xl" fontWeight="bold">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                </Text>
                {plan.price > 0 && (
                    <Text as="p" variant="bodySm" tone="subdued">
                        / {plan.period}
                    </Text>
                )}
            </InlineStack>

            <Divider />

            <BlockStack gap="200">
                {plan.features.map((feature) => (
                    <InlineStack key={feature} gap="200" blockAlign="center">
                        <Box>
                            <Icon source={CheckIcon} tone="success" />
                        </Box>
                        <Text as="p" variant="bodySm">
                            {feature}
                        </Text>
                    </InlineStack>
                ))}
            </BlockStack>

            <div style={{ marginTop: "auto" }}>
                {/* Free plan card */}
                {plan.id === "free" && (
                    onPaidPlan ? (
                        <fetcher.Form method="post">
                            <input type="hidden" name="_action" value="cancel" />
                            <Button fullWidth variant="secondary" submit loading={isLoading} tone="critical">
                                Choose plan
                            </Button>
                        </fetcher.Form>
                    ) : (
                        <Button fullWidth disabled>Current plan</Button>
                    )
                )}

                {/* Paid plan card — currently active */}
                {plan.id !== "free" && isActive && (
                    <Button fullWidth disabled>Current plan</Button>
                )}

                {/* Paid plan card — not active */}
                {plan.id !== "free" && !isActive && (
                    <fetcher.Form method="post">
                        <input type="hidden" name="_action" value="upgrade" />
                        <input type="hidden" name="plan" value={plan.id} />
                        <Button
                            fullWidth
                            variant={isHighlighted ? "primary" : "secondary"}
                            submit
                            loading={isLoading}
                        >
                            {plan.cta}
                        </Button>
                    </fetcher.Form>
                )}
            </div>
        </div>
    );
}

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
