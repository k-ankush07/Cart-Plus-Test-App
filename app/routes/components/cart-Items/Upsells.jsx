import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";

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
}) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [navReady, setNavReady] = useState(false);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);
  const fillRef = useRef(null);

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
  } = upsellsSettings || {};

  const updateProgress = (swiper) => {
    const total = swiper.slides.length;
    if (!total || !fillRef.current) return;
    const perView = swiper.params.slidesPerView || 1;
    const visibleRatio = perView / total;
    const fill = (visibleRatio + swiper.progress * (1 - visibleRatio)) * 100;
    fillRef.current.style.width = Math.min(100, fill) + "%";
  };

  useEffect(() => {
    if (swiperRef.current) {
      setTimeout(() => updateProgress(swiperRef.current), 0);
    }
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
        limit: 3,
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

  const ProductCard = ({ product }) => {
    const [loading, setLoading] = useState(false);

    const selectedVariant = selectedVariants[product.id] || product.variants[0];
    if (!selectedVariant) return null;

    const handleAddProduct = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    };

    return (
      <div
        className="cart-plus-internal-component-upsell-tile cart-plus-upsell-item-card"
        style={{ backgroundColor: designSettings.accentColor }}
      >
        <div className="cart-plus-internal-component-upsell-tile__info_count cart-plus-public-component-upsell-tile">
          <div className="cart-plus-internal-component-upsell-tile__image-container cart-plus-upsell-item-image-wrapper cart-plus-public-component-upsell-tile__image-container">
            <img
              className="cart-plus-item-image"
              src={selectedVariant.image || product.image}
              alt={product.title}
            />
          </div>

          <div className="cart-plus-internal-component-upsell-tile__info">
            <a
              href="#no"
              className="cart-plus-internal-component-upsell-tile__title-link"
            >
              <h3
                className="cart-plus-internal-component-upsell-tile__title cart-plus-public-component-upsell-tile__title"
                style={{ color: designSettings.textColor || "#6b7280" }}
              >
                {product.title}
              </h3>
            </a>

            {showReviews && (
              <div className="rating cart-plus-public-component-upsell-tile__rating-row">
                <span className="stars cart-plus-public-component-upsell-tile__stars">
                  {"★★★★★".slice(0, Math.round(Number(product.rating) || 0))}
                </span>
                <span className="rating-text cart-plus-public-component-upsell-tile__reviews">
                  {product.rating || 0} ({product.reviewCount || 0})
                </span>
              </div>
            )}
            <p
              className="price cart-plus-public-component-upsell-tile__price-row"
              style={{ color: designSettings.textColor || "#6b7280" }}
            >
              <span
                className="sale-price cart-plus-public-component-upsell-tile__price"
                style={{ color: designSettings.textColor || "#6b7280" }}
              >
                {currency} {selectedVariant.price}
              </span>

              {selectedVariant.compareAtPrice &&
                parseFloat(selectedVariant.compareAtPrice) >
                  parseFloat(selectedVariant.price) && (
                  <>
                    <span
                      className="compare-price cart-plus-public-component-upsell-tile__price-compare-at"
                      style={{ color: designSettings.textColor || "#6b7280" }}
                    >
                      {currency} {selectedVariant.compareAtPrice}
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
                          parseFloat(selectedVariant.compareAtPrice) -
                          parseFloat(selectedVariant.price)
                        ).toFixed(2)}{" "}
                      </span>
                    </span>
                  </>
                )}
            </p>
          </div>
        </div>
        <div
          className="cart-plus-internal-component-upsell-tile__variant-row cart-plus-public-component-upsell-tile__variant-row"
          style={{ color: designSettings.textColor || "#6b7280" }}
        >
          {product.variants.length > 1 && (
            <select
              className="cart-plus-upsell-item-variant-selector"
              value={selectedVariant.id}
              onChange={(e) => handleVariantChange(product.id, e.target.value)}
              style={{ color: designSettings.textColor || "#6b7280" }}
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="cart-plus-internal-component__button cart-plus-public-component__button"
            style={{
              borderRadius: `${designSettings.buttonRadius}px`,
              backgroundColor: designSettings.buttonColor,
              "--btn-hover-text": designSettings.buttonHoverColor,
              "--btn-text": designSettings.buttonTextColor,
            }}
            onClick={handleAddProduct}
          >
            {loading ? <span className="loader"></span> : buttonText}
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!swiperRef.current) return;

    const swiper = swiperRef.current;

    setTimeout(() => {
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
  }, [carouselIndicator]);

  useEffect(() => {
    if (carouselIndicator === "buttons" && prevRef.current && nextRef.current) {
      setNavReady(true);
    }
  }, [carouselIndicator, products]);

  if (loadingProducts) {
    return (
      <div className="cart-plus-internal-upsell__vertical-layout-wrapper block">
        <SkeletonCard />
      </div>
    );
  }

  // Koi real product nahi mila -> kuch bhi mat dikhao (no fake products)
  if (!products.length) return null;

  return (
    <div
      className={`cart-plus-internal-upsell cart-plus-public-upsell cart-plus-upsells cart-plus-upsells-module ${upsellsSettings?.position === "bottom" ? "hub-upsell-product" : "custom-upsell-top"}`}
    >
      {title && (
        <div
          className="cart-plus-internal-style__title-large cart-plus-upsells-title"
          style={{ color: designSettings.textColor || "#6b7280" }}
        >
          <p dangerouslySetInnerHTML={{ __html: title }} />
        </div>
      )}

      {direction === "carousel" ? (
        <div className="cart-plus-slider-wrapper">
          {carouselIndicator === "buttons" && (
            <div
              ref={prevRef}
              className="custom-prev"
              style={{ backgroundColor: designSettings.buttonColor }}
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
              style={{ backgroundColor: designSettings.buttonColor }}
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
            <div className="upsell-progress-bar">
              <div
                ref={fillRef}
                className="upsell-progress-fill"
                style={{ backgroundColor: designSettings.buttonColor }}
              ></div>
            </div>
          )}
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
