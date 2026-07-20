import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";
import CustomHtml from "./CustomHtml";

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

const DEFAULT_PRODUCT = {
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
};

export default function Recommendation({ recommendationsSettings, currency, cartSettings, upsellsSettings, designSettings }) {

    const [products, setProducts] = useState([]);
    const [selectedVariants, setSelectedVariants] = useState({});

    const { selectedItems = [], sourceType, maxRecommendations } = recommendationsSettings;
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const fillRef = useRef(null);
    const swiperRef = useRef(null);

    useEffect(() => {
        if (swiperRef.current) {
            setTimeout(() => updateProgress(swiperRef.current), 0);
        }
    }, [products]);

    useEffect(() => {
        const noProductsSelected =
            sourceType === "products" &&
            !selectedItems?.variants?.length &&
            !selectedItems?.products?.length;

        const noCollectionsSelected =
            sourceType === "collections" && !selectedItems?.length;

        if (noProductsSelected || noCollectionsSelected) {
            setProducts([DEFAULT_PRODUCT]);
            setSelectedVariants({
                [DEFAULT_PRODUCT.id]: DEFAULT_PRODUCT.variants[0]
            });
            return;
        }

        fetch("/shopify/get-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                collectionIds: sourceType === "collections" ? selectedItems : [],
                variantIds: sourceType === "products" ? selectedItems?.variants || [] : []
            }),
        })
            .then(res => res.json())
            .then(data => {
                const productsData = data.products.slice(0, maxRecommendations);
                setProducts(productsData);

                const initial = {};
                productsData.forEach(product => {
                    if (product.variants.length) {
                        initial[product.id] = product.variants[0];
                    }
                });
                setSelectedVariants(initial);
            });

    }, [
        sourceType,
        maxRecommendations,
        JSON.stringify(selectedItems),
    ]);

    const handleVariantChange = (productId, variantId) => {
        const product = products.find(p => p.id === productId);
        const variant = product.variants.find(v => v.id === variantId);

        setSelectedVariants(prev => ({
            ...prev,
            [productId]: variant
        }));
    };

    const ProductCard = ({ product }) => {
        const [loading, setLoading] = useState(false);

        const selectedVariant =
            selectedVariants[product.id] || product.variants[0];

        if (!selectedVariant) return null;

        const hanldeAddProduct = () => {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        }

        return (
            <div className="upcart-internal-component-upsell-tile custom-cart-public-component-upsell-tile" style={{ backgroundColor: designSettings.accentColor, }}>
                <div className="upcart-internal-component-upsell-tile__info_count custom-cart-public-component-upsell-tile">

                    {/* IMAGE */}
                    <div className="upcart-internal-component-upsell-tile__image-container custom-cart-public-component-upsell-tile__image-container">
                        <img src={selectedVariant.image || product.image} className="custom-cart-public-component-upsell-tile__image" />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="custom-cart-internal-component-upsell-tile__info">

                        {/* TITLE */}
                        <a href="#no" className="custom-cart-internal-component-upsell-tile__title-link">
                            <h3 className="upcart-internal-component-upsell-tile__title custom-cart-public-component-upsell-tile__title" style={{ color: designSettings.textColor || "#6b7280", }}>
                                {product.title}
                            </h3>
                        </a>

                        {recommendationsSettings.showReviews && (
                            <div className="rating custom-cart-public-component-upsell-tile__rating-row">
                                <span className="stars custom-cart-public-component-upsell-tile__stars">
                                    {"★★★★★".slice(0, Math.round(product.rating))}
                                </span>
                                <span className="rating-text custom-cart-public-component-upsell-tile__reviews">
                                    {product.rating} ({product.reviewCount})
                                </span>
                            </div>
                        )}

                        <p className="price custom-cart-public-component-upsell-tile__price-row" style={{ color: designSettings.textColor || "#6b7280", }}>


                            <span className="sale-price custom-cart-public-component-upsell-tile__price" style={{ color: designSettings.textColor || "#6b7280", }}>
                                {currency} {selectedVariant.price}
                            </span>

                            {selectedVariant.compareAtPrice &&
                                parseFloat(selectedVariant.compareAtPrice) >
                                parseFloat(selectedVariant.price) && (
                                    <>
                                        <span
                                            className="compare-price custom-cart-public-component-upsell-tile__price-compare-at"
                                            style={{ color: designSettings.textColor || "#6b7280" }}
                                        >
                                            {currency} {selectedVariant.compareAtPrice}
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
                                                display: "flex",
                                                gap: "3px"
                                            }}
                                        >
                                            <span> {currency}</span>
                                            <span>
                                                {cartSettings.savingsText} {""}
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
                <div className="upcart-internal-component-upsell-tile__variant-row custom-cart-public-component-upsell-tile__variant-row" style={{ color: designSettings.textColor || "#6b7280", }}>
                    <select
                        value={selectedVariant.id}
                        onChange={(e) =>
                            handleVariantChange(product.id, e.target.value)
                        }
                        style={{ color: designSettings.textColor || "#6b7280", }}
                    >
                        {product.variants.map(variant => (
                            <option key={variant.id} value={variant.id} style={{ color: designSettings.textColor || "#6b7280", }}>
                                {variant.title}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="upcart-internal-component__button custom-cart-public-component__button"
                        onClick={hanldeAddProduct}
                        style={{
                            borderRadius: `${designSettings.buttonRadius}px`,
                            backgroundColor: designSettings.buttonColor,
                            "--btn-hover-text": designSettings.buttonHoverColor,
                            "--btn-text": designSettings.buttonTextColor,
                        }}
                    >
                        {loading ? (<span className="loader"></span>) : (upsellsSettings.buttonText)}
                    </button>
                </div>
            </div>
        );
    };

    const renderProducts = () =>
        products.map(product => {
            const selectedVariant =
                selectedVariants[product.id] || product.variants[0];

            if (!selectedVariant) return null;

            return recommendationsSettings.layout === "carousel" ? (
                <SwiperSlide key={product.id}>
                    <ProductCard product={product} />
                </SwiperSlide>
            ) : (
                <div key={product.id} className="upcart-internal-component-upsell-tile-new">
                    <ProductCard product={product} />
                </div>
            );
        });

    const updateProgress = (swiper) => {
        const total = swiper.slides.length;
        if (!total || !fillRef.current) return;
        const perView = swiper.params.slidesPerView || 1;
        const visibleRatio = perView / total;
        const fill = (visibleRatio + swiper.progress * (1 - visibleRatio)) * 100;
        fillRef.current.style.width = Math.min(100, fill) + "%";
    };

    const indicator = recommendationsSettings.carouselIndicator || "progressBar";

    useEffect(() => {
        if (!swiperRef.current) return;

        const swiper = swiperRef.current;

        setTimeout(() => {
            if (recommendationsSettings.carouselIndicator === "buttons") {

                if (!swiper.params.navigation) {
                    swiper.params.navigation = {};
                }

                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;

                if (swiper.navigation) {
                    swiper.navigation.destroy();
                    swiper.navigation.init();
                    swiper.navigation.update();
                }
            }

            if (recommendationsSettings.carouselIndicator === "progressBar") {
                updateProgress(swiper);
            }
        });
    }, [recommendationsSettings.carouselIndicator]);

    return (
        <div className="cart_CartPreview__empty__body custom-cart-recommendation-module">
            <div className="cart_CartPreview__empty__">

                <div className="styles_CartPreview__empty__">
                    <div className="empty-cart-custom-text"> <CustomHtml cartSettings={cartSettings} position="empty_cart" /></div>

                    <h3 className="custom-cart-recommendations-title">{cartSettings.emptyCartMessage}</h3>
                    {/* HEADER */}
                    {!recommendationsSettings.enabled && (
                        <div
                            className="custom-cart-internal-upsell__header upcart-recommendations-title"
                            style={{ color: designSettings.textColor || "#6b7280" }}
                        >
                            <p dangerouslySetInnerHTML={{ __html: recommendationsSettings.headerText }} />
                        </div>
                    )}

                    {/* BUTTON */}
                    {!recommendationsSettings.enabled && recommendationsSettings.showShopNowButton && (
                        <div className="custom-cart-internal-style__title-large_button custom-cart-recommendations-shop-now-button" style={{
                            borderRadius: `${designSettings.buttonRadius}px`,
                            backgroundColor: designSettings.buttonColor,
                            "--btn-hover-text": designSettings.buttonHoverColor,
                            "--btn-text": designSettings.buttonTextColor,
                        }}>
                            <a href={recommendationsSettings.buttonUrl} onClick={(e) => e.preventDefault()}
                                className="upcart-recommendations-shop-now-button">
                                {recommendationsSettings.buttonText}
                            </a>
                        </div>
                    )}

                </div>
            </div>
            {!recommendationsSettings.enabled && (<div className="custom-cart-internal-upsell custom-cart-public-upsell">
                <div className="custom-cart-internal-style__title-large" style={{ color: designSettings.textColor || "#6b7280", }}>
                    <p dangerouslySetInnerHTML={{
                        __html: recommendationsSettings.productHeaderText
                    }} />
                </div>

                {recommendationsSettings.layout === "carousel" ? (
                    <div className="custom-cart-slider-wrapper">
                        {recommendationsSettings.carouselIndicator === "buttons" && (<div ref={prevRef} className="custom-prev" style={{ backgroundColor: designSettings.buttonColor,}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={designSettings.iconColor || "#ABABAB"} stroke-width="2">
                            <path d="M15 18l-6-6 6-6"></path>
                        </svg></div>)}
                        <Swiper
                            modules={[Navigation]}
                            navigation={{
                                prevEl: prevRef.current,
                                nextEl: nextRef.current,
                            }}
                            onInit={(swiper) => {
                                swiperRef.current = swiper;

                                if (!swiper.params.navigation) {
                                    swiper.params.navigation = {};
                                }

                                swiper.params.navigation.prevEl = prevRef.current;
                                swiper.params.navigation.nextEl = nextRef.current;

                                if (swiper.navigation) {
                                    swiper.navigation.init();
                                    swiper.navigation.update();
                                }
                            }}
                            onSlideChange={(swiper) => {
                                updateProgress(swiper);
                            }}
                            spaceBetween={12}
                            slidesPerView={products.length <= 1 ? 1 : 1.2}
                        >
                            {renderProducts()}
                        </Swiper>

                        {recommendationsSettings.carouselIndicator === "buttons" && (<div ref={nextRef} className="custom-next" style={{ backgroundColor: designSettings.buttonColor,}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={designSettings.iconColor || "#ABABAB"} stroke-width="2">
                            <path d="M9 6l6 6-6 6"></path>
                        </svg></div>)}
                        {indicator === "progressBar" && (
                            <div className="upsell-progress-bar">
                                <div ref={fillRef} className="upsell-progress-fill" style={{ backgroundColor: designSettings.buttonColor,}}></div>
                            </div>
                        )}
                    </div>

                ) : (
                    <div className="upcart-internal-upsell__vertical-layout-wrapper block">
                        {renderProducts()}
                    </div>)}
            </div>)}
        </div>
    );
}