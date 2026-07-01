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

import { useState, useEffect, Suspense } from "react";
import { CheckIcon} from "@shopify/polaris-icons";
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
            "Dev & Partner Only",
        ],
    },
    {
        id: "starter",
        name: "Starter",
        price: 4.99,
        period: "month",
        badge: "Popular",
        description: "Up to 200 orders/mo",
        cta: "Upgrade to Starter",
        tone: "success",
        features: [
            "Up to 200 monthly store orders",
            "14 Day Trial",
            "Design Settings",
            "Announcements Module",
            "Upsells & cross-sells",
            "Reward Progress Bar",
            "Add-Ons Module",
            "Custom HTML and CSS",
        ],
    },
    {
        id: "growth",
        name: "Growth",
        price: 9.99,
        period: "month",
        badge: "Best value",
        description: "Up to 500 orders/mo",
        cta: "Upgrade to Growth",
        tone: null,
        features: [
            "Up to 500 monthly store orders",
            "14 Day Trial",
            "Design Settings",
            "Announcements Module",
            "Upsells & cross-sells",
            "Reward Progress Bar",
            "Add-Ons Module",
            "Custom HTML and CSS",
        ],
    },
    {
        id: "advance",
        name: "Advance",
        price: 14.99,
        period: "month",
        badge: "Premium",
        description: "Up to 1000 orders/mo",
        cta: "Upgrade to Advance",
        tone: null,
        features: [
            "Up to 1000 monthly store orders",
            "14 Day Trial",
            "Design Settings",
            "Announcements Module",
            "Upsells & cross-sells",
            "Reward Progress Bar",
            "Add-Ons Module",
            "Custom HTML and CSS",
        ],
    },

];

// Feature matrix rows for the "Compare plans" table. Each row maps a label
// to either a per-plan boolean (✓ / —) or a per-plan display value (e.g. order limits).
const COMPARE_ROWS = [
    {
        label: "Monthly orders",
        values: { free: "Dev & Partner Only", starter: "200", growth: "500", advance: "1000" },
    },
    { label: "14-day free trial", values: { free: false, starter: true, growth: true, advance: true } },
    { label: "Design settings", values: { free: false, starter: true, growth: true, advance: true } },
    { label: "Announcements module", values: { free: false, starter: true, growth: true, advance: true } },
    { label: "Upsells & cross-sells", values: { free: false, starter: true, growth: true, advance: true } },
    { label: "Reward progress bar", values: { free: false, starter: true, growth: true, advance: true } },
    { label: "Add-ons module", values: { free: false, starter: true, growth: true, advance: true } },
    { label: "Custom HTML & CSS", values: { free: false, starter: true, growth: true, advance: true } },
];

const FAQ = [
    {
        q: "Is there a free trial available?",
        a: "Yes, we offer a free trial so you can test all key features before choosing a paid plan.",
    },
    {
        q: "What happens if I switch plans?",
        a: "When you upgrade or downgrade, your billing is automatically adjusted based on your new plan.",
    },
    {
        q: "Does the cart drawer work with all Shopify themes?",
        a: "Yes, our cart drawer is designed to be compatible with most Shopify themes.",
    },
];

// ─── API key helper (server-side: read from process.env) ─────────────────────

const apiAuthHeaders = (extra = {}) => ({
    "x-api-key": process.env.API_SECRET_KEY || "",
    ...extra,
});


// ─── Helper ───────────────────────────────────────────────────────────────────

const savePlan = (apiUrl, shop, plan, price, subscriptionId, status, isDev) =>
    fetch(`${apiUrl}/api/shop-plan`, {
        method: "POST",
        headers: apiAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ shop, plan, price, subscriptionId, status, isDev }),
    });

// ─── Loader ───────────────────────────────────────────────────────────────────

export const loader = async ({ request }) => {
    const { shop, apiUrl, admin } = await shopLoader(request);
    const shopDomain = shop?.myshopifyDomain;
    const isDev = shop?.plan?.partnerDevelopment || false;

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
            // Match the charged amount to the closest paid plan so all
            // tiers (starter / growth / advance …) resolve correctly.
            const matched = PLANS
                .filter((p) => p.price > 0)
                .sort((a, b) => Math.abs(a.price - amount) - Math.abs(b.price - amount))[0];
            activePlan = matched?.id || "starter";
            activePrice = amount;
            activeSubscriptionId = active.id;
        }

        savePlan(apiUrl, shopDomain, activePlan, activePrice, activeSubscriptionId, "active", isDev)
            .catch((e) => console.error("savePlan error:", e));

        const dbRes = await fetch(
            `${apiUrl}/api/shop-plan?shop=${encodeURIComponent(shopDomain)}`,
            { headers: apiAuthHeaders() },
        );

        const dbData = await dbRes.json();

        return { activePlan, apiUrl, dbRecord: dbData.data, isDev };
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
    // Price comes straight from the PLANS definition so the four tiers stay
    // in sync with what the merchant sees on the page.
    const planDef = PLANS.find((p) => p.id === selectedPlan && p.price > 0);
    if (!planDef) return Response.json({ error: "Invalid plan" }, { status: 400 });
    const price = planDef.price.toFixed(2);

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
                trialDays: 14,
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
                    <Card>
                        <BlockStack gap="400">
                            <SkeletonDisplayText size="small" />
                            <SkeletonBodyText lines={6} />
                        </BlockStack>
                    </Card>
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
                {(data) => <PricingInner activePlan={data.activePlan} isDev={data.isDev} />}
            </Await>
        </Suspense>
    );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function PricingInner({ activePlan, isDev }) {
    const [plansVisible, setPlansVisible] = useState(true);
    const fetcher = useFetcher();
    const [redirecting, setRedirecting] = useState(false);
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [pendingPlan, setPendingPlan] = useState(null);

    // Tracks WHICH plan row triggered the current fetcher submission, so only
    // that row shows a spinner instead of every button on the page.
    const [pendingPlanId, setPendingPlanId] = useState(null);

    const isLoading = fetcher.state !== "idle" || redirecting;
    const activePlanData = PLANS.find((p) => p.id === activePlan);

    // Side effects must live in useEffect, not in the render body.
    useEffect(() => {
        if (fetcher.data?.confirmationUrl && !redirecting) {
            setRedirecting(true);
            window.top.location.href = fetcher.data.confirmationUrl;
        }
    }, [fetcher.data, redirecting]);

    // Reset the "which row is loading" marker once the fetcher goes idle again
    // (e.g. request finished, errored, or was a no-op).
    useEffect(() => {
        if (fetcher.state === "idle" && !redirecting) {
            setPendingPlanId(null);
        }
    }, [fetcher.state, redirecting]);

    // Called when a row button is clicked — either submits directly (upgrade)
    // or opens the confirmation modal first (downgrade / move to free).
    const handlePlanAction = (plan) => {
        const isDowngrade = plan.id === "free" || plan.price < (activePlanData?.price ?? 0);
        if (isDowngrade) {
            setPendingPlan(plan);
            setShowDowngradeModal(true);
        } else {
            setPendingPlanId(plan.id);
            fetcher.submit(
                { _action: "upgrade", plan: plan.id },
                { method: "post" }
            );
        }
    };

    const confirmDowngrade = () => {
        setShowDowngradeModal(false);
        if (!pendingPlan) return;
        setPendingPlanId(pendingPlan.id);
        if (pendingPlan.id === "free") {
            fetcher.submit({ _action: "cancel" }, { method: "post" });
        } else {
            fetcher.submit(
                { _action: "upgrade", plan: pendingPlan.id },
                { method: "post" }
            );
        }
    };

    const renderRowButton = (plan) => {
        const isActive = activePlan === plan.id;

        const thisRowLoading = isLoading && pendingPlanId === plan.id;
        const otherRowBusy = isLoading && pendingPlanId !== plan.id;

        if (isActive) {
            return <Button disabled>Current plan</Button>;
        }

        if (plan.id === "free") {
            const onPaidPlan = activePlan !== "free";
            if (!onPaidPlan) return <Button disabled>Current plan</Button>;
            return (
                <Button
                    tone="critical"
                    variant="secondary"
                    loading={thisRowLoading}
                    disabled={otherRowBusy}
                    onClick={() => handlePlanAction(plan)}
                >
                    Downgrade to Free
                </Button>
            );
        }

        const isDowngrade = plan.price < (activePlanData?.price ?? 0);
        return (
            <Button
                variant="primary"
                loading={thisRowLoading}
                disabled={otherRowBusy}
                onClick={() => handlePlanAction(plan)}
            >
                {isDowngrade ? `Downgrade to ${plan.name}` : plan.cta}
            </Button>
        );
    };

    return (
        <Page
            title="Pricing"
            subtitle="Choose the plan that works best for your store"
        >
            <Layout>
                {isDev && activePlan === "free" && (
                    <Layout.Section>
                        <Banner tone="info">
                            <Text as="p" variant="bodyMd">
                                This is a <strong>development / partner store</strong>, so
                                all features are unlocked for free. On a live store the cart
                                drawer requires a paid plan.
                            </Text>
                        </Banner>
                    </Layout.Section>
                )}

                {activePlan !== "free" && (
                    <Layout.Section>
                        <Banner tone="success">
                            <Text as="p" variant="bodyMd">
                                You are on the{" "}
                                <strong>{activePlanData?.name} plan</strong>. Thank you for
                                subscribing!
                            </Text>
                        </Banner>
                    </Layout.Section>
                )}

                {/* ── Downgrade confirmation modal ── */}
                {showDowngradeModal && pendingPlan && (
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
                                        Downgrade to {pendingPlan.name}?
                                    </Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        {pendingPlan.id === "free"
                                            ? "You'll lose access to all paid features. Cart drawers beyond the free limit will be paused."
                                            : `You'll lose access to higher-tier features. Any extras beyond the ${pendingPlan.name} plan limits will be paused.`}
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

                {/* ── Choose plan card ── */}
                <Layout.Section>
                    <Card padding="0">
                        <Box padding="500">
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingLg">
                                    Choose plan
                                </Text>

                                {/* Plan rows table */}
                                {plansVisible && (
                                    <Box borderColor="border" borderWidth="025" borderRadius="200" overflowX="hidden">
                                        <Box padding="300" background="bg-surface-secondary">
                                            <InlineStack wrap={false} gap="400">
                                                <Box minWidth="180px">
                                                    <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                                                        Plan
                                                    </Text>
                                                </Box>
                                                <Box minWidth="240px">
                                                    <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                                                        Description
                                                    </Text>
                                                </Box>
                                                <Box minWidth="140px">
                                                    <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                                                        Price
                                                    </Text>
                                                </Box>
                                                <Box minWidth="200px" />
                                            </InlineStack>
                                        </Box>
                                        <Divider />
                                        <Box padding="300">
                                            <InlineStack
                                                wrap={false}
                                                gap="400"
                                                blockAlign="center"
                                                align="space-between"
                                            >
                                                <InlineStack wrap={false} gap="400" blockAlign="center">
                                                    <Box minWidth="180px">
                                                        <InlineStack gap="150" blockAlign="center">
                                                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                                                                Free
                                                            </Text>
                                                            {activePlan === "free" && (
                                                                <Badge tone="success">Active</Badge>
                                                            )}
                                                        </InlineStack>
                                                    </Box>
                                                    <Box minWidth="240px">
                                                        <Text as="span" variant="bodySm" tone="subdued">
                                                            Perfect for getting started
                                                        </Text>
                                                    </Box>
                                                    <Box minWidth="140px">
                                                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                                                            Free
                                                        </Text>
                                                    </Box>
                                                </InlineStack>
                                                {renderRowButton(PLANS.find((p) => p.id === "free"))}
                                            </InlineStack>
                                        </Box>
                                        <Divider />
                                        {PLANS.filter((p) => p.id !== "free").map((plan, idx) => (
                                            <Box key={plan.id}>
                                                {idx > 0 && <Divider />}
                                                <Box padding="300">
                                                    <InlineStack
                                                        wrap={false}
                                                        gap="400"
                                                        blockAlign="center"
                                                        align="space-between"
                                                    >
                                                        <InlineStack wrap={false} gap="400" blockAlign="center">
                                                            <Box minWidth="180px">
                                                                <InlineStack gap="150" blockAlign="center">
                                                                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                                                                        {plan.name}
                                                                    </Text>
                                                                    {activePlan === plan.id && (
                                                                        <Badge tone="success">Active</Badge>
                                                                    )}
                                                                    {activePlan !== plan.id && plan.badge && (
                                                                        <span
                                                                            style={{
                                                                                display: "inline-block",
                                                                                padding: "2px 8px",
                                                                                borderRadius: "12px",
                                                                                fontSize: "12px",
                                                                                fontWeight: 500,
                                                                                background:
                                                                                    plan.badge === "Popular"
                                                                                        ? "#D1FAE5"
                                                                                        : plan.badge === "Recommended"
                                                                                            ? "#DBEAFE"
                                                                                            : plan.badge === "Premium"
                                                                                                ? "#FEF3C7"
                                                                                                : "#F3F4F6",
                                                                                color:
                                                                                    plan.badge === "Popular"
                                                                                        ? "#065F46"
                                                                                        : plan.badge === "Recommended"
                                                                                            ? "#1D4ED8"
                                                                                            : plan.badge === "Premium"
                                                                                                ? "#92400E"
                                                                                                : "#6B7280",
                                                                            }}
                                                                        >
                                                                            {plan.badge}
                                                                        </span>
                                                                    )}
                                                                </InlineStack>
                                                            </Box>
                                                            <Box minWidth="240px">
                                                                <Text as="span" variant="bodySm" tone="subdued">
                                                                    {plan.description}
                                                                </Text>
                                                            </Box>
                                                            <Box minWidth="140px">
                                                                <Text as="span" variant="bodyMd" fontWeight="semibold">
                                                                    ${plan.price.toFixed(2)}/mo
                                                                </Text>
                                                            </Box>
                                                        </InlineStack>
                                                        {renderRowButton(plan)}
                                                    </InlineStack>
                                                </Box>
                                            </Box>
                                        ))}

                                    </Box>
                                )}
                            </BlockStack>
                        </Box>
                    </Card>
                </Layout.Section>

                {/* ── Compare plans ── */}
                <Layout.Section>
                    <Card padding="0">
                        <Box padding="500">
                            <BlockStack gap="400">
                                <Text as="h2" variant="headingLg">
                                    Compare plans
                                </Text>
                                <Box borderColor="border" borderWidth="025" borderRadius="200" overflowX="auto">
                                    <Box padding="300" background="bg-surface-secondary">
                                        <InlineStack wrap={false} gap="400" align="space-between">
                                            <Box minWidth="200px">
                                                <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                                                    Feature
                                                </Text>
                                            </Box>
                                            {PLANS.map((plan) => (
                                                <Box key={plan.id} minWidth="100px">
                                                    <InlineStack align="center">
                                                        <Text
                                                            as="span"
                                                            variant="bodySm"
                                                            fontWeight="semibold"
                                                            tone={activePlan === plan.id ? undefined : "subdued"}
                                                        >
                                                            {plan.name}
                                                        </Text>
                                                    </InlineStack>
                                                </Box>
                                            ))}
                                        </InlineStack>
                                    </Box>
                                    <Divider />
                                    {COMPARE_ROWS.map((row, idx) => (
                                        <Box key={row.label}>
                                            {idx > 0 && <Divider />}
                                            <Box padding="300">
                                                <InlineStack wrap={false} gap="400" align="space-between" blockAlign="center">
                                                    <Box minWidth="200px">
                                                        <Text as="span" variant="bodySm">
                                                            {row.label}
                                                        </Text>
                                                    </Box>
                                                    {PLANS.map((plan) => {
                                                        const val = row.values[plan.id];
                                                        return (
                                                            <Box key={plan.id} minWidth="100px">
                                                                <InlineStack align="center">
                                                                    {typeof val === "boolean" ? (
                                                                        val ? (
                                                                            <Icon source={CheckIcon} tone="success" />
                                                                        ) : (
                                                                            <Text as="span" tone="subdued">—</Text>
                                                                        )
                                                                    ) : (
                                                                        <div style={{ whiteSpace: "nowrap" }}>
                                                                            <Text as="span" variant="bodySm" fontWeight="semibold">
                                                                                {val}
                                                                            </Text>
                                                                        </div>
                                                                    )}
                                                                </InlineStack>
                                                            </Box>
                                                        );
                                                    })}
                                                </InlineStack>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </BlockStack>
                        </Box>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingLg">
                                Frequently asked questions
                            </Text>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: "24px",
                            }}>
                                {FAQ.map((item) => (
                                    <BlockStack key={item.q} gap="100">
                                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                                            {item.q}
                                        </Text>
                                        <Text as="p" variant="bodySm" tone="subdued">
                                            {item.a}
                                        </Text>
                                    </BlockStack>
                                ))}
                            </div>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}