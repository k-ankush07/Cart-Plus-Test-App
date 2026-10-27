import { useMemo, useRef, useState } from "react";
import {
  Popover,
  TextField,
  Button,
  Icon,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Spinner,
} from "@shopify/polaris";
import {
  HomeIcon,
  SettingsIcon,
  PersonIcon,
  NotificationIcon,
  HeartIcon,
  StarIcon,
  SearchIcon,
  EmailIcon,
  PhoneIcon,
  CameraIcon,
  LockIcon,
  DeleteIcon,
  EditIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CartIcon,
  GiftCardIcon,
  LocationIcon,
  CalendarIcon,
  DiscountIcon,
  DeliveryIcon,
  ClockIcon,
  InfoIcon,
  ShieldCheckMarkIcon,
  MegaphoneIcon,
  ReceiptIcon,
  PaymentIcon,
  GlobeIcon,
  ImageIcon,
  CodeIcon,
  RefreshIcon,
  FlagIcon,
  ChatIcon,
  ProductIcon,
  StoreIcon,
  PlayIcon,
} from "@shopify/polaris-icons";
import { uploadImage } from "../../../services/apiRoutes";

export const ICON_LIBRARY = [
  { name: "home", label: "Home", source: HomeIcon },
  { name: "settings", label: "Settings", source: SettingsIcon },
  { name: "user", label: "User", source: PersonIcon },
  { name: "notification", label: "Notification", source: NotificationIcon },
  { name: "heart", label: "Heart", source: HeartIcon },
  { name: "star", label: "Star", source: StarIcon },
  { name: "search", label: "Search", source: SearchIcon },
  { name: "mail", label: "Mail", source: EmailIcon },
  { name: "phone", label: "Phone", source: PhoneIcon },
  { name: "camera", label: "Camera", source: CameraIcon },
  { name: "lock", label: "Lock", source: LockIcon },
  { name: "trash", label: "Trash", source: DeleteIcon },
  { name: "edit", label: "Edit", source: EditIcon },
  { name: "plus", label: "Plus", source: PlusIcon },
  { name: "minus", label: "Minus", source: MinusIcon },
  { name: "check", label: "Check", source: CheckIcon },
  { name: "close", label: "Close", source: XIcon },
  { name: "right", label: "Right", source: ArrowRightIcon },
  { name: "left", label: "Left", source: ArrowLeftIcon },
  { name: "down", label: "Down", source: ArrowDownIcon },
  { name: "up", label: "Up", source: ArrowUpIcon },
  { name: "cart", label: "Cart", source: CartIcon },
  { name: "gift", label: "Gift", source: GiftCardIcon },
  { name: "location", label: "Location", source: LocationIcon },
  { name: "calendar", label: "Calendar", source: CalendarIcon },
  { name: "discount", label: "Discount", source: DiscountIcon },
  { name: "delivery", label: "Delivery", source: DeliveryIcon },
  { name: "clock", label: "Clock", source: ClockIcon },
  { name: "info", label: "Info", source: InfoIcon },
  { name: "shield", label: "Shield", source: ShieldCheckMarkIcon },
  { name: "megaphone", label: "Megaphone", source: MegaphoneIcon },
  { name: "receipt", label: "Receipt", source: ReceiptIcon },
  { name: "payment", label: "Payment", source: PaymentIcon },
  { name: "globe", label: "Globe", source: GlobeIcon },
  { name: "image", label: "Image", source: ImageIcon },
  { name: "code", label: "Code", source: CodeIcon },
  { name: "refresh", label: "Refresh", source: RefreshIcon },
  { name: "flag", label: "Flag", source: FlagIcon },
  { name: "chat", label: "Chat", source: ChatIcon },
  { name: "product", label: "Product", source: ProductIcon },
  { name: "store", label: "Store", source: StoreIcon },
  { name: "play", label: "Play", source: PlayIcon },
];

const DEFAULT_QUICK_ICONS = [
  "star", "heart", "right", "gift", "discount", "delivery", "megaphone", "cart",
];

const byName = Object.fromEntries(ICON_LIBRARY.map((i) => [i.name, i]));

/**
 * value shape: { type: "icon", name } | { type: "image", url } | null
 * Renders the picked library icon, or the uploaded image, at `size` px.
 * Pass `color` (or set it on a parent) to tint library icons; uploaded images keep their own colours.
 */
export function LibraryIcon({ value, size = 20, color }) {
  if (!value) return null;
  if (value.type === "image" && value.url) {
    return (
      <img
        src={value.url}
        alt=""
        style={{ width: size, height: size, objectFit: "contain", display: "block" }}
      />
    );
  }
  const item = byName[value.name];
  if (!item) return null;
  return (
    <span
      className="cart-plus-lib-icon"
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        color: color || "currentColor",
      }}
    >
      <Icon source={item.source} />
    </span>
  );
}

const sameValue = (a, b) =>
  !!a &&
  !!b &&
  a.type === b.type &&
  (a.type === "image" ? a.url === b.url : a.name === b.name);

const iconButtonStyle = (selected) => ({
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  cursor: "pointer",
  background: "#fff",
  border: selected ? "2px solid #303030" : "1px solid #c9cccf",
  padding: 0,
});

/**
 * Icon picker: a row of quick icons plus a "+" that opens the Library
 * popover (Upload Image, search, icon grid).
 *
 * @param value        current value (see LibraryIcon)
 * @param onChange     called with the new value
 * @param quickIcons   icon names shown in the row (defaults to a short list)
 * @param shop, accessToken, apiUrl   needed for "Upload Image"
 */
export default function IconLibrary({
  value,
  onChange,
  quickIcons = DEFAULT_QUICK_ICONS,
  shop,
  accessToken,
  apiUrl,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? ICON_LIBRARY.filter((i) => i.label.toLowerCase().includes(q))
      : ICON_LIBRARY;
  }, [search]);

  // quick row = defaults, plus the current pick when it is not one of them
  const rowItems = useMemo(() => {
    const items = quickIcons
      .map((name) => byName[name])
      .filter(Boolean)
      .map((i) => ({ key: i.name, value: { type: "icon", name: i.name }, item: i }));
    if (value && !items.some((i) => sameValue(i.value, value))) {
      items.unshift({
        key: "current",
        value,
        item: value.type === "icon" ? byName[value.name] : null,
      });
    }
    return items;
  }, [quickIcons, value]);

  const pick = (next) => {
    onChange(next);
    setOpen(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      setUploading(true);
      const data = await uploadImage(apiUrl, file, shop, accessToken);
      if (!data?.imageUrl) throw new Error("imageUrl missing in response");
      pick({ type: "image", url: data.imageUrl });
    } catch (err) {
      console.error("Icon upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const activator = (
    <button
      type="button"
      aria-label="Open icon library"
      onClick={() => setOpen((v) => !v)}
      style={{ ...iconButtonStyle(open), border: "1px dashed #8a8a8a" }}
    >
      <Icon source={PlusIcon} />
    </button>
  );

  return (
    <InlineStack gap="200" blockAlign="center">
      {rowItems.map(({ key, value: v, item }) => (
        <button
          key={key}
          type="button"
          title={item?.label}
          aria-label={item?.label || "Selected icon"}
          onClick={() => onChange(v)}
          onDoubleClick={() => onChange(null)}
          style={iconButtonStyle(sameValue(v, value))}
        >
          <LibraryIcon value={v} size={20} />
        </button>
      ))}

      <Popover
        active={open}
        activator={activator}
        onClose={() => setOpen(false)}
        preferredAlignment="left"
      >
        <Box padding="300" minWidth="340px">
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h4" variant="headingSm">
                Library
              </Text>
              <Button
                size="slim"
                icon={ImageIcon}
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                Upload Image
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFile}
              />
            </InlineStack>

            <TextField
              label="Search icons"
              labelHidden
              placeholder="Search icons..."
              value={search}
              onChange={setSearch}
              autoComplete="off"
              prefix={<Icon source={SearchIcon} />}
              clearButton
              onClearButtonClick={() => setSearch("")}
            />

            {error && (
              <Text as="p" variant="bodySm" tone="critical">
                {error}
              </Text>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 4,
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {filtered.map((i) => {
                const selected = sameValue(value, { type: "icon", name: i.name });
                return (
                  <button
                    key={i.name}
                    type="button"
                    onClick={() => pick({ type: "icon", name: i.name })}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 4px",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: selected ? "#f1f1f1" : "transparent",
                    }}
                  >
                    <span style={{ display: "inline-flex", width: 20, height: 20 }}>
                      <Icon source={i.source} />
                    </span>
                    <Text as="span" variant="bodyXs" tone="subdued" truncate>
                      {i.label}
                    </Text>
                  </button>
                );
              })}
              {!filtered.length && (
                <div style={{ gridColumn: "1 / -1", padding: 16, textAlign: "center" }}>
                  <Text as="p" tone="subdued">
                    No icons found
                  </Text>
                </div>
              )}
            </div>

            {uploading && (
              <InlineStack align="center">
                <Spinner size="small" />
              </InlineStack>
            )}
          </BlockStack>
        </Box>
      </Popover>
    </InlineStack>
  );
}
