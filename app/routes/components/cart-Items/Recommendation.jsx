// import { useEffect, useState } from "react";

// export default function Recommendation({ recommendationsSettings, currency }) {

//     const [products, setProducts] = useState([]);
//     const [selectedVariant, setSelectedVariant] = useState({});

//     const { selectedItems = [], sourceType, maxRecommendations } = recommendationsSettings;

//     const normalizeId = (id) => id?.toString().trim();

//     const getDefaultVariant = (variants) => {
//         return variants.find(v => v.available) || variants[0];
//     };

//     useEffect(() => {
//         if (!selectedItems.length || sourceType !== "products") return;

//         fetch("/api/products", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ variantIds: selectedItems }),
//         })
//             .then(async (res) => {
//                 if (!res.ok) {
//                     const text = await res.text();
//                     console.error("API Error:", text);
//                     return { products: [] };
//                 }
//                 return res.json();
//             })
//             .then(data => {
//                 const items = data.products.slice(0, maxRecommendations);

//                 const initial = {};

//                 items.forEach(p => {
//                     const matched = p.variants.find(v =>
//                         selectedItems.some(id => normalizeId(id) === normalizeId(v.id))
//                     );

//                     initial[p.id] =
//                         matched?.id ||
//                         getDefaultVariant(p.variants)?.id;
//                 });

//                 setSelectedVariant(initial);
//                 setProducts(items);
//             });

//     }, [selectedItems]);

//     return (
//         <div className="cart_CartPreview__empty__body">

//             <div className="cart_CartPreview__empty__">
//                 <h3>Your cart is empty</h3>
//             </div>

//             <div className="upcart-internal-upsell upcart-public-upsell">

//                 {/* HEADER */}
//                 <div className="upcart-internal-upsell__header">
//                     <p
//                         dangerouslySetInnerHTML={{
//                             __html: recommendationsSettings.headerText
//                         }}
//                     />
//                 </div>

//                 {/* BUTTON */}
//                 {recommendationsSettings.showShopNowButton && (
//                     <div className="upcart-internal-upsell__shop-now-button">
//                         <a href={recommendationsSettings.buttonUrl}>
//                             {recommendationsSettings.buttonText}
//                         </a>
//                     </div>
//                 )}

//                 {/* TITLE */}
//                 <div className="upcart-internal-style__title-large">
//                     <p
//                         dangerouslySetInnerHTML={{
//                             __html: recommendationsSettings.productHeaderText
//                         }}
//                     />
//                 </div>

//                 {/* PRODUCTS */}
//                 <div className="upcart-internal-upsell__vertical-layout-wrapper">

//                     {products.map((product) => {

//                         const currentVariant = product.variants.find(
//                             v => v.id === selectedVariant[product.id]
//                         ) || product.variants[0];

//                         return (
//                             <div key={product.id} className="upsell-item">

//                                 {/* IMAGE (dynamic fallback) */}
//                                 <img
//                                     src={currentVariant?.image || product.image}
//                                     width="80"
//                                 />

//                                 <div style={{ flex: 1 }}>

//                                     <p>{product.title}</p>

//                                     {/* ✅ hide dropdown if single variant */}
//                                     {product.variants.length > 1 && (
//                                         <select
//                                             value={selectedVariant[product.id] || ""}
//                                             onChange={(e) =>
//                                                 setSelectedVariant(prev => ({
//                                                     ...prev,
//                                                     [product.id]: e.target.value
//                                                 }))
//                                             }
//                                         >
//                                             {product.variants.map(v => (
//                                                 <option key={v.id} value={v.id}>
//                                                     {v.title}
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     )}

//                                 </div>

//                                 {/* PRICE */}
//                                 <div>
//                                     <p>{currentVariant?.price} {currency}</p>
//                                 </div>

//                                 {/* ADD BUTTON */}
//                                 <button
//                                     onClick={() => {
//                                         console.log("Add to cart", currentVariant.id);
//                                     }}
//                                     className="upsell-add-btn"
//                                 >
//                                     Add
//                                 </button>

//                             </div>
//                         );
//                     })}

//                 </div>
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from "react";

export default function Recommendation({ recommendationsSettings, currency }) {

    const [products, setProducts] = useState([]);

    const { selectedItems = [], sourceType, maxRecommendations } = recommendationsSettings;

    useEffect(() => {
        console.log("CHECK:", selectedItems);

        if (!selectedItems?.variants?.length || sourceType !== "products") {
            console.log("❌ Skip fetch");
            return;
        }

        console.log("🚀 Fetching with variants:", selectedItems.variants);

        fetch("/get-products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantIds: selectedItems.variants }),
        })
            .then(res => res.json())
            .then(data => {
                console.log("✅ Data:", data);
                setProducts(data.products.slice(0, maxRecommendations));
            });

    }, [JSON.stringify(selectedItems), sourceType]);


    return (
        <div className="cart_CartPreview__empty__body">

            <div className="cart_CartPreview__empty__">
                <h3>Your cart is empty</h3>
            </div>

            <div className="upcart-internal-upsell">

                {/* HEADER */}
                <div>
                    <p dangerouslySetInnerHTML={{
                        __html: recommendationsSettings.headerText
                    }} />
                </div>

                {/* PRODUCTS */}
                <div>

                    {products.map((product) => {
                        const variant = product.variants[0]; // ✅ only matched variant

                        return (
                            <div key={product.id} className="upsell-item">

                                {/* IMAGE */}
                                <img
                                    src={variant?.image || product.image}
                                    width="80"
                                />

                                <div style={{ flex: 1 }}>
                                    <p>{product.title}</p>
                                    <p>{variant.title}</p>
                                </div>

                                {/* PRICE */}
                                <div>
                                    <p>{variant.price} {currency}</p>
                                </div>

                                {/* ADD TO CART */}
                                <button
                                    onClick={() => {
                                        console.log("Add to cart:", variant.id);

                                        fetch("/cart/add.js", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({
                                                id: variant.id.split("/").pop(),
                                                quantity: 1,
                                            }),
                                        });
                                    }}
                                >
                                    Add
                                </button>

                            </div>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}