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
    Box,
    Icon,
    LegacyTabs,
    Tooltip,
    Popover, ActionList, Link
} from "@shopify/polaris";

import {
    SettingsIcon, ChevronUpIcon, ChevronDownIcon, QuestionCircleIcon        // Settings
} from "@shopify/polaris-icons";

const CART_POSITION_OPTIONS = [
    { label: "Slide from left", value: "slide_from_left" },
    { label: "Slide from right", value: "slide_from_right" },
    { label: "Modal (center)", value: "modal_center" },
];

const SELECTOR_OPTIONS = [
    { label: "Use default selector", value: "default" },
    { label: "Custom selector", value: "custom" },
];

const DOT_COLORS = {
    above_announcements: "var(--p-color-icon-success)",
    below_header: "var(--p-color-icon-success)",
    between_line_items: "var(--p-color-icon-success)",
    below_cart_items: "var(--p-color-icon-success)",
    above_footer: "var(--p-color-icon-success)",
    above_checkout: "var(--p-color-icon-success)",
    below_checkout: "var(--p-color-icon-success)",
    bottom_of_cart: "var(--p-color-icon-success)",
    empty_cart: "var(--p-color-icon-success)",
    scripts_before_load: "var(--p-color-icon-caution)",
};

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
    "custom-cart", "custom-cart-body", "custom-cart-backdrop", "custom-cart-loading-bar-container", "custom-cart-header", "custom-cart-header-text", "custom-cart-header-logo", "custom-cart-header-close-button", "custom-cart-header-close-button-icon", "custom-cart-footer", "custom-cart-savings-row", "custom-cart-savings-amount", "custom-cart-checkout-button", "custom-cart-checkout-button-container", "custom-cart-continue-shopping", "custom-cart-products-section", "custom-cart-product-item", "custom-cart-product-title", "custom-cart-product-title-link", "custom-cart-item-prices-row", "custom-cart-item-price", "custom-cart-item-compare-price", "custom-cart-product-savings", "custom-cart-item-option", "custom-cart-item-option-category", "custom-cart-item-option-value", "custom-cart-bundle-item-image-wrapper", "custom-cart-bundle-item-product-title", "custom-cart-bundle-item-variant-title", "custom-cart-bundle-detail-toggle", "custom-cart-item-properties", "custom-cart-item-property", "custom-cart-item-property-subscription", "custom-cart-product-quantity-input", "custom-cart-product-quantity-minus", "custom-cart-product-quantity-plus", "custom-cart-product-image-wrapper", "custom-cart-announcement", "custom-cart-rewards", "custom-cart-rewards-message", "custom-cart-rewards-bar-background", "custom-cart-rewards-bar-foreground", "custom-cart-rewards-tier", "custom-cart-rewards-tier-circle", "custom-cart-rewards-tier-icon", "custom-cart-rewards-tier-description", "custom-cart-upsells-module", "custom-cart-upsells-title", "custom-cart-upsells-button", "custom-cart-upsell-item-title", "custom-cart-upsell-item-card", "custom-cart-upsell-item-image-wrapper", "custom-cart-upsell-item-image", "custom-cart-upsell-item-price", "custom-cart-upsell-item-price-row", "custom-cart-upsell-item-compare-price", "custom-cart-upsell-item-variant-selector", "custom-cart-upsells", "custom-cart-recommendation-module", "custom-cart-recommendations-title", "custom-cart-recommendations-shop-now-button", "custom-cart-addons", "custom-cart-addons-title", "custom-cart-addons-product-description", "custom-cart-addons-price", "custom-cart-addons-compare-price", "custom-cart-addons-toggle", "custom-cart-addons-image-wrapper", "custom-cart-discount-code-row", "custom-cart-discount-code-module", "custom-cart-discount-code-button", "custom-cart-discount-code-input", "custom-cart-discount-code-badge", "custom-cart-discount-code-icon", "custom-cart-discount-code-text", "custom-cart-discount-code-input-wrapper", "custom-cart-subscription-upgrade-section", "custom-cart-subscription-upgrade-button", "custom-cart-subscription-upgrade-dropdown", "custom-cart-express-pay-buttons-container", "custom-cart-express-pay-buttons-row", "custom-cart-express-pay-button", "custom-cart-express-pay-button-shop-pay", "custom-cart-express-pay-button-google-pay", "custom-cart-express-pay-button-paypal", "custom-cart-express-pay-button-apple-pay", "custom-cart-express-pay-button-amazon-pay", "custom-cart-express-pay-button-meta-pay", "custom-cart-trust-badge", "custom-cart-trust-badge-image", "custom-cart-quantity-warning", "custom-cart-quantity-warning-text", "custom-cart-integration-zapiet-pickup", "custom-cart-skeleton", "custom-cart-product-item-skeleton", "custom-cart-product-image-skeleton", "custom-cart-product-title-skeleton", "custom-cart-item-option-skeleton", "custom-cart-product-quantity-skeleton", "custom-cart-product-price-container-skeleton", "custom-cart-announcement-skeleton", "custom-cart-rewards-skeleton", "custom-cart-rewards-message-skeleton", "custom-cart-rewards-bar-skeleton", "custom-cart-upsells-module-skeleton", "custom-cart-upsells-title-skeleton", "custom-cart-upsell-item-image-skeleton", "custom-cart-upsell-item-title-skeleton", "custom-cart-upsell-item-price-skeleton", "custom-cart-upsells-button-skeleton", "custom-cart-trust-badge-skeleton", "custom-cart-trust-badge-image-skeleton", "custom-cart-checkout-button-container-skeleton", "custom-cart-checkout-button-skeleton", "custom-cart-addons-skeleton", "custom-cart-addons-image-wrapper-skeleton", "custom-cart-addons-skeleton-text-container", "custom-cart-discount-code-module-skeleton", "custom-cart-discount-code-input-skeleton", "custom-cart-discount-code-button-skeleton", "custom-cart-express-pay-buttons-container-skeleton", "custom-cart-express-pay-button-skeleton", "custom-cart-public-header", "custom-cart-public-header__close-button", "custom-cart-public-header__close-button-icon", "custom-cart-public-announcement", "custom-cart-public-skeleton", "custom-cart-public-announcement-skeleton", "custom-cart-public-component-upsell-tile", "custom-cart-public-component-upsell-tile__image-container", "custom-cart-public-component-upsell-tile__image", "custom-cart-public-component-upsell-tile__info", "custom-cart-public-component-upsell-tile__title-link", "custom-cart-public-component-upsell-tile__title", "custom-cart-public-component-upsell-tile__rating-row", "custom-cart-public-component-upsell-tile__stars", "custom-cart-public-component-upsell-tile__star--partial", "custom-cart-public-component-upsell-tile__reviews", "custom-cart-public-component-upsell-tile__price-row", "custom-cart-public-component-upsell-tile__price-compare-at", "custom-cart-public-component-upsell-tile__price", "custom-cart-public-component-upsell-tile__variant-row", "custom-cart-public-component__button", "custom-cart-public-component-loader", "custom-cart-public-upsell__skeleton", "custom-cart-public-upsell__skeleton-title", "custom-cart-public-upsell__skeleton-image", "custom-cart-public-upsell__skeleton-product-title", "custom-cart-public-upsell__skeleton-product-price", "custom-cart-public-notes", "custom-cart-public-component-collapse__dropdown-container", "custom-cart-public-component-collapse__expand-icon", "custom-cart-public-notes__text-container", "custom-cart-public-notes__textarea", "custom-cart-public-discount-code", "custom-cart-public-discount-code__form", "custom-cart-public-discount-code__input-wrapper", "custom-cart-public-discount-code__input", "custom-cart-public-discount-code__suffix", "custom-cart-public-discount-code__error", "custom-cart-public-discount-code__button", "custom-cart-public-discount-code__skeleton", "custom-cart-public-discount-code__skeleton-input", "custom-cart-public-discount-code__skeleton-button", "custom-cart-public-trust-badges", "custom-cart-public-trust-badges__image", "custom-cart-public-rewards", "custom-cart-public-rewards__message", "custom-cart-public-rewards__bar", "custom-cart-public-component-segmented-progress-bar", "custom-cart-public-component-segmented-progress-bar__segments-container", "custom-cart-public-component-segmented-progress-bar__segment", "custom-cart-public-component-segmented-progress-bar__segment-fill", "custom-cart-public-component-segmented-progress-bar__segment-label", "custom-cart-public-component-segmented-progress-bar__milestone", "custom-cart-public-component-segmented-progress-bar__milestone--bottom", "custom-cart-public-component-segmented-progress-bar__milestone--top", "custom-cart-public-component-segmented-progress-bar__milestone--middle", "custom-cart-public-component-segmented-progress-bar__milestone-icon", "custom-cart-public-component-segmented-progress-bar__milestone-label", "custom-cart-public-component-segmented-progress-bar__milestone-label--align-right", "custom-cart-public-component-segmented-progress-bar__milestone-label--align-center", "custom-cart-public-rewards__skeleton", "custom-cart-public-rewards__skeleton-message", "custom-cart-public-rewards__skeleton-bar", "custom-cart-public-component-product-tile", "custom-cart-public-component-product-tile__content", "custom-cart-public-component-product-tile__image-wrapper", "custom-cart-public-component-product-tile__image", "custom-cart-public-component-product-tile__info", "custom-cart-public-component-product-tile__header", "custom-cart-public-component-product-tile__product-title", "custom-cart-public-component-product-tile__title-link", "custom-cart-public-component-product-tile__remove-button", "custom-cart-public-component-product-tile__variant", "custom-cart-public-component-product-tile__properties", "custom-cart-public-component-product-tile__bundle", "custom-cart-public-component-product-tile__product-pricing", "custom-cart-public-component-product-tile__price-compare-at", "custom-cart-public-component-product-tile__price", "custom-cart-public-component-product-tile__savings", "custom-cart-public-component-product-tile__controls", "custom-cart-public-component-product-tile__quantity-selector", "custom-cart-public-component-product-tile__quantity-minus", "custom-cart-public-component-product-tile__quantity-plus", "custom-cart-public-component-product-tile__discount-codes", "custom-cart-public-component-tag", "custom-cart-public-component-tag__icon", "custom-cart-public-component-tag__text", "custom-cart-public-component-product-tile__subscription-upgrade", "custom-cart-public-component-product-tile__select-wrapper", "custom-cart-public-component-product-tile__select", "custom-cart-public-product-properties__subscription", "custom-cart-public-product-properties__item", "custom-cart-public-product-properties__link", "custom-cart-public-cart-items__key-value-pair", "custom-cart-public-bundle-properties", "custom-cart-public-bundle-properties__variant-title", "custom-cart-public-bundle-properties__header", "custom-cart-public-bundle-properties__item-components", "custom-cart-public-bundle-properties__item-component-row", "custom-cart-public-bundle-properties__image-wrapper", "custom-cart-public-bundle-properties__content", "custom-cart-public-bundle-properties__product-title", "custom-cart-public-addons", "custom-cart-public-addons__image-wrapper", "custom-cart-public-addons__content-wrapper", "custom-cart-public-addons__content-title-wrapper", "custom-cart-public-addons__content-title", "custom-cart-public-addons__content-price", "custom-cart-public-addons__compare-at-price", "custom-cart-public-addons__price", "custom-cart-public-addons__content-description", "custom-cart-public-addons__toggle-wrapper", "custom-cart-public-addons__toggle", "custom-cart-public-addons__toggle-switch", "custom-cart-public-addons__toggle-slider", "custom-cart-public-addons__skeleton", "custom-cart-public-addons__skeleton-image", "custom-cart-public-addons__skeleton-text", "custom-cart-public-cart-summary", "custom-cart-public-cart-summary__discount-codes", "custom-cart-public-cart-summary__discount-label", "custom-cart-public-cart-summary__slide-codes", "custom-cart-public-cart-summary__total-discount",
];

export default function Preferences({ handleChange, cartSettings }) {
    const [activeTab, setActiveTab] = useState("Cart settings");
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [cssListOpen, setCssListOpen] = useState(false);
    const [htmlPosition, setHtmlPosition] = useState("above_announcements");
    const [htmlPositionPopoverOpen, setHtmlPositionPopoverOpen] = useState(false);

    const update = (key, value) => {
        handleChange("cartSettings", (prev) => ({ ...prev, [key]: value }));
    };

    const updateHtmlBlock = (position, value) => {
        handleChange("cartSettings", (prev) => ({
            ...prev,
            customHtmlBlocks: { ...prev.customHtmlBlocks, [position]: value },
        }));
    };

    const tabs = TABS.map((tab) => ({
        id: tab.toLowerCase().replace(/\s+/g, "-"),
        content: tab,
        accessibilityLabel: tab,
        panelID: `${tab.toLowerCase().replace(/\s+/g, "-")}-panel`,
    }));

    const getDotColor = (position) => {
        if (position === "scripts_before_load") return "var(--p-color-icon-caution)";
        const hasContent = !!cartSettings.customHtmlBlocks?.[position];
        return hasContent ? "var(--p-color-icon-success)" : "var(--p-color-icon-disabled)";
    };

    return (
        <div className="mainContent">
            {/* Page heading — matches reference HTML exactly */}
            <Box paddingBlockEnd="400">
                <BlockStack gap="400">
                    <InlineStack gap="300" align="space-between" blockAlign="center">
                        <InlineStack blockAlign="center" gap="100">
                            <Box>
                                <Icon source={SettingsIcon} />
                            </Box>
                            <InlineStack gap="200">
                                <Text variant="headingMd" as="h2">Preferences</Text>
                            </InlineStack>

                        </InlineStack>

                    </InlineStack>
                </BlockStack>
            </Box>

            <BlockStack gap="400">
                {/* Tab bar */}
                <LegacyTabs
                    tabs={tabs}
                    selected={TABS.indexOf(activeTab)}
                    onSelect={(index) => setActiveTab(TABS[index])}
                />

                {activeTab === "Cart settings" && (
                    <BlockStack gap="400">
                        <Card>
                            <BlockStack gap="200">
                                <Text variant="headingMd">Cart settings</Text>
                                <BlockStack gap="200">
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
                                    <Checkbox
                                        label="Disable fixed footer"
                                        checked={cartSettings.disableFixedFooter}
                                        onChange={(v) => update("disableFixedFooter", v)}
                                    />
                                    <Checkbox
                                        label="Open cart drawer on add to cart"
                                        checked={cartSettings.openOnAddToCart}
                                        onChange={(v) => update("openOnAddToCart", v)}
                                    />
                                    <Checkbox
                                        label="Go to cart page when pressing checkout button"
                                        checked={cartSettings.goToCartPageOnCheckout}
                                        onChange={(v) => update("goToCartPageOnCheckout", v)}
                                    />
                                    <Checkbox
                                        label="Show savings with product prices"
                                        checked={cartSettings.showSavingsBelowPrices}
                                        onChange={(v) => update("showSavingsBelowPrices", v)}
                                    />
                                    <Checkbox
                                        label="Enable loading preview for cart"
                                        checked={cartSettings.enableLoadingPreview}
                                        onChange={(v) => update("enableLoadingPreview", v)}
                                    />
                                    {/* <BlockStack inlineAlign="start">
                                        <Button
                                            variant="plain"
                                            monochrome
                                            removeUnderline
                                            onClick={() => setAdvancedOpen((o) => !o)}
                                        >
                                            <InlineStack gap="100" align="center">
                                                <Text as="span" tone="subdued">
                                                    Advanced Settings
                                                </Text>
                                                <Icon source={advancedOpen ? ChevronUpIcon : ChevronDownIcon} tone="base" />
                                            </InlineStack>
                                        </Button>
                                    </BlockStack> */}
                                    {/* <Collapsible open={advancedOpen} id="basic-collapsible">
                                        <BlockStack gap="200">
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Show discounts from base price instead of from compare at price"
                                                    checked={cartSettings.showDiscountsFromBasePrice}
                                                    onChange={(v) => update("showDiscountsFromBasePrice", v)}
                                                    helpText="If there is a discount, use the base product price as the strikethrough price. If there is no discount, use the compare-at price as the strikethrough price. This setting is only useful in a few specific cases. If this is confusing, we recommend leaving it unchecked."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Show compare-at price savings in footer total"
                                                    checked={cartSettings.showCompareAtPriceSavingsInFooter}
                                                    onChange={(v) => update("showCompareAtPriceSavingsInFooter", v)}
                                                    helpText="When enabled, the savings row will include both discount code savings and compare-at price savings across all cart items."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label='Hide properties starting with single underscore "_"'
                                                    checked={cartSettings.hideSingleUnderscoreProperties}
                                                    onChange={(v) => update("hideSingleUnderscoreProperties", v)}
                                                    helpText='The standard convention for hidden cart properties is to use two underscores at the start of the property name (e.g. "__hiddenProperty"). Some apps or themes may instead use a single underscore to indicate a hidden property. Enabling this setting will hide both single and double underscored properties.'
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Enhanced Ajax API compatibility"
                                                    checked={cartSettings.enhancedAjaxCompatibility}
                                                    onChange={(v) => update("enhancedAjaxCompatibility", v)}
                                                    helpText="If there are multiple scripts trying to add items or update the cart at the same time, sometimes Shopify's Ajax API does not register the changes. This setting will allow multiple scripts to use the Ajax API simultaneously and ensure that all updates are registered."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Force re-render of custom HTML fields"
                                                    checked={cartSettings.forceRerenderCustomHtml}
                                                    onChange={(v) => update("forceRerenderCustomHtml", v)}
                                                    helpText="If you are using custom HTML fields, you may need to enable this setting to ensure that the HTML fields are re-rendered when the cart is updated. This setting is only necessary if you are using HTML fields and they are not updating correctly due to a theme or app conflict."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Skip the loading of Google fonts in the Upcart bundle"
                                                    checked={cartSettings.skipGoogleFonts}
                                                    onChange={(v) => update("skipGoogleFonts", v)}
                                                    helpText="You may wish to skip the loading of Google fonts for GDPR compliance purposes."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Override existing scroll locking logic"
                                                    checked={cartSettings.overrideScrollLocking}
                                                    onChange={(v) => update("overrideScrollLocking", v)}
                                                    helpText="If a theme or a third-party application is preventing the cart from scrolling, or if the page remains scroll-locked after closing the cart, enable this setting. It will override the scroll-locking behavior."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Integrate with YMQ Product Options & Variants"
                                                    checked={cartSettings.integrateYmqProductOptions}
                                                    onChange={(v) => update("integrateYmqProductOptions", v)}
                                                    helpText="Allow custom product options such as image uploads."
                                                />
                                            </BlockStack>
                                            <BlockStack gap="100">
                                                <Checkbox
                                                    label="Render cart in shadow DOM"
                                                    checked={cartSettings.renderCartInShadowDom}
                                                    onChange={(v) => update("renderCartInShadowDom", v)}
                                                    helpText="The shadow DOM prevents theme code or other app code from interfering with Upcart."
                                                />
                                            </BlockStack>
                                        </BlockStack>
                                    </Collapsible> */}
                                </BlockStack>
                            </BlockStack>
                        </Card>

                        {/* <Card>
                            <BlockStack gap="400">
                                <InlineStack gap="200" blockAlign="center">
                                    <Text variant="bodyMd">Open cart button selector</Text>
                                    <Tooltip content="The CSS selector used to identify the button that opens the cart drawer.">
                                        <Icon source={QuestionCircleIcon} tone="subdued" />
                                    </Tooltip>
                                </InlineStack>
                                <Box paddingInlineStart="200">
                                    <BlockStack gap="100">
                                        <Select
                                            label="Options"
                                            options={SELECTOR_OPTIONS}
                                            value={cartSettings.openCartButtonSelector}
                                            onChange={(v) => update("openCartButtonSelector", v)}
                                        />
                                        <TextField
                                            label="Custom selector"
                                            placeholder="Custom selector"
                                            value={cartSettings.openCartButtonCustomSelector}
                                            onChange={(v) => update("openCartButtonCustomSelector", v)}
                                            disabled={cartSettings.openCartButtonSelector !== "custom-selector"}
                                        />
                                    </BlockStack>
                                </Box>

                                <InlineStack gap="200" blockAlign="center">
                                    <Text variant="bodyMd">Add to cart button selector</Text>
                                    <Tooltip content="The CSS selector used to identify the add to cart button.">
                                        <Icon source={QuestionCircleIcon} tone="subdued" />
                                    </Tooltip>
                                </InlineStack>
                                <Box paddingInlineStart="200">
                                    <BlockStack gap="100">
                                        <Select
                                            label="Options"
                                            options={SELECTOR_OPTIONS}
                                            value={cartSettings.addToCartButtonSelector}
                                            onChange={(v) => update("addToCartButtonSelector", v)}
                                        />
                                        <TextField
                                            label="Custom selector"
                                            placeholder="Custom selector"
                                            value={cartSettings.addToCartButtonCustomSelector}
                                            onChange={(v) => update("addToCartButtonCustomSelector", v)}
                                            disabled={cartSettings.addToCartButtonSelector !== "custom-selector"}
                                        />
                                    </BlockStack>
                                </Box>

                                <Divider />

                                <Checkbox
                                    label="Access custom templates"
                                    checked={cartSettings.accessCustomTemplates}
                                    onChange={(v) => update("accessCustomTemplates", v)}
                                    helpText="Custom templates allow you to have full control over the look and feel of cart modules. Requires V2.0 of the module."
                                />
                            </BlockStack>
                        </Card> */}
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

                            <Popover
                                active={htmlPositionPopoverOpen}
                                activator={
                                    <Button
                                        onClick={() => setHtmlPositionPopoverOpen((v) => !v)}
                                        disclosure
                                        icon={() => {
                                            const color = getDotColor(htmlPosition);
                                            return (
                                                <span style={{
                                                    display: "inline-block",
                                                    height: "8px",
                                                    width: "8px",
                                                    borderRadius: "50%",
                                                    flexShrink: 0,
                                                    border: `2px solid ${color}`,
                                                    background: color,
                                                }} />
                                            );
                                        }}
                                    >
                                        {CUSTOM_HTML_POSITION_OPTIONS.find((o) => o.value === htmlPosition)?.label}
                                    </Button>
                                }
                                onClose={() => setHtmlPositionPopoverOpen(false)}
                                autofocusTarget="none"
                            >
                                <ActionList
                                    actionRole="menuitem"
                                    items={CUSTOM_HTML_POSITION_OPTIONS.map((opt) => ({
                                        content: opt.label,
                                        active: opt.value === htmlPosition,
                                        prefix: (
                                            <span style={{
                                                display: "inline-block",
                                                height: "8px",
                                                width: "8px",
                                                borderRadius: "50%",
                                                flexShrink: 0,
                                                border: `2px solid ${getDotColor(opt.value)}`,
                                                background: getDotColor(opt.value),
                                            }} />
                                        ),
                                        onAction: () => {
                                            setHtmlPosition(opt.value);
                                            setHtmlPositionPopoverOpen(false);
                                        },
                                    }))}
                                />
                            </Popover>

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
                                <p>Start by typing a dot "." to see a list of all available CSS classes. Or view the full list below.</p>
                                <p>
                                    <Button
                                        variant="plain"
                                        onClick={() => setCssListOpen((o) => !o)}
                                    >
                                        {cssListOpen ? "Hide list" : "Show list"}
                                    </Button>
                                </p>
                            </Banner>
                            <Collapsible open={cssListOpen} id="css-class-list">
                                <Text variant="bodyMd" tone="subdued">
                                    {CSS_CLASSES.join(", ")}
                                </Text>
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
        </div>
    );
}
