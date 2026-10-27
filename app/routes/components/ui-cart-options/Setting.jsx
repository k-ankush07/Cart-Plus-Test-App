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
    "cart-plus", "cart-plus-body", "cart-plus-backdrop", "cart-plus-loading-bar-container", "cart-plus-header", "cart-plus-header-text", "cart-plus-header-logo", "cart-plus-header-close-button", "cart-plus-header-close-button-icon", "cart-plus-footer", "cart-plus-savings-row", "cart-plus-savings-amount", "cart-plus-checkout-button", "cart-plus-checkout-button-container", "cart-plus-continue-shopping", "cart-plus-products-section", "cart-plus-product-item", "cart-plus-product-title", "cart-plus-product-title-link", "cart-plus-item-prices-row", "cart-plus-item-price", "cart-plus-item-compare-price", "cart-plus-product-savings", "cart-plus-item-option", "cart-plus-item-option-category", "cart-plus-item-option-value", "cart-plus-bundle-item-image-wrapper", "cart-plus-bundle-item-product-title", "cart-plus-bundle-item-variant-title", "cart-plus-bundle-detail-toggle", "cart-plus-item-properties", "cart-plus-item-property", "cart-plus-item-property-subscription", "cart-plus-product-quantity-input", "cart-plus-product-quantity-minus", "cart-plus-product-quantity-plus", "cart-plus-product-image-wrapper", "cart-plus-announcement", "cart-plus-rewards", "cart-plus-rewards-message", "cart-plus-rewards-bar-background", "cart-plus-rewards-bar-foreground", "cart-plus-rewards-tier", "cart-plus-rewards-tier-circle", "cart-plus-rewards-tier-icon", "cart-plus-rewards-tier-description", "cart-plus-upsells-module", "cart-plus-upsells-title", "cart-plus-upsells-button", "cart-plus-upsell-item-title", "cart-plus-upsell-item-card", "cart-plus-upsell-item-image-wrapper", "cart-plus-upsell-item-image", "cart-plus-upsell-item-price", "cart-plus-upsell-item-price-row", "cart-plus-upsell-item-compare-price", "cart-plus-upsell-item-variant-selector", "cart-plus-upsells", "cart-plus-recommendation-module", "cart-plus-recommendations-title", "cart-plus-recommendations-shop-now-button", "cart-plus-addons", "cart-plus-addons-title", "cart-plus-addons-product-description", "cart-plus-addons-price", "cart-plus-addons-compare-price", "cart-plus-addons-toggle", "cart-plus-addons-image-wrapper", "cart-plus-discount-code-row", "cart-plus-discount-code-module", "cart-plus-discount-code-button", "cart-plus-discount-code-input", "cart-plus-discount-code-badge", "cart-plus-discount-code-icon", "cart-plus-discount-code-text", "cart-plus-discount-code-input-wrapper", "cart-plus-subscription-upgrade-section", "cart-plus-subscription-upgrade-button", "cart-plus-subscription-upgrade-dropdown", "cart-plus-express-pay-buttons-container", "cart-plus-express-pay-buttons-row", "cart-plus-express-pay-button", "cart-plus-express-pay-button-shop-pay", "cart-plus-express-pay-button-google-pay", "cart-plus-express-pay-button-paypal", "cart-plus-express-pay-button-apple-pay", "cart-plus-express-pay-button-amazon-pay", "cart-plus-express-pay-button-meta-pay", "cart-plus-trust-badge", "cart-plus-trust-badge-image", "cart-plus-quantity-warning", "cart-plus-quantity-warning-text", "cart-plus-integration-zapiet-pickup", "cart-plus-skeleton", "cart-plus-product-item-skeleton", "cart-plus-product-image-skeleton", "cart-plus-product-title-skeleton", "cart-plus-item-option-skeleton", "cart-plus-product-quantity-skeleton", "cart-plus-product-price-container-skeleton", "cart-plus-announcement-skeleton", "cart-plus-rewards-skeleton", "cart-plus-rewards-message-skeleton", "cart-plus-rewards-bar-skeleton", "cart-plus-upsells-module-skeleton", "cart-plus-upsells-title-skeleton", "cart-plus-upsell-item-image-skeleton", "cart-plus-upsell-item-title-skeleton", "cart-plus-upsell-item-price-skeleton", "cart-plus-upsells-button-skeleton", "cart-plus-trust-badge-skeleton", "cart-plus-trust-badge-image-skeleton", "cart-plus-checkout-button-container-skeleton", "cart-plus-checkout-button-skeleton", "cart-plus-addons-skeleton", "cart-plus-addons-image-wrapper-skeleton", "cart-plus-addons-skeleton-text-container", "cart-plus-discount-code-module-skeleton", "cart-plus-discount-code-input-skeleton", "cart-plus-discount-code-button-skeleton", "cart-plus-express-pay-buttons-container-skeleton", "cart-plus-express-pay-button-skeleton", "cart-plus-public-header", "cart-plus-public-header__close-button", "cart-plus-public-header__close-button-icon", "cart-plus-public-announcement", "cart-plus-public-skeleton", "cart-plus-public-announcement-skeleton", "cart-plus-public-component-upsell-tile", "cart-plus-public-component-upsell-tile__image-container", "cart-plus-public-component-upsell-tile__image", "cart-plus-public-component-upsell-tile__info", "cart-plus-public-component-upsell-tile__title-link", "cart-plus-public-component-upsell-tile__title", "cart-plus-public-component-upsell-tile__rating-row", "cart-plus-public-component-upsell-tile__stars", "cart-plus-public-component-upsell-tile__star--partial", "cart-plus-public-component-upsell-tile__reviews", "cart-plus-public-component-upsell-tile__price-row", "cart-plus-public-component-upsell-tile__price-compare-at", "cart-plus-public-component-upsell-tile__price", "cart-plus-public-component-upsell-tile__variant-row", "cart-plus-public-component__button", "cart-plus-public-component-loader", "cart-plus-public-upsell__skeleton", "cart-plus-public-upsell__skeleton-title", "cart-plus-public-upsell__skeleton-image", "cart-plus-public-upsell__skeleton-product-title", "cart-plus-public-upsell__skeleton-product-price", "cart-plus-public-notes", "cart-plus-public-component-collapse__dropdown-container", "cart-plus-public-component-collapse__expand-icon", "cart-plus-public-notes__text-container", "cart-plus-public-notes__textarea", "cart-plus-public-discount-code", "cart-plus-public-discount-code__form", "cart-plus-public-discount-code__input-wrapper", "cart-plus-public-discount-code__input", "cart-plus-public-discount-code__suffix", "cart-plus-public-discount-code__error", "cart-plus-public-discount-code__button", "cart-plus-public-discount-code__skeleton", "cart-plus-public-discount-code__skeleton-input", "cart-plus-public-discount-code__skeleton-button", "cart-plus-public-trust-badges", "cart-plus-public-trust-badges__image", "cart-plus-public-rewards", "cart-plus-public-rewards__message", "cart-plus-public-rewards__bar", "cart-plus-public-component-segmented-progress-bar", "cart-plus-public-component-segmented-progress-bar__segments-container", "cart-plus-public-component-segmented-progress-bar__segment", "cart-plus-public-component-segmented-progress-bar__segment-fill", "cart-plus-public-component-segmented-progress-bar__segment-label", "cart-plus-public-component-segmented-progress-bar__milestone", "cart-plus-public-component-segmented-progress-bar__milestone--bottom", "cart-plus-public-component-segmented-progress-bar__milestone--top", "cart-plus-public-component-segmented-progress-bar__milestone--middle", "cart-plus-public-component-segmented-progress-bar__milestone-icon", "cart-plus-public-component-segmented-progress-bar__milestone-label", "cart-plus-public-component-segmented-progress-bar__milestone-label--align-right", "cart-plus-public-component-segmented-progress-bar__milestone-label--align-center", "cart-plus-public-rewards__skeleton", "cart-plus-public-rewards__skeleton-message", "cart-plus-public-rewards__skeleton-bar", "cart-plus-public-component-product-tile", "cart-plus-public-component-product-tile__content", "cart-plus-public-component-product-tile__image-wrapper", "cart-plus-public-component-product-tile__image", "cart-plus-public-component-product-tile__info", "cart-plus-public-component-product-tile__header", "cart-plus-public-component-product-tile__product-title", "cart-plus-public-component-product-tile__title-link", "cart-plus-public-component-product-tile__remove-button", "cart-plus-public-component-product-tile__variant", "cart-plus-public-component-product-tile__properties", "cart-plus-public-component-product-tile__bundle", "cart-plus-public-component-product-tile__product-pricing", "cart-plus-public-component-product-tile__price-compare-at", "cart-plus-public-component-product-tile__price", "cart-plus-public-component-product-tile__savings", "cart-plus-public-component-product-tile__controls", "cart-plus-public-component-product-tile__quantity-selector", "cart-plus-public-component-product-tile__quantity-minus", "cart-plus-public-component-product-tile__quantity-plus", "cart-plus-public-component-product-tile__discount-codes", "cart-plus-public-component-tag", "cart-plus-public-component-tag__icon", "cart-plus-public-component-tag__text", "cart-plus-public-component-product-tile__subscription-upgrade", "cart-plus-public-component-product-tile__select-wrapper", "cart-plus-public-component-product-tile__select", "cart-plus-public-product-properties__subscription", "cart-plus-public-product-properties__item", "cart-plus-public-product-properties__link", "cart-plus-public-cart-items__key-value-pair", "cart-plus-public-bundle-properties", "cart-plus-public-bundle-properties__variant-title", "cart-plus-public-bundle-properties__header", "cart-plus-public-bundle-properties__item-components", "cart-plus-public-bundle-properties__item-component-row", "cart-plus-public-bundle-properties__image-wrapper", "cart-plus-public-bundle-properties__content", "cart-plus-public-bundle-properties__product-title", "cart-plus-public-addons", "cart-plus-public-addons__image-wrapper", "cart-plus-public-addons__content-wrapper", "cart-plus-public-addons__content-title-wrapper", "cart-plus-public-addons__content-title", "cart-plus-public-addons__content-price", "cart-plus-public-addons__compare-at-price", "cart-plus-public-addons__price", "cart-plus-public-addons__content-description", "cart-plus-public-addons__toggle-wrapper", "cart-plus-public-addons__toggle", "cart-plus-public-addons__toggle-switch", "cart-plus-public-addons__toggle-slider", "cart-plus-public-addons__skeleton", "cart-plus-public-addons__skeleton-image", "cart-plus-public-addons__skeleton-text", "cart-plus-public-cart-summary", "cart-plus-public-cart-summary__discount-codes", "cart-plus-public-cart-summary__discount-label", "cart-plus-public-cart-summary__slide-codes", "cart-plus-public-cart-summary__total-discount",
];

export default function Setting({ handleChange, cartSettings }) {
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
                                    {/* <RangeSlider
                                        label={`Traffic allocation percent (${cartSettings.trafficAllocationPercent}%)`}
                                        min={0}
                                        max={100}
                                        value={cartSettings.trafficAllocationPercent}
                                        onChange={(v) => update("trafficAllocationPercent", v)}
                                    /> */}
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
                                    
                                    {cartSettings.goToCartPageOnCheckout && (
                                        <TextField label="View cart button text" value={cartSettings.viewCartName} onChange={(v) => update("viewCartName", v)} />
                                    )}

                                    <Checkbox
                                        label="Show savings with product prices"
                                        checked={cartSettings.showSavingsBelowPrices}
                                        onChange={(v) => update("showSavingsBelowPrices", v)}
                                    />
                                    {/* <Checkbox
                                        label="Enable loading preview for cart"
                                        checked={cartSettings.enableLoadingPreview}
                                        onChange={(v) => update("enableLoadingPreview", v)}
                                    /> */}
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
                        {/* <Card>
                            <BlockStack gap="400">
                                <Text variant="headingMd">Footer</Text>
                                <TextField label="Total discount savings text" value={cartSettings.discountsSavingsText} onChange={(v) => update("discountsSavingsText", v)} />
                                <BlockStack gap="100">
                                    <TextField label="Checkout button text" value={cartSettings.checkoutButtonText} onChange={(v) => update("checkoutButtonText", v)} />
                                    <Text variant="bodyMd" tone="subdued">Use {"{{total_price}}"} to display the total price</Text>
                                </BlockStack>
                            </BlockStack>
                        </Card> */}
                        {/* <Card>
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
                        </Card> */}
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
