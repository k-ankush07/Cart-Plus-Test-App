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
  StarFilledIcon,
  PackageIcon,
  CashDollarIcon,
  CreditCardIcon,
  ConfettiIcon,
  ThumbsUpIcon,
  LightbulbIcon,
  TargetIcon,
  SmileyHappyIcon,
  OrderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  QuestionCircleIcon,
  LinkIcon,
  ViewIcon,
  MenuIcon,
  ChevronRightIcon,
} from "@shopify/polaris-icons";
import { uploadImage } from "../../../services/apiRoutes";

const BoltIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path d="M11.6 1.5 4.2 11.2h4.4l-1 7.3 8.2-10.2h-4.6z" />
  </svg>
);

const HourglassIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path
      fillRule="evenodd"
      d="M5 2h10v3.2L11.6 10l3.4 4.8V18H5v-3.2L8.4 10 5 5.2zm2 2v.6L10 8.9l3-4.3V4zm3 7.1-3 4.3V16h6v-.6z"
    />
  </svg>
);

const CrownIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path d="M2.5 15.5 1.5 6l4.3 3.4L10 3l4.2 6.4L18.5 6l-1 9.5zm1.2 1h12.6v1.5H3.7z" />
  </svg>
);

const FireIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path d="M10.6 1.5c.3 2.4-.7 3.9-2 5.3-1.4 1.5-2.7 3-2.7 5.1a4.1 4.1 0 0 0 8.2 0c0-1-.3-1.9-.8-2.7-.2 1-.7 1.6-1.4 1.9.5-2.6-.1-6.1-1.3-9.6ZM10 18.5a3 3 0 0 1-3-3c0-1.4 1-2.3 2-3.4.5.9 2.1 1.4 3 2.7.1 3.1-1 3.7-2 3.7Z" />
  </svg>
);

const PercentIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path
      fillRule="evenodd"
      d="M14.7 4.3a.75.75 0 0 1 0 1.06l-9.34 9.34a.75.75 0 1 1-1.06-1.06l9.34-9.34a.75.75 0 0 1 1.06 0ZM6 4.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm8 7.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z"
    />
  </svg>
);

const SparkleIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path d="M8 2.5 9.4 7 14 8.5 9.4 10 8 14.5 6.6 10 2 8.5 6.6 7zm7 7 .8 2.4 2.4.8-2.4.8L15 16l-.8-2.5-2.4-.8 2.4-.8z" />
  </svg>
);

const TrophyIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path d="M5 2.5h10v1.8h2.5V7c0 1.7-1.3 3-3 3h-.3A4.5 4.5 0 0 1 11 12.4V15h2.5v1.5h-7V15H9v-2.6A4.5 4.5 0 0 1 5.8 10h-.3c-1.7 0-3-1.3-3-3V4.3H5zm-1 3.3V7c0 .8.6 1.5 1.3 1.5V5.8zm10.7 0v2.7c.7 0 1.3-.7 1.3-1.5V5.8z" />
  </svg>
);

const TruckFastIcon = (props) => (
  <svg viewBox="0 0 20 20" {...props}>
    <path d="M1 5h10v8H1zm10 2.5h3.5L18 10.5V13h-7zM5 14.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm9 0a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z" />
  </svg>
);

export const ICON_LIBRARY = [
  { name: "bolt", label: "Bolt", source: BoltIcon },
  { name: "hourglass", label: "Hourglass", source: HourglassIcon },
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
    { name: "crown", label: "Crown", source: CrownIcon },
  { name: "fire", label: "Fire", source: FireIcon },
  { name: "percent", label: "Percent", source: PercentIcon },
  { name: "sparkle", label: "Sparkle", source: SparkleIcon },
  { name: "trophy", label: "Trophy", source: TrophyIcon },
  { name: "truck", label: "Fast truck", source: TruckFastIcon },
  { name: "star-filled", label: "Star filled", source: StarFilledIcon },
  { name: "package", label: "Package", source: PackageIcon },
  { name: "cash", label: "Cash", source: CashDollarIcon },
  { name: "card", label: "Credit card", source: CreditCardIcon },
  { name: "confetti", label: "Confetti", source: ConfettiIcon },
  { name: "thumbs-up", label: "Thumbs up", source: ThumbsUpIcon },
  { name: "idea", label: "Idea", source: LightbulbIcon },
  { name: "target", label: "Target", source: TargetIcon },
  { name: "smile", label: "Smile", source: SmileyHappyIcon },
  { name: "order", label: "Order", source: OrderIcon },
  { name: "check-circle", label: "Check circle", source: CheckCircleIcon },
  { name: "alert", label: "Alert", source: AlertCircleIcon },
  { name: "help", label: "Help", source: QuestionCircleIcon },
  { name: "link", label: "Link", source: LinkIcon },
  { name: "view", label: "View", source: ViewIcon },
  { name: "menu", label: "Menu", source: MenuIcon },
  { name: "chevron-right", label: "Chevron right", source: ChevronRightIcon },
];

const DEFAULT_QUICK_ICONS = [
  "star",
  "heart",
  "right",
  "gift",
  "discount",
  "delivery",
  "megaphone",
  "cart",
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
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
        }}
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
      .map((i) => ({
        key: i.name,
        value: { type: "icon", name: i.name },
        item: i,
      }));
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
                const selected = sameValue(value, {
                  type: "icon",
                  name: i.name,
                });
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
                    <span
                      style={{ display: "inline-flex", width: 20, height: 20 }}
                    >
                      <Icon source={i.source} />
                    </span>
                    <Text as="span" variant="bodyXs" tone="subdued" truncate>
                      {i.label}
                    </Text>
                  </button>
                );
              })}
              {!filtered.length && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: 16,
                    textAlign: "center",
                  }}
                >
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
