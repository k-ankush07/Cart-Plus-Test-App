import { backgroundToCss, useTemplateBackground } from "../utils/background";
import { LibraryIcon } from "../ui/IconLibrary";

const paddingMap = {
    slim: "4px 33px",
    normal: "10px 33px",
    thick: "18px 33px",
};

export default function Announcements({ announcementSettings }) {
    const templateBg = useTemplateBackground();
    // older announcements may still contain the retired {TIMER} placeholder
    const html = (announcementSettings.text || "").replace(/\s*\{timer\}/gi, "");

    return (
        <div
            className={`cart-plus-public-announcement cart-plus-announcement  ${announcementSettings?.position === "after" ? "announcement-after" : ""
                }`}
            style={{
                padding: paddingMap[announcementSettings.height],
                textAlign: "center",
                // on the Template gradient the text goes white
                ...(!announcementSettings.background && templateBg
                    ? { color: "#fff" }
                    : {}),
                fontSize: `${announcementSettings.fontSize}px`,
                lineHeight: "30px",
                background: backgroundToCss(
                    announcementSettings.background ||
                        templateBg || {
                            type: "plain",
                            color: announcementSettings.backgroundColor,
                        },
                ),
                // borderTop: `1px solid ${announcementSettings.borderColor}`,
                // borderBottom: `1px solid ${announcementSettings.borderColor}`,
            }}
        >
            {announcementSettings.icon && (
                <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 8 }}>
                    <LibraryIcon
                        value={announcementSettings.icon}
                        size={25}
                        color={announcementSettings.iconColor}
                    />
                </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
