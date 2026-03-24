import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function Additionalnote({ noteTitle, notePlaceholder, noteSize,
    notePlaceholderSize, showNote }) {
    const [showArea, setShowArea] = useState(true);

    const hanldeShow = () => {
        setShowArea(!showArea);
    }

    return (
        <>
            {showNote && (<div className='cart-additional-note'>
                <div className='additional-title' onClick={hanldeShow}>
                    <div style={{ fontSize: `${noteSize}px` }}>{noteTitle}</div>
                    <div className="additional-svg">
                        <ChevronDown
                            size={16}
                            className={showArea ? "rotate-icon" : "rotate-icon closed"}
                        />
                    </div>
                </div>
                {showArea && (<div className='additional-textarea'>
                    <textarea name="" id=""
                        placeholder={notePlaceholder}
                        style={{
                            resize: "none",
                            fontSize: `${notePlaceholderSize}px`
                        }}
                    >
                    </textarea>
                </div>)}
            </div>)}
        </>
    )
}
