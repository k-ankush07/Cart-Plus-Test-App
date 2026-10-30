import "../../../index.css";
import { backgroundToCss, useTemplateBackground } from "../utils/background";
import { THEMES, getTheme } from "../utils/rewardThemes";
import { LibraryIcon } from "../ui/IconLibrary";

const getIcon = (type) => {
  switch (type) {
    case "shipping":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path
            d="M4.75 4.5a.75.75 0 0 0 0 1.5h3.25a1 1 0 0 1 0 2h-4.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 0 0 1.5h.458a2.5 2.5 0 1 0 4.78.75h3.024a2.5 2.5 0 1 0 4.955-.153 1.75 1.75 0 0 0 1.033-1.597v-1.22a1.75 1.75 0 0 0-1.326-1.697l-1.682-.42a.25.25 0 0 1-.18-.174l-.426-1.494a2.75 2.75 0 0 0-2.645-1.995h-6.991Zm2.75 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
            fillRule="evenodd"
          />
        </svg>
      );
    case "discount":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path
            d="M8.575 4.649a3.75 3.75 0 0 1 2.7-1.149h1.975a3.25 3.25 0 0 1 3.25 3.25v2.187a3.25 3.25 0 0 1-.996 2.34l-4.747 4.572a2.5 2.5 0 0 1-3.502-.033l-2.898-2.898a2.75 2.75 0 0 1-.036-3.852l4.254-4.417Zm4.425 3.351a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            fillRule="evenodd"
          />
        </svg>
      );
    case "product":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M7.835 9.5h-.96c-.343 0-.625-.28-.625-.628 0-.344.28-.622.619-.622.242 0 .463.142.563.363l.403.887Z" />
          <path d="M10.665 9.5h.96c.343 0 .625-.28.625-.628 0-.344-.28-.622-.619-.622-.242 0-.463.142-.563.363l-.403.887Z" />
          <path
            fillRule="evenodd"
            d="M8.5 4h-3.25c-1.519 0-2.75 1.231-2.75 2.75v2.25h1.25c.414 0 .75.336.75.75s-.336.75-.75.75h-1.25v2.75c0 1.519 1.231 2.75 2.75 2.75h3.441c-.119-.133-.191-.308-.191-.5v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0 .192-.072.367-.191.5h4.941c1.519 0 2.75-1.231 2.75-2.75v-2.75h-2.75c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h2.75v-2.25c0-1.519-1.231-2.75-2.75-2.75h-4.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.25Zm.297 3.992c-.343-.756-1.097-1.242-1.928-1.242-1.173 0-2.119.954-2.119 2.122 0 1.171.95 2.128 2.125 2.128h.858c-.595.51-1.256.924-1.84 1.008-.41.058-.694.438-.635.848.058.41.438.695.848.636 1.11-.158 2.128-.919 2.803-1.53.121-.11.235-.217.341-.322.106.105.22.213.34.322.676.611 1.693 1.372 2.804 1.53.41.059.79-.226.848-.636.059-.41-.226-.79-.636-.848-.583-.084-1.244-.498-1.839-1.008h.858c1.176 0 2.125-.957 2.125-2.128 0-1.168-.946-2.122-2.119-2.122-.83 0-1.585.486-1.928 1.242l-.453.996-.453-.996Z"
          />
        </svg>
      );
    default:
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M7.835 9.5h-.96c-.343 0-.625-.28-.625-.628 0-.344.28-.622.619-.622.242 0 .463.142.563.363l.403.887Z" />
          <path d="M10.665 9.5h.96c.343 0 .625-.28.625-.628 0-.344-.28-.622-.619-.622-.242 0-.463.142-.563.363l-.403.887Z" />
          <path
            fillRule="evenodd"
            d="M8.5 4h-3.25c-1.519 0-2.75 1.231-2.75 2.75v2.25h1.25c.414 0 .75.336.75.75s-.336.75-.75.75h-1.25v2.75c0 1.519 1.231 2.75 2.75 2.75h3.441c-.119-.133-.191-.308-.191-.5v-2c0-.414.336-.75.75-.75s.75.336.75.75v2c0 .192-.072.367-.191.5h4.941c1.519 0 2.75-1.231 2.75-2.75v-2.75h-2.75c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h2.75v-2.25c0-1.519-1.231-2.75-2.75-2.75h-4.75v2.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.25Zm.297 3.992c-.343-.756-1.097-1.242-1.928-1.242-1.173 0-2.119.954-2.119 2.122 0 1.171.95 2.128 2.125 2.128h.858c-.595.51-1.256.924-1.84 1.008-.41.058-.694.438-.635.848.058.41.438.695.848.636 1.11-.158 2.128-.919 2.803-1.53.121-.11.235-.217.341-.322.106.105.22.213.34.322.676.611 1.693 1.372 2.804 1.53.41.059.79-.226.848-.636.059-.41-.226-.79-.636-.848-.583-.084-1.244-.498-1.839-1.008h.858c1.176 0 2.125-.957 2.125-2.128 0-1.168-.946-2.122-2.119-2.122-.83 0-1.585.486-1.928 1.242l-.453.996-.453-.996Z"
          />
        </svg>
      );
  }
};

export default function TieredRewards({ rewardsSettings, currency }) {
  const templateBg = useTemplateBackground();
  const tiers = rewardsSettings?.tiers || [];

  const totalCart = 1400;
  const totalMinProduct = 1400;

  const isQuantity = rewardsSettings.calculationType === "quantity";

  const totalValue = isQuantity ? totalMinProduct : totalCart;

  const getTierValue = (tier) =>
    isQuantity ? tier.minQuantity || 0 : tier.minAmount || 0;

  const sortedTiers = [...tiers].sort(
    (a, b) => getTierValue(a) - getTierValue(b),
  );

  const maxAmount = getTierValue(sortedTiers[sortedTiers.length - 1]) || 1;

  const getStepPosition = (index) => {
    const len = sortedTiers.length;
    const step = 100 / len;
    return step * (index + 1);
  };

  const currentTier = sortedTiers.find(
    (tier) => totalValue < getTierValue(tier),
  );

  const getFillPercent = () => {
    if (sortedTiers.length === 0) return 0;

    const firstTier = sortedTiers[0];

    if (totalValue < getTierValue(firstTier)) {
      return (totalValue / getTierValue(firstTier)) * getStepPosition(0);
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
          progress * (getStepPosition(i + 1) - getStepPosition(i))
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

  const messageHtml =
    totalValue >= maxAmount
      ? rewardsSettings.successText
      : currentTier?.title.replace(
          "{AMOUNT}",
          isQuantity
            ? `${getRemainingAmount(currentTier)} items`
            : `${currency}${getRemainingAmount(currentTier)}`,
        );

  // gradient-aware colours; fall back to the plain bar colours
  const trackBg =
    backgroundToCss(rewardsSettings.barBackground) ||
    rewardsSettings.backgroundColor;
  const fillBg =
    backgroundToCss(rewardsSettings.barProgress || templateBg) ||
    rewardsSettings.textColor;
  const barHeight = rewardsSettings.barLength || 5;
  const message = (
    <p
      className="tier-title cart-plus-rewards-message cart-plus-public-rewards__message"
      dangerouslySetInnerHTML={{ __html: messageHtml }}
    />
  );
  const bar = (percent) => (
    <div
      style={{
        height: barHeight,
        borderRadius: barHeight,
        background: trackBg,
        overflow: "hidden",
      }}
    >
      <div
        style={{ width: `${percent}%`, height: "100%", background: fillBg }}
      />
    </div>
  );
  const fmt = (n) => (isQuantity ? `${n}` : `${currency}${n}`);
  const barStyle = rewardsSettings.barStyle || "icon";
  const ticketLabel = rewardsSettings.rewardTicketLabel ?? "REWARD TICKET";
  const nextLabel = rewardsSettings.nextRewardLabel ?? "NEXT REWARD";
  const doneLabel = rewardsSettings.milestoneDoneLabel ?? "DONE";

  const theme = THEMES[barStyle];
  if (THEMES[barStyle]) {
    const t = getTheme(barStyle, rewardsSettings.styleConfig?.[barStyle]);
    const { bg, accent, track } = t;
    const h = t.barHeight;
    const iconColor = t.iconColor || accent;
    const iconNode =
      typeof t.icon === "string" ? (
        t.icon
      ) : (
        <LibraryIcon value={t.icon} size={t.iconSize} color={iconColor} />
      );

    const remainingNext = getRemainingAmount(currentTier);
    const pctRound = Math.round(Math.min(100, (totalValue / maxAmount) * 100));

    const shell = {
      background: bg,
      borderRadius: t.radius,
      padding: `${t.padding}px 16px`,
      margin: "12px",
      color: t.textColor,
      display: "flex",
      alignItems: "center",
      gap: 12,
    };
    const msg = (
      <div
        style={{ fontSize: t.fontSize, fontWeight: 700, lineHeight: 1.3 }}
        dangerouslySetInnerHTML={{ __html: messageHtml }}
      />
    );
    const sub = (text) => (
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{text}</div>
    );
    const iconBox = (content, round = true) => (
      <div
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: round ? "50%" : 10,
          background: t.iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {content}
      </div>
    );
    const simpleBar = (striped, pct = fillPercent) => (
      <div
        style={{
          height: h,
          borderRadius: h,
          background: track,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: striped
              ? `repeating-linear-gradient(45deg, ${accent} 0 6px, ${accent}99 6px 12px)`
              : accent,
            transition: "width .4s",
          }}
        />
      </div>
    );

    const n = sortedTiers.length;
    const evenPos = (i) => (n > 1 ? (i / (n - 1)) * 100 : 100);
    const evenFill = (() => {
      if (!n) return 0;
      const first = getTierValue(sortedTiers[0]);
      if (n === 1) return Math.min(100, (totalValue / (first || 1)) * 100);
      if (totalValue <= first) return 0;
      for (let i = 0; i < n - 1; i++) {
        const a = getTierValue(sortedTiers[i]);
        const b = getTierValue(sortedTiers[i + 1]);
        if (totalValue < b)
          return (
            evenPos(i) +
            ((totalValue - a) / (b - a)) * (evenPos(i + 1) - evenPos(i))
          );
      }
      return 100;
    })();

    const tierTrack = (
      <div
        style={{
          position: "relative",
          paddingTop: t.dotSize / 2,
          paddingBottom: t.showLabels ? 44 : t.dotSize / 2,
        }}
      >
        {simpleBar(false, evenFill)}
        {sortedTiers.map((tier, i) => {
          const pos = evenPos(i);
          const reached = totalValue >= getTierValue(tier);
          return (
            <div
              key={tier.id}
              style={{
                position: "absolute",
                left: `${pos}%`,
                top: h / 2,
                transform: `translateX(-${pos}%)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: 10,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: t.dotSize,
                  height: t.dotSize,
                  borderRadius: "50%",
                  boxSizing: "border-box",
                  background: reached ? accent : "#fff",
                  border: `2px solid ${reached ? accent : track}`,
                  color: "#fff",
                  fontSize: Math.max(8, t.dotSize - 8),
                  lineHeight: `${t.dotSize - 4}px`,
                }}
              >
                {reached ? "✓" : ""}
              </span>
              {t.showLabels && (
                <>
                  <b style={{ marginTop: 6 }}>{fmt(getTierValue(tier))}</b>
                  <span style={{ opacity: 0.7 }}>{tier.description}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
    const nextCard = t.showNext && currentTier && (
      <div
        style={{
          background: t.nextBg,
          borderRadius: 10,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: accent,
          flexShrink: 0,
        }}
      >
        {getIcon(currentTier.type)}
        <div style={{ color: t.textColor, fontSize: 11, lineHeight: 1.3 }}>
          <b style={{ display: "block", fontSize: 13 }}>
            {fmt(getTierValue(currentTier))}
          </b>
          {currentTier.description}
        </div>
      </div>
    );

    if (barStyle === "card")
      return (
        <div className="cart-plus-rewards" style={shell}>
          {t.showIcon && iconBox(iconNode, false)}
          <div style={{ flex: 1 }}>
            {msg}
            <div style={{ marginTop: 8 }}>{simpleBar(false)}</div>
            {t.showLabels && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                <span>{fmt(0)}</span>
                <span>{fmt(maxAmount)}</span>
              </div>
            )}
          </div>
        </div>
      );

    if (barStyle === "gift")
      return (
        <div
          className="cart-plus-rewards"
          style={{ ...shell, alignItems: "flex-start" }}
        >
          {t.showIcon && iconBox(iconNode)}
          <div style={{ flex: 1 }}>
            {msg}
            <div style={{ marginTop: 14 }}>{tierTrack}</div>
          </div>
        </div>
      );

    if (barStyle === "ring") {
      const size = t.ringSize;
      const stroke = 4;
      const r = (size - stroke - 2) / 2;
      const c = 2 * Math.PI * r;
      const subHtml = String(t.subText || "").replace(
        /\{remaining\}/gi,
        fmt(remainingNext),
      );
      return (
        <div className="cart-plus-rewards" style={shell}>
          <div
            style={{
              position: "relative",
              width: size,
              height: size,
              flexShrink: 0,
            }}
          >
            <svg
              width={size}
              height={size}
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={track}
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={accent}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${(c * pctRound) / 100} ${c}`}
              />
            </svg>
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: accent,
              }}
            >
              {pctRound}%
            </span>
          </div>
          <div style={{ flex: 1 }}>
            {msg}
            {remainingNext > 0 && subHtml && sub(subHtml)}
          </div>
          {nextCard}
        </div>
      );
    }

    if (barStyle === "unlock")
      return (
        <div
          className="cart-plus-rewards"
          style={{ ...shell, alignItems: "flex-start" }}
        >
          <div style={{ width: `${t.titleWidth}%`, flexShrink: 0 }}>{msg}</div>
          <div style={{ flex: 1, paddingTop: 6 }}>{tierTrack}</div>
        </div>
      );

    if (barStyle === "striped")
      return (
        <div className="cart-plus-rewards" style={shell}>
          {t.showIcon && iconBox(iconNode, false)}
          <div style={{ flex: 1 }}>
            {msg}
            <div style={{ marginTop: 8 }}>{simpleBar(true)}</div>
          </div>
          {nextCard}
        </div>
      );

    // almost
    return (
      <div className="cart-plus-rewards" style={shell}>
        {t.showIcon && iconBox(iconNode)}
        <div style={{ flex: 1 }}>
          {msg}
          <div style={{ marginTop: 8 }}>{simpleBar(false)}</div>
        </div>
        {t.showCounter && (
          <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
            {fmt(totalValue)} / {fmt(maxAmount)}
          </div>
        )}
        {t.showButton && (
          <span
            style={{
              background: t.buttonBg || accent,
              color: t.buttonColor,
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {t.buttonText}
          </span>
        )}
      </div>
    );
  }

  // Reward: ticket card with the current reward on the left, next reward on the right
  if (barStyle === "reward") {
    // labels use the bar colour (first stop when it is a gradient)
    const labelColor =
      /#[0-9a-fA-F]{3,8}|rgba?([^)]*)/.exec(String(fillBg))?.[0] || "inherit";
    const labelStyle = {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: labelColor,
    };
    return (
      <div className="cart-plus-rewards" style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            border: "1px dashed",
            borderColor: labelColor,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: "16px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ ...labelStyle, textAlign: "left", marginBottom: 8 }}>
              {ticketLabel}
            </div>
            {message}
            {bar(fillPercent)}
          </div>
          <div
            style={{
              width: 120,
              flexShrink: 0,
              padding: "16px 12px",
              textAlign: "center",
              borderLeft: "1px dashed",
              borderColor: labelColor,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={labelStyle}>{nextLabel}</div>
            <div style={{ fontSize: 40, lineHeight: 1 }}>🎁</div>
          </div>
        </div>
      </div>
    );
  }

  // Next Reward: message plus one continuous bar
  if (barStyle === "nextReward") {
    return (
      <div
        className="cart-plus-rewards"
        style={{ padding: "12px 16px", textAlign: "center" }}
      >
        {message}
        {bar(fillPercent)}
      </div>
    );
  }

  // Milestone: one circle per tier, "DONE" once reached
  if (barStyle === "milestone") {
    return (
      <div
        className="cart-plus-rewards"
        style={{ padding: "12px 16px", textAlign: "center" }}
      >
        {message}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            marginTop: 8,
          }}
        >
          {sortedTiers.map((tier, index) => {
            const reached = totalValue >= getTierValue(tier);
            return (
              <div
                key={tier.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: reached ? fillBg : trackBg,
                    color: reached
                      ? rewardsSettings.completeIconColor
                      : rewardsSettings.incompleteIconColor,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {reached ? (
                    <>
                      <span>✓</span>
                      {doneLabel}
                    </>
                  ) : (
                    index + 1
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {tier.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Threshold Tracker: one bar per tier with the current and target values underneath
  if (barStyle === "threshold") {
    return (
      <div
        className="cart-plus-rewards"
        style={{ padding: "12px 16px", textAlign: "center" }}
      >
        {message}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {sortedTiers.map((tier, index) => {
            const segStart = index === 0 ? 0 : getStepPosition(index - 1);
            const segEnd = getStepPosition(index);
            const segFill =
              fillPercent >= segEnd
                ? 100
                : fillPercent > segStart
                  ? ((fillPercent - segStart) / (segEnd - segStart)) * 100
                  : 0;
            return (
              <div key={tier.id} style={{ flex: 1 }}>
                {bar(segFill)}
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            marginTop: 4,
          }}
        >
          <span>{fmt(totalValue)}</span>
          <span>{fmt(maxAmount)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-plus-internal-rewards cart-plus-public-rewards tier-card cart-plus-rewards">
      <div className="tier-content">
        {message}

        <div className="progress-wrapper">
          <div className="progress-track">
            <div className="segments-flex cart-plus-public-component-segmented-progress-bar__segments-container">
              {sortedTiers.map((tier, index) => {
                const segStart = index === 0 ? 0 : getStepPosition(index - 1);
                const segEnd = getStepPosition(index);
                let segFill = 0;
                if (fillPercent >= segEnd) segFill = 100;
                else if (fillPercent > segStart)
                  segFill =
                    ((fillPercent - segStart) / (segEnd - segStart)) * 100;

                const reached = totalValue >= getTierValue(tier);

                return (
                  <div
                    key={tier.id}
                    className="tier-cell cart-plus-rewards-tier cart-plus-public-component-segmented-progress-bar__segment"
                  >
                    <div
                      className="cell-bar cart-plus-rewards-bar-background cart-plus-public-rewards__bar"
                      style={{
                        background: trackBg,
                        height: `${rewardsSettings.barLength}px`,
                      }}
                    >
                      <div
                        className="cell-fill cart-plus-rewards-bar-foreground cart-plus-public-component-segmented-progress-bar"
                        style={{
                          width: `${segFill}%`,
                          background: fillBg,
                        }}
                      />
                    </div>
                    <div
                      className="tier-circle-wrap"
                      style={{ padding: `0 ${rewardsSettings.barGap || 0}px` }}
                    >
                      {tier.showIcon !== false && (
                        <>
                          <div
                            className={`cart-plus-public-component-segmented-progress-bar__milestone--middle icon-circle upcart-rewards-tier-circle ${reached ? "active" : ""}`}
                            style={{
                              background: reached ? fillBg : trackBg,
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
