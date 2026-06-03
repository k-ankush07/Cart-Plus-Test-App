import {
    Text,
    Button,
    InlineStack,
    BlockStack,
    Checkbox,
    ResourceList, Thumbnail,
    Badge,
    Icon,
    Spinner,
    TextField,
    ResourceItem,
    Tabs,
    Pagination,
    Box
} from "@shopify/polaris";
import {
    ChevronDownIcon,
    ChevronUpIcon,
} from "@shopify/polaris-icons";
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useAuthenticatedFetch } from "../utils/useAuthenticatedFetch";

const ProductItemCollections = React.forwardRef(({ currency, onSelect, initialSelected, showCollections = true, showProducts = true, maxSelect = null, multiSelectCollections = false, onPaginationChange }, ref) => {

    const authenticatedFetch = useAuthenticatedFetch();
    const [cursorStack, setCursorStack] = useState([]);
    const [openProducts, setOpenProducts] = useState({});
    const [selectedVariants, setSelectedVariants] = useState([]);
    const [localProducts, setLocalProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState(null);
    const [search, setSearch] = useState("");
    const [showSelected, setShowSelected] = useState(false);
    const [activeTab, setActiveTab] = useState("products");
    const [hasNextPage, setHasNextPage] = useState(false);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const searchDebounceRef = useRef(null);
    const currentSearchRef = useRef("");

    const cursorRef = useRef(null);
    const cursorStackRef = useRef([]);

    useEffect(() => {
        if (!initialSelected) return;

        if (initialSelected.type === "products") {
            const variants = Array.isArray(initialSelected.items)
                ? initialSelected.items
                : initialSelected.items?.variants || [];

            setSelectedVariants(variants);
        }

        if (initialSelected.type === "collections") {
            setSelectedCollections(initialSelected.items || []);
            setSelectedVariants([]);
            setActiveTab("collections");
        }
    }, [initialSelected]);

    const toggleVariants = (id) => {
        setOpenProducts((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const isSelected = (id) => selectedVariants.includes(id);

    const toggleSelect = (variant) => {
        setSelectedCollections([]);

        setSelectedVariants((prev) => {
            let updated;
            if (prev.includes(variant.id)) {
                updated = prev.filter((i) => i !== variant.id);
            } else if (maxSelect === 1) {
                updated = [variant.id];
            } else {
                updated = [...prev, variant.id];
            }

            const selectedProducts = localProducts.filter((p) =>
                p.variants.some((v) => updated.includes(v.id))
            );
            const productIds = selectedProducts.map((p) => p.id);
            const titles = selectedProducts.map((p) => p.title);
            const images = selectedProducts.map((p) => p.image);

            onSelect({
                type: "products",
                items: { variants: updated, products: productIds, titles, images }
            });

            return updated;
        });
    };

    const isProductSelected = (product) =>
        product.variants.some((v) => selectedVariants.includes(v.id));

    const toggleProduct = (product) => {
        setSelectedCollections([]);

        const variantIds = product.variants.map((v) => v.id);

        setSelectedVariants((prev) => {
            const allSelected = variantIds.every((id) =>
                prev.includes(id)
            );

            let updated;

            if (allSelected) {
                updated = prev.filter((id) => !variantIds.includes(id));
            } else if (maxSelect === 1) {
                updated = [variantIds[0]];
            } else {
                updated = [...new Set([...prev, ...variantIds])];
            }

            const selectedProducts = localProducts.filter((p) =>
                p.variants.some((v) => updated.includes(v.id))
            );
            const productIds = selectedProducts.map((p) => p.id);
            const titles = selectedProducts.map((p) => p.title);
            const images = selectedProducts.map((p) => p.image);

            onSelect({
                type: "products",
                items: { variants: updated, products: productIds, titles, images }
            });

            return updated;
        });
    };

    const selectedProductCount = new Set(
        localProducts
            .filter((product) =>
                product.variants.some((v) =>
                    selectedVariants.includes(v.id)
                )
            )
            .map((p) => p.id)
    ).size;

    useEffect(() => {
        onPaginationChange?.({
            hasPrevious: cursorStack.length > 0,
            hasNext: hasNextPage,
            handlePrev,
            handleNext,
        });
    }, [cursorStack, hasNextPage]);

    useImperativeHandle(ref, () => ({
        hasPrevious: cursorStack.length > 0,
        hasNext: hasNextPage,
        handlePrev,
        handleNext,
    }));

    useEffect(() => { cursorRef.current = cursor; }, [cursor]);
    useEffect(() => { cursorStackRef.current = cursorStack; }, [cursorStack]);

    const handleNext = async () => {
        if (!hasNextPage) return;
        setCursorStack((prev) => [...prev, cursorRef.current]);
        await loadMore(cursorRef.current, currentSearchRef.current);
    };

    const handlePrev = async () => {
        const stack = [...cursorStackRef.current];
        if (stack.length === 0) return;
        stack.pop();
        const prevCursor =
            stack.length > 0 ? stack[stack.length - 1] : null;
        setCursorStack(stack);
        await loadMore(prevCursor, currentSearchRef.current);
    };

    useEffect(() => {
        loadMore(null, "");
    }, []);

    useEffect(() => {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            currentSearchRef.current = search;
            setCursorStack([]);
            loadMore(null, search);
        }, 400);
        return () => clearTimeout(searchDebounceRef.current);
    }, [search]);

    const loadMore = async (cursorValue, searchQuery) => {
        setLoading(true);

        try {
            const q = searchQuery !== undefined ? searchQuery : currentSearchRef.current;
            const res = await authenticatedFetch(`/shopify/products?cursor=${cursorValue || ""}&query=${encodeURIComponent(q)}`);
            const data = await res.json();

            const edges = data?.data?.products?.edges || [];

            const newProducts = edges.map((p) => ({
                id: p.node.id,
                title: p.node.title,
                status: p.node.status,
                image: p.node.images.edges[0]?.node?.url,
                price: p.node.variants.edges[0]?.node?.price || "0",
                variants: p.node.variants.edges.map((v) => ({
                    id: v.node.id,
                    title: v.node.title,
                    price: v.node.price,
                    available: v.node.availableForSale,
                    image: v.node.image?.url || null,
                }))
            }));

            setLocalProducts(newProducts);

            const lastCursor = edges[edges.length - 1]?.cursor;
            setCursor(lastCursor);

            setHasNextPage(data?.data?.products?.pageInfo?.hasNextPage);

        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    const filteredProducts = localProducts.filter((product) =>
        showSelected
            ? product.variants.some((v) => selectedVariants.includes(v.id))
            : true
    );

    const [collections, setCollections] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);

    const loadCollections = async () => {
        setCollectionsLoading(true);

        try {
            const res = await authenticatedFetch(`/shopify/collections`, {
                credentials: "include",
            });

            const data = await res.json();

            const edges = data?.collections || [];

            const formatted = edges.map((c) => ({
                id: c.node.id,
                title: c.node.title,
                image: c.node.image?.url || "",
                productsCount: c.node.productsCount?.count || 0,
            }));

            setCollections(formatted);

        } catch (err) {
            console.error(err);
        }

        setCollectionsLoading(false);
    };

    useEffect(() => {
        if (activeTab === "collections") {
            loadCollections();
        }
    }, [activeTab]);

    const filteredCollections = collections.filter((col) => {
        const matchesSearch = col.title
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesSelected = showSelected
            ? selectedCollections.includes(col.id)
            : true;

        return matchesSearch && matchesSelected;
    });

    const handleCollectionSelect = (id) => {
        setSelectedVariants([]);

        setSelectedCollections((prev) => {
            let updated;
            if (multiSelectCollections) {
                updated = prev.includes(id)
                    ? prev.filter((i) => i !== id)
                    : [...prev, id];
            } else {
                updated = prev.includes(id) ? [] : [id];
            }

            const selected = collections.filter((c) => updated.includes(c.id));
            const titles = selected.map((c) => c.title);
            const images = selected.map((c) => c.image);

            onSelect({ type: "collections", items: updated, titles, images });

            return updated;
        });
    };

    return (
        <div>
            <BlockStack gap="300">
                {(showProducts || showCollections) && (
                    <Tabs
                        tabs={[
                            ...(showProducts ? [{ id: "products", content: "Product", accessibilityLabel: "Search Products" }] : []),
                            ...(showCollections ? [{ id: "collections", content: "Collection", accessibilityLabel: "Search Collections" }] : []),
                        ]}
                        selected={
                            activeTab === "products"
                                ? showProducts ? 0 : -1
                                : showProducts ? 1 : 0
                        }
                        onSelect={(index) => {
                            const tabs = [
                                ...(showProducts ? ["products"] : []),
                                ...(showCollections ? ["collections"] : []),
                            ];
                            setActiveTab(tabs[index]);
                        }}
                        fitted
                    />
                )}
                <div style={{ height: "4px" }} />
            </BlockStack>

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
                    <Text tone="subdued">
                        {activeTab === "products"
                            ? `${selectedProductCount} product${selectedProductCount !== 1 ? "s" : ""} selected`
                            : `${selectedCollections.length} collection${selectedCollections.length !== 1 ? "s" : ""} selected`}
                    </Text>
                    <Checkbox
                        label="Show only selected"
                        checked={showSelected}
                        onChange={(value) => setShowSelected(value)}
                    />
                </InlineStack>
            </BlockStack>
            {activeTab === "products" && (
                <div style={{ position: "relative", minHeight: "200px" }}>
                    {loading && (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: "rgba(255,255,255,0.7)",
                                    zIndex: 10,
                                }}
                            />
                            <div
                                style={{
                                    position: "fixed",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 11,
                                }}
                            >
                                <Spinner accessibilityLabel="Loading products" size="large" />
                            </div>
                        </>
                    )}

                    {showSelected && filteredProducts.length === 0 && !loading && (
                        <Text alignment="center" tone="subdued">
                            No items to display
                        </Text>
                    )}

                    <ResourceList
                        resourceName={{ singular: "product", plural: "products" }}
                        items={filteredProducts}
                        renderItem={(product) => {
                            const index = filteredProducts.indexOf(product);

                            return (
                                <div key={product.id}>

                                    {/* PRODUCT ROW */}
                                    <div style={{
                                        padding: "10px 0",
                                        borderBottom: index !== filteredProducts.length - 1
                                            ? "1px solid #e1e3e5"
                                            : "none",
                                    }}>

                                        <InlineStack align="space-between" wrap={false} gap="500">

                                            {/* LEFT */}
                                            <InlineStack gap="200" align="start" blockAlign="start" wrap={false}>

                                                <Checkbox
                                                    checked={isProductSelected(product)}
                                                    onChange={() => toggleProduct(product)}
                                                />
                                                <div style={{ minWidth: "40px" }}>
                                                    <Thumbnail source={product.image} size="small" />
                                                </div>
                                                <div onClick={() => toggleVariants(product.id)} style={{ cursor: "pointer" }}>
                                                    <BlockStack>
                                                        <Text fontWeight="medium">{product.title}</Text>

                                                        {product.variants.length > 0 && (
                                                            <InlineStack gap="50" align="left">
                                                                <div style={{ display: "inline-flex", alignItems: "center" }}>
                                                                    <Text tone="subdued" variant="bodySm">
                                                                        {product.variants.length} variants
                                                                    </Text>

                                                                    {product.variants.length > 1 && (
                                                                        <Icon source={openProducts[product.id] ? ChevronUpIcon : ChevronDownIcon} />
                                                                    )}
                                                                </div>
                                                            </InlineStack>
                                                        )}
                                                    </BlockStack>
                                                </div>

                                            </InlineStack>

                                            <div style={{
                                                display: "flex", gap: "8px", justifyContent: "flex-end", minWidth: product.variants.every((v) => !v.available)
                                                    ? "165px"
                                                    : "90px",
                                            }}>
                                                <div
                                                    style={{
                                                        lineHeight: 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        height: "25px",
                                                        gap: "8px"
                                                    }}
                                                >
                                                    {product.status !== "ACTIVE" && (
                                                        <Badge tone={product.status === "DRAFT" ? "info" : "warning"}>
                                                            {product.status === "DRAFT" ? "Draft" : "Archived"}
                                                        </Badge>
                                                    )}

                                                    {product.variants.every((v) => !v.available) && (
                                                        <Badge tone="warning">Out of stock</Badge>
                                                    )}
                                                </div>
                                                <Text alignment="end">{product.price} {currency}</Text>
                                            </div>

                                        </InlineStack>
                                    </div>

                                    {/* VARIANTS */}
                                    {product.variants.length > 1 &&
                                        openProducts[product.id] &&
                                        product.variants.map((v) => (
                                            <div
                                                key={v.id}
                                                style={{
                                                    padding: "8px 0 8px 40px",
                                                    borderBottom: "1px solid #f1f2f3",
                                                }}
                                            >
                                                <InlineStack align="space-between">

                                                    <InlineStack gap="200">
                                                        <Checkbox
                                                            checked={isSelected(v.id)}
                                                            onChange={() => toggleSelect(v, product)}
                                                        />

                                                        <Thumbnail
                                                            source={v.image || product.image}
                                                            size="extraSmall"
                                                        />

                                                        <Text>{v.title}</Text>
                                                    </InlineStack>

                                                    <InlineStack gap="200">
                                                        {!v.available && (
                                                            <Badge tone="warning">Out of stock</Badge>
                                                        )}
                                                        <Text>{v.price} {currency}</Text>
                                                    </InlineStack>

                                                </InlineStack>
                                            </div>
                                        ))}

                                </div>
                            );
                        }}
                    />
                </div>)}

            {activeTab === "collections" && (
                <div style={{ position: "relative", minHeight: "200px" }}>
                    {collectionsLoading && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.7)",
                                zIndex: 10,
                            }}
                        >
                            <Spinner accessibilityLabel="Loading collections" size="large" />
                        </div>
                    )}
                    <ResourceList
                        resourceName={{ singular: "collection", plural: "collections" }}
                        items={filteredCollections}
                        renderItem={(item) => {
                            const { id, title, image, productsCount } = item;

                            return (
                                <ResourceItem
                                    id={id}
                                    onClick={() =>
                                        handleCollectionSelect(id)}
                                >
                                    <InlineStack align="space-between" blockAlign="center">

                                        {/* LEFT */}
                                        <InlineStack gap="300" blockAlign="center">

                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedCollections.includes(id)}
                                                    onChange={() => handleCollectionSelect(id)}
                                                />
                                            </div>

                                            <Thumbnail source={image} size="small" />

                                            <BlockStack gap="050">
                                                <Text fontWeight="medium">{title}</Text>
                                                <Text tone="subdued" variant="bodySm">
                                                    {productsCount} products
                                                </Text>
                                            </BlockStack>
                                        </InlineStack>
                                    </InlineStack>
                                </ResourceItem>
                            );
                        }}
                    />
                </div>
            )}
        </div>
    )
});

export default ProductItemCollections