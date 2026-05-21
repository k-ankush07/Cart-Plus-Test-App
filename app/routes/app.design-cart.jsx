import { useState } from "react";
import CartPreview from "./components/CartPreview";
import { Button, InlineStack } from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router-dom";
import { shopLoader } from "./components/shop.server";
import { createCart } from "../services/apiRoutes";
import {
    defaultSettings,
    defaultHeaderSettings,
    defaultAnnouncementSettings,
    defaultRewardsSettings,
    defaultRecommendationsSettings,
    defaultSubscriptionUpgradesSettings,
    defaultUpsellsSettings,
    defaultAdditionalNotesSettings,
    defaultAddonsSettings,
    defaultDiscountCodesSettings,
    defaultExpressPaymentsSettings,
    defaultTrustBadgesSettings,
    defaultCartSettings,
    defaultTriggeredRewardsSettings,
} from "../routes/components/constants/cartDefaults";

import {
    ViewIcon
} from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
    const { shop, apiUrl } = await shopLoader(request);
    return { shop, apiUrl };
};

const TEMPLATE_SETTINGS = {
    live: { backgroundColor: "#ffffff", textColor: "rgb(18,18,18)", buttonColor: "rgb(18,18,18)", buttonTextColor: "#ffffff", accentColor: "rgba(18,18,18,0.05)", buttonRadius: "2", announcementBg: "rgb(18,18,18)" },
    default: { backgroundColor: "#ffffff", textColor: "rgb(17,17,17)", buttonColor: "rgb(48,48,48)", buttonTextColor: "#ffffff", accentColor: "rgb(245,245,245)", buttonRadius: "0", announcementBg: "rgb(240,240,240)" },
    ivory: { backgroundColor: "rgb(245,243,240)", textColor: "rgb(36,21,16)", buttonColor: "rgb(36,21,16)", buttonTextColor: "rgb(245,243,240)", accentColor: "rgb(233,229,228)", buttonRadius: "0", announcementBg: "rgb(233,229,228)" },
    electric: { backgroundColor: "#ffffff", textColor: "rgb(0,26,100)", buttonColor: "rgb(0,58,221)", buttonTextColor: "rgb(222,242,64)", accentColor: "rgb(240,242,255)", buttonRadius: "0", announcementBg: "rgb(222,242,64)" },
    natural: { backgroundColor: "rgb(255,253,247)", textColor: "rgb(27,51,5)", buttonColor: "rgb(27,51,5)", buttonTextColor: "rgb(255,253,247)", accentColor: "rgb(245,242,233)", buttonRadius: "0", announcementBg: "rgb(242,168,85)" },
};

// ─── Template Definitions ──────────────────────────────────────────────────────

const TEMPLATES = [
    {
        id: "live",
        name: "Your Live Theme",
        font: "Inter",
        bg: "#ffffff",
        announcementBg: "rgb(18,18,18)",
        colors: { text: "rgb(18,18,18)", header: "rgb(18,18,18)", progress: "#ffffff", button: "rgb(18,18,18)", buttonText: "rgba(255,255,255,0.733)", body: "rgba(18,18,18,0.05)" },
        swatches: ["#ffffff", "rgb(18,18,18)", "rgb(18,18,18)", "#ffffff"],
    },
    {
        id: "default",
        name: "Default",
        font: "Inherits from theme",
        bg: "#ffffff",
        announcementBg: "rgb(240,240,240)",
        colors: { text: "rgb(17,17,17)", header: "rgb(240,240,240)", progress: "rgb(48,48,48)", button: "rgb(48,48,48)", buttonText: "rgba(255,255,255,0.733)", body: "rgb(245,245,245)" },
        swatches: ["#ffffff", "rgb(48,48,48)", "rgb(46,168,24)", "rgb(238,238,238)"],
    },
    {
        id: "ivory",
        name: "Ivory",
        font: "Inherits from theme",
        bg: "rgb(245,243,240)",
        announcementBg: "rgb(233,229,228)",
        colors: { text: "rgb(36,21,16)", header: "rgb(233,229,228)", progress: "rgb(36,21,16)", button: "rgb(36,21,16)", buttonText: "rgba(245,243,240,0.733)", body: "rgb(245,243,240)" },
        swatches: ["rgb(245,243,240)", "rgb(36,21,16)", "rgb(162,155,153)", "rgb(233,229,228)"],
    },
    {
        id: "electric",
        name: "Electric",
        font: "Inherits from theme",
        bg: "#ffffff",
        announcementBg: "rgb(222,242,64)",
        colors: { text: "rgb(0,26,100)", header: "rgb(222,242,64)", progress: "rgb(0,58,221)", button: "rgb(0,58,221)", buttonText: "rgba(222,242,64,0.733)", body: "#ffffff", rewardsBg: "rgb(240,242,255)" },
        swatches: ["#ffffff", "rgb(0,58,221)", "rgb(222,242,64)", "rgb(0,26,100)"],
    },
    {
        id: "natural",
        name: "Natural",
        font: "Inherits from theme",
        bg: "rgb(255,253,247)",
        announcementBg: "rgb(242,168,85)",
        colors: { text: "rgb(27,51,5)", header: "rgb(242,168,85)", progress: "rgb(57,82,29)", button: "rgb(27,51,5)", buttonText: "rgba(255,253,247,0.733)", body: "rgb(245,242,233)" },
        swatches: ["rgb(255,253,247)", "rgb(27,51,5)", "rgb(242,168,85)", "rgb(232,136,28)"],
    },
];

const MODULES = [
    {
        id: "upsells",
        name: "Upsells",
        desc: "Present targeted upsell offers to increase order value",
        img: "/images/templates/modules/upsells.png",
        defaultOn: false,
    },
    {
        id: "rewards",
        name: "Rewards",
        desc: "Incentivize customers to add more to their cart with reward tiers",
        img: "/images/templates/modules/rewards.png",
        defaultOn: false,
    },
    {
        id: "recommendations",
        name: "Recommendations",
        desc: "Show AI-powered product recommendations to boost AOV",
        img: "/images/templates/modules/recommendations.png",
        defaultOn: true,
    },
    {
        id: "addons",
        name: "Add ons",
        desc: "Let customers add complementary products with a single toggle",
        img: "/images/templates/modules/addons.png",
        defaultOn: true,
    },
    {
        id: "announcements",
        name: "Announcements",
        desc: "Display promotional banners and messages at the top of the cart",
        img: "/images/templates/modules/announcements.png",
        defaultOn: true,
    },
    {
        id: "subscriptions",
        name: "Subscriptions",
        desc: "Offer subscription upgrades directly in the cart drawer",
        img: "/images/templates/modules/subscriptions.png",
        defaultOn: true,
    },
];

function ModuleCard({ module, isActive, onToggle }) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(module.id)}
            style={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 10,
                border: !isActive ? "2px solid #303030" : "2px solid transparent",
                boxShadow: !isActive ? "0 0 0 1px #303030" : "0 0 0 1px #e1e3e5",
                transition: "box-shadow 0.15s, border-color 0.15s",
                background: "#fff",
                padding: "10px 12px",
                textAlign: "left",
            }}
        >
            {/* Thumbnail */}
            <div style={{
                width: 56, height: 56, borderRadius: 8,
                overflow: "hidden", flexShrink: 0,
                background: "#f6f6f7",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <img
                    src={module.img}
                    alt={module.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#303030" }}>{module.name}</span>
                <span style={{ fontSize: 11, color: "#6d7175", lineHeight: 1.4 }}>{module.desc}</span>
            </div>
        </button>
    );
}

// ─── Wireframe Preview ─────────────────────────────────────────────────────────

function WireframePreview({ template }) {
    const { bg, colors } = template;
    const textAlpha = (opacity) => colors.text.replace("rgb(", "rgba(").replace(")", `,${opacity})`);

    return (
        <div style={{
            width: 110, height: 200, background: bg,
            fontFamily: "system-ui, sans-serif", overflow: "hidden",
            display: "flex", flexDirection: "column", borderRadius: 4,
        }}>
            {/* Storefront bar */}
            <div style={{
                padding: "3px 4px", display: "flex", justifyContent: "space-between",
                alignItems: "center", borderBottom: `1px solid ${textAlpha(0.133)}`, flexShrink: 0,
            }}>
                <div style={{ width: 14, height: 3, borderRadius: 2, background: textAlpha(0.333) }} />
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: textAlpha(0.2) }} />
            </div>

            {/* Announcement / header bar */}
            <div style={{
                background: colors.header, padding: "2px 5px",
                display: "flex", justifyContent: "center", flexShrink: 0,
            }}>
                <div style={{ width: "60%", height: 2, borderRadius: 1, background: "rgba(128,128,128,0.35)" }} />
            </div>

            {/* Progress bar */}
            <div style={{ background: colors.rewardsBg || colors.header, padding: "3px 5px", flexShrink: 0 }}>
                <div style={{ height: 2, borderRadius: 2, overflow: "hidden", background: textAlpha(0.082) }}>
                    <div style={{ width: "55%", height: "100%", background: colors.progress }} />
                </div>
            </div>

            {/* Cart item row */}
            <div style={{
                padding: "4px 5px", display: "flex", gap: 4, alignItems: "center",
                borderBottom: `1px solid ${textAlpha(0.067)}`, flexShrink: 0,
            }}>
                <div style={{ width: 14, height: 14, borderRadius: 2, background: textAlpha(0.094), flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ height: 2, borderRadius: 2, background: textAlpha(0.267), width: "85%" }} />
                    <div style={{ height: 2, borderRadius: 2, background: textAlpha(0.157), width: "55%" }} />
                </div>
            </div>

            {/* Body space */}
            <div style={{ flex: 1, background: colors.body, minHeight: 0 }} />

            {/* Checkout button */}
            <div style={{ padding: "4px 5px", flexShrink: 0, background: bg }}>
                <div style={{
                    background: colors.button, borderRadius: template.id === "live" ? 2 : 0,
                    height: 12, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{ width: 24, height: 2, borderRadius: 2, background: colors.buttonText }} />
                </div>
            </div>
        </div>
    );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, isActive, onSelect }) {
    return (
        <button
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(template.id)}
            style={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                borderRadius: 10,
                overflow: "hidden",
                border: isActive ? "2px solid #303030" : "2px solid transparent",
                boxShadow: isActive ? "0 0 0 1px #303030" : "0 0 0 1px #e1e3e5",
                transition: "box-shadow 0.15s, border-color 0.15s",
                background: "#fff",
            }}
        >
            {/* Preview area */}
            <div style={{
                background: template.bg, padding: 12,
                display: "flex", justifyContent: "center", alignItems: "center",
                height: 160,
            }}>
                <WireframePreview template={template} />
            </div>

            {/* Info row */}
            <div style={{
                padding: "10px 12px", display: "flex",
                flexDirection: "column", gap: 4, borderTop: "1px solid #e1e3e5",
            }}>
                {/* Swatches */}
                <div style={{ display: "flex", gap: 4 }}>
                    {template.swatches.map((color, i) => (
                        <span key={i} style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: color, border: "1px solid rgba(0,0,0,0.1)",
                            display: "inline-block",
                        }} />
                    ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#303030" }}>{template.name}</span>
                <span style={{ fontSize: 11, color: "#6d7175" }}>{template.font}</span>
            </div>
        </button>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Designcart() {
    const { shop, apiUrl } = useLoaderData();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const [selectedTemplate, setSelectedTemplate] = useState("electric");
    const [activeModules, setActiveModules] = useState(
        () => new Set(MODULES.filter((m) => m.defaultOn).map((m) => m.id))
    );

    const toggleModule = (id) => {
        setActiveModules((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const mergedDesignSettings = {
        ...defaultSettings,
        ...TEMPLATE_SETTINGS[selectedTemplate],
    };

    const mergedAnnouncementSettings = {
        ...defaultAnnouncementSettings,
        enabled: activeModules.has("announcements"),
        backgroundColor: TEMPLATE_SETTINGS[selectedTemplate].announcementBg,
    };

    const mergedRewardsSettings = {
        ...defaultRewardsSettings,
        enabled: activeModules.has("rewards"),
    };

    const mergedRecommendationsSettings = {
        ...defaultRecommendationsSettings,
        enabled: activeModules.has("recommendations"),
    };

    const mergedUpsellsSettings = {
        ...defaultUpsellsSettings,
        enabled: activeModules.has("upsells"),
    };

    const mergedAddonsSettings = {
        ...defaultAddonsSettings,
        enabled: activeModules.has("addons"),
    };

    const mergedSubscriptionUpgradesSettings = {
        ...defaultSubscriptionUpgradesSettings,
        enabled: activeModules.has("subscriptions"),
    };

    const handleSaveAsDraft = () => {
        if (saving) return;
        setSaving(true);
        const tempCartId = "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
        navigate(`/app/cart-editor/${tempCartId}?from=design-cart`, { replace: true });
        createCart(apiUrl, {
            shop: shop.myshopifyDomain,
            shopEmail: shop.email,
            storeOwner: shop.name,
            cartId: tempCartId,
            designSettings: mergedDesignSettings,
            headerSettings: defaultHeaderSettings,
            announcementSettings: mergedAnnouncementSettings,
            rewardsSettings: mergedRewardsSettings,
            recommendationsSettings: mergedRecommendationsSettings,
            subscriptionUpgradesSettings: mergedSubscriptionUpgradesSettings,
            upsellsSettings: mergedUpsellsSettings,
            additionalNotesSettings: defaultAdditionalNotesSettings,
            addonsSettings: mergedAddonsSettings,
            discountCodesSettings: defaultDiscountCodesSettings,
            expressPaymentsSettings: defaultExpressPaymentsSettings,
            trustBadgesSettings: defaultTrustBadgesSettings,
            cartSettings: defaultCartSettings,
            triggeredRewardsSettings: defaultTriggeredRewardsSettings,
        })
            .then((data) => {
                if (data?.success) shopify.toast.show("Cart saved as draft");
            })
            .catch(() => { })
            .finally(() => setSaving(false));
    };

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

            <div style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid #e1e3e5",
            }}>

                <div style={{ flex: 1, padding: 32 }}>

                    {step === 1 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#303030" }}>
                                    Select a base style
                                </h2>
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6d7175" }}>
                                    Colours can be adjusted later in the cart editor — focus on the overall layout and feel.
                                </p>
                            </div>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                                gap: 12,
                            }}>
                                {TEMPLATES.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        isActive={selectedTemplate === template.id}
                                        onSelect={setSelectedTemplate}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#303030" }}>
                                    Recommended modules
                                </h2>
                                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6d7175" }}>
                                    Pick any modules to include in your cart — you can add or remove these at anytime later in the cart editor.
                                </p>
                            </div>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                                gap: 10,
                            }}>
                                {MODULES.map((module) => (
                                    <ModuleCard
                                        key={module.id}
                                        module={module}
                                        isActive={activeModules.has(module.id)}
                                        onToggle={toggleModule}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sticky footer inside left panel ── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "right",
                    padding: "12px 24px",
                    borderTop: "1px solid #e1e3e5",
                    background: "#fff",
                    flexShrink: 0,
                    gap: 20
                }}>
                    <span style={{ fontSize: 13, color: "#6d7175" }}>Step {step} of 2</span>
                    <InlineStack gap="200">
                        {step === 2 && (
                            <Button onClick={() => setStep(1)}>
                                Back
                            </Button>
                        )}
                        <Button
                            icon={ViewIcon}
                            onClick={() => window.open(`https://${shop.myshopifyDomain}`, "_blank")}
                        >
                            Preview
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => step === 1 ? setStep(2) : console.log("Done!")}
                        >
                            {step === 1 ? "Next" : "Create cart"}
                        </Button>
                        {step === 2 && (
                            <div className="design-cart_saveDraftRainbowBorder__XHNl9">
                                <Button
                                    variant="primary"
                                    loading={saving}
                                    disabled={saving}
                                    onClick={handleSaveAsDraft}
                                >
                                    Save as draft
                                </Button>
                            </div>
                        )}
                    </InlineStack>
                </div>
            </div>

            {/* ── RIGHT: CartPreview fixed ── */}
            <div>
                <CartPreview
                    designSettings={mergedDesignSettings}
                    headerSettings={defaultHeaderSettings}
                    announcementSettings={mergedAnnouncementSettings}
                    rewardsSettings={mergedRewardsSettings}
                    recommendationsSettings={mergedRecommendationsSettings}
                    subscriptionUpgradesSettings={mergedSubscriptionUpgradesSettings}
                    upsellsSettings={mergedUpsellsSettings}
                    additionalNotesSettings={defaultAdditionalNotesSettings}
                    addonsSettings={mergedAddonsSettings}
                    discountCodesSettings={defaultDiscountCodesSettings}
                    expressPaymentsSettings={defaultExpressPaymentsSettings}
                    trustBadgesSettings={defaultTrustBadgesSettings}
                    cartSettings={defaultCartSettings}
                    triggeredRewardsSettings={defaultTriggeredRewardsSettings}
                />
            </div>
        </div>
    );
}