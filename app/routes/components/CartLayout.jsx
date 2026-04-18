import { Page, Button, Modal, TextField, InlineStack, Badge, Popover, ActionList, Icon } from "@shopify/polaris";
import { EditIcon, ArrowLeftIcon, } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../index.css";
import { renameCart, togglePublishCart, getCarts } from "../../services/apiRoutes";

export default function CartLayout({
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
  isDirty
}) {
  const navigate = useNavigate();

  const [cartName, setCartName] = useState(initialCartName || "Untitled cart");
  const [cartStatus, setCartStatus] = useState(cart?.status || "unpublished");
  const [previewPopoverOpen, setPreviewPopoverOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState("items");
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
    if (!switcherOpen || !shop?.myshopifyDomain) return;
    getCarts(apiUrl, shop.myshopifyDomain).then((data) => {
      setAllCarts(data.data || []);
    });
  }, [switcherOpen]);

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
      handlePublish();
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
        shopify.toast.show(next === "published" ? "Cart published" : "Cart unpublished");
      }
    } catch (e) {
      shopify.toast.show("Failed to update status", { isError: true });
    } finally {
      setPublishLoading(false);
    }
  };

  const isPublished = cartStatus === "published";

  // Build ActionList items: other carts + rename option
  const otherCarts = allCarts.filter((c) => c.cartId !== cart?.cartId);

  const switcherItems = [
    ...(otherCarts.length > 0
      ? [{
        items: otherCarts.map((c) => ({
          content: c.cartName || "Untitled cart",
          suffix: c.status === "published"
            ? <Badge tone="success">Live</Badge>
            : null,
          onAction: () => {
            setSwitcherOpen(false);
            navigate(`/app/cart-editor/${c.cartId}`);
          },
        })),
      }]
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
  ];

  return (
    <>
      <Page fullWidth>
        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", paddingRight: isPreviewVisible ? (designSettings?.desktopWidth === "wide" ? "500px" : "440px") : "0px", transition: "padding-right 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}>

          {/* Left: cart switcher + badge */}
          <InlineStack gap="200" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="plain"
              onClick={() => navigate("/app/carts")}
              accessibilityLabel="Go back"
            />
            <Popover
              active={switcherOpen}
              activator={
                <>
                  <Button
                    disclosure="down"
                    disabled={isDirty}
                    onClick={() => setSwitcherOpen((o) => !o)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {cartName}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwitcherOpen(false);
                          setNewCartName(cartName);
                          setRenameModal(true);
                        }}
                        style={{ display: "flex", alignItems: "center", opacity: 0.6 }}
                        title="Rename cart"
                      >
                      </span>
                    </span>
                  </Button>
                </>
              }
              onClose={() => setSwitcherOpen(false)}
            >
              <ActionList sections={switcherItems} />
            </Popover>


            {/* Edit icon — opens rename modal directly */}
            <Button
              icon={EditIcon}
              variant="plain"
              onClick={() => { setNewCartName(cartName); setRenameModal(true); }}
              accessibilityLabel="Rename cart"
            />

            <Badge tone={isPublished ? "success" : "info"}>
              {isPublished ? "Live" : "Draft"}
            </Badge>
          </InlineStack>

          {/* Right: actions */}
          <InlineStack gap="200">
            <Popover
              active={previewPopoverOpen}
              activator={
                <Button
                  disclosure="down"
                  onClick={() => setPreviewPopoverOpen((prev) => !prev)}
                >
                  {previewMode === "items" ? "Show items in cart" : "Show empty cart"}
                </Button>
              }
              onClose={() => setPreviewPopoverOpen(false)}
            >
              <ActionList
                items={[
                  {
                    content: "Show items in cart",
                    onAction: () => {
                      setPreviewMode("items");
                      setPreviewPopoverOpen(false);
                    },
                  },
                  {
                    content: "Show empty cart",
                    onAction: () => {
                      setPreviewMode("empty");
                      setPreviewPopoverOpen(false);
                    },
                  },
                ]}
              />
            </Popover>
            <Button onClick={() => window.open(`https://${shop?.myshopifyDomain}`, "_blank")}>
              Preview in store
            </Button>

            <Button
              tone={isPublished ? "critical" : "success"}
              loading={publishLoading}
              onClick={handleTogglePublish}
            >
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          </InlineStack>
        </div>

        {/* ── Main layout ── */}
        <div
          className="appLayout"
          style={{ paddingRight: isPreviewVisible ? (designSettings?.desktopWidth === "wide" ? "500px" : "440px") : "0px", transition: "padding-right 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
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
          />

          <MainContent
            activeTab={activeTab}
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
          />
        </div>

        {/* ── Unpublish confirmation modal ── */}
        <Modal
          open={unpublishModal}
          onClose={() => setUnpublishModal(false)}
          title={`Unpublish '${cartName}'?`}
          primaryAction={{
            content: "Unpublish",
            tone: "critical",
            loading: publishLoading,
            onAction: handlePublish,
          }}
          secondaryActions={[
            { content: "Cancel", onAction: () => setUnpublishModal(false) },
          ]}
        >
          <Modal.Section>
            Unpublishing will set this cart to draft. No cart will be live until you publish another.
          </Modal.Section>
        </Modal>

        {/* ── Rename modal ── */}
        <Modal
          open={renameModal}
          onClose={() => setRenameModal(false)}
          title="Rename cart"
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
              label="Cart name *"
              value={newCartName}
              onChange={setNewCartName}
              autoComplete="off"
            />
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
        className="cartPreviewWrapper"
        style={{
          width: isPreviewVisible ? (designSettings?.desktopWidth === "wide" ? "500px" : "440px") : "0px",
        }}
      >
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
          currency={currency}
          activeTab={activeTab}
          previewMode={previewMode}
          onClosePreview={() => setIsPreviewVisible(false)}
        />
      </div>
    </>
  );
}
