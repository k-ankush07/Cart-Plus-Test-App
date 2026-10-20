import "../../../index.css";

const getIcon = (type) => {
  switch (type) {
    case "shipping":
      return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path d="M4.75 4.5a.75.75 0 0 0 0 1.5h3.25a1 1 0 0 1 0 2h-4.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 0 0 1.5h.458a2.5 2.5 0 1 0 4.78.75h3.024a2.5 2.5 0 1 0 4.955-.153 1.75 1.75 0 0 0 1.033-1.597v-1.22a1.75 1.75 0 0 0-1.326-1.697l-1.682-.42a.25.25 0 0 1-.18-.174l-.426-1.494a2.75 2.75 0 0 0-2.645-1.995h-6.991Zm2.75 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fillRule="evenodd" />
        </svg>
      );
    case "discount":
      return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path d="M8.575 4.649a3.75 3.75 0 0 1 2.7-1.149h1.975a3.25 3.25 0 0 1 3.25 3.25v2.187a3.25 3.25 0 0 1-.996 2.34l-4.747 4.572a2.5 2.5 0 0 1-3.502-.033l-2.898-2.898a2.75 2.75 0 0 1-.036-3.852l4.254-4.417Zm4.425 3.351a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fillRule="evenodd" />
        </svg>
      );
    case "product":
      return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path d="M7.835 9.5h-.96c-.343 0-.625-.28-.625-.628 0-.344.28-.622.619-.622.242 0 .463.142.563.363l.403.887Z" />
          <path d="M10.665 9.5h.96c.343 0 .625-.28.625-.628 0-.344-.28-.622-.619-.622-.242 0-.463.142-.563.363l-.403.887Z" />
          <path fillRule="evenodd" d="M8.5 4h-3.25c-1.519 0-2.75 1.231-2.75 2.75v2.25h1.25c.414 0 .75.336.75.75s-.336.75-.75.75h-1.25v2.75c0 1.519 1.231 2.75 2.75 2.75h3.441c-.119-.133-.191-.308-.191-.5v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0 .192-.072.367-.191.5h4.941c1.519 0 2.75-1.231 2.75-2.75v-2.75h-2.75c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h2.75v-2.25c0-1.519-1.231-2.75-2.75-2.75h-4.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.25Zm.297 3.992c-.343-.756-1.097-1.242-1.928-1.242-1.173 0-2.119.954-2.119 2.122 0 1.171.95 2.128 2.125 2.128h.858c-.595.51-1.256.924-1.84 1.008-.41.058-.694.438-.635.848.058.41.438.695.848.636 1.11-.158 2.128-.919 2.803-1.53.121-.11.235-.217.341-.322.106.105.22.213.34.322.676.611 1.693 1.372 2.804 1.53.41.059.79-.226.848-.636.059-.41-.226-.79-.636-.848-.583-.084-1.244-.498-1.839-1.008h.858c1.176 0 2.125-.957 2.125-2.128 0-1.168-.946-2.122-2.119-2.122-.83 0-1.585.486-1.928 1.242l-.453.996-.453-.996Z" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path d="M7.835 9.5h-.96c-.343 0-.625-.28-.625-.628 0-.344.28-.622.619-.622.242 0 .463.142.563.363l.403.887Z" />
          <path d="M10.665 9.5h.96c.343 0 .625-.28.625-.628 0-.344-.28-.622-.619-.622-.242 0-.463.142-.563.363l-.403.887Z" />
          <path fillRule="evenodd" d="M8.5 4h-3.25c-1.519 0-2.75 1.231-2.75 2.75v2.25h1.25c.414 0 .75.336.75.75s-.336.75-.75.75h-1.25v2.75c0 1.519 1.231 2.75 2.75 2.75h3.441c-.119-.133-.191-.308-.191-.5v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0 .192-.072.367-.191.5h4.941c1.519 0 2.75-1.231 2.75-2.75v-2.75h-2.75c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h2.75v-2.25c0-1.519-1.231-2.75-2.75-2.75h-4.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.25Zm.297 3.992c-.343-.756-1.097-1.242-1.928-1.242-1.173 0-2.119.954-2.119 2.122 0 1.171.95 2.128 2.125 2.128h.858c-.595.51-1.256.924-1.84 1.008-.41.058-.694.438-.635.848.058.41.438.695.848.636 1.11-.158 2.128-.919 2.803-1.53.121-.11.235-.217.341-.322.106.105.22.213.34.322.676.611 1.693 1.372 2.804 1.53.41.059.79-.226.848-.636.059-.41-.226-.79-.636-.848-.583-.084-1.244-.498-1.839-1.008h.858c1.176 0 2.125-.957 2.125-2.128 0-1.168-.946-2.122-2.119-2.122-.83 0-1.585.486-1.928 1.242l-.453.996-.453-.996Z" />
        </svg>
      );
  }
};

export default function TieredRewards({ rewardsSettings, currency }) {
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
    <div className="cart-plus-internal-rewards cart-plus-public-rewards tier-card cart-plus-rewards">
      <div className="tier-content">
        <p
          className="tier-title cart-plus-rewards-message cart-plus-public-rewards__message"
          dangerouslySetInnerHTML={{
            __html:
              totalValue >= maxAmount
                ? rewardsSettings.successText
                : currentTier?.title.replace(
                  "{AMOUNT}",
                  isQuantity
                    ? `${getRemainingAmount(currentTier)} items`
                    : `${currency}${getRemainingAmount(currentTier)}`
                ),
          }}
        />

        <div className="progress-wrapper">
          <div className="progress-track">
            <div className="segments-flex cart-plus-public-component-segmented-progress-bar__segments-container">
              {sortedTiers.map((tier, index) => {
                const segStart = index === 0 ? 0 : getStepPosition(index - 1);
                const segEnd = getStepPosition(index);
                let segFill = 0;
                if (fillPercent >= segEnd) segFill = 100;
                else if (fillPercent > segStart)
                  segFill = ((fillPercent - segStart) / (segEnd - segStart)) * 100;

                const reached = totalValue >= getTierValue(tier);

                return (
                  <div key={tier.id} className="tier-cell cart-plus-rewards-tier cart-plus-public-component-segmented-progress-bar__segment">
                    <div
                      className="cell-bar cart-plus-rewards-bar-background cart-plus-public-rewards__bar"
                      style={{
                        backgroundColor: rewardsSettings.backgroundColor,
                        height: `${rewardsSettings.barLength}px`,
                      }}
                    >
                      <div
                        className="cell-fill cart-plus-rewards-bar-foreground cart-plus-public-component-segmented-progress-bar"
                        style={{
                          width: `${segFill}%`,
                          backgroundColor: rewardsSettings.textColor,
                        }}
                      />
                    </div>
                    <div className="tier-circle-wrap" style={{ padding: `0 ${rewardsSettings.barGap || 0}px` }}>
                      {tier.showIcon !== false && (
                        <>
                          <div
                            className={`cart-plus-public-component-segmented-progress-bar__milestone--middle icon-circle upcart-rewards-tier-circle ${reached ? "active" : ""}`}
                            style={{
                              backgroundColor: reached
                                ? rewardsSettings.textColor
                                : rewardsSettings.backgroundColor,
                              color: reached
                                ? rewardsSettings.completeIconColor
                                : rewardsSettings.incompleteIconColor,
                            }}
                          >
                            <span className="cart-plus-rewards-tier-icon cart-plus-public-component-segmented-progress-bar__segment">
                              {getIcon(tier.type)}
                            </span>
                          </div>
                          <p className="step-text cart-plus-rewards-tier-description cart-plus-public-component-segmented-progress-bar__milestone-label--align-center">
                            {tier.description}
                          </p>
                        </>
                      )}
                    </div>
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