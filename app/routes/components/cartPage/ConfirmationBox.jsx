import React from 'react';

export default function ConfirmationBox({ checkboxLabel, link, isChecked, showBox }) {

    const match = checkboxLabel.match(/{{(.*?)}}/);

    const cleanLabel = checkboxLabel.replace(/{{.*?}}/, "").trim();

    const linkText = match ? match[1] : "";

    return (
        <>
            {showBox && (<div className="checkbox-confirmation-box" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => { }}
                />
                <span style={{ fontSize: "14px" }}>
                    {cleanLabel}{" "}
                    {linkText && (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                textDecoration: "underline",
                                color: "black",
                            }}
                        >
                            {linkText}
                        </a>
                    )}
                </span>
            </div>)}
        </>
    );
}
