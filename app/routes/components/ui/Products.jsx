import React, { useState, useEffect, useRef } from "react";
import {
    Text,
    Thumbnail,
    Checkbox,
    BlockStack,
    InlineStack,
    TextField,
    Badge,
    Spinner,
    Icon
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

export default function Products({ products: initialProducts, hasNextPage: initialHasNext, nextCursor: initialCursor,
    currency, onSelect, selectedItems = [], }) {

    const [products, setProducts] = useState(initialProducts);
    const [cursor, setCursor] = useState(initialCursor);
    const [hasNextPage, setHasNextPage] = useState(initialHasNext);
    const [loading, setLoading] = useState(false);
    const [openProducts, setOpenProducts] = useState({});

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(selectedItems);
    const [showSelected, setShowSelected] = useState(false);

    const loaderRef = useRef(null);

    useEffect(() => {
        setSelected(selectedItems);
    }, [selectedItems]);

    const loadMore = async () => {
        if (!hasNextPage || loading || (showSelected && selected.length === 0)) return;

        setLoading(true);

        try {
            const res = await fetch(`/api/products?cursor=${cursor}`);
            const data = await res.json();

            const edges = data?.data?.products?.edges || [];

            const newProducts = edges.map((p) => ({
                id: p.node.id,
                title: p.node.title,
                image: p.node.images.edges[0]?.node?.url,
                price: p.node.variants.edges[0]?.node?.price || "0",
                variants: p.node.variants.edges.map((v) => ({
                    id: v.node.id,
                    title: v.node.title,
                    price: v.node.price,
                    sku: v.node.sku,
                    available: v.node.availableForSale,
                    image: v.node.image
                        ? {
                            url: v.node.image.url,
                            altText: v.node.image.altText,
                        }
                        : null,
                }))
            }));

            setProducts((prev) => [...prev, ...newProducts]);

            setCursor(edges[edges.length - 1]?.cursor);
            setHasNextPage(data?.data?.products?.pageInfo?.hasNextPage);

        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 1 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
        };
    }, [cursor, hasNextPage]);

    const toggleSelect = (variant, product) => {
        let updated;

        const exists = selected.some((v) => v.id === variant.id);

        if (exists) {
            updated = [];
        } else {
            updated = [
                {
                    ...variant,
                    productTitle: product.title,
                    productImage: product.image,
                },
            ];
        }

        setSelected(updated);
        onSelect(updated);
    };

    const isSelected = (id) => selected.some((v) => v.id === id);

    const filtered = products?.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    const isProductSelected = (product) => {
        return selected.some((v) =>
            product.variants.some((pv) => pv.id === v.id)
        );
    };

    const toggleProduct = (product) => {
        const firstVariant = product.variants[0];

        const isAlreadySelected = selected.some(
            (v) => v.id === firstVariant.id
        );

        let updated;

        if (isAlreadySelected) {
            updated = [];
        } else {
            updated = [
                {
                    ...firstVariant,
                    productTitle: product.title,
                    productImage: product.image,
                },
            ];
        }

        setSelected(updated);
        onSelect(updated);
    };

    const toggleVariants = (productId) => {
        setOpenProducts((prev) => ({
            ...prev,
            [productId]: !prev[productId],
        }));
    };

    const visibleProducts = filtered.filter((product) => {
        if (!showSelected) return true;
        return product.variants.some((v) =>
            selected.some((s) => s.id === v.id)
        );
    });

    return (
        <BlockStack gap="300">

            <InlineStack gap="200">
                <div style={{ flex: 1 }}>
                    <TextField
                        placeholder="Search products"
                        value={search}
                        onChange={setSearch}
                        autoComplete="off"
                    />
                </div>
            </InlineStack>

            <InlineStack align="space-between">
                <Text tone="subdued">{selected.length} item selected</Text>

                <Checkbox
                    label="Show only selected"
                    checked={showSelected}
                    onChange={(value) => setShowSelected(value)}
                />
            </InlineStack>

            <div style={{ borderTop: "1px solid #e1e3e5" }}>
                {visibleProducts.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                        <Text tone="subdued">No items to display</Text>
                    </div>
                ) : (visibleProducts.map((product) => (
                    <div key={product.id}>
                        <div
                            style={{
                                padding: "10px 0",
                                borderBottom: "1px solid #e1e3e5",
                            }}
                        >
                            <InlineStack align="space-between" wrap={false}>

                                {/* LEFT SIDE */}
                                <div style={{ flex: 1 }}>
                                    <InlineStack gap="200" align="left" wrap={false}>
                                        <Checkbox
                                            checked={isProductSelected(product)}
                                            onChange={() => toggleProduct(product)}
                                        />

                                        <div style={{ minWidth: "40px" }}>
                                            <Thumbnail source={product.image} size="small" />
                                        </div>

                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={() => toggleVariants(product.id)}
                                        >

                                            <BlockStack>
                                                <Text fontWeight="medium">{product.title}</Text>

                                                <InlineStack gap="50" align="left">
                                                    <div style={{ display: "inline-flex", alignItems: 'center' }}>
                                                        <Text tone="subdued" variant="bodySm">
                                                            {product.variants.length} variants
                                                        </Text>

                                                        <Icon
                                                            source={openProducts[product.id] ? ChevronUpIcon : ChevronDownIcon}
                                                        />
                                                    </div>
                                                </InlineStack>
                                            </BlockStack>

                                        </div>
                                    </InlineStack>
                                </div>

                                {/* RIGHT SIDE */}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", minWidth: "140px" }}>
                                    {product.variants.every((v) => !v.available) && (
                                        <Badge tone="warning">Out of stock</Badge>
                                    )}
                                    <Text alignment="end">{product.price} {currency}</Text>
                                </div>

                            </InlineStack>
                        </div>

                        {product.variants.length > 1 &&
                            openProducts[product.id] &&
                            product.variants.map((v) => {
                                if (showSelected && !isSelected(v.id)) return null;

                                return (
                                    <div
                                        key={v.id}
                                        style={{
                                            padding: "8px 0 8px 40px",
                                            borderBottom: "1px solid #f1f2f3",
                                        }}
                                    >
                                        <InlineStack align="space-between">

                                            <InlineStack gap="200" align="center">
                                                <Checkbox
                                                    checked={isSelected(v.id)}
                                                    onChange={() => toggleSelect(v, product)}
                                                />

                                                <Thumbnail
                                                    source={v.image?.url || product.image}
                                                    size="extraSmall"
                                                />

                                                <Text>{v.title}</Text>
                                            </InlineStack>

                                            <InlineStack gap="200">
                                                {!v.available && (
                                                    <Badge tone="warning">Out of stock</Badge>
                                                )}
                                                <Text>{v.price} USD</Text>
                                            </InlineStack>
                                        </InlineStack>
                                    </div>
                                );
                            })}
                    </div>
                ))
                )}
            </div>
            {!showSelected && (
                <div
                    ref={loaderRef}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "12px 0",
                    }}
                >
                    {loading && <Spinner accessibilityLabel="Loading products" size="small" />}
                </div>
            )}
        </BlockStack>
    );
}