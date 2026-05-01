export default function Subscription({
  subscriptionUpgradesSettings,
  designSettings = {}
}) {
  const previewText =
    (subscriptionUpgradesSettings?.buttonText ||
      "Upgrade to {{selling_plan_group_name}}")
      .replace(/\{\{selling_plan_group_name\}\}/g, "Subscribe & Save 20%");

  return (
    <div className="subscription-upgrade-preview upcart-subscription-upgrade-section upcart-public-component-product-tile__subscription-upgrade">
      <button
        className="subscription-upgrade-btn upcart-subscription-upgrade-button"
        style={{
          borderRadius: `${designSettings?.buttonRadius || 8}px`,
          backgroundColor: designSettings?.buttonColor || "#000",
          "--btn-hover-text": designSettings?.buttonHoverColor || "#333",
          "--btn-text": designSettings?.buttonTextColor || "#fff",
        }}
      >
        {previewText}
      </button>
    </div>
  );
}