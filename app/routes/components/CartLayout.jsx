import { Page, Button, Modal, TextField, InlineStack, Badge, Popover, ActionList } from "@shopify/polaris";
import { EditIcon, ChevronDownIcon } from "@shopify/polaris-icons";
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

  const handleTogglePublish = async () => {
    setPublishLoading(true);
    try {
      const data = await togglePublishCart(apiUrl, cart?.cartId);
      if (data.success) {
        const next = cartStatus === "published" ? "unpublished" : "published";
        setCartStatus(next);
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
    <Page fullWidth>
      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>

        {/* Left: cart switcher + badge */}
        <InlineStack gap="200" blockAlign="center">
          <Popover
            active={switcherOpen}
            activator={
              <>
                <Button
                  disclosure="down"
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
      <div className="appLayout">
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

        <div className="cartPreviewWrapper">
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
          />
        </div>
      </div>

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
  );
}
