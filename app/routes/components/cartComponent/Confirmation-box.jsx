import { Eye, EyeOff, Settings, GripVertical } from "lucide-react";

export default function ConfirmationBox({ setOpenForm, showForm, checkboxLabel, setCheckboxLabel, link, setLink,
    isChecked, setIsChecked, showBox, setShowBox
}) {

    const toggleForm = () => {
        setOpenForm(showForm ? null : "ConfirmationBox");
    };

    const handleCheckboxClick = () => {
        setIsChecked(!isChecked);
    };

    const toggleVisibility = () => {
        setShowBox(!showBox);
        setOpenForm(!showNote);
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Confirmation Box</span>
                </div>

                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" title={showBox ? "Hide" : "Show"} onClick={toggleVisibility}>
                        {showBox ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">

                    <span>Terms and conditions checkbox</span>

                    <div>
                        <label>Confirmation checkbox</label>
                        <input
                            type="text"
                            value={checkboxLabel}
                            onChange={(e) => setCheckboxLabel(e.target.value)}
                            placeholder="Enter checkbox label"
                        />
                    </div>

                    <div>
                        <label>Link</label>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className="checkbox-row" onClick={handleCheckboxClick} style={{ cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxClick}
                        />
                        <span>Check box is ticked by default</span>
                    </div>

                </div>
            )}
        </div>
    );
}
