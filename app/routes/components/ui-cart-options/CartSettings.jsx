import { useState } from "react";
import HtmlEditor from "./HtmlEditor";
import {
    Card,
    BlockStack,
    InlineStack,
    Text,
    Select,
    RangeSlider,
    Checkbox,
    Collapsible,
    Button,
    TextField,
    Divider,
    Banner,
} from "@shopify/polaris";

const CART_POSITION_OPTIONS = [
    { label: "Slide from left", value: "slide_from_left" },
    { label: "Slide from right", value: "slide_from_right" },
    { label: "Modal (center)", value: "modal_center" },
];

const SELECTOR_OPTIONS = [
    { label: "Use default selector", value: "default" },
    { label: "Custom selector", value: "custom" },
];

const CUSTOM_HTML_POSITION_OPTIONS = [
    { label: "Above announcements/rewards", value: "above_announcements" },
    { label: "Below header/announcements/rewards", value: "below_header" },
    { label: "Between each line item", value: "between_line_items" },
    { label: "Below cart items", value: "below_cart_items" },
    { label: "Above footer/add-ons", value: "above_footer" },
    { label: "Above checkout button", value: "above_checkout" },
    { label: "Below checkout button", value: "below_checkout" },
    { label: "Bottom of cart", value: "bottom_of_cart" },
    { label: "On empty cart screen", value: "empty_cart" },
    { label: "Scripts (Before load)", value: "scripts_before_load" },
];

const TABS = ["Cart settings", "Edit copy", "Custom HTML", "Custom CSS"];

const CSS_CLASSES = [
    "upcart-cart","upcart-cart-body","upcart-backdrop","upcart-loading-bar-container","upcart-header","upcart-header-text","upcart-header-logo","upcart-header-close-button","upcart-header-close-button-icon","upcart-footer","upcart-savings-row","upcart-savings-amount","upcart-checkout-button","upcart-checkout-button-container","upcart-continue-shopping","upcart-products-section","upcart-product-item","upcart-product-title","upcart-product-title-link","upcart-item-prices-row","upcart-item-price","upcart-item-compare-price","upcart-product-savings","upcart-item-option","upcart-item-option-category","upcart-item-option-value","upcart-bundle-item-image-wrapper","upcart-bundle-item-product-title","upcart-bundle-item-variant-title","upcart-bundle-detail-toggle","upcart-item-properties","upcart-item-property","upcart-item-property-subscription","upcart-product-quantity-input","upcart-product-quantity-minus","upcart-product-quantity-plus","upcart-product-image-wrapper","upcart-announcement","upcart-rewards","upcart-rewards-message","upcart-rewards-bar-background","upcart-rewards-bar-foreground","upcart-rewards-tier","upcart-rewards-tier-circle","upcart-rewards-tier-icon","upcart-rewards-tier-description","upcart-upsells-module","upcart-upsells-title","upcart-upsells-button","upcart-upsell-item-title","upcart-upsell-item-card","upcart-upsell-item-image-wrapper","upcart-upsell-item-image","upcart-upsell-item-price","upcart-upsell-item-price-row","upcart-upsell-item-compare-price","upcart-upsell-item-variant-selector","upcart-upsells","upcart-recommendation-module","upcart-recommendations-title","upcart-recommendations-shop-now-button","upcart-addons","upcart-addons-title","upcart-addons-product-description","upcart-addons-price","upcart-addons-compare-price","upcart-addons-toggle","upcart-addons-image-wrapper","upcart-discount-code-row","upcart-discount-code-module","upcart-discount-code-button","upcart-discount-code-input","upcart-discount-code-badge","upcart-discount-code-icon","upcart-discount-code-text","upcart-discount-code-input-wrapper","upcart-subscription-upgrade-section","upcart-subscription-upgrade-button","upcart-subscription-upgrade-dropdown","upcart-express-pay-buttons-container","upcart-express-pay-buttons-row","upcart-express-pay-button","upcart-express-pay-button-shop-pay","upcart-express-pay-button-google-pay","upcart-express-pay-button-paypal","upcart-express-pay-button-apple-pay","upcart-express-pay-button-amazon-pay","upcart-express-pay-button-meta-pay","upcart-trust-badge","upcart-trust-badge-image","upcart-quantity-warning","upcart-quantity-warning-text","upcart-integration-zapiet-pickup","upcart-skeleton","upcart-product-item-skeleton","upcart-product-image-skeleton","upcart-product-title-skeleton","upcart-item-option-skeleton","upcart-product-quantity-skeleton","upcart-product-price-container-skeleton","upcart-announcement-skeleton","upcart-rewards-skeleton","upcart-rewards-message-skeleton","upcart-rewards-bar-skeleton","upcart-upsells-module-skeleton","upcart-upsells-title-skeleton","upcart-upsell-item-image-skeleton","upcart-upsell-item-title-skeleton","upcart-upsell-item-price-skeleton","upcart-upsells-button-skeleton","upcart-trust-badge-skeleton","upcart-trust-badge-image-skeleton","upcart-checkout-button-container-skeleton","upcart-checkout-button-skeleton","upcart-addons-skeleton","upcart-addons-image-wrapper-skeleton","upcart-addons-skeleton-text-container","upcart-discount-code-module-skeleton","upcart-discount-code-input-skeleton","upcart-discount-code-button-skeleton","upcart-express-pay-buttons-container-skeleton","upcart-express-pay-button-skeleton","upcart-public-header","upcart-public-header__close-button","upcart-public-header__close-button-icon","upcart-public-announcement","upcart-public-skeleton","upcart-public-announcement-skeleton","upcart-public-component-upsell-tile","upcart-public-component-upsell-tile__image-container","upcart-public-component-upsell-tile__image","upcart-public-component-upsell-tile__info","upcart-public-component-upsell-tile__title-link","upcart-public-component-upsell-tile__title","upcart-public-component-upsell-tile__rating-row","upcart-public-component-upsell-tile__stars","upcart-public-component-upsell-tile__star--partial","upcart-public-component-upsell-tile__reviews","upcart-public-component-upsell-tile__price-row","upcart-public-component-upsell-tile__price-compare-at","upcart-public-component-upsell-tile__price","upcart-public-component-upsell-tile__variant-row","upcart-public-component__button","upcart-public-component-loader","upcart-public-upsell__skeleton","upcart-public-upsell__skeleton-title","upcart-public-upsell__skeleton-image","upcart-public-upsell__skeleton-product-title","upcart-public-upsell__skeleton-product-price","upcart-public-notes","upcart-public-component-collapse__dropdown-container","upcart-public-component-collapse__expand-icon","upcart-public-notes__text-container","upcart-public-notes__textarea","upcart-public-discount-code","upcart-public-discount-code__form","upcart-public-discount-code__input-wrapper","upcart-public-discount-code__input","upcart-public-discount-code__suffix","upcart-public-discount-code__error","upcart-public-discount-code__button","upcart-public-discount-code__skeleton","upcart-public-discount-code__skeleton-input","upcart-public-discount-code__skeleton-button","upcart-public-trust-badges","upcart-public-trust-badges__image","upcart-public-rewards","upcart-public-rewards__message","upcart-public-rewards__bar","upcart-public-component-segmented-progress-bar","upcart-public-component-segmented-progress-bar__segments-container","upcart-public-component-segmented-progress-bar__segment","upcart-public-component-segmented-progress-bar__segment-fill","upcart-public-component-segmented-progress-bar__segment-label","upcart-public-component-segmented-progress-bar__milestone","upcart-public-component-segmented-progress-bar__milestone--bottom","upcart-public-component-segmented-progress-bar__milestone--top","upcart-public-component-segmented-progress-bar__milestone--middle","upcart-public-component-segmented-progress-bar__milestone-icon","upcart-public-component-segmented-progress-bar__milestone-label","upcart-public-component-segmented-progress-bar__milestone-label--align-right","upcart-public-component-segmented-progress-bar__milestone-label--align-center","upcart-public-rewards__skeleton","upcart-public-rewards__skeleton-message","upcart-public-rewards__skeleton-bar","upcart-public-component-product-tile","upcart-public-component-product-tile__content","upcart-public-component-product-tile__image-wrapper","upcart-public-component-product-tile__image","upcart-public-component-product-tile__info","upcart-public-component-product-tile__header","upcart-public-component-product-tile__product-title","upcart-public-component-product-tile__title-link","upcart-public-component-product-tile__remove-button","upcart-public-component-product-tile__variant","upcart-public-component-product-tile__properties","upcart-public-component-product-tile__bundle","upcart-public-component-product-tile__product-pricing","upcart-public-component-product-tile__price-compare-at","upcart-public-component-product-tile__price","upcart-public-component-product-tile__savings","upcart-public-component-product-tile__controls","upcart-public-component-product-tile__quantity-selector","upcart-public-component-product-tile__quantity-minus","upcart-public-component-product-tile__quantity-plus","upcart-public-component-product-tile__discount-codes","upcart-public-component-tag","upcart-public-component-tag__icon","upcart-public-component-tag__text","upcart-public-component-product-tile__subscription-upgrade","upcart-public-component-product-tile__select-wrapper","upcart-public-component-product-tile__select","upcart-public-product-properties__subscription","upcart-public-product-properties__item","upcart-public-product-properties__link","upcart-public-cart-items__key-value-pair","upcart-public-bundle-properties","upcart-public-bundle-properties__variant-title","upcart-public-bundle-properties__header","upcart-public-bundle-properties__item-components","upcart-public-bundle-properties__item-component-row","upcart-public-bundle-properties__image-wrapper","upcart-public-bundle-properties__content","upcart-public-bundle-properties__product-title","upcart-public-addons","upcart-public-addons__image-wrapper","upcart-public-addons__content-wrapper","upcart-public-addons__content-title-wrapper","upcart-public-addons__content-title","upcart-public-addons__content-price","upcart-public-addons__compare-at-price","upcart-public-addons__price","upcart-public-addons__content-description","upcart-public-addons__toggle-wrapper","upcart-public-addons__toggle","upcart-public-addons__toggle-switch","upcart-public-addons__toggle-slider","upcart-public-addons__skeleton","upcart-public-addons__skeleton-image","upcart-public-addons__skeleton-text","upcart-public-cart-summary","upcart-public-cart-summary__discount-codes","upcart-public-cart-summary__discount-label","upcart-public-cart-summary__slide-codes","upcart-public-cart-summary__total-discount",
];

export default function CartSettings({ handleChange, cartSettings }) {
    const [activeTab, setActiveTab] = useState("Cart settings");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [cssListOpen, setCssListOpen] = useState(false);
    const [htmlPosition, setHtmlPosition] = useState("above_announcements");

    const insertCssClass = (cls) => {
        const snippet = `.${cls} {\n  \n}\n`;
        handleChange("cartSettings", (prev) => ({
            ...prev,
            customCss: (prev.customCss || "") + snippet,
        }));
    };

    const update = (key, value) => {
        handleChange("cartSettings", (prev) => ({ ...prev, [key]: value }));
    };

    const updateHtmlBlock = (position, value) => {
        handleChange("cartSettings", (prev) => ({
            ...prev,
            customHtmlBlocks: { ...prev.customHtmlBlocks, [position]: value },
        }));
    };

    return (
        <BlockStack gap="400">
            {/* Tab bar */}
            <div style={{ borderBottom: "1px solid #e1e3e5", display: "flex", gap: 0 }}>
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: "10px 16px",
                            border: "none",
                            borderBottom: activeTab === tab ? "2px solid #000" : "2px solid transparent",
                            background: "none",
                            cursor: "pointer",
                            fontWeight: activeTab === tab ? 600 : 400,
                            fontSize: 14,
                            color: activeTab === tab ? "#000" : "#6d7175",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "Cart settings" && (
                <BlockStack gap="400">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Cart settings</Text>
                            <Select
                                label="Cart position"
                                options={CART_POSITION_OPTIONS}
                                value={cartSettings.cartPosition}
                                onChange={(v) => update("cartPosition", v)}
                            />
                            <RangeSlider
                                label={`Traffic allocation percent (${cartSettings.trafficAllocationPercent}%)`}
                                min={0}
                                max={100}
                                value={cartSettings.trafficAllocationPercent}
                                onChange={(v) => update("trafficAllocationPercent", v)}
                            />
                            <Checkbox label="Disable fixed footer" checked={cartSettings.disableFixedFooter} onChange={(v) => update("disableFixedFooter", v)} />
                            <Checkbox label="Open cart drawer on add to cart" checked={cartSettings.openOnAddToCart} onChange={(v) => update("openOnAddToCart", v)} />
                            <Checkbox label="Go to cart page when pressing checkout button" checked={cartSettings.goToCartPageOnCheckout} onChange={(v) => update("goToCartPageOnCheckout", v)} />
                            <Checkbox label="Show savings below product prices" checked={cartSettings.showSavingsBelowPrices} onChange={(v) => update("showSavingsBelowPrices", v)} />
                            <Checkbox label="Enable loading preview for cart" checked={cartSettings.enableLoadingPreview} onChange={(v) => update("enableLoadingPreview", v)} />
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="300">
                            <button
                                onClick={() => setAdvancedOpen((o) => !o)}
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 6 }}
                            >
                                <Text variant="headingMd">Advanced Settings</Text>
                                <span style={{ fontSize: 12 }}>{advancedOpen ? "▲" : "▼"}</span>
                            </button>
                            <Collapsible open={advancedOpen} id="advanced-settings">
                                <BlockStack gap="400">
                                    <BlockStack gap="100">
                                        <Checkbox label="Show discounts from base price instead of from compare at price" checked={cartSettings.showDiscountsFromBasePrice} onChange={(v) => update("showDiscountsFromBasePrice", v)} />
                                        <Text variant="bodyMd" tone="subdued">If there is a discount, use the base product price as the strikethrough price. If there is no discount, use the compare-at price as the strikethrough price. This setting is only useful in a few specific cases. If this is confusing, we recommend leaving it unchecked.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Show compare-at price savings in footer total" checked={cartSettings.showCompareAtPriceSavingsInFooter} onChange={(v) => update("showCompareAtPriceSavingsInFooter", v)} />
                                        <Text variant="bodyMd" tone="subdued">When enabled, the savings row will include both discount code savings and compare-at price savings across all cart items.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label='Hide properties starting with single underscore "_"' checked={cartSettings.hideSingleUnderscoreProperties} onChange={(v) => update("hideSingleUnderscoreProperties", v)} />
                                        <Text variant="bodyMd" tone="subdued">The standard convention for hidden cart properties is to use two underscores at the start of the property name (e.g. "__hiddenProperty"). Some apps or themes may instead use a single underscore to indicate a hidden property. Enabling this setting will hide both single and double underscored properties.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Enhanced Ajax API compatibility" checked={cartSettings.enhancedAjaxCompatibility} onChange={(v) => update("enhancedAjaxCompatibility", v)} />
                                        <Text variant="bodyMd" tone="subdued">If there are multiple scripts trying to add items or update the cart at the same time, sometimes Shopify's Ajax API does not register the changes. This setting will allow multiple scripts to use the Ajax API simultaneously and ensure that all updates are registered.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Force re-render of custom HTML fields" checked={cartSettings.forceRerenderCustomHtml} onChange={(v) => update("forceRerenderCustomHtml", v)} />
                                        <Text variant="bodyMd" tone="subdued">If you are using custom HTML fields, you may need to enable this setting to ensure that the HTML fields are re-rendered when the cart is updated. This setting is only necessary if you are using custom HTML fields and they are not updating correctly due to a theme or app conflict.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Skip the loading of Google fonts in the Upcart bundle" checked={cartSettings.skipGoogleFonts} onChange={(v) => update("skipGoogleFonts", v)} />
                                        <Text variant="bodyMd" tone="subdued">You may wish to skip the loading of Google fonts for GDPR compliance purposes.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Override existing scroll locking logic" checked={cartSettings.overrideScrollLocking} onChange={(v) => update("overrideScrollLocking", v)} />
                                        <Text variant="bodyMd" tone="subdued">If a theme or a third-party application is preventing the cart from scrolling, or if the page remains scroll-locked after closing the cart, enable this setting. It will override the scroll-locking behavior.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Integrate with YMQ Product Options & Variants" checked={cartSettings.integrateYmqProductOptions} onChange={(v) => update("integrateYmqProductOptions", v)} />
                                        <Text variant="bodyMd" tone="subdued">Allow custom product options such as image uploads.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Render cart in shadow DOM" checked={cartSettings.renderCartInShadowDom} onChange={(v) => update("renderCartInShadowDom", v)} />
                                        <Text variant="bodyMd" tone="subdued">The shadow DOM prevents theme code or other app code from interfering with Upcart.</Text>
                                    </BlockStack>
                                    <BlockStack gap="100">
                                        <Checkbox label="Track cart events" checked={cartSettings.trackCartEvents} onChange={(v) => update("trackCartEvents", v)} />
                                        <Text variant="bodyMd" tone="subdued">Tracking cart events allows data to be collected for the analytics page.</Text>
                                    </BlockStack>
                                </BlockStack>
                            </Collapsible>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="400">
                            <InlineStack gap="200" align="start">
                                <Text variant="headingMd">Open cart button selector</Text>
                                <span style={{ fontSize: 13, color: "#6d7175", cursor: "help" }} title="The CSS selector used to identify the button that opens the cart drawer.">ⓘ</span>
                            </InlineStack>
                            <Select label="Options" options={SELECTOR_OPTIONS} value={cartSettings.openCartButtonSelector} onChange={(v) => update("openCartButtonSelector", v)} />
                            <TextField label="" placeholder="Custom selector" value={cartSettings.openCartButtonCustomSelector} onChange={(v) => update("openCartButtonCustomSelector", v)} disabled={cartSettings.openCartButtonSelector !== "custom"} />

                            <Divider />

                            <InlineStack gap="200" align="start">
                                <Text variant="headingMd">Add to cart button selector</Text>
                                <span style={{ fontSize: 13, color: "#6d7175", cursor: "help" }} title="The CSS selector used to identify the add to cart button.">ⓘ</span>
                            </InlineStack>
                            <Select label="Options" options={SELECTOR_OPTIONS} value={cartSettings.addToCartButtonSelector} onChange={(v) => update("addToCartButtonSelector", v)} />
                            <TextField label="" placeholder="Custom selector" value={cartSettings.addToCartButtonCustomSelector} onChange={(v) => update("addToCartButtonCustomSelector", v)} disabled={cartSettings.addToCartButtonSelector !== "custom"} />

                            <Divider />

                            <BlockStack gap="100">
                                <Checkbox label="Access custom templates" checked={cartSettings.accessCustomTemplates} onChange={(v) => update("accessCustomTemplates", v)} />
                                <Text variant="bodyMd" tone="subdued">Custom templates allow you to have full control over the look and feel of cart modules. Requires V2.0 of the module.</Text>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </BlockStack>
            )}

            {activeTab === "Edit copy" && (
                <BlockStack gap="400">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Body</Text>
                            <TextField label="Automatic discount savings text per cart item" value={cartSettings.savingsText} onChange={(v) => update("savingsText", v)} />
                            <TextField label="Empty cart message" value={cartSettings.emptyCartMessage} onChange={(v) => update("emptyCartMessage", v)} />
                            <TextField label="Continue shopping button text" value={cartSettings.continueShoppingText} onChange={(v) => update("continueShoppingText", v)} />
                        </BlockStack>
                    </Card>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Footer</Text>
                            <TextField label="Total discount savings text" value={cartSettings.discountsSavingsText} onChange={(v) => update("discountsSavingsText", v)} />
                            <BlockStack gap="100">
                                <TextField label="Checkout button text" value={cartSettings.checkoutButtonText} onChange={(v) => update("checkoutButtonText", v)} />
                                <Text variant="bodyMd" tone="subdued">Use {"{{total_price}}"} to display the total price</Text>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">Bundles</Text>
                            <TextField label="Show bundle items text (singular)" value={cartSettings.showBundleSingular} onChange={(v) => update("showBundleSingular", v)} />
                            <BlockStack gap="100">
                                <TextField label="Show bundle items text (plural)" value={cartSettings.showBundlePlural} onChange={(v) => update("showBundlePlural", v)} />
                                <Text variant="bodyMd" tone="subdued">Use {"{NUMBER_OF_ITEMS}"} for the item count</Text>
                            </BlockStack>
                            <TextField label="Hide bundle items text (singular)" value={cartSettings.hideBundleSingular} onChange={(v) => update("hideBundleSingular", v)} />
                            <BlockStack gap="100">
                                <TextField label="Hide bundle items text (plural)" value={cartSettings.hideBundlePlural} onChange={(v) => update("hideBundlePlural", v)} />
                                <Text variant="bodyMd" tone="subdued">Use {"{NUMBER_OF_ITEMS}"} for the item count</Text>
                            </BlockStack>
                        </BlockStack>
                    </Card>
                </BlockStack>
            )}

            {activeTab === "Custom HTML" && (
                <Card>
                    <BlockStack gap="400">
                        <Text variant="headingMd">Custom HTML</Text>
                        <Select
                            label=""
                            options={CUSTOM_HTML_POSITION_OPTIONS}
                            value={htmlPosition}
                            onChange={(v) => setHtmlPosition(v)}
                        />
                        <HtmlEditor
                            value={cartSettings.customHtmlBlocks?.[htmlPosition] || ""}
                            onChange={(v) => updateHtmlBlock(htmlPosition, v)}
                            language="html"
                        />
                    </BlockStack>
                </Card>
            )}

            {activeTab === "Custom CSS" && (
                <Card>
                    <BlockStack gap="400">
                        <Text variant="headingMd">Custom CSS</Text>
                        <Banner tone="info">
                            <BlockStack gap="100">
                                <Text variant="bodyMd">Start by typing a dot "." to see a list of all available CSS classes. Or view the full list below.</Text>
                                <Button plain onClick={() => setCssListOpen((o) => !o)}>
                                    {cssListOpen ? "Hide list" : "Show list"}
                                </Button>
                            </BlockStack>
                        </Banner>
                        <Collapsible open={cssListOpen} id="css-class-list">
                            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#444", padding: "8px 0" }}>
                                {CSS_CLASSES.join(", ")}
                            </div>
                        </Collapsible>
                        <HtmlEditor
                            value={cartSettings.customCss || ""}
                            onChange={(v) => update("customCss", v)}
                            language="css"
                        />
                    </BlockStack>
                </Card>
            )}
        </BlockStack>
    );
}
