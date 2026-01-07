import { Truck, Percent, Gift } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function MultiTierProgressBar({
    tiers,
    testAmount,
    textAfter,
    showProgressBar,
    addedProgressProducts,
    tierTitle,
    tierRewardTitle,
    tierFontsize,
    rewardFontsize,
    beforeColor,
    beforeBar,
    afterColor,
    afterIcon
}) {
    const prevProductActive = useRef(false);
    const [activeProduct, setActiveProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);

    const getIcon = (rewardType, active) => {
        const color = active ? afterColor : beforeColor;
        switch (rewardType) {
            case "Shipping":
                return <Truck size={18} color={color} />;
            case "Discount":
                return <Percent size={18} color={color} />;
            case "Product":
                return <Gift size={18} color={color} />;
            default:
                return <Truck size={18} color={color} />;
        }
    };

    const getProgressPercent = (tierIndex) => {
        if (tierIndex === 0) return Math.min((testAmount / tiers[0].minAmount) * 100, 100);
        const prevMin = tiers[tierIndex - 1].minAmount;
        const currMin = tiers[tierIndex].minAmount;
        if (testAmount <= prevMin) return 0;
        return Math.min(((testAmount - prevMin) / (currMin - prevMin)) * 100, 100);
    };

    const getProgressText = () => {
        if (!tiers || tiers.length === 0) return "";
        const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
        const lastTier = sortedTiers[sortedTiers.length - 1];
        if (testAmount >= lastTier.minAmount) return textAfter;
        const nextTier = sortedTiers.find(t => testAmount < t.minAmount);
        if (nextTier) {
            const remaining = nextTier.minAmount - testAmount;
            const amountText = `₹${remaining}`;
            return nextTier.textBefore.replace("{{min_amount}}", amountText);
        }
        return "";
    };

    useEffect(() => {
        if (!tiers) return;

        const productTier = tiers.find(t => t.rewardType === "Product");
        if (!productTier) return;

        const isActive = testAmount >= productTier.minAmount;
        if (isActive && addedProgressProducts?.length > 0) {
            const product = addedProgressProducts[0];
            setActiveProduct(product);
            setSelectedVariant(product.variants[0]);
        } else {
            setActiveProduct(null);
            setSelectedVariant(null);
        }

        prevProductActive.current = isActive;
    }, [testAmount, tiers, addedProgressProducts]);

    const handleVariantChange = (variantId) => {
        const variant = activeProduct.variants.find(v => v.id === parseInt(variantId));
        setSelectedVariant(variant);
    };

    return (
        <>
            {showProgressBar && (
                <div className="multi-tier-progress-container">
                    <div className="progress-text" style={{
                        fontSize: `${rewardFontsize}px`,
                        color: tierRewardTitle,
                    }}>
                        {getProgressText()}
                    </div>

                    <div className="progress-bar-wrapper">
                        {tiers.map((tier, index) => {
                            const progress = getProgressPercent(index);
                            const isActive = testAmount >= tier.minAmount;
                            return (
                                <div key={index} className="tier-wrapper">
                                    <div className="progress-segment"
                                        style={{ background: isActive ? afterIcon : beforeBar }}>
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${progress}%`, background: afterIcon }}
                                        ></div>
                                    </div>
                                    <div className={`progress-icon ${isActive ? "active" : ""}`}
                                        style={{ background: isActive ? afterIcon : beforeBar }}>
                                        {getIcon(tier.rewardType, isActive)}
                                    </div>
                                    <div className="tier-label" style={{
                                        fontSize: `${tierFontsize}px`,
                                        color: tierTitle,
                                    }}>
                                        {tier.rewardDescription}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {activeProduct && selectedVariant && (
                        <div className="active-product-display">
                            <div className="active-product-left-side">
                                {selectedVariant.image ? (
                                    <img src={selectedVariant.image.src || selectedVariant.image.url} alt={selectedVariant.image.alt || activeProduct.title} />
                                ) : activeProduct.image ? (
                                    <img src={activeProduct.image.src || activeProduct.image.url} alt={activeProduct.image.alt} />
                                ) : null}
                            </div>
                            <div className="active-product-right-side">
                                <h4>{activeProduct.title}</h4>
                                <p> ₹{selectedVariant.price}</p>

                                <select onChange={(e) => handleVariantChange(e.target.value)} value={selectedVariant.id}>
                                    {activeProduct.variants.map(variant => (
                                        <option key={variant.id} value={variant.id}>
                                            {variant.title} - ₹{variant.price}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
