import {
  DeliveryIcon,
  DiscountIcon,
  ProductIcon,
} from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";

import "../../../index.css";

const getIcon = (type) => {
  switch (type) {
    case "shipping":
      return DeliveryIcon;
    case "discount":
      return DiscountIcon;
    case "product":
      return ProductIcon;
    default:
      return ProductIcon;
  }
};

export default function TieredRewards({ rewardsSettings }) {
  const tiers = rewardsSettings?.tiers || [];

  const totalCart = 1400;
  const totalMinProduct = 1400;

  const isQuantity = rewardsSettings.calculationType === "quantity";

  const totalValue = isQuantity
    ? totalMinProduct
    : totalCart;

  const getTierValue = (tier) =>
    isQuantity ? tier.minQuantity || 0 : tier.minAmount || 0;

  const sortedTiers = [...tiers].sort(
    (a, b) => getTierValue(a) - getTierValue(b)
  );

  const maxAmount =
    getTierValue(sortedTiers[sortedTiers.length - 1]) || 1;

  const getStepPosition = (index) => {
    const len = sortedTiers.length;
    const step = 100 / len;
    return step * (index + 1);
  };

  const currentTier = sortedTiers.find(
    (tier) => totalValue < getTierValue(tier)
  );

  const getFillPercent = () => {
    if (sortedTiers.length === 0) return 0;

    const firstTier = sortedTiers[0];

    if (totalValue < getTierValue(firstTier)) {
      return (
        (totalValue / getTierValue(firstTier)) *
        getStepPosition(0)
      );
    }

    for (let i = 0; i < sortedTiers.length - 1; i++) {
      const current = sortedTiers[i];
      const next = sortedTiers[i + 1];

      if (
        totalValue >= getTierValue(current) &&
        totalValue < getTierValue(next)
      ) {
        const progress =
          (totalValue - getTierValue(current)) /
          (getTierValue(next) - getTierValue(current));

        return (
          getStepPosition(i) +
          progress *
          (getStepPosition(i + 1) - getStepPosition(i))
        );
      }
    }

    return 100;
  };

  const fillPercent = getFillPercent();

  const getRemainingAmount = (tier) => {
    if (!tier) return 0;

    const tierValue = getTierValue(tier);

    if (totalValue >= tierValue) return 0;

    return tierValue - totalValue;
  };

  return (
    <div className="tier-card upcart-rewards">
      <div className="tier-content">
        <p
          className="tier-title upcart-rewards-message"
          dangerouslySetInnerHTML={{
            __html:
              totalValue >= maxAmount
                ? rewardsSettings.successText
                : currentTier?.title.replace(
                  "{AMOUNT}",
                  isQuantity
                    ? `${getRemainingAmount(currentTier)} items`
                    : `$${getRemainingAmount(currentTier)}`
                ),
          }}
        />

        <div className="progress-wrapper">
          <div className="progress-track">
          <div
            className="progress-bar upcart-rewards-bar-background"
            style={{ backgroundColor: rewardsSettings.backgroundColor, height: `${rewardsSettings.barLength}px` }}
          >
            <div
              className="progress-fill upcart-rewards-bar-foreground"
              style={{
                width: `${fillPercent}%`,
                backgroundColor: rewardsSettings.textColor,
              }}
            />
          </div>

          <div className="segments">
            {sortedTiers.map((tier, index) => {
              const reached =
                totalValue >= getTierValue(tier);

              return (
                <div
                  key={tier.id}
                  className="segment upcart-rewards-tier"
                  style={{
                    left: `${getStepPosition(index)}%`,
                  }}
                >
                  <div
                    className={`icon-circle upcart-rewards-tier-circle ${reached ? "active" : ""}`}
                    style={{
                      backgroundColor: reached
                        ? rewardsSettings.textColor
                        : rewardsSettings.backgroundColor,
                      color: reached
                        ? rewardsSettings.completeIconColor
                        : rewardsSettings.incompleteIconColor,
                      "--bar-gap": `${rewardsSettings.barGap || 0}px`,
                      "--bar-height": `${rewardsSettings.barLength || 6}px`,
                    }}
                  >
                    <span className="upcart-rewards-tier-icon">
                      <Icon source={getIcon(tier.type)} />
                    </span>
                  </div>

                  <p className="step-text upcart-rewards-tier-description">
                    {tier.description}
                  </p>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}