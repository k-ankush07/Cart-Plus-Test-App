import { useEffect, useState } from "react";

const paddingMap = {
    slim: "4px 33px",
    normal: "10px 33px",
    thick: "18px 33px",
};

export default function Announcements({ announcementSettings }) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!announcementSettings.timer) return;

        const [min, sec] = announcementSettings.timer.split(":").map(Number);
        const totalSeconds = (min || 0) * 60 + (sec || 0);

        setTimeLeft(totalSeconds);
    }, [announcementSettings.timer]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    const finalHTML = announcementSettings.text?.replace(
        "{TIMER}",
        `<strong>${formatTime(timeLeft)}</strong>`
    );

    return (
        <div
            className={`upcart-announcement ${announcementSettings?.position === "after" ? "announcement-after" : ""
                }`}
            style={{
                padding: paddingMap[announcementSettings.height],
                textAlign: "center",
                fontSize: `${announcementSettings.fontSize}px`,
                lineHeight: "30px",
                backgroundColor: announcementSettings.backgroundColor,
                borderTop: `1px solid ${announcementSettings.borderColor}`,
                borderBottom: `1px solid ${announcementSettings.borderColor}`,
            }}
        >

            <span
                dangerouslySetInnerHTML={{
                    __html: finalHTML,
                }}
            />
        </div>
    );
}