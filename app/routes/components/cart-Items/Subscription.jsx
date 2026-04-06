export default function Subscription({ subscriptionUpgradesSettings }) {
    
    const previewText = (subscriptionUpgradesSettings?.buttonText || "Upgrade to {{selling_plan_group_name}}")
        .replace(/\{\{selling_plan_group_name\}\}/g, "Subscribe & Save 20%");

    return (
        <div className="subscription-upgrade-preview">
            <button className="subscription-upgrade-btn">
                {previewText}
            </button>
        </div>
    );
}
