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
    Spinner,
} from "@shopify/polaris";

import { CheckIcon } from "@shopify/polaris-icons";
import { useLoaderData, useFetcher } from "react-router-dom";
import { authenticate } from "../shopify.server";
import { redirect } from "react-router";
import axios from "axios";
import "../index.css";

const API_VERSION = "2026-01";

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
    const { session } = await authenticate.admin(request);
    const apiUrl = process.env.PUBLIC_REACT_APP_API_URL;
    const secretKey = process.env.SHOPIFY_API_SECRET_KEY;
    const { shop, accessToken } = session;

    if (!shop || !accessToken) {
        return Response.json({ charges: [], activePlan: "free", shop, apiUrl, accessToken });
    }

    try {
        const response = await axios.get(
            `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        const charges = response.data.recurring_application_charges || [];
        const activeCharge = charges.find((c) => c.status === "active");
        const activePlan = activeCharge
            ? activeCharge.price === "9.00" || activeCharge.price === 9
                ? "starter"
                : "growth"
            : "free";

        return Response.json({ charges, activePlan, shop, apiUrl, accessToken });
    } catch (error) {
        console.error("Error fetching charges:", error.response?.data || error.message);
        return Response.json({ charges: [], activePlan: "free", shop, apiUrl, accessToken, error: true });
    }
};

// ─── Action ──────────────────────────────────────────────────────────────────

export const action = async ({ request }) => {
      const { session } = await authenticate.admin(request);
    const apiUrl = process.env.PUBLIC_REACT_APP_API_URL;
    const secretKey = process.env.SHOPIFY_API_SECRET_KEY;
    const { shop, accessToken } = session;

    const formData = await request.formData();
    const selectedPlan = formData.get("plan");

    const priceMap = { starter: "9.00", growth: "29.00" };
    const price = priceMap[selectedPlan];
    if (!price) return Response.json({ error: "Invalid plan" }, { status: 400 });

    const appUrl = process.env.SHOPIFY_APP_URL || "";
    const returnUrl = `${appUrl}/app/pricing`;

    const chargeData = {
        recurring_application_charge: {
            name: `Cart Drawer - ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
            price,
            return_url: returnUrl,
            interval: "every_30_days",
            trial_days: 7,
            test: true,
        },
    };

    try {
        // Cancel any existing active charges before creating a new one
        const existingRes = await axios.get(
            `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        const activeCharges = (existingRes.data.recurring_application_charges || []).filter(
            (c) => c.status === "active"
        );

        for (const charge of activeCharges) {
            await axios.delete(
                `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${charge.id}.json`,
                {
                    headers: {
                        "X-Shopify-Access-Token": accessToken,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const response = await axios.post(
            `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges.json`,
            chargeData,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        const confirmationUrl =
            response.data.recurring_application_charge?.confirmation_url;

        if (confirmationUrl) {
            return redirect(confirmationUrl);
        }

        return Response.json({ error: "No confirmation URL returned" }, { status: 500 });
    } catch (error) {
        console.error("Error creating charge:", error.response?.data || error.message);
        return Response.json(
            { error: error.response?.data || error.message },
            { status: 500 }
        );
    }
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Pricing() {
    const { activePlan, error } = useLoaderData();

    return (
        <Page
            title="Pricing"
            subtitle="Choose the plan that works best for your store"
        >
            <Layout>
                {error && (
                    <Layout.Section>
                        <Banner tone="warning">
                            <Text as="p" variant="bodyMd">
                                Could not fetch your current billing status. Please refresh the page.
                            </Text>
                        </Banner>
                    </Layout.Section>
                )}

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
    const isActive = activePlan === plan.id;
    const isHighlighted = plan.badge === "Popular";
    const isLoading = fetcher.state !== "idle";

    const ctaLabel = isActive
        ? "Current plan"
        : plan.id === "free"
        ? "Downgrade to Free"
        : plan.cta;

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
                {plan.id === "free" || isActive ? (
                    <Button fullWidth disabled>
                        {ctaLabel}
                    </Button>
                ) : (
                    <fetcher.Form method="post">
                        <input type="hidden" name="plan" value={plan.id} />
                        <Button
                            fullWidth
                            variant={isHighlighted ? "primary" : "secondary"}
                            submit
                            loading={isLoading}
                            tone={plan.tone === "success" ? "success" : undefined}
                        >
                            {ctaLabel}
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
        a: "All paid plans come with a 14-day free trial. No credit card required to start.",
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
