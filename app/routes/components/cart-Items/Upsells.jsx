import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Navigation } from "swiper/modules";
import "swiper/css/navigation";

const DEFAULT_PRODUCTS = [
    {
        id: "default-upsell-1",
        title: "Recommended Product",
        image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg?v=1748430488&height=180",
        price: "19.99",
        compareAtPrice: "29.99",
        rating: "4.5",
        reviewCount: 120,
        variants: [
            {
                id: "default-variant-1",
                title: "Default",
                price: "19.99",
                compareAtPrice: "29.99",
                available: true,
                image: "https://cdn.shopify.com/s/files/1/0733/2531/4260/files/71gaxSw_UAL._SL1500.jpg?v=1748430488&height=180",
            },
        ],
    },
    {
        id: "default-upsell-2",
        title: "You Might Also Like",
        image: "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/derbytier_nutmeg_810294de-9152-4bf7-b5e0-b88fc94a1ff8.jpg?v=1651950701&height=180",
        price: "24.99",
        compareAtPrice: "34.99",
        rating: "4.2",
        reviewCount: 85,
        variants: [
            {
                id: "default-variant-2",
                title: "Default",
                price: "24.99",
                compareAtPrice: "34.99",
                available: true,
                image: "https://cdn.shopify.com/s/files/1/0642/9435/5203/products/derbytier_nutmeg_810294de-9152-4bf7-b5e0-b88fc94a1ff8.jpg?v=1651950701&height=180",
            },
        ],
    },
];

export default function Upsells({ upsellsSettings }) {
    const [products, setProducts] = useState([]);
    const [selectedVariants, setSelectedVariants] = useState({});
    const prevRef = useRef(null);
    const nextRef = useRef(null);
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
        fetch("/app/get-products", {
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
    }, [useAiRecommended, selectedItems, limitUpsellsInCart, maxUpsellsInCart]);

    const handleVariantChange = (productId, variantId) => {
        const product = products.find((p) => p.id === productId);
        const variant = product.variants.find((v) => v.id === variantId);
        setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
    };

    const ProductCard = ({ product }) => {
        const selectedVariant = selectedVariants[product.id] || product.variants[0];
        if (!selectedVariant) return null;

        return (
            <div className="upcart-internal-component-upsell-tile upcart-upsell-item-card">
                <div className="upcart-internal-component-upsell-tile__info_count">
                    <div className="upcart-internal-component-upsell-tile__image-container upcart-upsell-item-image-wrapper">
                        <img className="upcart-upsell-item-image" src={selectedVariant.image || product.image} alt={product.title} />
                    </div>

                    <div className="upcart-internal-component-upsell-tile__info">
                        <a href="#no" className="upcart-internal-component-upsell-tile__title-link">
                            <h3 className="upcart-internal-component-upsell-tile__title upcart-upsell-item-title">
                                {product.title}
                            </h3>
                        </a>

                        <div className="upcart-upsell-item-price-row">
                            {selectedVariant.compareAtPrice &&
                                parseFloat(selectedVariant.compareAtPrice) > parseFloat(selectedVariant.price) && (
                                    <span className="compare-price upcart-upsell-item-compare-price">
                                        {selectedVariant.compareAtPrice}
                                    </span>
                                )}
                            <span className="sale-price upcart-upsell-item-price">{selectedVariant.price}</span>
                        </div>

                        {showReviews && (
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
                                className="upcart-upsell-item-variant-selector"
                                value={selectedVariant.id}
                                onChange={(e) => handleVariantChange(product.id, e.target.value)}
                            >
                                {product.variants.map((variant) => (
                                    <option key={variant.id} value={variant.id}>
                                        {variant.title}
                                    </option>
                                ))}
                            </select>

                            <button type="button" className="upcart-internal-component__button upcart-upsells-button">
                                {buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!products.length) return null;

    return (
        <div
            className={`upcart-internal-upsell 
  upcart-public-upsell 
  upcart-upsells 
  upcart-upsells-module 
  ${upsellsSettings?.position === "bottom" ? "hub-upsell-product" : ""}`}
        >
            {title && (
                <div className="upcart-internal-style__title-large upcart-upsells-title">
                    <p dangerouslySetInnerHTML={{ __html: title }} />
                </div>
            )}

            {direction === "carousel" ? (
                <div className="upcart-slider-wrapper">
                    <div ref={prevRef} className="custom-prev">‹</div>
                    <Swiper
                        modules={[Navigation]}
                        onInit={(swiper) => {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }}
                        spaceBetween={12}
                        slidesPerView={1.2}
                        breakpoints={{ 768: { slidesPerView: 1 } }}
                    >
                        {products.map((product) => (
                            <SwiperSlide key={product.id}>
                                <ProductCard product={product} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div ref={nextRef} className="custom-next">›</div>
                </div>
            ) : (
                <div className="upcart-internal-upsell__vertical-layout-wrapper">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
