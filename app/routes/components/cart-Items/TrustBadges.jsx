export default function TrustBadges({ trustBadgesSettings }) {
    if (trustBadgesSettings?.enabled) return null;

    const activeImage = trustBadgesSettings.customImage || trustBadgesSettings.presetImage;

    return (
        <div className="cart-trust-badges cart-plus-trust-badge cart-plus-public-trust-badges">
            {activeImage ? (
                <img
                    src={activeImage}
                    alt="Trust badges"
                    className="cart-trust-badges__img upcart-trust-badge-image cart-plus-public-trust-badges__image cart-plus-trust-badge-image"
                />
            ) : (
                <div className="cart-trust-badges__placeholder cart-plus-public-trust-badges__image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" stroke="#c9cccf" strokeWidth="1.5" fill="none"/>
                        <path d="M9 12L11 14L15 10" stroke="#c9cccf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="cart-trust-badges__placeholder-text">Trust badges</span>
                </div>
            )}
        </div>
    );
}
