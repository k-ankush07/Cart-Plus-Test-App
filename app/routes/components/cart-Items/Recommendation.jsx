import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";

const DEFAULT_PRODUCT = {
    id: "default-product",
    title: "Recommended Product",
    image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg",
    price: "19.99",
    compareAtPrice: "29.99",
    rating: "4.5",
    reviewCount: 120,
    variants: [
        {
            id: "default-variant",
            title: "Default",
            price: "19.99",
            compareAtPrice: "29.99",
            available: true,
            image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg"
        }
    ]
};

export default function Recommendation({ recommendationsSettings, currency, cartSettings, upsellsSettings }) {

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
        fetch("/app/get-products", {
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

    }, [selectedItems, sourceType, maxRecommendations]);

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
            <div className="upcart-internal-component-upsell-tile">
                <div className="upcart-internal-component-upsell-tile__info_count">

                    {/* IMAGE */}
                    <div className="upcart-internal-component-upsell-tile__image-container">
                        <img src={selectedVariant.image || product.image} />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="upcart-internal-component-upsell-tile__info">

                        {/* TITLE */}
                        <a href="#no" className="upcart-internal-component-upsell-tile__title-link">
                            <h3 className="upcart-internal-component-upsell-tile__title">
                                {product.title}
                            </h3>
                        </a>

                        <p className="price">

                            {selectedVariant.compareAtPrice &&
                                parseFloat(selectedVariant.compareAtPrice) > parseFloat(selectedVariant.price) && (
                                    <span className="compare-price">
                                        {selectedVariant.compareAtPrice} {currency}
                                    </span>
                                )}

                            <span className="sale-price">
                                {selectedVariant.price} {currency}
                            </span>

                        </p>

                        {recommendationsSettings.showReviews && (
                            <div className="rating">
                                <span className="stars">
                                    {"★★★★★".slice(0, Math.round(product.rating))}
                                </span>
                                <span className="rating-text">
                                    {product.rating} ({product.reviewCount})
                                </span>
                            </div>
                        )}

                        <div className="upcart-internal-component-upsell-tile__variant-row">
                            <select
                                value={selectedVariant.id}
                                onChange={(e) =>
                                    handleVariantChange(product.id, e.target.value)
                                }
                            >
                                {product.variants.map(variant => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.title}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="upcart-internal-component__button"
                                onClick={hanldeAddProduct}
                            >
                                {loading ? (<span className="loader"></span>) : (upsellsSettings.buttonText)}
                            </button>
                        </div>

                    </div>
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
                <div key={product.id} className="upcart-internal-component-upsell-tile">
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
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;

                swiper.navigation.destroy();
                swiper.navigation.init();
                swiper.navigation.update();
            }

            if (recommendationsSettings.carouselIndicator === "progressBar") {
                updateProgress(swiper);
            }
        });
    }, [recommendationsSettings.carouselIndicator]);

    return (
        <div className="cart_CartPreview__empty__body upcart-recommendation-module">

            <div className="cart_CartPreview__empty__">
                <h3>{cartSettings.emptyCartMessage}</h3>
            </div>

            <div className="upcart-internal-upsell upcart-public-upsell">

                {/* HEADER */}
                <div className="upcart-internal-upsell__header upcart-recommendations-title">
                    <p dangerouslySetInnerHTML={{
                        __html: recommendationsSettings.headerText
                    }} />
                </div>

                {/* BUTTON */}
                {recommendationsSettings.showShopNowButton && (
                    <div className="upcart-internal-style__title-large_button">
                        <a href={recommendationsSettings.buttonUrl} className="upcart-recommendations-shop-now-button">
                            {recommendationsSettings.buttonText}
                        </a>
                    </div>
                )}

                <div className="upcart-internal-style__title-large">
                    <p dangerouslySetInnerHTML={{
                        __html: recommendationsSettings.productHeaderText
                    }} />
                </div>

                {recommendationsSettings.layout === "carousel" ? (
                    <div className="upcart-slider-wrapper">
                        {recommendationsSettings.carouselIndicator === "buttons" && (<div ref={prevRef} className="custom-prev">‹</div>)}
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
                            slidesPerView={products.length <= 1 ? 1 : 1.5}
                        >
                            {renderProducts()}
                        </Swiper>

                        {recommendationsSettings.carouselIndicator === "buttons" && (<div ref={nextRef} className="custom-next">›</div>)}
                        {indicator === "progressBar" && (
                            <div className="upsell-progress-bar">
                                <div ref={fillRef} className="upsell-progress-fill"></div>
                            </div>
                        )}
                    </div>

                ) : (
                    <div className="upcart-internal-upsell__vertical-layout-wrapper">
                        {renderProducts()}
                    </div>)}
            </div>
        </div>
    );
}