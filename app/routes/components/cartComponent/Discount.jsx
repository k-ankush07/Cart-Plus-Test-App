import { Eye, EyeOff, Settings, GripVertical } from "lucide-react";

export default function Discount({
    showForm,
    setOpenForm,
    isDiscountVisible,
    setIsDiscountVisible,
    discountCode, setDiscountCode,
    buttonText, setButtonText
}) {
  
    const toggleForm = () => {
        setOpenForm(showForm ? null : "discount");
    };

    const toggleVisibility = () => {
        setIsDiscountVisible(!isDiscountVisible);
        setOpenForm(!isDiscountVisible);
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Discount Codes</span>
                </div>
                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="icon-btn"
                        title={isDiscountVisible ? "Hide" : "Show"}
                        onClick={toggleVisibility}
                    >
                        {isDiscountVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <div className="form-group discount">
                        <label>Discount input placeholder</label>
                        <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group discount">
                        <label>Discount apply button text</label>
                        <input
                            type="text"
                            value={buttonText}
                            onChange={(e) => setButtonText(e.target.value)}
                            className="form-input"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
