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

const DEFAULT_PRODUCTS = [
    {
        id: "default-upsell-1",
        title: "Premium Wireless Headphones",
        image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg?v=1748430488&height=180",
        price: "19.99",
        compareAtPrice: "29.99",
        rating: "4.5",
        reviewCount: 120,
        variants: [
            {
                id: "default-variant-1",
                title: "Black",
                price: "19.99",
                compareAtPrice: "29.99",
                available: true,
                image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg?v=1748430488&height=180",
            },
            {
                id: "default-variant-2",
                title: "White",
                price: "21.99",
                compareAtPrice: "31.99",
                available: true,
                image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg?v=1748430488&height=180",
            },
        ],
    },
    {
        id: "default-upsell-2",
        title: "Comfort Leather Shoes",
        image: "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/derbytier_nutmeg_810294de-9152-4bf7-b5e0-b88fc94a1ff8.jpg?v=1651950701&height=180",
        price: "24.99",
        compareAtPrice: "34.99",
        rating: "4.2",
        reviewCount: 85,
        variants: [
            {
                id: "default-variant-3",
                title: "Size 8",
                price: "24.99",
                compareAtPrice: "34.99",
                available: true,
                image: "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/derbytier_nutmeg_810294de-9152-4bf7-b5e0-b88fc94a1ff8.jpg?v=1651950701&height=180",
            },
            {
                id: "default-variant-4",
                title: "Size 9",
                price: "24.99",
                compareAtPrice: "34.99",
                available: true,
                image: "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/derbytier_nutmeg_810294de-9152-4bf7-b5e0-b88fc94a1ff8.jpg?v=1651950701&height=180",
            },
        ],
    },
];

export default function Upsells({ upsellsSettings, designSettings, currency, cartSettings }) {
    const [products, setProducts] = useState([]);
    const [selectedVariants, setSelectedVariants] = useState({});
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const swiperRef = useRef(null);
    const fillRef = useRef(null);

    useEffect(() => {
        if (swiperRef.current) {
            setTimeout(() => updateProgress(swiperRef.current), 0);
        }
    }, [products]);

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

    useEffect(() => {
        if (useAiRecommended) {
            setProducts(DEFAULT_PRODUCTS);
            const initial = {};
            DEFAULT_PRODUCTS.forEach((p) => {
                initial[p.id] = p.variants[0];
            });
            setSelectedVariants(initial);
            return;
        }

        const noProductsSelected =
            sourceType === "products" &&
            !selectedItems?.variants?.length &&
            !selectedItems?.products?.length;

        const noCollectionsSelected =
            sourceType === "collections" && !selectedItems?.length;

        if (noProductsSelected || noCollectionsSelected) {
            setProducts(DEFAULT_PRODUCTS);
            const initial = {};
            DEFAULT_PRODUCTS.forEach((p) => {
                initial[p.id] = p.variants[0];
            });
            setSelectedVariants(initial);
            return;
        }

        fetch("/shopify/get-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                variantIds: sourceType === "products" ? selectedItems?.variants || [] : [],
                collectionIds: sourceType === "collections" ? selectedItems || [] : [],
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                const limit = limitUpsellsInCart ? maxUpsellsInCart : data.products.length;
                const productsData = data.products.slice(0, limit);
                setProducts(productsData);

                const initial = {};
                productsData.forEach((p) => {
                    if (p.variants.length) initial[p.id] = p.variants[0];
                });
                setSelectedVariants(initial);
            });
    }, [
        useAiRecommended,
        sourceType,
        limitUpsellsInCart,
        maxUpsellsInCart,
        JSON.stringify(selectedItems),
    ]);

    const handleVariantChange = (productId, variantId) => {
        const product = products.find((p) => p.id === productId);
        const variant = product.variants.find((v) => v.id === variantId);
        setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
    };

    const ProductCard = ({ product }) => {
        const [loading, setLoading] = useState(false);

        const selectedVariant = selectedVariants[product.id] || product.variants[0];
        if (!selectedVariant) return null;

        const hanldeAddProduct = () => {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        }

        return (
            <div className="upcart-internal-component-upsell-tile upcart-upsell-item-card" style={{backgroundColor: designSettings.accentColor,}}>
                <div className="upcart-internal-component-upsell-tile__info_count custom-cart-public-component-upsell-tile">
                    <div className="upcart-internal-component-upsell-tile__image-container upcart-upsell-item-image-wrapper custom-cart-public-component-upsell-tile__image-container">
                        <img className="upcart-upsell-item-image" src={selectedVariant.image || product.image} alt={product.title} />
                    </div>

                    <div className="custom-cart-internal-component-upsell-tile__info">
                        <a href="#no" className="custom-cart-internal-component-upsell-tile__title-link">
                            <h3 className="upcart-internal-component-upsell-tile__title custom-cart-public-component-upsell-tile__title" style={{ color: designSettings.textColor || "#6b7280", }}>
                                {product.title}
                            </h3>
                        </a>

                        {showReviews && (
                            <div className="rating custom-cart-public-component-upsell-tile__rating-row">
                                <span className="stars custom-cart-public-component-upsell-tile__stars">
                                    {"★★★★★".slice(0, Math.round(product.rating))}
                                </span>
                                <span className="rating-text custom-cart-public-component-upsell-tile__reviews">
                                    {product.rating} ({product.reviewCount})
                                </span>
                            </div>
                        )}
                        <p
                            className="price custom-cart-public-component-upsell-tile__price-row"
                            style={{ color: designSettings.textColor || "#6b7280" }}
                        >
                            <span
                                className="sale-price custom-cart-public-component-upsell-tile__price"
                                style={{ color: designSettings.textColor || "#6b7280" }}
                            >
                                {selectedVariant.price} {currency}
                            </span>

                            {selectedVariant.compareAtPrice &&
                                parseFloat(selectedVariant.compareAtPrice) >
                                parseFloat(selectedVariant.price) && (
                                    <>
                                        <span
                                            className="compare-price custom-cart-public-component-upsell-tile__price-compare-at"
                                            style={{ color: designSettings.textColor || "#6b7280" }}
                                        >
                                            {selectedVariant.compareAtPrice} {currency}
                                        </span>

                                        <span
                                            className="upsell-save-price"
                                            style={{
                                                background: hexToRGBA(designSettings?.savingsColor, 0.1),
                                                color: designSettings.savingsColor,
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                padding: "5px 7px",
                                                borderRadius: "14px",
                                                lineHeight: 1,
                                            }}
                                        >
                                            {cartSettings.savingsText} {""}
                                            {(
                                                parseFloat(selectedVariant.compareAtPrice) -
                                                parseFloat(selectedVariant.price)
                                            ).toFixed(2)}{" "}
                                            {currency}
                                        </span>
                                    </>
                                )}
                        </p>

                    </div>

                </div>
                <div className="upcart-internal-component-upsell-tile__variant-row custom-cart-public-component-upsell-tile__variant-row" style={{ color: designSettings.textColor || "#6b7280", }}>
                    <select
                        className="upcart-upsell-item-variant-selector"
                        value={selectedVariant.id}
                        onChange={(e) => handleVariantChange(product.id, e.target.value)}
                        style={{ color: designSettings.textColor || "#6b7280", }}
                    >
                        {product.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                                {variant.title}
                            </option>
                        ))}
                    </select>

                    <button type="button" className="upcart-internal-component__button custom-cart-public-component__button"
                        style={{
                            borderRadius: `${designSettings.buttonRadius}px`,
                            backgroundColor: designSettings.buttonColor,
                            "--btn-hover-text": designSettings.buttonHoverColor,
                            "--btn-text": designSettings.buttonTextColor,
                        }}
                        onClick={hanldeAddProduct}>
                        {loading ? (<span className="loader"></span>) : (buttonText)}
                    </button>
                </div>
            </div>
        );
    };

    const updateProgress = (swiper) => {
        const total = swiper.slides.length;
        if (!total || !fillRef.current) return;
        const perView = swiper.params.slidesPerView || 1;
        const visibleRatio = perView / total;
        const fill = (visibleRatio + swiper.progress * (1 - visibleRatio)) * 100;
        fillRef.current.style.width = Math.min(100, fill) + "%";
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

    if (!products.length) return null;

    return (
        <div
            className={`custom-cart-internal-upsell upcart-internal-upsell 
  upcart-public-upsell 
  upcart-upsells 
  upcart-upsells-module 
  ${upsellsSettings?.position === "bottom" ? "hub-upsell-product" : "custom-upsell-top"}`}
        >
            {title && (
                <div className="upcart-internal-style__title-large upcart-upsells-title custom-cart-internal-style__title-large" style={{ color: designSettings.textColor || "#6b7280", }}>
                    <p dangerouslySetInnerHTML={{ __html: title }} />
                </div>
            )}

            {direction === "carousel" ? (
                <div className="upcart-slider-wrapper">
                    {carouselIndicator === "buttons" && (<div ref={prevRef} className="custom-prev"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"></path></svg></div>)}

                    <Swiper
                        modules={[Navigation]}
                        onInit={(swiper) => {
                            swiperRef.current = swiper;
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }}
                        onSlideChange={(swiper) => {
                            updateProgress(swiper);
                        }}
                        spaceBetween={12}
                        slidesPerView={products.length <= 1 ? 1 : 1.2}
                    >
                        {products.map((product) => (
                            <SwiperSlide key={product.id}>
                                <ProductCard product={product} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    {carouselIndicator === "buttons" && (<div ref={nextRef} className="custom-next"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"></path></svg></div>)}
                    {carouselIndicator === "progressBar" && (<div className="upsell-progress-bar">
                        <div ref={fillRef} className="upsell-progress-fill"></div>
                    </div>)}
                </div>
            ) : (
                <div className="upcart-internal-upsell__vertical-layout-wrapper block">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
