export default function CustomHtml({ cartSettings, position }) {
    if (position === "scripts_before_load" || position === "empty_cart") return null;

    const html = cartSettings?.customHtmlBlocks?.[position];
    if (!html) return null;

    return (
        <div
            className="cart-custom-html"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
