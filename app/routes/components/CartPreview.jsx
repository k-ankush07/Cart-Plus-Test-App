import { Fragment, memo, useMemo, useState } from "react";
import { DEFAULT_HEADER_ORDER, resolveOrder } from "./utils/sectionOrder";
import CartItem from "./cart-Items/CartItem";
import "../../index.css";
import Announcements from "./cart-Items/Announcements";
import TieredReward from "./cart-Items/TieredRewards";
import CartHeading from "./cart-Items/CartHeading";
import CartFooter from "./cart-Items/CartFooter";
import Recommendation from "./cart-Items/Recommendation";
import EmptyCart from "./cart-Items/EmptyCart";
import LoginMessage from "./cart-Items/LoginMessage";
import { getEmptyUpsells } from "./utils/emptyUpsells";
import Subscription from "./cart-Items/Subscription";
import Upsells from "./cart-Items/Upsells";
import AdditionalNotes from "./cart-Items/AdditionalNotes";
import TrustBadges from "./cart-Items/TrustBadges";
import CustomHtml from "./cart-Items/CustomHtml";
import { getCustomBlocks, placedBlockIds } from "./utils/customBlocks";
import { customBlockNodes } from "./cart-Items/CustomBlocks";
import BannerImage from "./cart-Items/BannerImage";
import Timer from "./cart-Items/Timer";
import OneTickUpsell from "./cart-Items/OneTickUpsell";
import SectionBg from "./cart-Items/SectionBg";
import { backgroundToCss } from "./utils/background";
import { getCartItemOptions } from "./utils/cartItemOptions";
import { applyTemplateTheme } from "./utils/templateTheme";

function scopeCss(css, scope) {
  if (!css) return "";
  let result = css.replace(/([^{}@][^{}]*)\{/g, (_match, selectors) => {
    const scoped = selectors
      .split(",")
      .map((s) => {
        const t = s.trim();
        if (!t) return t;
        return `${scope} ${t}`;
      })
      .join(", ");
    return `${scoped} {`;
  });
  result = result.replace(
    /([\w-]+\s*:\s*)([^;!{}]+?)(\s*;)/g,
    (_m, prop, val, semi) => {
      return `${prop}${val.trim()} !important${semi}`;
    },
  );
  return result;
}

const CartPreview = memo(function CartPreview({
  currency,
  designSettings: rawDesignSettings,
  headerSettings,
  announcementSettings,
  rewardsSettings,
  recommendationsSettings,
  activeTab,
  subscriptionUpgradesSettings,
  upsellsSettings,
  additionalNotesSettings,
  addonsSettings,
  discountCodesSettings,
  trustBadgesSettings,
  cartSettings,
  sectionOrder,
  previewMode,
  onClosePreview,
  shop,
  apiUrl,
  previewProducts,
  previewLoading,
  onRemovePreviewProduct,
  onAddPreviewProduct,
}) {
  const designSettings = useMemo(
    () => applyTemplateTheme(rawDesignSettings),
    [rawDesignSettings],
  );
  const emptyCart = previewMode === "empty";
  const floating = !!designSettings.floating;
  const maxWidth = designSettings.desktopWidth === "wide" ? 500 : 440;

  const scopedCustomCss = useMemo(
    () => scopeCss(cartSettings?.customCss, ".cart-app"),
    [cartSettings?.customCss],
  );
  // sidebar "Custom HTML / CSS" rows: CSS rows join the custom CSS, HTML rows render under the body rows
  const customBlocks = useMemo(
    () => getCustomBlocks(cartSettings).filter((b) => b.enabled && b.code),
    [cartSettings?.customBlocks],
  );
  const blocksCss = useMemo(
    () =>
      scopeCss(
        customBlocks
          .filter((b) => b.type === "css")
          .map((b) => b.code)
          .join("\n"),
        ".cart-app",
      ),
    [customBlocks],
  );
  const blockNodes = useMemo(
    () => customBlockNodes(cartSettings),
    [cartSettings?.customBlocks],
  );
  const placed = useMemo(
    () => placedBlockIds(cartSettings),
    [cartSettings?.sectionOrder],
  );
  const [qty, setQty] = useState(1);
  const [subtotal, setSubtotal] = useState(null);
  const [compareTotal, setCompareTotal] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);

  // the Empty cart has its own Cross-sell settings
  const sideUpsells = emptyCart ? getEmptyUpsells(cartSettings) : upsellsSettings;

  const bodyBg = backgroundToCss(getCartItemOptions(cartSettings).sectionBackground);
  const showTopRows =!emptyCart && activeTab !== "Recommended Products";
  const headerBlocks = {
    ...blockNodes,
    "Banner Image": (
      <SectionBg id="Banner Image" cartSettings={cartSettings}>
        <BannerImage headerSettings={headerSettings} />
      </SectionBg>
    ),
    Announcement: showTopRows &&
      !announcementSettings.enabled &&
      announcementSettings.position === "before" && (
        <Announcements
          announcementSettings={announcementSettings}
          cartSettings={cartSettings}
        />
      ),
    Timer: !emptyCart && (
      <Timer headerSettings={headerSettings} designSettings={designSettings} />
    ),
    "Progress Bar": !rewardsSettings.enabled &&
      (emptyCart ? rewardsSettings.showOnEmptyCart : showTopRows) && (
        <SectionBg id="Progress Bar" cartSettings={cartSettings}>
          <TieredReward rewardsSettings={rewardsSettings} currency={currency} />
        </SectionBg>
      ),
  };
  // Body-section rows. With no saved order, Cross-sell keeps following its Top / Bottom setting.
  const bodyBlocks = {
    ...blockNodes,
    "One Tick Upsell": (
      <SectionBg id="One Tick Upsell" cartSettings={cartSettings}>
        <OneTickUpsell
          cartSettings={cartSettings}
          designSettings={designSettings}
          currency={currency}
          previewProducts={previewProducts}
          onAddPreviewProduct={onAddPreviewProduct}
          onRemovePreviewProduct={onRemovePreviewProduct}
        />
      </SectionBg>
    ),
    "Products in cart": (
      <>
        <CartItem
          showStrikethrough={designSettings.showStrikethrough}
          textColor={designSettings.textColor}
          savingColor={designSettings.savingsColor}
          Subscription={Subscription}
          subscriptionUpgradesSettings={subscriptionUpgradesSettings}
          cartSettings={cartSettings}
          setQty={setQty}
          qty={qty}
          designSettings={designSettings}
          currency={currency}
          previewProducts={previewProducts}
          onSubtotalChange={setSubtotal}
          onCompareTotalChange={setCompareTotal}
          loading={previewLoading}
          onRemovePreviewProduct={onRemovePreviewProduct}
        />

        {!upsellsSettings.enabled &&
          upsellsSettings.showSuggestedProduct &&
          upsellsSettings?.suggestedProduct?.items?.titles?.length > 0 && (
            <div className="upsell-suggestion">
              <label className="upsell-checkbox-wrapper">
                <input type="checkbox" />
                <span className="custom-checkbox"></span>
                <span className="upsell-text">
                  {upsellsSettings?.suggestedProduct?.items?.titles?.[0]}
                </span>
              </label>
            </div>
          )}

        <CustomHtml cartSettings={cartSettings} position="between_line_items" />
      </>
    ),
    "Cross-sell":
      !upsellsSettings.enabled && (
        <SectionBg id="Upsells" cartSettings={cartSettings}>
          <Upsells
            upsellsSettings={upsellsSettings}
            designSettings={designSettings}
            currency={currency}
            cartSettings={cartSettings}
          />
        </SectionBg>
      ),
  };
  const defaultBodyOrder =
    upsellsSettings?.position === "top"
      ? ["Cross-sell", "One Tick Upsell", "Products in cart"]
      : ["One Tick Upsell", "Products in cart", "Cross-sell"];
  const bodyOrder = sectionOrder?.Body
    ? resolveOrder(sectionOrder.Body, defaultBodyOrder)
    : defaultBodyOrder;
  const headerOrder = resolveOrder(sectionOrder?.Header, DEFAULT_HEADER_ORDER);

  return (
    <div
      className={`cart-app cart-plus ${designSettings.inheritFonts ? "" : "cart-app--customFont"} ${designSettings.themed ? "cart-app--themed" : ""} ${designSettings.dark ? "cart-app--dark" : ""}`}
      style={{
        backgroundColor: designSettings.backgroundColor,
        ...(designSettings.bodyBackground
          ? { background: designSettings.bodyBackground }
          : {}),
        maxWidth: floating ? `${maxWidth - 32}px` : `${maxWidth}px`,
        width: "100%",
        position: "relative",
        overflowY: cartSettings?.disableFixedFooter ? "auto" : "unset",
        ...(designSettings.themed
          ? {
              "--cp-surface": designSettings.backgroundColor,
              "--cp-text": designSettings.textColor,
              "--cp-card-radius": `${designSettings.cardRadius}px`,
              "--cp-field-radius": `${designSettings.fieldRadius}px`,
              "--cp-image-radius": `${designSettings.imageRadius}px`,
              ...(designSettings.accentBorder ? { "--cp-accent-border": designSettings.accentBorder } : {}),
              color: designSettings.textColor,
            }
          : {}),
        ...(floating
          ? {
              top: "16px",
              right: "16px",
              height: "calc(100vh - 32px)",
              borderRadius: `${designSettings.drawerRadius}px`,
              overflowX: "hidden",
              overflowY: "hidden",
            }
          : {}),
      }}
    >
      {/* Cross-sell "Side panel" layout: a strip of products beside the cart */}
      {!sideUpsells.enabled &&
        sideUpsells.layout === "side" && (
          <Upsells
            sidePanel
            upsellsSettings={sideUpsells}
            designSettings={designSettings}
            currency={currency}
            cartSettings={cartSettings}
          />
        )}

      {offerOpen && (
        <div
          onClick={() => setOfferOpen(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        />
      )}

      {(cartSettings?.customCss || blocksCss) && (
        <style
          dangerouslySetInnerHTML={{ __html: scopedCustomCss + "\n" + blocksCss }}
        />
      )}

      <div
        className="cart-app__container styles_CartPreview__card__"
        style={{ position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        {breakdownOpen && (
          <div
            onClick={() => setBreakdownOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,.25)",
              zIndex: 8,
            }}
          />
        )}

        <div
          className="cart-app__heading"
          style={
            designSettings.headerBackground
              ? { background: designSettings.headerBackground }
              : undefined
          }
        >
          <CartHeading
            headerSettings={headerSettings}
            designSettings={designSettings}
            onClose={onClosePreview}
            qty={qty}
          />
          {headerSettings.border === "thin" && (
            <div className="cart-app__divider"></div>
          )}
        </div>

        {/* Header-section rows, in the order set by dragging them in the sidebar */}
        {headerOrder.map((key) => (
          <Fragment key={key}>{headerBlocks[key]}</Fragment>
        ))}

        {/* below_header */}
        <CustomHtml cartSettings={cartSettings} position="below_header" />

        <div
          className="cart-app__body cart-plus-body"
          style={{
            overflowY: cartSettings?.disableFixedFooter ? "unset" : "auto",
            ...(bodyBg ? { background: bodyBg } : {}),
          }}
        >
          {emptyCart ? (
            <>
              <EmptyCart
                cartSettings={cartSettings}
                designSettings={designSettings}
                footer={
                  !getEmptyUpsells(cartSettings).enabled && (
                    <SectionBg id="Upsells" cartSettings={cartSettings}>
                      <Upsells
                        upsellsSettings={getEmptyUpsells(cartSettings)}
                        designSettings={designSettings}
                        currency={currency}
                        cartSettings={cartSettings}
                      />
                    </SectionBg>
                  )
                }
              >
                <LoginMessage cartSettings={cartSettings} settingsKey="emptyLogin" />
              </EmptyCart>
            </>
          ) : (
            <>
              {!emptyCart && activeTab !== "Recommended Products" && (
                <>
                  <CustomHtml
                    cartSettings={cartSettings}
                    position="above_announcements"
                  />

                  {trustBadgesSettings?.position === "top" && (
                    <SectionBg id="Security Badges" cartSettings={cartSettings}>
                      <TrustBadges trustBadgesSettings={trustBadgesSettings} />
                    </SectionBg>
                  )}

                  {/* Body rows, in the order set by dragging them in the sidebar */}
                  {bodyOrder.map((key) => (
                    <Fragment key={key}>{bodyBlocks[key]}</Fragment>
                  ))}

                  <div className="cart-app__bottom-group">
                    <CustomHtml
                      cartSettings={cartSettings}
                      position="below_cart_items"
                    />

                    {/* {!additionalNotesSettings.enabled &&
                      additionalNotesSettings.placement === "below_items" && (
                        <SectionBg id="Add Notes" cartSettings={cartSettings}>
                          <AdditionalNotes
                            additionalNotesSettings={additionalNotesSettings}
                            designSettings={designSettings}
                          />
                        </SectionBg>
                      )} */}

                    {!announcementSettings.enabled &&
                      announcementSettings.position === "after" && (
                        <Announcements
                          announcementSettings={announcementSettings}
                          cartSettings={cartSettings}
                        />
                      )}
                  </div>
                </>
              )}

            </>
          )}
        </div>

        {/* above_footer */}
        {!emptyCart && activeTab !== "Recommended Products" && (
          <CustomHtml cartSettings={cartSettings} position="above_footer" />
        )}

        {!emptyCart && activeTab !== "Recommended Products" && (
          <CartFooter
            designSettings={designSettings}
            additionalNotesSettings={additionalNotesSettings}
            addonsSettings={addonsSettings}
            currency={currency}
            discountCodesSettings={discountCodesSettings}
            trustBadgesSettings={trustBadgesSettings}
            disableFixedFooter={cartSettings?.disableFixedFooter}
            cartSettings={cartSettings}
            sectionOrder={sectionOrder}
            subtotal={subtotal}
            compareTotal={compareTotal}
            setBreakdownOpen={setBreakdownOpen}
            breakdownOpen={breakdownOpen}
            setOfferOpen={setOfferOpen}
            offerOpen={offerOpen}
            shop={shop.myshopifyDomain}
            apiUrl={apiUrl}
          />
        )}

        {/* bottom_of_cart */}
        {!emptyCart && (
          <CustomHtml cartSettings={cartSettings} position="bottom_of_cart" />
        )}

        {/* sidebar Custom HTML blocks not dragged into a section sit at the very end */}
        {!emptyCart &&
          customBlocks
            .filter((b) => b.type !== "css" && !placed.has(b.id))
            .map((b) => blockNodes[b.id])}
      </div>
    </div>
  );
});

export default CartPreview;
