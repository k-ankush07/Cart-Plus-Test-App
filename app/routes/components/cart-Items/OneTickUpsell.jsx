import { useEffect, useRef, useState } from "react";
import { getOneTick, applyDiscount } from "../utils/oneTick";
import { backgroundToCss } from "../utils/background";
import { LibraryIcon } from "../ui/IconLibrary";
import NoProductPlaceholder from "../ui/NoProductPlaceholder";

const money = (n) => Number(n).toFixed(2);

const CAROUSEL_GAP = 10;

// card corners are fixed; Styles > Radius only rounds the product image
const CARD_RADIUS = 10;

// how long a toggle / checkbox stays visibly "on" before its product is added
const ARMED_MS = 450;

/* Stack CSS: pos 0 = top card, 1 & 2 = peeking layers, 3+ = hidden */
const STACK_CSS = `
.cart-plus-drawer__ups-stack{position:relative;padding-bottom:14px}
.cart-plus-drawer__ups-stack-item{transition:transform .25s ease,opacity .25s ease;transform-origin:top center}
.cart-plus-drawer__ups-stack-item[data-rapi-ups-stack-pos="0"]{position:relative;z-index:3}
.cart-plus-drawer__ups-stack-item:not([data-rapi-ups-stack-pos="0"]){position:absolute;top:0;left:0;right:0;pointer-events:none}
.cart-plus-drawer__ups-stack-item[data-rapi-ups-stack-pos="1"]{z-index:2;transform:translateY(8px) scale(.96)}
.cart-plus-drawer__ups-stack-item[data-rapi-ups-stack-pos="2"]{z-index:1;transform:translateY(16px) scale(.92)}
.cart-plus-drawer__ups-stack-item:not([data-rapi-ups-stack-pos="0"]):not([data-rapi-ups-stack-pos="1"]):not([data-rapi-ups-stack-pos="2"]){z-index:0;opacity:0;visibility:hidden;transform:translateY(16px) scale(.92)}
.cart-plus-drawer__ups-stack-item>div{min-height:96px;box-sizing:border-box;box-shadow:0 1px 4px rgba(0,0,0,.12); border: 1px solid rgba(0, 0, 0, .08);}
`;

const CACHE_KEY = "cp-one-tick-products";

// last loaded products, per offer set (sessionStorage can be unavailable)
const readCache = (key) => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    return saved?.key === key ? saved.products : {};
  } catch {
    return {};
  }
};
const writeCache = (key, products) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ key, products }));
  } catch {
    /* ignore */
  }
};

const LEAVE_MS = 320;

// fade + slide + collapse for a card that was just added to the cart
const leaveStyle = (isLeaving, collapse = true) => ({
  transition: `opacity ${LEAVE_MS}ms ease, transform ${LEAVE_MS}ms ease, max-height ${LEAVE_MS}ms ease, padding ${LEAVE_MS}ms ease`,
  ...(isLeaving
    ? {
        opacity: 0,
        transform: "translateX(24px) scale(.97)",
        pointerEvents: "none",
        ...(collapse
          ? {
              maxHeight: 0,
              paddingTop: 0,
              paddingBottom: 0,
              overflow: "hidden",
            }
          : {}),
      }
    : {
        opacity: 1,
        transform: "none",
        ...(collapse ? { maxHeight: 600 } : {}),
      }),
});

const optionParts = (variant) => String(variant.title || "").split(" / ");

export default function OneTickUpsell({
  cartSettings,
  designSettings,
  currency,
  previewProducts = [],
  onAddPreviewProduct,
  onRemovePreviewProduct,
}) {
  const oneTickSaved = getOneTick(cartSettings);
  const isActiveOffer = (o) =>
    o.mode === "auto" ||
    (o.mode === "manual" && o.selected?.items?.variants?.length > 0);
  // Appearance: Dark -> the light defaults saved with the section become the dark theme's text colours
  const dark = !!designSettings?.dark;
  const darkText = (value, lightDefault, fallback) =>
    dark && (!value || String(value).toLowerCase() === lightDefault)
      ? fallback
      : value;
  const oneTick = dark
    ? {
        ...oneTickSaved,
        primaryTextColor: darkText(
          oneTickSaved.primaryTextColor,
          "#000000",
          designSettings.textColor,
        ),
        secondaryTextColor: darkText(
          oneTickSaved.secondaryTextColor,
          "#616161",
          "#a8a8ad",
        ),
        iconColor: darkText(
          oneTickSaved.iconColor,
          "#000000",
          designSettings.textColor,
        ),
      }
    : oneTickSaved;
  const offersKey = JSON.stringify(
    oneTick.offers.map((o) => [o.id, o.mode, o.selected?.items?.variants]),
  );
  // starts empty so the first client render matches the server HTML; the saved products
  // from the last load are applied right after hydration (in the effect below)
  const [products, setProducts] = useState({}); // offerId -> product
  const [loaded, setLoaded] = useState(false);
  const [variantSel, setVariantSel] = useState({}); // offerId -> chosen variant id
  const [addedBy, setAddedBy] = useState({}); // offerId -> true once this offer added its product
  const [leaving, setLeaving] = useState({}); // offerId -> true while its card fades out
  const [armed, setArmed] = useState({}); // offerId -> true while a toggle / checkbox shows "on" just before the product is added
  const [activeDot, setActiveDot] = useState(0);
  const [top, setTop] = useState(0); // stack: konsa card abhi upar hai
  const trackRef = useRef(null);

  useEffect(() => {
    if (Object.keys(products).length) writeCache(offersKey, products);
  }, [products, offersKey]);

  // one real store product per offer (the picked one, or any for auto-recommend)
  useEffect(() => {
    if (!oneTick.enabled || !oneTick.offers.length) return;
    let cancelled = false;
    setProducts((prev) =>
      Object.keys(prev).length ? prev : readCache(offersKey),
    );
    setLoaded(false);

    const post = (body) =>
      fetch("/shopify/get-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionIds: [], ...body }),
      })
        .then((res) => res.json())
        .then((data) => (data.products || []).filter((p) => p.variants?.length))
        .catch(() => []);

    const manualOffers = oneTick.offers.filter(
      (o) => o.mode === "manual" && o.selected?.items?.variants?.length,
    );
    const autoOffers = oneTick.offers.filter((o) => o.mode === "auto");

    const requests = [];

    // manual: the picked product, with only the variants ticked in the picker
    manualOffers.forEach((offer) => {
      const variantIds = offer.selected.items.variants;
      const req = post({ variantIds, anyProducts: false, limit: 1 }).then(
        ([found]) => {
          if (cancelled || !found) return;
          const chosen = found.variants.filter((v) =>
            variantIds.some((id) => String(id) === String(v.id)),
          );
          const product = chosen.length
            ? { ...found, variants: chosen }
            : found;
          setProducts((prev) => ({ ...prev, [offer.id]: product }));
        },
      );
      requests.push(req);
    });

    // auto: a different store product for each offer
    if (autoOffers.length) {
      const req = post({
        variantIds: [],
        anyProducts: true,
        limit: autoOffers.length,
      }).then((list) => {
        if (cancelled || !list.length) return;
        setProducts((prev) => {
          const next = { ...prev };
          autoOffers.forEach((offer, i) => {
            next[offer.id] = list[i] || list[0];
          });
          return next;
        });
      });
      requests.push(req);
    }

    Promise.all(requests).then(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [oneTick.enabled, offersKey]);

  if (!oneTick.enabled) return null;
  // nothing to show yet (no offer, or manual offers with no product picked): say so, like an empty slot
  const nothingPicked = !oneTick.offers.some(isActiveOffer);

  if (nothingPicked) {
    return (
      <NoProductPlaceholder
        title={oneTick.title}
        icon={oneTick.icon}
        iconColor={oneTick.iconColor}
        titleColor={oneTick.primaryTextColor}
        textColor={oneTick.primaryTextColor}
        cardBackground={
          backgroundToCss(oneTick.cardBackground) ||
          (dark ? "var(--cp-card, #2a2a2d)" : "#ffffff")
        }
        radius={CARD_RADIUS}
      />
    );
  }

  // an offer disappears once its product is in the cart (back again if it is removed)
  const inCartAlready = (product) =>
    (previewProducts.find((p) => p.id === product.id)?.variants || []).some(
      (v) => product.variants.some((pv) => pv.id === v.id),
    );

  const cards = oneTick.offers
    .filter(isActiveOffer)
    .map((offer) => ({ offer, product: products[offer.id] }))
    .filter(
      (c) => c.product && !(addedBy[c.offer.id] && inCartAlready(c.product)),
    );
  // first load with nothing cached: a placeholder instead of an empty gap
  if (!cards.length) {
    return loaded ? null : (
      <div className="cart-plus-one-tick" style={{ padding: "12px 16px" }}>
        <div
          className="cart-plus-skeleton"
          style={{ height: 92, borderRadius: CARD_RADIUS }}
        >
          &nbsp;
        </div>
      </div>
    );
  }

  const n = cards.length;
  const isRow = oneTick.layout === "row" || oneTick.layout === "list";
  const isCarousel = oneTick.layout === "carousel";
  // stack sirf "row" layout me, aur jab 1 se zyada card ho
  const isStack = oneTick.layout === "row" && n > 1;
  // card border follows the theme colour (Template), a soft grey otherwise
  const cardBorder = designSettings?.accentBorder || "rgba(0, 0, 0, 0.08)";
  // white unless a Card background is set
  const cardBg =
    backgroundToCss(oneTick.cardBackground) ||
    (dark ? "var(--cp-card, #2a2a2d)" : "#ffffff");

  /* ---------- stack helpers ---------- */
  // top card = 0, agla = 1, ... (circular)
  const posOf = (i) => (((i - top) % n) + n) % n;

  /* ---------- carousel: active dot scroll se nikalo ---------- */
  const onTrackScroll = (e) => {
    const el = e.currentTarget;
    const first = el.firstElementChild;
    if (!first) return;
    const step = first.getBoundingClientRect().width + CAROUSEL_GAP;
    const idx = Math.round(el.scrollLeft / step);
    setActiveDot(Math.max(0, Math.min(n - 1, idx)));
  };

  const goTo = (i) => {
    const el = trackRef.current;
    const child = el?.children[i];
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  // the offer's variants that are currently in the cart
  const inCart = (product) =>
    (previewProducts.find((p) => p.id === product.id)?.variants || []).filter(
      (v) => product.variants.some((pv) => pv.id === v.id),
    );

  // the cart line carries the offer price (original struck through)
  const cartVariant = (offer, variant) => {
    const { final, saved } = applyDiscount(offer, variant.price);
    return saved > 0
      ? {
          ...variant,
          price: money(final),
          compareAtPrice: money(variant.price),
        }
      : variant;
  };

  const trigger = (offer, product, variant, full = false) => {
    const on = inCart(product).some((v) => v.id === variant.id) || !!armed[offer.id];
    const toggle = (v) => {
      // tick = this product goes into the cart items, untick = it is removed again
      if (v) {
        const addToCart = () => {
          // the product slides into the cart while this card fades out, then the card is removed
          onAddPreviewProduct?.(product, cartVariant(offer, variant));
          setLeaving((p) => ({ ...p, [offer.id]: true }));
          setTimeout(() => {
            setAddedBy((p) => ({ ...p, [offer.id]: true }));
            setLeaving((p) => ({ ...p, [offer.id]: false }));
            setArmed((p) => ({ ...p, [offer.id]: false }));
          }, LEAVE_MS);
        };
        if (oneTick.trigger === "button") {
          addToCart();
        } else {
          // toggle / checkbox: show it switched on first, then add the product
          setArmed((p) => ({ ...p, [offer.id]: true }));
          setTimeout(addToCart, ARMED_MS);
        }
      } else {
        onRemovePreviewProduct?.(product.id, variant.id);
      }
    };
    const accent = backgroundToCss(oneTick.buttonBackground) || "#303030";
    if (oneTick.trigger === "checkbox") {
      return (
        <label
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: full ? "center" : "flex-start",
            width: full ? "100%" : undefined,
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={on}
            aria-label={oneTick.buttonLabel}
            onChange={(e) => toggle(e.target.checked)}
            style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
          />
          {/* custom checkbox */}
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              boxSizing: "border-box",
              borderRadius: 5,
              border: on
                ? "2px solid transparent"
                : `2px solid ${oneTick.secondaryTextColor || "#8a8a8a"}`,
              background: on ? accent : "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background .15s ease, border-color .15s ease",
            }}
          >
            {on && (
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6.5l2.6 2.6L10 3.5"
                  stroke={oneTick.buttonTextColor || "#fff"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </label>
      );
    }
    if (oneTick.trigger === "toggle") {
      const sw = (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={oneTick.buttonLabel}
          // pill switch: on = the Button / Checkbox colour, off = a soft tint of the theme
          style={{
            position: "relative",
            width: 36,
            height: 20,
            padding: 0,
            flexShrink: 0,
            cursor: "pointer",
            border: `1px solid ${on ? "transparent" : cardBorder}`,
            borderRadius: 20,
            boxSizing: "border-box",
            background: on
              ? accent
              : designSettings?.accentBorder || "#c9cccf",
            transition: "background .2s ease",
          }}
          onClick={() => toggle(!on)}
        >
          <span
            style={{
              position: "absolute",
              top: 1,
              left: 1,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,.25)",
              transform: on ? "translateX(16px)" : "none",
              transition: "transform .2s ease",
            }}
          />
        </button>
      );
      return full ? (
        <div
          style={{ display: "flex", justifyContent: "center", width: "100%" }}
        >
          {sw}
        </div>
      ) : (
        sw
      );
    }
    return (
      <button
        type="button"
        onClick={() => toggle(!on)}
        style={{
          border: "none",
          cursor: "pointer",
          padding: "8px 16px",
          width: full ? "100%" : undefined,
          borderRadius: oneTick.buttonRadius,
          fontSize: oneTick.buttonFontSize,
          background: backgroundToCss(oneTick.buttonBackground),
          color: oneTick.buttonTextColor,
        }}
      >
        {oneTick.buttonLabel}
      </button>
    );
  };

  // switching variant while this offer is in the cart swaps the cart line
  const chooseVariant = (offer, product, nextVariant) => {
    const current = inCart(product);
    setVariantSel((p) => ({ ...p, [offer.id]: nextVariant.id }));
    if (current.length) {
      current.forEach((v) => onRemovePreviewProduct?.(product.id, v.id));
      onAddPreviewProduct?.(product, cartVariant(offer, nextVariant));
    }
  };

  // one select per option ("Multicolor" / "4"), only offering the picked variants
  const variantSelect = (offer, product, variant, inline = false) => {
    if (product.variants.length < 2) return null;
    const chosen = optionParts(variant);

    return chosen.map((_, i) => {
      const values = [
        ...new Set(
          product.variants
            .map(optionParts)
            .filter((parts) =>
              chosen.slice(0, i).every((c, k) => parts[k] === c),
            )
            .map((parts) => parts[i]),
        ),
      ];

      return (
        <select
          key={i}
          value={chosen[i]}
          onChange={(e) => {
            const candidates = product.variants.filter((v) => {
              const parts = optionParts(v);
              return (
                parts[i] === e.target.value &&
                chosen.slice(0, i).every((c, k) => parts[k] === c)
              );
            });
            // keep the later options when that combination exists
            const best =
              candidates.find((v) =>
                optionParts(v).every((part, k) => k <= i || part === chosen[k]),
              ) || candidates[0];
            if (best) chooseVariant(offer, product, best);
          }}
          style={{
            ...(inline
              ? { flex: 1, minWidth: 0 }
              : { width: "100%", marginTop: 4 }),
            fontSize: 12,
            padding: "6px 8px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            color: oneTick.secondaryTextColor,
          }}
        >
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      );
    });
  };

  const card = ({ offer, product }) => {
    const variant =
      product.variants.find(
        (v) => String(v.id) === String(variantSel[offer.id]),
      ) || product.variants[0];
    const { final, saved, percent } = applyDiscount(offer, variant.price);
    const label = String(offer.label || "")
      .replace(/\{\{saved_percentage\}\}/gi, `${percent}%`)
      .replace(/\{\{saved_amount\}\}/gi, `${currency}${money(saved)}`);

    /* ---------- Carousel card: image upar, sab center, Add full width ---------- */
    if (isCarousel) {
      return (
        <div
          key={offer.id}
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: CARD_RADIUS,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: "0 0 43%",
            minWidth: 0,
            boxSizing: "border-box",
            scrollSnapAlign: "start",
            ...leaveStyle(leaving[offer.id], false),
          }}
        >
          <img
            src={variant.image || product.image}
            alt={product.title}
            style={{
              width: oneTick.imageSize,
              maxWidth: "100%",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              borderRadius: oneTick.radius,
              display: "block",
              alignSelf: "center",
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 2,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                lineHeight: 1.3,
                color: oneTick.primaryTextColor,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.title}
            </div>
            <div style={{ fontSize: 13, color: oneTick.primaryTextColor }}>
              {currency}
              {money(final)}{" "}
              {saved > 0 && (
                <span
                  style={{
                    textDecoration: "line-through",
                    color: oneTick.secondaryTextColor,
                    fontSize: 12,
                  }}
                >
                  {currency}
                  {money(variant.price)}
                </span>
              )}
            </div>
            {offer.showLabel && saved > 0 && (
              <div
                style={{ fontSize: 10, color: oneTick.secondaryTextColor }}
                dangerouslySetInnerHTML={{ __html: label }}
              />
            )}
            {variantSelect(offer, product, variant)}
          </div>
          <div>{trigger(offer, product, variant, true)}</div>
        </div>
      );
    }

    /* ---------- Row / List card ---------- */
    const savingLabel =
      offer.showLabel && saved > 0 ? (
        <div
          style={{
            fontSize: 10,
            fontWeight: 400,
            color: "#1e7e34",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          dangerouslySetInnerHTML={{ __html: label }}
        />
      ) : null;

    return (
      <div
        key={offer.id}
        style={{
          // stack me background opaque hona chahiye warna peeche wale cards dikhenge
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: CARD_RADIUS,
          padding: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          ...leaveStyle(leaving[offer.id]),
        }}
      >
        {/* thumb stays 90px; only the image inside follows Styles > Image size */}
        <div
          className="cart-plus-drawer__xs-row-thumb"
          style={{
            width: 90,
            height: 90,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={variant.image || product.image}
            alt={product.title}
            style={{
              // row / list thumb is a scaled-down version of the Styles values
              width: oneTick.imageSize * 0.45,
              height: oneTick.imageSize * 0.45,
              maxWidth: "100%",
              maxHeight: "100%",
              display: "block",
              objectFit: "cover",
              borderRadius: oneTick.radius * 0.45,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                lineHeight: 1.25,
                color: oneTick.primaryTextColor,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.title}
            </div>
            {savingLabel}
          </div>
          <div
            style={{
              fontSize: 13,
              marginTop: 2,
              color: oneTick.primaryTextColor,
            }}
          >
            {currency}
            {money(final)}{" "}
            {saved > 0 && (
              <span
                style={{
                  textDecoration: "line-through",
                  color: oneTick.secondaryTextColor,
                  fontSize: 12,
                }}
              >
                {currency}
                {money(variant.price)}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
              {variantSelect(offer, product, variant, true)}
            </div>
            {isRow && (
              <div style={{ flexShrink: 0 }}>
                {trigger(offer, product, variant)}
              </div>
            )}
          </div>
          {!isRow && (
            <div style={{ marginTop: 12 }}>
              {trigger(offer, product, variant)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="cart-plus-one-tick" style={{ padding: "12px 16px" }}>
      {/* scrollbar chhupane ke liye + stack css */}
      <style>
        {`.cp-track{scrollbar-width:none;-ms-overflow-style:none}.cp-track::-webkit-scrollbar{display:none}`}
        {isStack ? STACK_CSS : ""}
      </style>

      {oneTick.title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 15,
            fontWeight: 600,
            color: oneTick.primaryTextColor,
          }}
        >
          <LibraryIcon
            value={oneTick.icon}
            size={20}
            color={oneTick.iconColor}
          />
          <span dangerouslySetInnerHTML={{ __html: oneTick.title }} />
        </div>
      )}

      {isStack ? (
        <>
          {/* ---------- card stack (row layout) ---------- */}
          <div className="cart-plus-drawer__ups-stack">
            {cards.map((c, i) => (
              <div
                key={c.offer.id}
                className="cart-plus-drawer__ups-stack-item"
                data-rapi-ups-stack-pos={posOf(i)}
                aria-hidden={posOf(i) !== 0}
              >
                {card(c)}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div
          ref={isCarousel ? trackRef : undefined}
          className={isCarousel ? "cp-track" : undefined}
          onScroll={isCarousel ? onTrackScroll : undefined}
          style={{
            display: "flex",
            flexDirection: isCarousel ? "row" : "column",
            gap: isCarousel ? CAROUSEL_GAP : 8,
            overflowX: isCarousel ? "auto" : undefined,
            scrollSnapType: isCarousel ? "x mandatory" : undefined,
            alignItems: isCarousel ? "stretch" : undefined,
          }}
        >
          {cards.map(card)}
        </div>
      )}

      {/* pagination dots (carousel) */}
      {isCarousel && n > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 10,
          }}
        >
          {cards.map((c, i) => (
            <button
              key={c.offer.id}
              type="button"
              aria-label={`Go to offer ${i + 1}`}
              onClick={() => goTo(i)}
              style={{
                width: 6,
                height: 6,
                padding: 0,
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                background:
                  i === activeDot
                    ? designSettings?.accentText ||
                      backgroundToCss(oneTick.buttonBackground) ||
                      "#303030"
                    : designSettings?.accentBorder || "#d0d0d0",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
