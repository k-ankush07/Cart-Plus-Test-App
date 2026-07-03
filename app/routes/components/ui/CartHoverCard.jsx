import { useState, useRef } from "react";
import { createPortal } from "react-dom";

// ─── OUTSIDE AppCarts ────────────────────────────────────────────

export default function CartHoverCard({ cart, children }) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const ref = useRef();
    const hideTimer = useRef(null);

    const cancelHide = () => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    };

    const scheduleHide = () => {
        hideTimer.current = setTimeout(() => setShow(false), 120);
    };

    const handleMouseEnter = () => {
        cancelHide();
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left });
        }
        setShow(true);
    };

    const MODULE_LABELS = [
        { key: "announcementSettings", label: "Announcement" },
        { key: "rewardsSettings", label: "Tiered Offers" },
        { key: "triggeredRewardsSettings", label: "Smart Offers" },
        { key: "recommendationsSettings", label: "Suggested Products" },
        { key: "upsellsSettings", label: "Upsells" },
        { key: "additionalNotesSettings", label: "Notes" },
        { key: "addonsSettings", label: "Add-ons" },
        { key: "discountCodesSettings", label: "Discount Codes" },
        { key: "expressPaymentsSettings", label: "Express Payments" },
        { key: "trustBadgesSettings", label: "Badges" },
        { key: "subscriptionUpgradesSettings", label: "Subscription" },
    ];

    const enabledModules = MODULE_LABELS
        .filter(({ key }) => {
            if (key === "triggeredRewardsSettings") {
                return (cart.triggeredRewardsSettings?.rewards?.length || 0) > 0;
            }

            return cart[key]?.enabled === false;
        })
        .map(({ label, key }) => {
            if (key === "triggeredRewardsSettings") {
                return `Smart Offers (${cart.triggeredRewardsSettings?.rewards?.length || 0})`;
            }

            return label;
        });

    const fmtDate = (iso) => iso
        ? new Date(iso).toLocaleDateString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric"
        }).replace(/\//g, "-")
        : "—";

    return (
        <>
            <div
                ref={ref}
                style={{ display: "inline-block" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={scheduleHide}
            >
                {children}
            </div>

            {show && createPortal(
                <div
                    style={{
                        position: "fixed",
                        top: pos.top,
                        left: pos.left,
                        zIndex: 2147483647,
                        background: "var(--p-color-bg-surface)",
                        border: "1px solid var(--p-color-border)",
                        borderRadius: "var(--p-border-radius-300)",
                        boxShadow: "var(--p-shadow-600)",
                        padding: "16px",
                        minWidth: "240px",
                        maxWidth: "280px",
                    }}
                    onMouseEnter={cancelHide}
                    onMouseLeave={scheduleHide}
                >
                    {/* Cart name */}
                    <p
                        title={cart.cartName || "Untitled cart"}
                        style={{
                            margin: "0 0 12px 0",
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "var(--p-color-text)",
                            fontFamily: "var(--p-font-family-sans)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "180px", 
                        }}
                    >
                        {cart.cartName || "Untitled cart"}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Last edited */}
                        <div>
                            <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "var(--p-color-text-secondary)", fontFamily: "var(--p-font-family-sans)" }}>
                                Last edited
                            </p>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--p-color-text)", fontFamily: "var(--p-font-family-sans)" }}>
                                {fmtDate(cart.updatedAt)}
                            </p>
                        </div>

                        {/* Last live */}
                        <div>
                            <p style={{ margin: "0 0 2px 0", fontSize: "12px", color: "var(--p-color-text-secondary)", fontFamily: "var(--p-font-family-sans)" }}>
                                Last live
                            </p>
                            <p style={{ margin: 0, fontSize: "13px", color: "var(--p-color-text)", fontFamily: "var(--p-font-family-sans)" }}>
                                {fmtDate(cart.lastLiveDate)}
                            </p>
                        </div>

                        {/* Disabled modules */}
                        {enabledModules.length > 0 && (
                            <div>
                                <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "var(--p-color-text-secondary)", fontFamily: "var(--p-font-family-sans)" }}>
                                    Modules enabled
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                    {enabledModules.map((mod) => (
                                        <span key={mod} style={{
                                            background: "var(--p-color-bg-surface-secondary)",
                                            color: "var(--p-color-text)",
                                            fontSize: "11px",
                                            fontFamily: "var(--p-font-family-sans)",
                                            padding: "2px 8px",
                                            borderRadius: "var(--p-border-radius-200)",
                                            border: "1px solid var(--p-color-border)",
                                        }}>
                                            {mod}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}