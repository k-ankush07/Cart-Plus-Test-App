export default function LiveDot() {
    return (
        <span
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 12,
                height: 12,
            }}
        >
            <style>{`@keyframes upcart-pulse{0%{transform:scale(.8);opacity:.7}100%{transform:scale(1.8);opacity:0}}`}</style>
            <span
                style={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#008060",
                    opacity: 0.4,
                    animation: "upcart-pulse 1.5s ease-out infinite",
                }}
            />
            <span
                style={{
                    position: "relative",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#008060",
                }}
            />
        </span>
    )
}
