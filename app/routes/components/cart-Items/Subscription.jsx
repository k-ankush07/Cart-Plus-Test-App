export default function Subscription({ subscriptionUpgradesSettings }) {

    const previewText = (subscriptionUpgradesSettings?.buttonText || "Upgrade to {{selling_plan_group_name}}")
        .replace(/\{\{selling_plan_group_name\}\}/g, "Subscribe & Save 20%");

    return (
        <div className="subscription-upgrade-preview upcart-subscription-upgrade-section upcart-public-component-product-tile__subscription-upgrade">
            <button className="subscription-upgrade-btn upcart-subscription-upgrade-button">
                {previewText}
            </button>
        </div>
    );
}
