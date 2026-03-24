import { Eye, EyeOff, Settings, GripVertical } from "lucide-react";
import { useState } from "react";
export default function Additionalnote({ showForm, setOpenForm, noteTitle, setNoteTitle, notePlaceholder, setNotePlaceholder,
    noteSize, setNoteSize, notePlaceholderSize, setNotePlaceholderSize,setShowNote,showNote
}) {

    const toggleForm = () => {
        setOpenForm(showForm ? null : "additionalNote");
    };
    
    const toggleVisibility = () => {
        setShowNote(!showNote);
        setOpenForm(!showNote);
    };

    return (
        <div className="discount cart-page-container-item">
            <div className="discount-sections cart-page-wrap" onClick={toggleForm}>
                <div className="upsell-header-left">
                    <GripVertical className="icon" />
                    <span className="upsell-title">Additional note</span>
                </div>
                <div className="upsell-header-icons" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" title={showNote ? "Hide" : "Show"} onClick={toggleVisibility}>
                        {showNote ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button className="icon-btn" title="Settings" onClick={toggleForm}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section">
                    <span> Additional notes settings </span>
                    <div>
                        <label htmlFor="">Title</label>
                        <input type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="">Placeholder (optional)</label>
                        <input type="text"
                            value={notePlaceholder}
                            onChange={(e) => setNotePlaceholder(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="">Title size</label>
                        <input type="number"
                            value={noteSize}
                            onChange={(e) => setNoteSize(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="">Placeholder size</label>
                        <input type="number"
                            value={notePlaceholderSize}
                            onChange={(e) => setNotePlaceholderSize(e.target.value)} />
                    </div>
                </div>)}
        </div>
    )
}
