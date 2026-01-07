import { Plus, Minus, BadgePercent, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import Discount from './Discount';
import TrustBages from './TrustBages';
import VipProduct from "./Vip-Product";
import ShippingProduct from "./Shipping-product";
import ProgressBar from './Progress-Bar';
import Additionalnote from "./Additional-note";
import ConfirmationBox from "./ConfirmationBox";

const parseTimer = (timerStr) => {
    const [minutes, seconds] = timerStr.split(":").map(Number);
    return (minutes || 0) * 60 + (seconds || 0);
};

export default function CartDrawer({ bgColor, upSellTitle, upSelltext, upSellstyle, addedProducts,
    upSellAdd, isUpSellVisible, upSellTemplate, announcementHeight, announcementPosition, announcementTimer, announcementText,
    announcementFontSize, announcementBgColor, announcementTextColor, announcementBorderColor, isAnnouncementVisible,
    headerfontSize, btnborderRadius, headingColor, variantColor, discountBadgeColor, priceColor, quantityColor, originalPriceColor,
    savingPriceColor, buttonColor, buttonTextColor, checkoutButtonColor, checkoutButtonTextColor, iconColor, discountCode,
    buttonText, isDiscountVisible, productNameSize, variantSize, comparePriceSize, savingPriceSize, productPriceSize,
    customImages, selectedImages, isTrustVisible, checkoutText, discountText, totalDiscountText, viewCartText, discountSize,
    totalDiscountSize, checkoutSize, viewCartSize, showViewCart, btnLinkColor, addedVipProducts, showViPProduct,
    addedShippingProducts, showShippingProduct, tiers, testAmount, showProgressBar, textAfter, tierTitle, tierRewardTitle,
    tierFontsize, rewardFontsize, beforeColor, beforeBar, afterColor, afterIcon, noteTitle, notePlaceholder, noteSize,
    notePlaceholderSize, showNote,checkboxLabel, link ,isChecked,showBox, addedProgressProducts

}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [countdown, setCountdown] = useState(parseTimer(announcementTimer));

    useEffect(() => {
        const currentProduct = addedProducts[currentIndex];
        if (currentProduct?.variants?.length > 0) {
            setSelectedVariants((prev) => ({
                ...prev,
                [currentProduct.id]: currentProduct.variants[0],
            }));
        }
    }, [currentIndex, addedProducts]);

    const handleNext = () => {
        if (currentIndex < addedProducts.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const getImageSrc = (product) => {
        const selectedVariant = selectedVariants[product.id];
        if (selectedVariant) {
            const variantImage = product.images?.find(img => img.id === selectedVariant.image_id);
            if (variantImage) return variantImage.src;
        }
        return product?.image?.src || "https://via.placeholder.com/150";
    };

    const handleVariantChange = (productId, e) => {
        const variantId = e.target.value;
        const product = addedProducts.find((p) => p.id === productId);
        const variant = product?.variants?.find((v) => v.id.toString() === variantId);

        if (variant) {
            setSelectedVariants((prev) => ({
                ...prev,
                [productId]: variant,
            }));
        }
    };

    useEffect(() => {
        setCountdown(parseTimer(announcementTimer));
    }, [announcementTimer]);

    useEffect(() => {
        if (countdown <= 0) return;
        const interval = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [countdown]);

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, "0");
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    const announcementBar = (
        <div className="cart-drawer announcement-bar"
            style={{
                height:
                    announcementHeight === "Slim"
                        ? "40px"
                        : announcementHeight === "Normal"
                            ? "60px"
                            : "80px",
                backgroundColor: announcementBgColor || "#cce7ff",
                color: announcementTextColor || "#000",
                border: `1px solid ${announcementBorderColor || "#000"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: 'center',
                fontSize: `${announcementFontSize || 14}px`,
            }}>
            <span>
                {announcementText?.replace("{TIMER}", formatTime(countdown))}
            </span>
        </div>
    );

    return (
        <div className="cart-page drawer" style={{ backgroundColor: bgColor }}>
            <div className="wrapper">
                <div className="cart-wrap">
                    <div className="cart-head">
                        <span style={{
                            fontSize: `${headerfontSize}px`,
                            color: headingColor
                        }}>Your cart (2)</span>
                        <div className="cursor-pointer">×</div>
                    </div>

                    {isAnnouncementVisible && announcementPosition === "Before products" && announcementBar}
                    <div className="cart-progress-bar">
                        <ProgressBar
                            tiers={tiers}
                            showProgressBar={showProgressBar}
                            testAmount={testAmount}
                            textAfter={textAfter}
                            tierTitle={tierTitle}
                            tierRewardTitle={tierRewardTitle}
                            tierFontsize={tierFontsize}
                            rewardFontsize={rewardFontsize}
                            beforeColor={beforeColor}
                            beforeBar={beforeBar}
                            afterColor={afterColor}
                            afterIcon={afterIcon}
                            addedProgressProducts={addedProgressProducts}
                        />
                    </div>
                    <div className="cart-drawer cart-product">
                        <div className="cart-product-left-side">
                            <div className="product-img">
                                <img
                                    src="https://snapdrawer.feeniks.io/img/1618081dd2a26351d585beaf3d1e1b79.jpeg"
                                    alt=""
                                />
                            </div>
                            <div className="title-size">
                                <div className="product-title" style={{ color: headingColor, fontSize: `${productNameSize}px`, }}>Soft armchair</div>
                                <div className="product-color" style={{ color: variantColor, fontSize: `${variantSize}px` }}>Color: Grey</div>
                                <div className="btn-quantity">
                                    <button className="icon-btn" style={{ color: headingColor }} >
                                        <Minus size={18} />
                                    </button>
                                    <span style={{ color: quantityColor }}>2</span>
                                    <button className="icon-btn" style={{ color: headingColor }}>
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="cart-product-right-side">
                            <div className="price-deleteIcon-custom" style={{ color: iconColor }}>
                                <Trash2 size={18} />
                            </div>
                            <div className="product-price-custom">
                                <div className="product-originalPrice line-through" style={{ color: originalPriceColor, fontSize: `${comparePriceSize}px` }}>₹50.00</div>
                                <div className="product-pricePrice-custom" style={{ color: priceColor, fontSize: `${productPriceSize}px` }}>₹45.00</div>
                            </div>
                            <div className="save-price" style={{ color: savingPriceColor, fontSize: `${savingPriceSize}px` }}>
                                <span>Save ₹5.00</span>
                            </div>
                            <div className="product-discount-custom">
                                <span className="icon-btn discount" style={{ color: iconColor }}>
                                    <BadgePercent size={18} />
                                </span>
                                <span className="discount-icon-code"
                                    style={{ color: discountBadgeColor }}>SUMMERSALE</span>
                            </div>
                        </div>
                    </div>

                    {isAnnouncementVisible && announcementPosition === "After products" && announcementBar}

                    {isUpSellVisible && upSellTemplate === "center" && (
                        <div className="cart-drawer upsell-product">
                            <div className="upsell-header-custom" style={{ color: headingColor }}>{upSellTitle}</div>
                            {upSellAdd === "Automatic" && (
                                <div className="automatic-upsell-product">
                                    <div className="added-product-item-cart">
                                        <img src="https://snapdrawer.feeniks.io/assets/demoUpsell-BUg98y9H.png" alt="" />
                                        <div className="added-product-left">
                                            <p className="added-product-title automatic" style={{ fontSize: `${productNameSize}px` }}>Turquoise table lamp</p>
                                            <p className="upsell-variant-price automatic" style={{ color: priceColor, fontSize: `${productPriceSize}px` }}>
                                                ₹80 </p>
                                            <div className="added-size-item">
                                                <div className="upsell-add-btn"
                                                    style={{
                                                        borderRadius: `${btnborderRadius}px`,
                                                        background: buttonColor,
                                                        color: buttonTextColor
                                                    }}>
                                                    {upSelltext}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )}

                            {upSellAdd === "Manual" && (
                                <>
                                    {upSellstyle === "Horizontal" ? (
                                        <div className="upsell-slider-wrapper">
                                            <button
                                                className="icon-btn slider left"
                                                onClick={handlePrev}
                                                disabled={currentIndex === 0}
                                            >
                                                <ChevronLeft size={20} />
                                            </button>

                                            {addedProducts.length > 0 ? (
                                                <div className="upsell-productBox-custom">
                                                    {(() => {
                                                        const product = addedProducts[currentIndex];
                                                        const selectedVariant = selectedVariants[product.id];
                                                        return (
                                                            <div key={product.id} className="added-product-item-cart">
                                                                <img
                                                                    src={getImageSrc(product)}
                                                                    alt={product.title}
                                                                    className="added-product-image"
                                                                />
                                                                <div className="added-product-left">
                                                                    <p className="added-product-title"
                                                                        style={{ fontSize: `${productNameSize}px` }}
                                                                    >{product.title}</p>

                                                                    {selectedVariant && (
                                                                        <p className="upsell-variant-price" style={{ color: priceColor, fontSize: `${productPriceSize}px` }}>
                                                                            ₹{parseFloat(selectedVariant.price).toFixed(2)}
                                                                        </p>
                                                                    )}

                                                                    <div className="added-size-item">
                                                                        <select
                                                                            className="upsell-size-dropdown"
                                                                            onChange={(e) => handleVariantChange(product.id, e)}
                                                                        >
                                                                            {product.variants?.length > 0 ? (
                                                                                product.variants.map((variant, i) => (
                                                                                    <option key={i} value={variant.id}>
                                                                                        {variant.title}
                                                                                    </option>
                                                                                ))
                                                                            ) : (
                                                                                <option disabled>No variants available</option>
                                                                            )}
                                                                        </select>

                                                                        <div className="upsell-add-btn"
                                                                            style={{
                                                                                borderRadius: `${btnborderRadius}px`,
                                                                                background: buttonColor,
                                                                                color: buttonTextColor
                                                                            }}
                                                                        >{upSelltext}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <p>No upsell products</p>
                                            )}

                                            <button
                                                className="icon-btn slider right"
                                                onClick={handleNext}
                                                disabled={currentIndex === addedProducts.length - 1}>
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    ) : (

                                        <div className="upsell-productBox-custom vertical">
                                            {addedProducts.map((product) => {
                                                const selectedVariant = selectedVariants[product.id];
                                                return (
                                                    <div key={product.id} className="added-product-item-cart">
                                                        <img
                                                            src={getImageSrc(product)}
                                                            alt={product.title}
                                                            className="added-product-image"
                                                        />
                                                        <div className="added-product-left">
                                                            <p className="added-product-title"
                                                                style={{ fontSize: `${productNameSize}px` }}
                                                            >{product.title}</p>

                                                            {selectedVariant && (
                                                                <p className="upsell-variant-price" style={{ color: priceColor, fontSize: `${productPriceSize}px` }}>
                                                                    ₹{parseFloat(selectedVariant.price).toFixed(2)}
                                                                </p>
                                                            )}

                                                            <div className="added-size-item">
                                                                <select
                                                                    className="upsell-size-dropdown"
                                                                    onChange={(e) => handleVariantChange(product.id, e)}
                                                                >
                                                                    {product.variants?.length > 0 ? (
                                                                        product.variants.map((variant, i) => (
                                                                            <option key={i} value={variant.id}>
                                                                                {variant.title}
                                                                            </option>
                                                                        ))
                                                                    ) : (
                                                                        <option disabled>No variants available</option>
                                                                    )}
                                                                </select>

                                                                <div className="upsell-add-btn"
                                                                    style={{
                                                                        borderRadius: `${btnborderRadius}px`,
                                                                        background: buttonColor,
                                                                        color: buttonTextColor
                                                                    }}
                                                                >{upSelltext}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    <VipProduct
                        addedVipProducts={addedVipProducts}
                        showViPProduct={showViPProduct}
                    />
                    <ShippingProduct
                        addedShippingProducts={addedShippingProducts}
                        showShippingProduct={showShippingProduct}
                    />
                    <Discount
                        btnborderRadius={btnborderRadius}
                        headingColor={headingColor}
                        discountBadgeColor={discountBadgeColor}
                        priceColor={priceColor}
                        buttonColor={buttonColor}
                        buttonTextColor={buttonTextColor}
                        checkoutButtonColor={checkoutButtonColor}
                        checkoutButtonTextColor={checkoutButtonTextColor}
                        iconColor={iconColor}
                        discountCode={discountCode}
                        buttonText={buttonText}
                        isDiscountVisible={isDiscountVisible}
                        checkoutText={checkoutText}
                        discountText={discountText}
                        totalDiscountText={totalDiscountText}
                        discountSize={discountSize}
                        totalDiscountSize={totalDiscountSize}
                        checkoutSize={checkoutSize}
                    />
                    <TrustBages
                        customImages={customImages}
                        selectedImages={selectedImages}
                        isTrustVisible={isTrustVisible}
                    />
                    <ConfirmationBox
                        checkboxLabel={checkboxLabel}
                        link={link}
                        isChecked={isChecked}
                        showBox={showBox}

                    />
                    <Additionalnote
                        noteTitle={noteTitle}
                        notePlaceholder={notePlaceholder}
                        noteSize={noteSize}
                        notePlaceholderSize={notePlaceholderSize}
                        showNote={showNote}
                    />
                    {showViewCart && (
                        <div
                            className="view-cart-btn"
                            style={{
                                color: btnLinkColor,
                                fontSize: `${viewCartSize}px`,
                                padding: "5px 10px",
                                display: "inline-block",
                            }}>
                            {viewCartText || "View Cart"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
