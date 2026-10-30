import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";
import { applyDiscount } from "../utils/oneTick";
import { backgroundToCss } from "../utils/background";
import { getCartItemOptions } from "../utils/cartItemOptions";
import { LibraryIcon } from "../ui/IconLibrary";
import NoProductPlaceholder from "../ui/NoProductPlaceholder";

function hexToRGBA(hex = "#16a34a", opacity = 1) {
  if (!hex || typeof hex !== "string") {
    hex = "#16a34a";
  }

  if (hex.startsWith("rgb")) {
    return hex.replace("rgb", "rgba").replace(")", `, ${opacity})`);
  }

  const validHex = hex.replace("#", "");

  if (validHex.length !== 6) {
    return `rgba(22, 163, 74, ${opacity})`;
  }

  const r = parseInt(validHex.substring(0, 2), 16);
  const g = parseInt(validHex.substring(2, 4), 16);
  const b = parseInt(validHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function Upsells({
  upsellsSettings,
  designSettings,
  currency,
  cartSettings,
  sidePanel = false, // the Side panel layout is drawn beside the cart, see CartPreview
}) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [navReady, setNavReady] = useState(false);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);
  const fillRef = useRef(null);

  // compact layout: scroll track + arrow state
  const compactRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const {
    useAiRecommended,
    selectedItems = [],
    sourceType,
    title,
    buttonText = "Add",
    direction = "block",
    showReviews = false,
    maxUpsellsInCart,
    limitUpsellsInCart,
    carouselIndicator = "progressBar",
    trigger = "button",
    discountType = "none",
    discountValue = 10,
    showLabel = true,
    labelText = "Save {{saved_percentage}}",
    imageSize = null,
    radius = null,
    primaryTextColor = null,
    secondaryTextColor = null,
    buttonRadius = null,
    buttonFontSize = null,
    buttonBackground = null,
    buttonTextColor = null,
    cardBackground = null,
  } = upsellsSettings || {};
  const layout =
    upsellsSettings?.layout && upsellsSettings.layout !== "row"
      ? upsellsSettings.layout
      : direction === "carousel"
        ? "carousel"
        : "list";
  const primary = primaryTextColor || designSettings.textColor || "#6b7280";
  const secondary = secondaryTextColor || primary;
  const bodyBg = backgroundToCss(
    getCartItemOptions(cartSettings).sectionBackground,
  );
  // title icon: star until one is picked, null (cleared) = none
  const titleIcon =
    upsellsSettings?.icon === undefined
      ? { type: "icon", name: "star" }
      : upsellsSettings.icon;

  const imageBox = {
    width: imageSize || 70,
    minWidth: imageSize || 70,
    flexShrink: 0,
    aspectRatio: "1 / 1",
    ...(radius !== null ? { borderRadius: radius, overflow: "hidden" } : {}),
  };

  const updateProgress = (swiper) => {
    if (!swiper || swiper.destroyed || !swiper.slides?.length) return;
    const total = swiper.slides.length;
    if (!fillRef.current) return;
    const perView = swiper.params.slidesPerView || 1;
    const visibleRatio = perView / total;
    const fill = (visibleRatio + swiper.progress * (1 - visibleRatio)) * 100;
    fillRef.current.style.width = Math.min(100, fill) + "%";
  };

  /* ---------- compact: arrows helpers ---------- */
  const updateEdge = () => {
    const el = compactRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  };

  const scrollCompact = (dir) => {
    const el = compactRef.current;
    if (!el) return;
    const tileW = el.firstElementChild?.getBoundingClientRect().width || 96;
    el.scrollBy({ left: dir * (tileW + 8) * 2, behavior: "smooth" }); // 2 tiles per click
  };

  useEffect(() => {
    if (layout === "compact") setTimeout(updateEdge, 0);
  }, [products, layout, imageSize, loadingProducts]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (swiperRef.current) updateProgress(swiperRef.current);
    }, 0);
    return () => clearTimeout(t);
  }, [products]);

  // ── Fetch real Shopify products (no fake/default products) ───────────
  useEffect(() => {
    let cancelled = false;

    const noProductsSelected =
      sourceType === "products" &&
      !selectedItems?.variants?.length &&
      !selectedItems?.products?.length;

    const noCollectionsSelected =
      sourceType === "collections" && !selectedItems?.length;

    // AI recommended ya kuch select nahi -> store ke koi bhi real products
    const useAny =
      useAiRecommended || noProductsSelected || noCollectionsSelected;

    setLoadingProducts(true);

    fetch("/shopify/get-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantIds:
          !useAny && sourceType === "products"
            ? selectedItems?.variants || []
            : [],
        collectionIds:
          !useAny && sourceType === "collections" ? selectedItems || [] : [],
        anyProducts: useAny,
        // hand-picked products: show all of them ("Set Upsell Limit in Cart" caps it below);
        // otherwise just a few store products
        limit:
          !useAny && sourceType === "products"
            ? Math.max(selectedItems?.products?.length || 0, 3)
            : 3,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        const list = (data.products || []).filter((p) => p.variants?.length);
        const limit = limitUpsellsInCart ? maxUpsellsInCart : list.length;
        const productsData = list.slice(0, limit);

        setProducts(productsData);

        const initial = {};
        productsData.forEach((p) => {
          initial[p.id] = p.variants[0];
        });
        setSelectedVariants(initial);
        setLoadingProducts(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    useAiRecommended,
    sourceType,
    limitUpsellsInCart,
    maxUpsellsInCart,
    JSON.stringify(selectedItems),
  ]);

  const handleVariantChange = (productId, variantId) => {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    if (!variant) return;
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const SkeletonCard = () => (
    <div
      className="cart-plus-rec-product cart-plus-rec-skeleton-card"
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        padding: "20px",
        margin: "20px",
        border: "1px solid #e5e5e5",
        borderRadius: "8px",
      }}
    >
      <div
        className="cart-plus-skeleton cart-plus-skeleton-img"
        style={{
          width: "60px",
          height: "60px",
          flexShrink: 0,
          borderRadius: "8px",
        }}
      >
        &nbsp;
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          className="cart-plus-skeleton cart-plus-skeleton-line"
          style={{ width: "85%", height: "14px" }}
        >
          &nbsp;
        </div>
        <div
          className="cart-plus-skeleton cart-plus-skeleton-line"
          style={{ width: "40%", height: "12px" }}
        >
          &nbsp;
        </div>
        <div
          className="cart-plus-skeleton cart-plus-skeleton-line"
          style={{
            width: "70px",
            height: "28px",
            borderRadius: "4px",
            marginTop: "4px",
          }}
        >
          &nbsp;
        </div>
      </div>
    </div>
  );

  const ProductCard = ({ product, vertical = false }) => {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false); // checkbox / toggle triggers

    const selectedVariant = selectedVariants[product.id] || product.variants[0];
    if (!selectedVariant) return null;

    const handleAddProduct = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    };

    // offer price + label from the Discount settings
    const discount = applyDiscount(
      { discountType, discountValue },
      selectedVariant.price,
    );
    const hasOffer = discount.saved > 0;
    const shownPrice = hasOffer
      ? discount.final.toFixed(2)
      : selectedVariant.price;
    const shownCompare = hasOffer
      ? selectedVariant.price
      : selectedVariant.compareAtPrice;
    const labelHtml = String(labelText || "")
      .replace(/\{\{saved_percentage\}\}/gi, `${discount.percent}%`)
      .replace(
        /\{\{saved_amount\}\}/gi,
        `${currency}${discount.saved.toFixed(2)}`,
      );

    return (
      <div
        className="cart-plus-internal-component-upsell-tile cart-plus-upsell-item-card"
        style={{
          background:
            backgroundToCss(cardBackground) || designSettings.accentColor,
          ...(radius !== null ? { borderRadius: radius } : {}),
          ...(vertical
            ? {
                display: "flex",
                flexDirection: "column",
                gap: 8,
                textAlign: "center",
              }
            : {}),
        }}
      >
        <div
          className="cart-plus-internal-component-upsell-tile__info_count cart-plus-public-component-upsell-tile"
          style={
            vertical
              ? {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }
              : undefined
          }
        >
          <div
            className="cart-plus-internal-component-upsell-tile__image-container cart-plus-upsell-item-image-wrapper cart-plus-public-component-upsell-tile__image-container"
            style={imageBox}
          >
            <img
              className="cart-plus-item-image"
              src={selectedVariant.image || product.image}
              alt={product.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div className="cart-plus-internal-component-upsell-tile__info">
            <a
              href="#no"
              className="cart-plus-internal-component-upsell-tile__title-link"
            >
              <h3
                className="cart-plus-internal-component-upsell-tile__title cart-plus-public-component-upsell-tile__title"
                style={{ color: primary }}
              >
                {product.title}
              </h3>
            </a>

            {showReviews && (
              <div className="rating cart-plus-public-component-upsell-tile__rating-row">
                <span
                  className="stars cart-plus-public-component-upsell-tile__stars"
                  aria-label={`${product.rating || 0} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      style={{
                        color:
                          n <= Math.round(Number(product.rating) || 0)
                            ? "#f5a623"
                            : "#d0d0d0",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </span>
                <span className="rating-text cart-plus-public-component-upsell-tile__reviews">
                  {product.rating || 0} ({product.reviewCount || 0})
                </span>
              </div>
            )}
            <p
              className="price cart-plus-public-component-upsell-tile__price-row"
              style={{ color: primary }}
            >
              <span
                className="sale-price cart-plus-public-component-upsell-tile__price"
                style={{ color: primary }}
              >
                {currency} {shownPrice}
              </span>

              {shownCompare &&
                parseFloat(shownCompare) > parseFloat(shownPrice) && (
                  <>
                    <span
                      className="compare-price cart-plus-public-component-upsell-tile__price-compare-at"
                      style={{ color: secondary }}
                    >
                      {currency} {shownCompare}
                    </span>

                    <span
                      className="upsell-save-price"
                      style={{
                        background: hexToRGBA(
                          designSettings?.savingsColor,
                          0.1,
                        ),
                        color: designSettings.savingsColor,
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "5px 7px",
                        borderRadius: "14px",
                        lineHeight: 1,
                        display: "flex",
                        gap: "2px",
                      }}
                    >
                      <span>{currency}</span>

                      <span>
                        {cartSettings?.savingsText}{" "}
                        {(
                          parseFloat(shownCompare) - parseFloat(shownPrice)
                        ).toFixed(2)}{" "}
                      </span>
                    </span>
                  </>
                )}
            </p>
            {showLabel && hasOffer && (
              <div
                style={{ fontSize: 11, color: secondary }}
                dangerouslySetInnerHTML={{ __html: labelHtml }}
              />
            )}
          </div>
        </div>
        <div
          className="cart-plus-internal-component-upsell-tile__variant-row cart-plus-public-component-upsell-tile__variant-row"
          style={{
            color: primary,
            ...(vertical
              ? {
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  width: "100%",
                }
              : {}),
          }}
        >
          {product.variants.length > 1 && (
            <select
              className="cart-plus-upsell-item-variant-selector"
              value={selectedVariant.id}
              onChange={(e) => handleVariantChange(product.id, e.target.value)}
              style={{ color: primary }}
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.title}
                </option>
              ))}
            </select>
          )}

          {trigger === "checkbox" && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={added}
                onChange={(e) => setAdded(e.target.checked)}
              />
              <span style={{ fontSize: 12 }}>{buttonText}</span>
            </label>
          )}

          {trigger === "toggle" && (
            <button
              type="button"
              role="switch"
              aria-checked={added}
              aria-label={buttonText}
              className={`sb-switch ${added ? "is-on" : ""}`}
              onClick={() => setAdded((v) => !v)}
            >
              <span className="sb-switch-knob" />
            </button>
          )}

          {trigger === "button" && (
            <button
              type="button"
              className="cart-plus-internal-component__button cart-plus-public-component__button"
              style={{
                borderRadius: `${buttonRadius ?? designSettings.buttonRadius}px`,
                background: buttonBackground || designSettings.buttonColor,
                "--btn-hover-text": designSettings.buttonHoverColor,
                "--btn-text": buttonTextColor || designSettings.buttonTextColor,
                ...(buttonTextColor ? { color: buttonTextColor } : {}),
                ...(buttonFontSize ? { fontSize: buttonFontSize } : {}),
              }}
              onClick={handleAddProduct}
            >
              {loading ? <span className="loader"></span> : buttonText}
            </button>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const t = setTimeout(() => {
      const swiper = swiperRef.current;
      if (!swiper || swiper.destroyed) return;

      if (carouselIndicator === "buttons") {
        swiper.params.navigation.prevEl = prevRef.current;
        swiper.params.navigation.nextEl = nextRef.current;

        swiper.navigation.destroy();
        swiper.navigation.init();
        swiper.navigation.update();
      }

      if (carouselIndicator === "progressBar") {
        updateProgress(swiper);
      }
    });
    return () => clearTimeout(t);
  }, [carouselIndicator, layout]);

  useEffect(() => {
    if (carouselIndicator === "buttons" && prevRef.current && nextRef.current) {
      setNavReady(true);
    }
  }, [carouselIndicator, products]);

  // Side panel: nothing inside the cart body, the panel itself is drawn beside the cart
  if (layout === "side" && !sidePanel) return null;

  // manual selection with nothing picked yet: an empty slot instead of random store products
  const nothingPicked =
    !useAiRecommended &&
    ((sourceType === "products" &&
      !selectedItems?.variants?.length &&
      !selectedItems?.products?.length) ||
      (sourceType === "collections" && !selectedItems?.length));
  if (nothingPicked && layout !== "side") {
    return (
      <NoProductPlaceholder
        title={title}
        icon={titleIcon}
        iconColor={upsellsSettings?.iconColor || undefined}
        titleColor={primary}
        textColor={primary}
        cardBackground={
          backgroundToCss(cardBackground) || designSettings.accentColor
        }
        radius={radius ?? 8}
      />
    );
  }

  if (loadingProducts) {
    if (layout === "side") return null;
    return (
      <div className="cart-plus-internal-upsell__vertical-layout-wrapper block">
        <SkeletonCard />
      </div>
    );
  }

  const isFloating = designSettings?.layout === "floating";

  if (!products.length) return null;

  if (layout === "side") {
    return (
      <div
        className="cart-plus-upsells-side-panel"
        style={{
          position: "absolute",
          top: 0,
          right: isFloating ? "calc(100% + 12px)" : "100%",
          width: 190,
          maxHeight: "100%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 8,
          boxSizing: "border-box",
          zIndex: 5,
          background:
            designSettings?.bodyBackground ||
            designSettings?.backgroundColor ||
            "#ffffff",
          ...(bodyBg ? { background: bodyBg } : {}),
          height: isFloating ? "100%" : "100vh",
          ...(isFloating ? { borderRadius: 14 } : {}),
        }}
      >
        {title && (
          <div
            className="cart-plus-internal-style__title-large cart-plus-upsells-title"
            style={{ color: primary, textAlign: "left", flexShrink: 0 }}
          >
            {titleIcon && (
              <span
                style={{
                  display: "inline-flex",
                  verticalAlign: "middle",
                  marginRight: 6,
                }}
              >
                <LibraryIcon
                  value={titleIcon}
                  size={18}
                  color={upsellsSettings.iconColor || undefined}
                />
              </span>
            )}
            <p
              dangerouslySetInnerHTML={{ __html: title }}
              style={{ display: "inline" }}
            />
          </div>
        )}

        {products.map((product) => (
          <ProductCard key={product.id} product={product} vertical />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`cart-plus-internal-upsell cart-plus-public-upsell cart-plus-upsells cart-plus-upsells-module ${upsellsSettings?.position === "bottom" ? "hub-upsell-product" : "custom-upsell-top"}`}
    >
      {title && (
        <div
          className="cart-plus-internal-style__title-large cart-plus-upsells-title"
          style={{
            color: primary,
            ...(layout === "compact"
              ? {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }
              : {}),
          }}
        >
          <div>
            {titleIcon && (
              <span
                style={{
                  display: "inline-flex",
                  verticalAlign: "middle",
                  marginRight: 6,
                }}
              >
                <LibraryIcon
                  value={titleIcon}
                  size={18}
                  color={upsellsSettings.iconColor || undefined}
                />
              </span>
            )}
            <p
              dangerouslySetInnerHTML={{ __html: title }}
              style={{ display: "inline" }}
            />
          </div>

          {/* compact: prev / next arrows, title ke right me */}
          {layout === "compact" && (
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {[
                {
                  dir: -1,
                  off: edge.start,
                  d: "M15 18l-6-6 6-6",
                  label: "Previous",
                },
                {
                  dir: 1,
                  off: edge.end,
                  d: "M9 6l6 6-6 6",
                  label: "Next",
                },
              ].map((b) => (
                <button
                  key={b.dir}
                  type="button"
                  aria-label={b.label}
                  disabled={b.off}
                  onClick={() => scrollCompact(b.dir)}
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: b.off ? "default" : "pointer",
                    opacity: b.off ? 0.3 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={designSettings.iconColor || primary}
                    strokeWidth="2"
                  >
                    <path d={b.d} />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {layout === "carousel" ? (
        <div className="cart-plus-slider-wrapper">
          {carouselIndicator === "buttons" && (
            <div
              ref={prevRef}
              className="custom-prev"
              style={{ background: designSettings.buttonColor }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={designSettings.iconColor || "#ABABAB"}
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </div>
          )}

          <Swiper
            modules={[Navigation]}
            navigation={
              carouselIndicator === "buttons" && navReady
                ? { prevEl: prevRef.current, nextEl: nextRef.current }
                : false
            }
            onInit={(swiper) => {
              swiperRef.current = swiper;
              if (carouselIndicator === "progressBar") {
                updateProgress(swiper);
              }
            }}
            onDestroy={() => {
              swiperRef.current = null;
            }}
            onSlideChange={(swiper) => updateProgress(swiper)}
            spaceBetween={12}
            slidesPerView={products.length <= 1 ? 1 : 1.2}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>

          {carouselIndicator === "buttons" && (
            <div
              ref={nextRef}
              className="custom-next"
              style={{ background: designSettings.buttonColor }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={designSettings.iconColor || "#ABABAB"}
                strokeWidth="2"
              >
                <path d="M9 6l6 6-6 6"></path>
              </svg>
            </div>
          )}
          {carouselIndicator === "progressBar" && (
            <div
              className="upsell-progress-bar"
              style={{
                display: "block",
                width: "100%",
                height: 4,
                marginTop: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(0,0,0,0.12)",
              }}
            >
              <div
                ref={fillRef}
                className="upsell-progress-fill"
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: designSettings.buttonColor,
                  transition: "width .2s ease",
                }}
              ></div>
            </div>
          )}
        </div>
      ) : layout === "compact" ? (
        /* Compact: small tiles side by side, "+" in the corner */
        <div
          ref={compactRef}
          onScroll={updateEdge}
          className="cp-compact-track"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
          }}
        >
          <style>{`.cp-compact-track::-webkit-scrollbar{display:none}`}</style>
          {products.map((product) => {
            const v = selectedVariants[product.id] || product.variants[0];
            return (
              <div
                key={product.id}
                style={{
                  position: "relative",
                  flex: "0 0 auto",
                  scrollSnapAlign: "start",
                  width: Math.max(88, Math.min(imageSize || 96, 128)),
                  boxSizing: "border-box",
                  background:
                    backgroundToCss(cardBackground) ||
                    designSettings.accentColor,
                  borderRadius: radius ?? 8,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                <img
                  src={v?.image || product.image}
                  alt={product.title}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: radius ?? 6,
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  aria-label={buttonText}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    background: buttonBackground || designSettings.buttonColor,
                    color:
                      buttonTextColor ||
                      designSettings.buttonTextColor ||
                      "#fff",
                    fontSize: 14,
                    lineHeight: "20px",
                    padding: 0,
                  }}
                >
                  +
                </button>

                <a
                  href="#no"
                  className="cart-plus-internal-component-upsell-tile__title-link"
                >
                  <h3
                    className="cart-plus-internal-component-upsell-tile__title cart-plus-public-component-upsell-tile__title"
                    style={{ color: primary }}
                  >
                    {product.title}
                  </h3>
                </a>

                <div style={{ fontSize: 11, color: primary }}>
                  {currency} {v?.price}
                </div>

                {product.variants.length > 1 && (
                  <div className="  cart-plus-internal-component-upsell-tile__variant-row upsell">
                    <select
                      className="cart-plus-upsell-item-variant-selector"
                      value={v.id}
                      onChange={(e) =>
                        handleVariantChange(product.id, e.target.value)
                      }
                      style={{
                        width: "100%",
                        fontSize: 11,
                        color: primary,
                        minWidth: 0,
                      }}
                    >
                      {product.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cart-plus-internal-upsell__vertical-layout-wrapper block">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
