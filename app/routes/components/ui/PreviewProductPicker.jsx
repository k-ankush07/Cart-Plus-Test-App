import { useState, useEffect, useRef } from "react";
import {
  Modal,
  TextField,
  Checkbox,
  Thumbnail,
  Tag,
  Spinner,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Button,
  Divider,
  Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useAuthenticatedFetch } from "../utils/useAuthenticatedFetch";
import {
  normalizePreviewProduct,
  pickDefaultPreviewProduct,
} from "../utils/previewProduct";

const normalize = normalizePreviewProduct;

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

/**
 * Polaris modal to pick products (and variants) for the cart preview.
 * `selected` is the list of picked products (each with only its picked variants),
 * `onChange` receives the new list. The first store product is picked by default.
 */
export default function PreviewProductPicker({
  selected = [],
  onChange,
  onInitialLoading,
}) {
  const authenticatedFetch = useAuthenticatedFetch();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  // draft = { [productId]: product } — applied on "Select"
  const [draft, setDraft] = useState({});
  const requestRef = useRef(0);
  const initRef = useRef(false);

  const fetchProducts = async (query, after = null) => {
    const res = await authenticatedFetch(
      `/shopify/products?cursor=${after || ""}&query=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    const edges = data?.data?.products?.edges || [];
    return {
      list: edges.map((e) => normalize(e.node)),
      cursor: edges[edges.length - 1]?.cursor || null,
      hasNext: !!data?.data?.products?.pageInfo?.hasNextPage,
    };
  };

  // select the first store product by default
  useEffect(() => {
    if (initRef.current || selected.length) {
      onInitialLoading?.(false);
      return;
    }
    initRef.current = true;
    onInitialLoading?.(true);
    fetchProducts("")
      .then(({ list }) => {
        const first = pickDefaultPreviewProduct(list);
        if (first) onChange([first]);
      })
      .catch(() => {})
      .finally(() => onInitialLoading?.(false));
  }, []);

  // load (and re-load on search) while the modal is open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      const requestId = ++requestRef.current;
      setLoading(true);
      try {
        const res = await fetchProducts(search);
        if (requestId !== requestRef.current) return;
        setProducts(res.list);
        setCursor(res.cursor);
        setHasNext(res.hasNext);
      } catch (err) {
        if (requestId === requestRef.current) setProducts([]);
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [open, search]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetchProducts(search, cursor);
      setProducts((prev) => [...prev, ...res.list]);
      setCursor(res.cursor);
      setHasNext(res.hasNext);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    const initial = {};
    selected.forEach((p) => {
      initial[p.id] = p;
    });
    setDraft(initial);
    setSearch("");
    setOpen(true);
  };

  const toggleProduct = (product) =>
    setDraft((prev) => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = product;
      return next;
    });

  const draftCount = Object.keys(draft).length;

  const applySelection = () => {
    // one cart line per product: keep an already-chosen variant, else the first available one
    const result = Object.values(draft).map((product) => {
      const existing = selected.find((p) => p.id === product.id);
      const variant =
        existing?.variants?.[0] ||
        product.variants.find((v) => v.available) ||
        product.variants[0];
      return { ...product, variants: variant ? [variant] : [] };
    });
    const order = selected.map((p) => p.id);
    result.sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
    });
    onChange(result);
    setOpen(false);
  };

  const remove = (id) => onChange(selected.filter((p) => p.id !== id));

  const label =
    selected.length === 0
      ? "No products"
      : selected.length === 1
        ? truncate(selected[0].title, 28)
        : `${selected.length} products selected`;

  return (
    <BlockStack gap="150">
      <Text as="span" variant="bodySm">
        Previewing items
      </Text>

      <Button fullWidth disclosure="select" textAlign="left" onClick={openModal}>
        {label}
      </Button>

      {selected.length > 1 && (
        <InlineStack gap="100">
          {selected.map((p) => (
            <Tag key={p.id} onRemove={() => remove(p.id)}>
              {truncate(p.title, 22)}
            </Tag>
          ))}
        </InlineStack>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Select products"
        footer={
          <Text as="span" variant="bodySm">
            {draftCount} product{draftCount === 1 ? "" : "s"} selected
          </Text>
        }
        primaryAction={{ content: "Select", onAction: applySelection }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setOpen(false) },
        ]}
      >
        <Modal.Section>
          <TextField
            label="Search products"
            labelHidden
            placeholder="Search products"
            value={search}
            onChange={setSearch}
            autoComplete="off"
            prefix={<Icon source={SearchIcon} />}
            clearButton
            onClearButtonClick={() => setSearch("")}
          />
        </Modal.Section>

        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {products.length === 0 && !loading && (
            <Box padding="400">
              <Text as="p" tone="subdued" alignment="center">
                No products found
              </Text>
            </Box>
          )}

          {products.map((product) => (
            <div key={product.id}>
              <Divider />
              <Box paddingInline="400" paddingBlock="200">
                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <Checkbox
                    label={product.title}
                    labelHidden
                    checked={!!draft[product.id]}
                    onChange={() => toggleProduct(product)}
                  />
                  <Thumbnail
                    source={product.image || ""}
                    alt={product.title}
                    size="small"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text as="span" variant="bodyMd">
                      {product.title}
                    </Text>
                  </div>
                </InlineStack>
              </Box>
            </div>
          ))}

          {loading && (
            <Box padding="400">
              <InlineStack align="center">
                <Spinner size="small" />
              </InlineStack>
            </Box>
          )}

          {hasNext && !loading && (
            <Box padding="300">
              <InlineStack align="center">
                <Button variant="plain" onClick={loadMore}>
                  Load more
                </Button>
              </InlineStack>
            </Box>
          )}
        </div>
      </Modal>
    </BlockStack>
  );
}
