export default function TrustBages({ selectedImages, isTrustVisible }) {

    const finalImages = [...selectedImages].sort(
        (a, b) => a.selectedAt - b.selectedAt
    );

    return (
        <>
            {isTrustVisible && (
                <div className="cart-trust-badges">
                    {finalImages.length > 0 ? (
                        <div className="cart-badges-wrapp">
                            {finalImages.map((img) => (
                                <div className="cart-badges-img">
                                    <img
                                        key={img.id}
                                        src={img.src}
                                        alt="" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ marginTop: "20px", color: "#666" }}>
                            No badges selected or uploaded yet.
                        </p>
                    )}
                </div>
            )}
        </>
    );
}
