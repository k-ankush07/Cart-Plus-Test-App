const fs=require("fs");
function sub(f,a,b){let s=fs.readFileSync(f,"utf8");if(!s.includes(a))throw new Error("missing "+a.slice(0,50));fs.writeFileSync(f,s.replace(a,()=>b));}
const P="app/routes/components/cart-Items/CartFooter.jsx";
sub(P,`import { Fragment, useState } from "react";`,`import { useLayoutEffect, useRef, useState } from "react";`);
sub(P,`  const [loading, setLoading] = useState(false);`,`  const stackRef = useRef(null);
  const [loading, setLoading] = useState(false);`);
sub(P,`  const footerOrder = resolveOrder(sectionOrder?.Footer, DEFAULT_FOOTER_ORDER);
`,`  const footerOrder = resolveOrder(sectionOrder?.Footer, DEFAULT_FOOTER_ORDER);

  // the first section that actually takes up space keeps its padding; the rest lose their top padding
  useLayoutEffect(() => {
    const kids = [...(stackRef.current?.children || [])];
    let found = false;
    kids.forEach((el) => {
      const first = !found && el.offsetHeight > 0;
      if (first) found = true;
      el.toggleAttribute("data-cp-first", first);
    });
  });
`);
sub(P,`      <div className="cart-plus-footer-stack">
        {footerOrder.map((key) =>
          key === "Age Verification" || key === "Checkout Button" ? (
            <div key={key} className="cp-keep-pad">
              {footerBlocks[key]}
            </div>
          ) : (
            <Fragment key={key}>{footerBlocks[key]}</Fragment>
          ),
        )}`,`      <div className="cart-plus-footer-stack" ref={stackRef}>
        {footerOrder.map((key) => (
          <div
            key={key}
            className={
              key === "Age Verification" || key === "Checkout Button"
                ? "cp-sec cp-keep-pad"
                : "cp-sec"
            }
          >
            {footerBlocks[key]}
          </div>
        ))}`);
let s=fs.readFileSync("app/index.css","utf8");
s=s.split(".cart-plus-footer-stack > :not(:first-child):not(.cp-keep-pad):not(.cart-plus-age-verification)").join(".cart-plus-footer-stack > .cp-sec:not([data-cp-first]):not(.cp-keep-pad)");
fs.writeFileSync("app/index.css",s);
