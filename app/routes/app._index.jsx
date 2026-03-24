<<<<<<< HEAD
import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
            demoInfo: metafield(namespace: "$app", key: "demo_info") {
              jsonValue
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
          metafields: [
            {
              namespace: "$app",
              key: "demo_info",
              value: "Created by React Router Template",
            },
          ],
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();
  const metaobjectResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
          title: field(key: "title") {
            jsonValue
          }
          description: field(key: "description") {
            jsonValue
          }
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        handle: {
          type: "$app:example",
          handle: "demo-entry",
        },
        metaobject: {
          fields: [
            { key: "title", value: "Demo Entry" },
            {
              key: "description",
              value:
                "This metaobject was created by the Shopify app template to demonstrate the metaobject API.",
            },
          ],
        },
      },
    },
  );
  const metaobjectResponseJson = await metaobjectResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
    metaobject: metaobjectResponseJson.data.metaobjectUpsert.metaobject,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="Shopify app template">
      <s-button slot="primary-action" onClick={generateProduct}>
        Generate a product
      </s-button>

      <s-section heading="Congrats on creating a new Shopify app 🎉">
        <s-paragraph>
          This embedded app template uses{" "}
          <s-link
            href="https://shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
          >
            App Bridge
          </s-link>{" "}
          interface examples like an{" "}
          <s-link href="/app/additional">additional page in the app nav</s-link>
          , as well as an{" "}
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            Admin GraphQL
          </s-link>{" "}
          mutation demo, to provide a starting point for app development.
        </s-paragraph>
      </s-section>
      <s-section heading="Get started with products">
        <s-paragraph>
          Generate a product with GraphQL and get the JSON output for that
          product. Learn more about the{" "}
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
            target="_blank"
          >
            productCreate
          </s-link>{" "}
          mutation in our API references. Includes a product{" "}
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data/metafields"
            target="_blank"
          >
            metafield
          </s-link>{" "}
          and{" "}
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data/metaobjects"
            target="_blank"
          >
            metaobject
          </s-link>
          .
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-button
            onClick={generateProduct}
            {...(isLoading ? { loading: true } : {})}
          >
            Generate a product
          </s-button>
          {fetcher.data?.product && (
            <s-button
              onClick={() => {
                shopify.intents.invoke?.("edit:shopify/Product", {
                  value: fetcher.data?.product?.id,
                });
              }}
              target="_blank"
              variant="tertiary"
            >
              Edit product
            </s-button>
          )}
        </s-stack>
        {fetcher.data?.product && (
          <s-section heading="productCreate mutation">
            <s-stack direction="block" gap="base">
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>{JSON.stringify(fetcher.data.product, null, 2)}</code>
                </pre>
              </s-box>

              <s-heading>productVariantsBulkUpdate mutation</s-heading>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>{JSON.stringify(fetcher.data.variant, null, 2)}</code>
                </pre>
              </s-box>

              <s-heading>metaobjectUpsert mutation</s-heading>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>
                    {JSON.stringify(fetcher.data.metaobject, null, 2)}
                  </code>
                </pre>
              </s-box>
            </s-stack>
          </s-section>
        )}
      </s-section>

      <s-section slot="aside" heading="App template specs">
        <s-paragraph>
          <s-text>Framework: </s-text>
          <s-link href="https://reactrouter.com/" target="_blank">
            React Router
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Interface: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/app-home/using-polaris-components"
            target="_blank"
          >
            Polaris web components
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>API: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            GraphQL
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Custom data: </s-text>
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data"
            target="_blank"
          >
            Metafields &amp; metaobjects
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Database: </s-text>
          <s-link href="https://www.prisma.io/" target="_blank">
            Prisma
          </s-link>
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Next steps">
        <s-unordered-list>
          <s-list-item>
            Build an{" "}
            <s-link
              href="https://shopify.dev/docs/apps/getting-started/build-app-example"
              target="_blank"
            >
              example app
            </s-link>
          </s-list-item>
          <s-list-item>
            Explore Shopify&apos;s API with{" "}
            <s-link
              href="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
              target="_blank"
            >
              GraphiQL
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
=======
import "../index.css";
import { useState, useRef, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { json } from "@remix-run/node";
import { authenticate, apiVersion } from '../shopify.server';
import UpSellProduct from './components/cartComponent/UpSell-Product';
import CartDrawer from './components/cartPage/Cart-Drawer';
import Announcement from './components/cartComponent/Announcement';
import CartDesgin from './components/cartComponent/Cart-Desgin';
import Discount from './components/cartComponent/Discount';
import CartItem from './components/cartComponent/Cart-Item';
import Trustbadges from './components/cartComponent/Trust-badges';
import CheckoutSection from './components/cartComponent/Checkout-section';
import VipProduct from './components/cartComponent/Vip-Product';
import Shippingprotection from './components/cartComponent/Shipping-protection';
import ProgrssBar from './components/cartComponent/ProgrssBar';
import Additionalnote from './components/cartComponent/Additional-note';
import ConfirmationBox from './components/cartComponent/Confirmation-box';

const allTiers = [
  {
    rewardType: "Shipping",
    minAmount: 200,
    rewardDescription: "Free shipping",
    textBefore: "You are {{min_amount}} away from Free shipping discount",
  },
  {
    rewardType: "Discount",
    minAmount: 400,
    rewardDescription: "10% off",
    textBefore: "You are {{min_amount}} away from discount",
    discountMode: "percentage",
    discountValue: 10
  },
  {
    rewardType: "Product",
    minAmount: 600,
    rewardDescription: "Free product",
    textBefore: "You are {{min_amount}} away from a free product",
    discountMode: "percentage",
    discountValue: 0,
  },
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const accessToken = session?.accessToken;

  if (!shop || !accessToken) {
    return json({ error: "Missing shop or access token!" }, { status: 400 });
  }

  const apiUrl = process.env.PUBLIC_REACT_APP_API_URL || "http://localhost:8001";

  try {
    const cartResponse = await fetch(`${apiUrl}/api/get-cart?shop=${shop}`);
    const cartData = cartResponse.ok ? await cartResponse.json() : { data: {} };
    let products = [];
    let url = `https://${shop}/admin/api/${apiVersion}/products.json`;
    let hasNextPage = true;

    while (hasNextPage) {
      const productsResponse = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!productsResponse.ok) {
        const text = await productsResponse.text();
        throw new Error(`Failed to fetch products: ${text}`);
      }

      const data = await productsResponse.json();
      products = [...products, ...data.products];

      const linkHeader = productsResponse.headers.get("link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        url = match ? match[1] : null;
      } else {
        hasNextPage = false;
      }
    }

    return json({
      shop,
      accessToken,
      cart: cartData.data || {},
      products,
    });
  } catch (err) {
    return json({ shop, cart: {}, products: [], error: err.message });
  }
};

export default function Index() {
  const loaderData = useLoaderData();
  const { shop, accessToken, cart, products, } = loaderData;
  const apiUrl = 'https://wondering-aspect-reductions-freeze.trycloudflare.com' || "http://localhost:8001";
  const [activeTab, setActiveTab] = useState("design");
  const [openForm, setOpenForm] = useState(null);
  const [bgColor, setBgColor] = useState(cart?.checkoutStyle?.bgColor || "#FFFFFF");
  const [headerfontSize, setHeaderFontSize] = useState(cart?.checkoutStyle?.headerfontSize || 20);
  const [btnborderRadius, setBtnBorderRadius] = useState(cart?.checkoutStyle?.btnborderRadius || 0);
  const [headingColor, setHeadingColor] = useState(cart?.checkoutStyle?.headingColor || "#000000");
  const [variantColor, setVariantColor] = useState(cart?.checkoutStyle?.variantColor || "#616161");
  const [discountBadgeColor, setDiscountBadgeColor] = useState(cart?.checkoutStyle?.discountBadgeColor || "#000000");
  const [priceColor, setPriceColor] = useState(cart?.checkoutStyle?.priceColor || "#000000");
  const [quantityColor, setQuantityColor] = useState(cart?.checkoutStyle?.quantityColor || "#000000");
  const [originalPriceColor, setOriginalPriceColor] = useState(cart?.checkoutStyle?.originalPriceColor || "#CCCCCC");
  const [savingPriceColor, setSavingPriceColor] = useState(cart?.checkoutStyle?.savingPriceColor || "#29845A");
  const [buttonColor, setButtonColor] = useState(cart?.checkoutStyle?.buttonColor || "#000000");
  const [buttonTextColor, setButtonTextColor] = useState(cart?.checkoutStyle?.buttonTextColor || "#FFFFFF");
  const [checkoutButtonColor, setCheckoutButtonColor] = useState(cart?.checkoutStyle?.checkoutButtonColor || "#303030");
  const [checkoutButtonTextColor, setCheckoutButtonTextColor] = useState(cart?.checkoutStyle?.checkoutButtonTextColor || "#FFFFFF");
  const [iconColor, setIconColor] = useState(cart?.checkoutStyle?.iconColor || '#000000')
  const [btnLinkColor, setBtnLinkColor] = useState(cart?.checkoutStyle?.btnLinkColor || '#000000');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState([]);
  const [loadedCount, setLoadedCount] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState(
    cart?.product?.productId?.length > 0
      ? cart.product.productId.map(String)
      : []
  );
  const [addedProducts, setAddedProducts] = useState(
    cart?.product?.productId?.length > 0 && products.length > 0
      ? products.filter((p) =>
        cart.product.productId.includes(String(p.id))
      )
      : []
  );
  const [upSellTitle, setUpSellTitle] = useState(cart?.product?.upSellTitle || "You may also like");
  const [upSelltext, setUpSellText] = useState(cart?.product?.upSelltext || "Add");
  const [upSellstyle, setUpSellStyle] = useState(cart?.product?.upSellstyle || "Horizontal");
  const [upSellAdd, setUpSellAdd] = useState(cart?.product?.upSellAdd || "Automatic");
  const [upSellTotal, setUpSellTotal] = useState(cart?.product?.upSellTotal || "1");
  const [isUpSellVisible, setIsUpSellVisible] = useState(
    cart?.product?.isUpSellVisible ? cart.product.isUpSellVisible === "true" : true
  );
  const [upSellTemplate, SetUpSellTemplate] = useState(cart?.product?.upSellTemplate || "center");

  const [announcementHeight, setAnnouncementHeight] = useState(cart?.announcement?.announcementHeight || "Normal");
  const [announcementPosition, setAnnouncementPosition] = useState(cart?.announcement?.announcementPosition || "Before products");
  const [announcementTimer, setAnnouncementTimer] = useState(cart?.announcement?.announcementTimer || "00:00");
  const [announcementText, setAnnouncementText] = useState(
    cart?.announcement?.announcementText || "Your products are reserved for {TIMER}!");
  const [announcementFontSize, setAnnouncementFontSize] = useState(cart?.announcement?.announcementFontSize || 14);
  const [announcementBgColor, setAnnouncementBgColor] = useState(cart?.announcement?.announcementBgColor || "#cce7ff");
  const [announcementTextColor, setAnnouncementTextColor] = useState(cart?.announcement?.announcementTextColor || "#000000");
  const [announcementBorderColor, setAnnouncementBorderColor] = useState(cart?.announcement?.announcementBorderColor || "#446688");
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(
    cart?.announcement?.isAnnouncementVisible ? cart.announcement.isAnnouncementVisible === "true" : true
  );

  const [isDiscountVisible, setIsDiscountVisible] = useState(
    cart?.discount?.isDiscountVisible ? cart.discount.isDiscountVisible === "true" : true
  );
  const [discountCode, setDiscountCode] = useState(cart?.discount?.discountCode || "Discount code");
  const [buttonText, setButtonText] = useState(cart?.discount?.buttonText || "Apply");

  const [productNameSize, setProductNameSize] = useState(cart?.cartItem?.productNameSize || 14);
  const [variantSize, setVariantSize] = useState(cart?.cartItem?.variantSize || 14);
  const [productPriceSize, setProductPriceSize] = useState(cart?.cartItem?.productPriceSize || 14);
  const [comparePriceSize, setComparePriceSize] = useState(cart?.cartItem?.comparePriceSize || 12);
  const [savingPriceSize, setSavingPriceSize] = useState(cart?.cartItem?.savingPriceSize || 14);

  const [isTrustVisible, setIsTrustVisible] = useState(
    cart?.trustBages?.isTrustVisible ? cart.trustBages.isTrustVisible === "true" : true
  );
  const [customImages, setCustomImages] = useState(
    cart?.trustBages?.selectedImages?.filter(img => img.type === "custom") || []
  );
  const [selectedImages, setSelectedImages] = useState(cart?.trustBages?.selectedImages || []);

  const [checkoutText, setCheckoutText] = useState(cart?.checkoutSection?.checkoutText || "Checkout - {{total_price}}");
  const [discountText, setDiscountText] = useState(cart?.checkoutSection?.discountText || "Discount");
  const [totalDiscountText, setTotalDiscountText] = useState(cart?.checkoutSection?.totalDiscountText || "Total discount");
  const [viewCartText, setViewCartText] = useState(cart?.checkoutSection?.viewCartText || "View Cart");
  const [discountSize, setDiscountSize] = useState(cart?.checkoutSection?.discountSize || 14);
  const [totalDiscountSize, setTotalDiscountSize] = useState(cart?.checkoutSection?.totalDiscountSize || 14);
  const [checkoutSize, setCheckoutSize] = useState(cart?.checkoutSection?.checkoutSize || 14);
  const [viewCartSize, setViewCartSize] = useState(cart?.checkoutSection?.viewCartSize || 14);

  const [showViewCart, setShowViewCart] = useState(
    cart?.checkoutSection?.showViewCart ? cart.checkoutSection.showViewCart === "true" : true
  );

  const [selectedVipProducts, setSelectedVipProducts] = useState(
    cart?.vipProduct?.productIds?.length > 0
      ? cart.vipProduct.productIds.map(String)
      : []
  );
  const [addedVipProducts, setAddedVipProducts] = useState(
    cart?.vipProduct?.productIds?.length > 0 && products.length > 0
      ? products.filter((p) =>
        cart.vipProduct.productIds.includes(String(p.id))
      )
      : []
  );
  const [showViPProduct, setShowVipProduct] = useState(
    cart?.vipProduct?.showViPProduct ? cart.vipProduct.showViPProduct === "true" : true
  );

  const [selectedShippingProducts, setSelectedShippingProducts] = useState(
    cart?.shippingProduct?.productIds?.length > 0
      ? cart.shippingProduct.productIds.map(String)
      : []
  );
  const [addedShippingProducts, setAddedShippingProducts] = useState(
    cart?.shippingProduct?.productIds?.length > 0 && products.length > 0
      ? products.filter((p) =>
        cart.shippingProduct.productIds.includes(String(p.id))
      )
      : []
  );

  const [showShippingProduct, setShowShippingProduct] = useState(
    cart?.shippingProduct?.showShippingProduct ? cart.shippingProduct.showShippingProduct === "true" : true
  );

  const [textAfter, setTextAfter] = useState("Congratulations! You have achieved Free gift(s)");
  const [tiers, setTiers] = useState(
    cart?.progressBar?.tiers && cart.progressBar.tiers.length > 0
      ? cart.progressBar.tiers
      : [allTiers[0]]
  );
  const [testAmount, setTestAmount] = useState(0);

  const [showProgressBar, setShowProgressBar] = useState(
    cart?.progressBar?.showProgressBar ?? true
  );
  const [selectedProgressProducts, setSelectedProgressProducts] = useState(
    cart?.progressBar?.selectedProgressProducts?.length > 0
      ? cart.progressBar.selectedProgressProducts.map(String)
      : []);
  const [addedProgressProducts, setAddedProgressProducts] = useState(
    cart?.progressBar?.selectedProgressProducts?.length > 0 && products.length > 0
      ? products.filter((p) =>
        cart.progressBar.selectedProgressProducts.includes(String(p.id))
      )
      : []
  );
  const [tierTitle, setTierTitle] = useState(cart?.progressBar?.tierTitle || '#000');
  const [tierRewardTitle, setRewardTitle] = useState(cart?.progressBar?.tierRewardTitle || '#616161');
  const [tierFontsize, setTierFontsize] = useState(cart?.progressBar?.tierFontsize || 14);
  const [rewardFontsize, setRewardFontsize] = useState(cart?.progressBar?.rewardFontsize || 14);
  const [beforeColor, setBeforeColor] = useState(cart?.progressBar?.beforeColor || '#000000');
  const [beforeBar, setBeforeBar] = useState(cart?.progressBar?.beforeBar || '#E1E1E1');
  const [afterColor, setAfterColor] = useState(cart?.progressBar?.afterColor || '#FFFFFF');
  const [afterIcon, setAfterIcon] = useState(cart?.progressBar?.afterIcon || '#303030');

  const [noteTitle, setNoteTitle] = useState(cart?.additionalNote?.noteTitle || 'Add a note to your order');
  const [notePlaceholder, setNotePlaceholder] = useState(cart?.additionalNote?.notePlaceholder || 'Note for your order');
  const [noteSize, setNoteSize] = useState(cart?.additionalNote?.noteSize || 14);
  const [notePlaceholderSize, setNotePlaceholderSize] = useState(cart?.additionalNote?.notePlaceholderSize || 14);
  const [showNote, setShowNote] = useState(
    cart?.additionalNote?.showNote ? cart.additionalNote.showNote === "true" : true
  );

  const [checkboxLabel, setCheckboxLabel] = useState(cart?.confirmationBox?.checkboxLabel || "I agree to the {{Terms and conditions}}");
  const [link, setLink] = useState(cart?.confirmationBox?.link || "");
  const [isChecked, setIsChecked] = useState(cart?.confirmationBox?.isChecked ?? true);
  const [showBox, setShowBox] = useState(
     cart?.confirmationBox?.showBox ? cart.confirmationBox.showBox === "true" : true
  );

  const listRef = useRef(null);

  useEffect(() => {
    if (!cart) return;
    console.log("Loaded cart data:", cart);
  }, [cart]);

  const handleSave = async () => {
    if (!shop) {
      setMessage("Shop info missing!");
      return;
    }

    if (showProgressBar && (!selectedProgressProducts || selectedProgressProducts.length === 0)) {
      alert("Please select products for the Progress Bar before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/api/save-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          product: {
            productId: selectedProducts,
            upSellTitle, upSelltext, upSellstyle, upSellAdd, upSellTotal, isUpSellVisible, upSellTemplate
          },
          announcement: {
            announcementHeight, announcementPosition, announcementTimer, announcementText, announcementFontSize,
            announcementBgColor, announcementTextColor, announcementBorderColor, isAnnouncementVisible
          },
          checkoutStyle: {
            bgColor, headingColor, variantColor, discountBadgeColor, priceColor, quantityColor, originalPriceColor,
            savingPriceColor, buttonColor, buttonTextColor, checkoutButtonColor, checkoutButtonTextColor, iconColor,
            headerfontSize, btnborderRadius, btnLinkColor
          },
          discount: {
            buttonText, discountCode, isDiscountVisible
          },
          cartItem: {
            productNameSize, variantSize, comparePriceSize, savingPriceSize, productPriceSize
          },
          trustBages: {
            selectedImages: Array.isArray(selectedImages)
              ? selectedImages
              : JSON.parse(selectedImages || '[]'),
            isTrustVisible
          },
          checkoutSection: {
            checkoutText, discountText, totalDiscountText, viewCartText, discountSize, totalDiscountSize, checkoutSize,
            viewCartSize, showViewCart
          },
          vipProduct: {
            productIds: selectedVipProducts, showViPProduct
          },
          shippingProduct: {
            productIds: selectedShippingProducts, showShippingProduct
          },
          progressBar: {
            tiers, textAfter, showProgressBar, selectedProgressProducts,
            tierTitle, tierRewardTitle, tierFontsize, rewardFontsize,
            beforeColor, beforeBar, afterIcon, afterColor
          },
          additionalNote: {
            noteTitle, notePlaceholder, notePlaceholderSize, noteSize, showNote
          },
          confirmationBox: {
            checkboxLabel, link, isChecked, showBox
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("Settings saved successfully!");
        console.log("Saved cart data:", data);

      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.message || "Failed to save"}`);
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      setVisibleProducts(products.slice(0, 10));
      setLoadedCount(10);
    }
  }, [products]);

  const handleScroll = () => {
    const list = listRef.current;
    if (list && list.scrollTop + list.clientHeight >= list.scrollHeight - 20) {
      loadMoreProducts();
    }
  };

  const loadMoreProducts = () => {
    if (loadedCount < products.length) {
      const nextCount = Math.min(loadedCount + 10, products.length);
      setVisibleProducts(products.slice(0, nextCount));
      setLoadedCount(nextCount);
    }
  };

  const handleCheckboxChange = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSaveProducts = () => {
    const selected = products.filter((p) =>
      selectedProducts.includes(String(p.id))
    );
    setAddedProducts(selected);
    setShowPopup(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <section className="cart-page-container">
      <div className="cart-page-wrapp">
        <div className="cart-page body">
          <h3 className="page-title">Cart Drawer</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="save-btn"
            style={{ marginTop: "1rem" }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {message && <p>{message}</p>}
          <div className="cart-drawer-options">
            <div className="cart-drawer-items"
              onClick={() => handleTabChange("design")}
              style={{
                cursor: "pointer",
                fontWeight: activeTab === "design" ? "bold" : "normal",
                borderBottom: activeTab === "design" ? "2px solid black" : "none",
                padding: "4px 8px",
              }}
            >
              Design
            </div>
            <div className="cart-drawer-items"
              onClick={() => handleTabChange("cart")}
              style={{
                cursor: "pointer",
                fontWeight: activeTab === "cart" ? "bold" : "normal",
                borderBottom: activeTab === "cart" ? "2px solid black" : "none",
                padding: "4px 8px",
              }} >
              Cart
            </div>
          </div>
          {activeTab === "design" && (
            <CartDesgin
              setBgColor={setBgColor}
              bgColor={bgColor}
              setHeaderFontSize={setHeaderFontSize}
              headerfontSize={headerfontSize}
              setBtnBorderRadius={setBtnBorderRadius}
              btnborderRadius={btnborderRadius}
              headingColor={headingColor}
              setHeadingColor={setHeadingColor}
              variantColor={variantColor}
              setVariantColor={setVariantColor}
              discountBadgeColor={discountBadgeColor}
              setDiscountBadgeColor={setDiscountBadgeColor}
              priceColor={priceColor}
              setPriceColor={setPriceColor}
              quantityColor={quantityColor}
              setQuantityColor={setQuantityColor}
              originalPriceColor={originalPriceColor}
              setOriginalPriceColor={setOriginalPriceColor}
              savingPriceColor={savingPriceColor}
              setSavingPriceColor={setSavingPriceColor}
              buttonColor={buttonColor}
              setButtonColor={setButtonColor}
              buttonTextColor={buttonTextColor}
              setButtonTextColor={setButtonTextColor}
              checkoutButtonColor={checkoutButtonColor}
              setCheckoutButtonColor={setCheckoutButtonColor}
              checkoutButtonTextColor={checkoutButtonTextColor}
              setCheckoutButtonTextColor={setCheckoutButtonTextColor}
              setIconColor={setIconColor}
              iconColor={iconColor}
              setBtnLinkColor={setBtnLinkColor}
              btnLinkColor={btnLinkColor}
            />
          )}

          {activeTab === "cart" && (
            <>
              <div className="upsell-product">
                <UpSellProduct
                  upSellTitle={upSellTitle}
                  setUpSellTitle={setUpSellTitle}
                  upSelltext={upSelltext}
                  setUpSellText={setUpSellText}
                  upSellstyle={upSellstyle}
                  setUpSellStyle={setUpSellStyle}
                  setShowPopup={setShowPopup}
                  addedProducts={addedProducts}
                  showPopup={showPopup}
                  visibleProducts={visibleProducts}
                  listRef={listRef}
                  handleScroll={handleScroll}
                  selectedProducts={selectedProducts}
                  handleCheckboxChange={handleCheckboxChange}
                  handleSaveProducts={handleSaveProducts}
                  loadedCount={loadedCount}
                  products={products}
                  setUpSellAdd={setUpSellAdd}
                  upSellAdd={upSellAdd}
                  upSellTotal={upSellTotal}
                  setUpSellTotal={setUpSellTotal}
                  isUpSellVisible={isUpSellVisible}
                  setIsUpSellVisible={setIsUpSellVisible}
                  setSelectedProducts={setSelectedProducts}
                  upSellTemplate={upSellTemplate}
                  SetUpSellTemplate={SetUpSellTemplate}
                  showForm={openForm === "upsell"}
                  setOpenForm={setOpenForm}
                />
              </div>
              <div className="announcement-bar">
                <Announcement
                  announcementHeight={announcementHeight}
                  setAnnouncementHeight={setAnnouncementHeight}
                  announcementPosition={announcementPosition}
                  setAnnouncementPosition={setAnnouncementPosition}
                  announcementTimer={announcementTimer}
                  setAnnouncementTimer={setAnnouncementTimer}
                  announcementText={announcementText}
                  setAnnouncementText={setAnnouncementText}
                  announcementFontSize={announcementFontSize}
                  setAnnouncementFontSize={setAnnouncementFontSize}
                  announcementBgColor={announcementBgColor}
                  setAnnouncementBgColor={setAnnouncementBgColor}
                  announcementTextColor={announcementTextColor}
                  announcementBorderColor={announcementBorderColor}
                  setAnnouncementTextColor={setAnnouncementTextColor}
                  setAnnouncementBorderColor={setAnnouncementBorderColor}
                  isAnnouncementVisible={isAnnouncementVisible}
                  setIsAnnouncementVisible={setIsAnnouncementVisible}
                  showForm={openForm === "announcement"}
                  setOpenForm={setOpenForm}
                />
              </div>
              <div className="discount-item">
                <Discount
                  showForm={openForm === "discount"}
                  setOpenForm={setOpenForm}
                  isDiscountVisible={isDiscountVisible}
                  setIsDiscountVisible={setIsDiscountVisible}
                  discountCode={discountCode}
                  setDiscountCode={setDiscountCode}
                  buttonText={buttonText}
                  setButtonText={setButtonText}
                />
              </div>
              <div className="CartItem">
                <CartItem
                  showForm={openForm === "cartItem"}
                  setOpenForm={setOpenForm}
                  productNameSize={productNameSize}
                  variantSize={variantSize}
                  comparePriceSize={comparePriceSize}
                  savingPriceSize={savingPriceSize}
                  productPriceSize={productPriceSize}
                  setProductNameSize={setProductNameSize}
                  setVariantSize={setVariantSize}
                  setComparePriceSize={setComparePriceSize}
                  setSavingPriceSize={setSavingPriceSize}
                  setProductPriceSize={setProductPriceSize}

                />
                <div className="trust-badges">
                  <Trustbadges
                    showForm={openForm === "trustBadges"}
                    setOpenForm={setOpenForm}
                    isTrustVisible={isTrustVisible}
                    setIsTrustVisible={setIsTrustVisible}
                    customImages={customImages}
                    setCustomImages={setCustomImages}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                    shop={shop}
                    accessToken={accessToken}
                  />
                </div>
                <div className="Checkout-section">
                  <CheckoutSection
                    showForm={openForm === "CheckoutSection"}
                    setOpenForm={setOpenForm}
                    checkoutText={checkoutText}
                    discountText={discountText}
                    totalDiscountText={totalDiscountText}
                    viewCartText={viewCartText}
                    discountSize={discountSize}
                    totalDiscountSize={totalDiscountSize}
                    checkoutSize={checkoutSize}
                    viewCartSize={viewCartSize}
                    showViewCart={showViewCart}
                    setCheckoutText={setCheckoutText}
                    setDiscountText={setDiscountText}
                    setTotalDiscountText={setTotalDiscountText}
                    setViewCartText={setViewCartText}
                    setDiscountSize={setDiscountSize}
                    setTotalDiscountSize={setTotalDiscountSize}
                    setCheckoutSize={setCheckoutSize}
                    setViewCartSize={setViewCartSize}
                    setShowViewCart={setShowViewCart}
                  />
                </div>
                <div className="vip-product-section">
                  <VipProduct
                    showForm={openForm === "VipProduct"}
                    setOpenForm={setOpenForm}
                    setShowPopup={setShowPopup}
                    addedProducts={addedProducts}
                    showPopup={showPopup}
                    visibleProducts={visibleProducts}
                    listRef={listRef}
                    handleScroll={handleScroll}
                    products={products}
                    addedVipProducts={addedVipProducts}
                    setAddedVipProducts={setAddedVipProducts}
                    selectedVipProducts={selectedVipProducts}
                    setSelectedVipProducts={setSelectedVipProducts}
                    setShowVipProduct={setShowVipProduct}
                    showViPProduct={showViPProduct}
                  />
                </div>
                <div className="shipping-protection">
                  <Shippingprotection
                    showForm={openForm === "Shippingprotection"}
                    setOpenForm={setOpenForm}
                    setShowPopup={setShowPopup}
                    addedProducts={addedProducts}
                    showPopup={showPopup}
                    visibleProducts={visibleProducts}
                    listRef={listRef}
                    handleScroll={handleScroll}
                    products={products}
                    selectedShippingProducts={selectedShippingProducts}
                    addedShippingProducts={addedShippingProducts}
                    showShippingProduct={showShippingProduct}
                    setShowShippingProduct={setShowShippingProduct}
                    setSelectedShippingProducts={setSelectedShippingProducts}
                    setAddedShippingProducts={setAddedShippingProducts}
                  />
                </div>
                <div className="progrssBar">
                  <ProgrssBar
                    showForm={openForm === "ProgrssBar"}
                    setOpenForm={setOpenForm}
                    setTiers={setTiers}
                    setTextAfter={setTextAfter}
                    tiers={tiers}
                    showProgressBar={showProgressBar}
                    setShowProgressBar={setShowProgressBar}
                    textAfter={textAfter}
                    allTiers={allTiers}
                    testAmount={testAmount}
                    setTestAmount={setTestAmount}
                    products={products}
                    setShowPopup={setShowPopup}
                    showPopup={showPopup}
                    selectedProgressProducts={selectedProgressProducts}
                    setSelectedProgressProducts={setSelectedProgressProducts}
                    addedProgressProducts={addedProgressProducts}
                    setAddedProgressProducts={setAddedProgressProducts}
                    tierTitle={tierTitle}
                    tierRewardTitle={tierRewardTitle}
                    tierFontsize={tierFontsize}
                    rewardFontsize={rewardFontsize}
                    setTierTitle={setTierTitle}
                    setRewardTitle={setRewardTitle}
                    setTierFontsize={setTierFontsize}
                    setRewardFontsize={setRewardFontsize}
                    beforeColor={beforeColor}
                    beforeBar={beforeBar}
                    setBeforeColor={setBeforeColor}
                    setBeforeBar={setBeforeBar}
                    afterColor={afterColor}
                    afterIcon={afterIcon}
                    setAfterColor={setAfterColor}
                    setAfterIcon={setAfterIcon}
                  />
                </div>
                <div className="additional-note">
                  <Additionalnote
                    showForm={openForm === "additionalNote"}
                    setOpenForm={setOpenForm}
                    noteTitle={noteTitle}
                    notePlaceholder={notePlaceholder}
                    noteSize={noteSize}
                    notePlaceholderSize={notePlaceholderSize}
                    showNote={showNote}
                    setNoteTitle={setNoteTitle}
                    setNotePlaceholder={setNotePlaceholder}
                    setNoteSize={setNoteSize}
                    setNotePlaceholderSize={setNotePlaceholderSize}
                    setShowNote={setShowNote}
                  />
                </div>
                <div className="Confirmation-box">
                  <ConfirmationBox
                    showForm={openForm === "ConfirmationBox"}
                    setOpenForm={setOpenForm}
                    checkboxLabel={checkboxLabel}
                    link={link}
                    isChecked={isChecked}
                    setLink={setLink}
                    setIsChecked={setIsChecked}
                    setCheckboxLabel={setCheckboxLabel}
                    showBox={showBox}
                    setShowBox={setShowBox}
                  />
                </div>
              </div>
            </>
          )}
        </div>


        <CartDrawer
          bgColor={bgColor}
          upSellTitle={upSellTitle}
          upSelltext={upSelltext}
          upSellstyle={upSellstyle}
          products={products}
          addedProducts={addedProducts}
          setUpSellAdd={setUpSellAdd}
          upSellAdd={upSellAdd}
          isUpSellVisible={isUpSellVisible}
          upSellTemplate={upSellTemplate}
          announcementHeight={announcementHeight}
          announcementPosition={announcementPosition}
          announcementTimer={announcementTimer}
          announcementText={announcementText}
          announcementFontSize={announcementFontSize}
          announcementBgColor={announcementBgColor}
          announcementTextColor={announcementTextColor}
          announcementBorderColor={announcementBorderColor}
          isAnnouncementVisible={isAnnouncementVisible}
          btnborderRadius={btnborderRadius}
          headerfontSize={headerfontSize}
          headingColor={headingColor}
          variantColor={variantColor}
          discountBadgeColor={discountBadgeColor}
          priceColor={priceColor}
          quantityColor={quantityColor}
          originalPriceColor={originalPriceColor}
          savingPriceColor={savingPriceColor}
          buttonColor={buttonColor}
          buttonTextColor={buttonTextColor}
          checkoutButtonColor={checkoutButtonColor}
          checkoutButtonTextColor={checkoutButtonTextColor}
          iconColor={iconColor}
          discountCode={discountCode}
          buttonText={buttonText}
          isDiscountVisible={isDiscountVisible}
          productNameSize={productNameSize}
          variantSize={variantSize}
          comparePriceSize={comparePriceSize}
          savingPriceSize={savingPriceSize}
          productPriceSize={productPriceSize}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          isTrustVisible={isTrustVisible}
          checkoutText={checkoutText}
          discountText={discountText}
          totalDiscountText={totalDiscountText}
          viewCartText={viewCartText}
          discountSize={discountSize}
          totalDiscountSize={totalDiscountSize}
          checkoutSize={checkoutSize}
          viewCartSize={viewCartSize}
          showViewCart={showViewCart}
          btnLinkColor={btnLinkColor}
          addedVipProducts={addedVipProducts}
          showViPProduct={showViPProduct}
          addedShippingProducts={addedShippingProducts}
          showShippingProduct={showShippingProduct}
          textAfter={textAfter}
          showProgressBar={showProgressBar}
          tiers={tiers}
          testAmount={testAmount}
          tierTitle={tierTitle}
          tierRewardTitle={tierRewardTitle}
          tierFontsize={tierFontsize}
          addedProgressProducts={addedProgressProducts}
          rewardFontsize={rewardFontsize}
          beforeColor={beforeColor}
          beforeBar={beforeBar}
          afterColor={afterColor}
          afterIcon={afterIcon}
          noteTitle={noteTitle}
          notePlaceholder={notePlaceholder}
          noteSize={noteSize}
          notePlaceholderSize={notePlaceholderSize}
          showNote={showNote}
          checkboxLabel={checkboxLabel}
          link={link}
          isChecked={isChecked}
          showBox={showBox}
        />
      </div>
    </section>
  );
}
>>>>>>> cf1e28d8c234fc626bc5b73da5e514279edd763f
