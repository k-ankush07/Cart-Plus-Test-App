import {
  Page,
  Button,
  Modal,
  TextField,
  InlineStack,
  Badge,
  Popover,
  ActionList,
  Icon,
  Text,
  Select,
  ButtonGroup,
} from "@shopify/polaris";
import {
  EditIcon,
  ArrowLeftIcon,
  InfoIcon,
  CheckIcon,
  CaretDownIcon,
} from "@shopify/polaris-icons";
import { useState, useEffect, useMemo, useRef, memo } from "react";
import { useNavigate, useLocation, useNavigation } from "react-router-dom";
import "../../index.css";
import {
  renameCart,
  togglePublishCart,
  getCarts,
} from "../../services/apiRoutes";
import { getCurrencySymbol } from "./utils/currency";
import { toggleBanner } from "./utils/banner";
import { toggleTimer } from "./utils/timer";
import { toggleOneTick } from "./utils/oneTick";
import { toggleSummary } from "./utils/summary";
import { toggleAgeVerification } from "./utils/ageVerification";
import { toggleLogin, toggleEmptyLogin } from "./utils/loginMessage";
import { getEmptyUpsells, toggleEmptyUpsells } from "./utils/emptyUpsells";
import { togglePaymentBadges } from "./utils/paymentBadges";
import Upsells from "./cart-Items/Upsells";
import {
  TemplateBackgroundContext,
  templateBackground,
} from "./utils/background";
import {
  CUSTOM_BLOCK_LABEL,
  addCustomBlock,
  getCustomBlocks,
  isCustomBlockKey,
  toggleCustomBlock,
} from "./utils/customBlocks";
import ABTesting from "./ABTesting";

const CartLayout = memo(function CartLayout({
  abTesting,
  activeTab,
  setActiveTab,
  designSettings,
  setDesignSettings,
  Sidebar,
  MainContent,
  CartPreview,
  cart,
  cartName: initialCartName,
  headerSettings,
  handleChange,
  shop,
  apiUrl,
  accessToken,
  announcementSettings,
  rewardsSettings,
  currency,
  recommendationsSettings,
  subscriptionUpgradesSettings,
  upsellsSettings,
  additionalNotesSettings,
  addonsSettings,
  discountCodesSettings,
  expressPaymentsSettings,
  trustBadgesSettings,
  cartSettings,
  triggeredRewardsSettings,
  isDirty,
  onSave,
  onDiscard,
  onResetToDefault,
  isResetting,
  initialPreviewProduct,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useNavigation();

  const [cartName, setCartName] = useState(initialCartName || "Untitled cart");
  const [cartStatus, setCartStatus] = useState(cart?.status || "unpublished");
  const [previewPopoverOpen, setPreviewPopoverOpen] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [previewMode, setPreviewMode] = useState("items");
  // last non-empty selection, restored when returning to "Item in cart"
  const lastPreviewRef = useRef(
    initialPreviewProduct ? [initialPreviewProduct] : [],
  );
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  // Custom HTML / CSS rows live in cartSettings.customBlocks, so they are saved with the cart
  const customItems = useMemo(
    () =>
      getCustomBlocks(cartSettings).map((b) => ({
        key: b.id,
        label: b.label || CUSTOM_BLOCK_LABEL,
      })),
    [cartSettings?.customBlocks],
  );
  const [selectedProduct, setSelectedProduct] = useState("");
  const [previewProducts, setPreviewProducts] = useState(
    initialPreviewProduct ? [initialPreviewProduct] : [],
  );
  const [previewLoading, setPreviewLoading] = useState(!initialPreviewProduct);

  const hadPreviewProductsRef = useRef(false);
  useEffect(() => {
    if (previewProducts.length) {
      lastPreviewRef.current = previewProducts;
      hadPreviewProductsRef.current = true;
    } else if (hadPreviewProductsRef.current) {
      // last product removed → show the empty cart
      setPreviewMode("empty");
    }
  }, [previewProducts]);

  // coming back to "Item in cart" with nothing left brings the last product back
  const changePreviewMode = (mode) => {
    setPreviewMode(mode);
    if (mode === "items" && !previewProducts.length) {
      setPreviewProducts(lastPreviewRef.current);
    }
  };
  const [selectedMarket, setSelectedMarket] = useState("IN");

  // Sync state when cart prop changes (after switching carts via dropdown)
  useEffect(() => {
    setCartName(initialCartName || "Untitled cart");
    setCartStatus(cart?.status || "unpublished");
  }, [cart?.cartId]);

  // Cart switcher popover
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [allCarts, setAllCarts] = useState([]);

  // Rename modal
  const [renameModal, setRenameModal] = useState(false);
  const [newCartName, setNewCartName] = useState(cartName);
  const [renameLoading, setRenameLoading] = useState(false);

  const [publishLoading, setPublishLoading] = useState(false);
  const [unpublishModal, setUnpublishModal] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  // Fetch all carts when popover opens
  useEffect(() => {
    if (!shop?.myshopifyDomain) return;
    getCarts(apiUrl, shop.myshopifyDomain).then((data) => {
      setAllCarts(data.data || []);
    });
  }, []);

  const handleRenameSubmit = async () => {
    if (!newCartName.trim()) return;
    setRenameLoading(true);
    try {
      await renameCart(apiUrl, cart?.cartId, newCartName.trim());
      setCartName(newCartName.trim());
      setRenameModal(false);
      shopify.toast.show("Cart renamed successfully");
    } catch (e) {
      shopify.toast.show("Failed to rename cart", { isError: true });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleTogglePublish = () => {
    if (isPublished) {
      setUnpublishModal(true);
    } else {
      setPublishModal(true);
    }
  };

  const handlePublish = async () => {
    setPublishLoading(true);
    try {
      const data = await togglePublishCart(apiUrl, cart?.cartId);
      if (data.success) {
        const next = cartStatus === "published" ? "unpublished" : "published";
        setCartStatus(next);
        setUnpublishModal(false);
        shopify.toast.show(
          next === "published" ? "Cart published" : "Cart unpublished",
        );
      }
    } catch (e) {
      shopify.toast.show("Failed to update status", { isError: true });
    } finally {
      setPublishLoading(false);
    }
  };

  const isPublished = cartStatus === "published";

  // Build ActionList items: other carts + rename option
  const otherCarts = useMemo(
    () => allCarts.filter((c) => c.cartId !== cart?.cartId),
    [allCarts, cart?.cartId],
  );

  const switcherItems = useMemo(
    () => [
      {
        items: [
          {
            content: (
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isPublished ? (
                    <circle cx="4" cy="4" r="4" fill="#22863a" />
                  ) : (
                    <circle
                      cx="4"
                      cy="4"
                      r="3.5"
                      stroke="#8c8c8c"
                      strokeWidth="1"
                      fill="none"
                    />
                  )}
                </svg>
                {cartName.length > 20
                  ? cartName.slice(0, 20) + "..."
                  : cartName}
              </span>
            ),
            suffix: <Icon source={CheckIcon} />,
            active: true,
            onAction: () => setSwitcherOpen(false),
          },
        ],
      },

      ...(otherCarts.length > 0
        ? [
            {
              items: otherCarts.map((c) => ({
                content: (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {c.status === "published" ? (
                        <circle cx="4" cy="4" r="4" fill="#22863a" />
                      ) : (
                        <circle
                          cx="4"
                          cy="4"
                          r="3.5"
                          stroke="#8c8c8c"
                          strokeWidth="1"
                          fill="none"
                        />
                      )}
                    </svg>
                    {(c.cartName || "Untitled cart").length > 20
                      ? (c.cartName || "Untitled cart").slice(0, 20) + "..."
                      : c.cartName || "Untitled cart"}
                  </span>
                ),
                onAction: () => {
                  setSwitcherOpen(false);
                  navigate(`/app/cart-editor/${c.cartId}`);
                },
              })),
            },
          ]
        : []),

      {
        items: [
          {
            content: "Rename cart",
            icon: EditIcon,
            onAction: () => {
              setSwitcherOpen(false);
              setNewCartName(cartName);
              setRenameModal(true);
            },
          },
        ],
      },
    ],
    [otherCarts, isPublished, cartName, navigate],
  );

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const fromPage = searchParams.get("from");
  const backPath = fromPage === "home" ? "/app" : "/app/carts";

  const isNavigatingBack =
    navigation.state === "loading" &&
    navigation.location?.pathname === backPath;

  useEffect(() => {
    let observer;
    let pollId;

    const moveToLeft = (root) => {
      if (!root) return;
      if (root.classList.contains("widget-position-right")) {
        root.classList.remove("widget-position-right");
        root.classList.add("widget-position-left");
      }
      if (root.classList.contains("sidebar-position-right")) {
        root.classList.remove("sidebar-position-right");
        root.classList.add("sidebar-position-left");
      }
      root.style.bottom = "-50px";
    };

    const trySetup = () => {
      const host = document.getElementById("tidio-chat");
      const root = host?.shadowRoot?.getElementById("tidio-chat-root");

      if (host?.shadowRoot && root) {
        moveToLeft(root);

        observer = new MutationObserver(() => {
          const currentRoot = host.shadowRoot.getElementById("tidio-chat-root");
          moveToLeft(currentRoot);
        });

        observer.observe(host.shadowRoot, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });

        clearInterval(pollId);
      }
    };

    pollId = setInterval(trySetup, 300);
    trySetup();

    return () => {
      clearInterval(pollId);
      if (observer) observer.disconnect();

      const root = document
        .getElementById("tidio-chat")
        ?.shadowRoot?.getElementById("tidio-chat-root");
      if (root) {
        root.classList.remove("widget-position-left", "sidebar-position-left");
        root.classList.add("widget-position-right", "sidebar-position-right");
        root.style.bottom = "";
      }
    };
  }, []);

  const symbol = getCurrencySymbol(currency);
  const templateBg = useMemo(
    () => templateBackground(designSettings),
    [
      designSettings?.colorMode,
      designSettings?.themeColor,
      designSettings?.gradientStart,
      designSettings?.gradientEnd,
      designSettings?.gradientAngle,
    ],
  );

  const sideUpsells =
    previewMode === "items" ? upsellsSettings : getEmptyUpsells(cartSettings);
  const sideLayout = sideUpsells?.layout === "side";
  const isFloating = designSettings?.layout === "floating";

  return (
    <TemplateBackgroundContext.Provider value={templateBg}>
      <Page fullWidth>
        {/* ── Top bar ── */}
        <div
          className={`cart-plus-header-wrapper ${isPreviewVisible ? "preview-visible" : ""} ${designSettings?.desktopWidth === "wide" ? "wide" : "normal"}`}
        >
          {/* Left: cart switcher + badge */}
          <InlineStack gap="200" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="plain"
              loading={isNavigatingBack}
              onClick={() => {
                if (isDirty) {
                  setLeaveModal(true);
                } else {
                  navigate(backPath);
                }
              }}
              accessibilityLabel="Go back"
            />
            <InlineStack gap="200" blockAlign="center">
              <Text as="h2" variant="headingMd">
                {cartName.length > 20
                  ? cartName.slice(0, 20) + "..."
                  : cartName}
              </Text>

              <Button
                variant="plain"
                icon={EditIcon}
                accessibilityLabel="Rename cart"
                onClick={() => {
                  setNewCartName(cartName);
                  setRenameModal(true);
                }}
              />

              <Badge tone={isPublished ? "success" : "info"}>
                {isPublished ? "Live" : "Draft"}
              </Badge>
            </InlineStack>
          </InlineStack>

          {/* Right: actions */}
          <InlineStack gap="200">
            {/* <Popover
              active={previewPopoverOpen}
              activator={
                <Button
                  variant="tertiary"
                  icon={CaretDownIcon}
                  onClick={() => setPreviewPopoverOpen((prev) => !prev)}
                >
                  {previewMode === "items"
                    ? "Show items in cart"
                    : "Show empty cart"}
                </Button>
              }
              onClose={() => setPreviewPopoverOpen(false)}
            >
              <ActionList
                items={[
                  {
                    content: "Show items in cart",
                    onAction: () => {
                      changePreviewMode("items");
                      setPreviewPopoverOpen(false);
                    },
                  },
                  {
                    content: "Show empty cart",
                    onAction: () => {
                      changePreviewMode("empty");
                      setPreviewPopoverOpen(false);
                    },
                  },
                ]}
              />
            </Popover> */}

            <ABTesting key={abTesting?.resetKey} {...abTesting} />

            {/* <Button
              variant="tertiary"
              loading={isResetting}
              onClick={() => setResetModal(true)}
            >
              Reset to default
            </Button>

            <Button
              onClick={() =>
                window.open(`https://${shop?.myshopifyDomain}`, "_blank")
              }
            >
              Preview in store
            </Button> */}

            {/* <Button
              variant="secondary"
              loading={publishLoading}
              onClick={handleTogglePublish}
              icon={
                <img
                  src={
                    isPublished
                      ? "https://www.hubsyntax.com/cart-images/earth.svg"
                      : "https://www.hubsyntax.com/cart-images/close_earth.svg"
                  }
                  width={14}
                  height={14}
                  style={{
                    filter: "brightness(0)",
                    display: "block",
                    marginRight: "4px",
                    opacity: "0.7",
                  }}
                />
              }
            >
              {isPublished ? "Unpublish" : "Publish"}
            </Button> */}
          </InlineStack>
        </div>

        {/* ── Main layout ── */}
        <div
          className="appLayout"
          style={{
            paddingRight: isPreviewVisible
              ? designSettings?.desktopWidth === "wide"
                ? "500px"
                : "440px"
              : "0px",
            transition: "padding-right 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            announcementSettings={announcementSettings}
            rewardsSettings={rewardsSettings}
            recommendationsSettings={recommendationsSettings}
            subscriptionUpgradesSettings={subscriptionUpgradesSettings}
            upsellsSettings={upsellsSettings}
            additionalNotesSettings={additionalNotesSettings}
            addonsSettings={addonsSettings}
            discountCodesSettings={discountCodesSettings}
            expressPaymentsSettings={expressPaymentsSettings}
            trustBadgesSettings={trustBadgesSettings}
            cartSettings={cartSettings}
            handleChange={handleChange}
            initialOrder={cartSettings?.sectionOrder}
            onReorder={(_section, _keys, fullOrder) =>
              handleChange("cartSettings", (prev) => ({
                ...prev,
                sectionOrder: fullOrder,
              }))
            }
            enabledMap={{
              "Banner Image": !!headerSettings?.banner?.enabled,
              Timer: !!headerSettings?.timer?.enabled,
              // announcementSettings.enabled === true means the section is switched off
              Announcement: !announcementSettings?.enabled,
              // same inverted flag for the progress bar
              "Progress Bar": !rewardsSettings?.enabled,
              "One Tick Upsell": !!cartSettings?.oneTick?.enabled,
              // same inverted flag for the subscription upgrade
              "Subscription Upgrade": !subscriptionUpgradesSettings?.enabled,
              // Cross-sell is the Upsells settings, same inverted flag
              "Cross-sell": !upsellsSettings?.enabled,

              "Order notes": !additionalNotesSettings?.enabled,

              Summary: !!cartSettings?.summary?.enabled,
              "Age Verification": !!cartSettings?.ageVerification?.enabled,
              Login: !!cartSettings?.login?.enabled,
              "Empty Cross-sell": !getEmptyUpsells(cartSettings).enabled,
              "Empty Login": !!cartSettings?.emptyLogin?.enabled,
              "Payment Badges": !!cartSettings?.paymentBadges?.enabled,

              "Shipping Protection & Add-ons": !addonsSettings?.enabled,

              "Discount code": !discountCodesSettings?.enabled,

              ...Object.fromEntries(
                getCustomBlocks(cartSettings).map((b) => [b.id, !!b.enabled]),
              ),
            }}
            onToggleItem={(key) => {
              if (isCustomBlockKey(key))
                handleChange("cartSettings", toggleCustomBlock(key));
              if (key === "Banner Image") handleChange("header", toggleBanner);
              if (key === "Timer") handleChange("header", toggleTimer);
              if (key === "Order notes")
                handleChange("additionalNotesSettings", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));
              if (key === "Summary")
                handleChange("cartSettings", toggleSummary);
              if (key === "Login") handleChange("cartSettings", toggleLogin);
              if (key === "Empty Login")
                handleChange("cartSettings", toggleEmptyLogin);
              if (key === "Empty Cross-sell")
                handleChange("cartSettings", toggleEmptyUpsells);
              if (key === "Payment Badges")
                handleChange("cartSettings", togglePaymentBadges);
              if (key === "Age Verification")
                handleChange("cartSettings", toggleAgeVerification);
              if (key === "Cross-sell")
                handleChange("upsellsSettings", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));
              if (key === "Subscription Upgrade")
                handleChange("subscriptionUpgradesSettings", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));
              if (key === "One Tick Upsell")
                handleChange("cartSettings", toggleOneTick);
              if (key === "Progress Bar")
                handleChange("rewardsSettings", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));
              if (key === "Announcement")
                handleChange("announcement", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));
              if (key === "Shipping Protection & Add-ons")
                handleChange("addonsSettings", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));

              if (key === "Discount code")
                handleChange("discountCodesSettings", (prev) => ({
                  ...prev,
                  enabled: !prev.enabled,
                }));
            }}
            previewMode={previewMode === "items" ? "cart" : "empty"}
            setPreviewMode={(m) =>
              changePreviewMode(m === "cart" ? "items" : "empty")
            }
            selectedPreviewProducts={previewProducts}
            onPreviewProductsChange={setPreviewProducts}
            onPreviewLoading={setPreviewLoading}
            markets={[
              { label: "Default (India)", value: "IN" },
              { label: "United States", value: "US" },
            ]}
            market={selectedMarket}
            onMarketChange={setSelectedMarket}
            customItems={customItems}
            onAddCustomItem={(id) =>
              handleChange("cartSettings", addCustomBlock(id))
            }
          />

          <MainContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            designSettings={designSettings}
            setDesignSettings={setDesignSettings}
            headerSettings={headerSettings}
            handleChange={handleChange}
            shop={shop}
            accessToken={accessToken}
            apiUrl={apiUrl}
            announcementSettings={announcementSettings}
            rewardsSettings={rewardsSettings}
            recommendationsSettings={recommendationsSettings}
            subscriptionUpgradesSettings={subscriptionUpgradesSettings}
            upsellsSettings={upsellsSettings}
            additionalNotesSettings={additionalNotesSettings}
            addonsSettings={addonsSettings}
            discountCodesSettings={discountCodesSettings}
            expressPaymentsSettings={expressPaymentsSettings}
            trustBadgesSettings={trustBadgesSettings}
            cartSettings={cartSettings}
            triggeredRewardsSettings={triggeredRewardsSettings}
            currency={currency}
            cartStatus={cartStatus}
            cartId={cart?.cartId}
          />
        </div>

        {/* ── Unpublish confirmation modal ── */}
        <Modal
          open={unpublishModal}
          onClose={() => setUnpublishModal(false)}
          title={`Unpublish '${cartName}'?`}
          size="small"
          primaryAction={{
            content: "Unpublish Cart",
            tone: "critical",
            loading: publishLoading,
            onAction: handlePublish,
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setUnpublishModal(false) },
          ]}
        >
          <Modal.Section>
            Unpublishing will set this cart to draft. No cart will be live until
            you publish another.
          </Modal.Section>
        </Modal>

        {/* ── Rename modal ── */}
        <Modal
          open={renameModal}
          onClose={() => setRenameModal(false)}
          title="Rename cart"
          size="small"
          primaryAction={{
            content: "Save",
            loading: renameLoading,
            onAction: handleRenameSubmit,
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setRenameModal(false) },
          ]}
        >
          <Modal.Section>
            <TextField
              label={
                <span>
                  Cart name{" "}
                  <span class="required-asterisk" aria-hidden="true">
                    {" "}
                    *
                  </span>
                </span>
              }
              value={newCartName}
              onChange={(val) => val.length <= 150 && setNewCartName(val)}
              autoComplete="off"
              maxLength={150}
              showCharacterCount
            />
          </Modal.Section>
        </Modal>

        {/* ── Publish confirmation modal ── */}
        <Modal
          open={publishModal}
          onClose={() => setPublishModal(false)}
          title={`Publish "${cartName}"?`}
          size="small"
          primaryAction={{
            content: "Publish cart",
            loading: publishLoading,
            onAction: async () => {
              await handlePublish();
              setPublishModal(false);
            },
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setPublishModal(false) },
          ]}
        >
          <Modal.Section>
            <p>
              Publishing will make this cart live. The current live cart will be
              moved to draft.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                backgroundColor: "#EBF5FB",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "12px",
              }}
            >
              <span
                aria-hidden="true"
                className="icon color-base tone-auto size-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                  <path d="M8 12a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-.75.75"></path>
                  <path d="M7 5a1 1 0 1 1 2 0 1 1 0 0 1-2 0"></path>
                  <path
                    fillRule="evenodd"
                    d="M15 8a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-1.5 0a5.5 5.5 0 1 1-11 0 5.5 5.5 0 1 1 11 0"
                  ></path>
                </svg>
              </span>
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    color: "#003a5a",
                    marginBottom: "4px",
                  }}
                >
                  Your cart has triggered rewards
                </p>
                <p style={{ color: "#003a5a" }}>
                  Once this cart is live, triggered rewards discounts will be
                  active via Shopify's discount system — even if the app embed
                  is off.
                </p>
              </div>
            </div>
          </Modal.Section>
        </Modal>

        <Modal
          open={leaveModal}
          onClose={() => setLeaveModal(false)}
          title="Save before leaving?"
          size="small"
          primaryAction={{
            content: "Save",
            loading: leaveSaving,
            onAction: async () => {
              try {
                setLeaveSaving(true);
                await onSave?.();
                setLeaveModal(false);
                navigate(backPath);
              } catch (e) {
                shopify.toast.show("Failed to save changes", { isError: true });
              } finally {
                setLeaveSaving(false);
              }
            },
          }}
          secondaryActions={[
            {
              content: "Discard",
              onAction: () => {
                onDiscard?.();
                setLeaveModal(false);
                navigate(backPath);
              },
            },
          ]}
        >
          <Modal.Section>Save or discard changes to exit.</Modal.Section>
        </Modal>

        {/* ── Reset to default confirmation modal ── */}
        <Modal
          open={resetModal}
          onClose={() => setResetModal(false)}
          title="Reset to default settings?"
          size="small"
          primaryAction={{
            content: "Reset to default",
            tone: "critical",
            loading: isResetting,
            onAction: async () => {
              await onResetToDefault?.();
              setResetModal(false);
            },
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setResetModal(false) },
          ]}
        >
          <Modal.Section>
            This restores every section of this cart — appearance, header, and
            all modules — to the app's default settings and saves immediately.
            Your current customizations for this cart will be lost and this
            can't be undone.
          </Modal.Section>
        </Modal>
      </Page>

      {/* Toggle arrow — fixed outside wrapper so overflow:hidden never clips it */}
      <button
        className="show-icon-toggleCartVisibility"
        onClick={() => setIsPreviewVisible((v) => !v)}
        title={isPreviewVisible ? "Hide preview" : "Show preview"}
      >
        <Icon source={ArrowLeftIcon} />
      </button>

      <div
        className={`cart-plus-cartPreviewWrapper ${designSettings?.desktopWidth === "wide" ? "cart-wide" : "cart-normal"}`}
        style={{
          width: isPreviewVisible ? undefined : "0px",
          ...(sideLayout ? { overflow: "visible" } : {}),
          ...(designSettings?.colorMode && designSettings?.layout === "floating"
            ? { background: "#eceef0" }
            : {}),
        }}
      >
        <div className="cart-plus-upsell-site"></div>
        <CartPreview
          designSettings={designSettings}
          headerSettings={headerSettings}
          announcementSettings={announcementSettings}
          rewardsSettings={rewardsSettings}
          recommendationsSettings={recommendationsSettings}
          subscriptionUpgradesSettings={subscriptionUpgradesSettings}
          upsellsSettings={upsellsSettings}
          additionalNotesSettings={additionalNotesSettings}
          addonsSettings={addonsSettings}
          discountCodesSettings={discountCodesSettings}
          expressPaymentsSettings={expressPaymentsSettings}
          trustBadgesSettings={trustBadgesSettings}
          cartSettings={cartSettings}
          sectionOrder={cartSettings?.sectionOrder}
          currency={symbol}
          activeTab={activeTab}
          previewMode={previewMode}
          shop={shop}
          apiUrl={apiUrl}
          previewProducts={previewProducts}
          previewLoading={previewLoading}
          onAddPreviewProduct={(product, variant) =>
            setPreviewProducts((prev) => {
              const existing = prev.find((p) => p.id === product.id);
              if (!existing)
                return [...prev, { ...product, variants: [variant] }];
              if (existing.variants.some((v) => v.id === variant.id))
                return prev;
              return prev.map((p) =>
                p.id === product.id
                  ? { ...p, variants: [...p.variants, variant] }
                  : p,
              );
            })
          }
          onRemovePreviewProduct={(id, variantId) =>
            setPreviewProducts((prev) =>
              prev
                .map((p) =>
                  p.id === id
                    ? {
                        ...p,
                        variants: variantId
                          ? p.variants.filter((v) => v.id !== variantId)
                          : [],
                      }
                    : p,
                )
                .filter((p) => p.variants.length),
            )
          }
          onClosePreview={() => setIsPreviewVisible(false)}
        />
      </div>
    </TemplateBackgroundContext.Provider>
  );
});

export default CartLayout;
