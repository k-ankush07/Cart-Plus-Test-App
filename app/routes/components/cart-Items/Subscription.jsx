import { useState } from "react";

export default function Subscription({
  subscriptionUpgradesSettings,
  designSettings = {}
}) {

  const [loading, setLoading] = useState(false);

  const previewText =
    (subscriptionUpgradesSettings?.buttonText ||
      "Upgrade to {{selling_plan_group_name}}")
      .replace(/\{\{selling_plan_group_name\}\}/g, "Subscribe & Save 20%");

  const handleSubScription = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }

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
        onClick={handleSubScription}
      >
        {loading ? (<span className="loader"></span>) : (previewText)}
      </button>
    </div>
  );
}