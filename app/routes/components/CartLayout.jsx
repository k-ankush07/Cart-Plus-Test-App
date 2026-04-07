import { Page, Button } from "@shopify/polaris";
import "../../index.css";

export default function CartLayout({
  activeTab,
  setActiveTab,
  designSettings,
  setDesignSettings,
  Sidebar,
  MainContent,
  CartPreview,
  cartName,
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
}) {
  return (
    <Page fullWidth>
      <div style={{ marginBottom: "10px" }}>
        <Button >{cartName || "Untitled cart"}</Button>
      </div>
      <div className="appLayout">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab}
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
    </Page>
  );
}