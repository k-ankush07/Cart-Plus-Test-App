import { getCustomBlocks } from "../utils/customBlocks";

// { [blockId]: node } for the enabled HTML blocks added from the sidebar.
// CSS blocks have nothing to show in place, they are applied to the whole cart.
export const customBlockNodes = (cartSettings) =>
  Object.fromEntries(
    getCustomBlocks(cartSettings)
      .filter((b) => b.enabled && b.code && b.type !== "css")
      .map((b) => [
        b.id,
        <div
          key={b.id}
          className="cart-custom-html"
          dangerouslySetInnerHTML={{ __html: b.code }}
        />,
      ]),
  );
