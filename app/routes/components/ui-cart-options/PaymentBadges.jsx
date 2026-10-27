import { useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  DropZone,
  Icon,
  InlineGrid,
  InlineStack,
  Modal,
  Popover,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DragHandleIcon,
  PlusIcon,
  PaymentIcon,
  SearchIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  XIcon,
} from "@shopify/polaris-icons";

import BackgroundInput from "../ui/BackgroundInput";
import { BadgeIcon, TRUST_ICONS, TrustIcon } from "../cart-Items/PaymentBadges";
import { uploadImage } from "../../../services/apiRoutes";
import {
  BADGE_LIBRARY,
  SHOW_OPTIONS,
  getPaymentBadges,
  newTrustBadge,
  patchPaymentBadges,
  resolveBadge,
} from "../utils/paymentBadges";
import "../../../index.css";

const ALIGN_BUTTONS = [
  { value: "left", icon: TextAlignLeftIcon, label: "Align left" },
  { value: "center", icon: TextAlignCenterIcon, label: "Align center" },
  { value: "right", icon: TextAlignRightIcon, label: "Align right" },
];

const MAX_TRUST_BADGES = 6;

// one editable trust badge: icon picker + text + move / remove
function TrustRow({ badge, index, count, onChange, onMove, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <InlineStack gap="200" blockAlign="center" wrap={false}>
      <Popover
        active={pickerOpen}
        onClose={() => setPickerOpen(false)}
        activator={
          <Button
            icon={<TrustIcon name={badge.icon} size={20} />}
            accessibilityLabel="Choose icon"
            onClick={() => setPickerOpen((v) => !v)}
          />
        }
      >
        <Box padding="200">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 36px)", gap: 6 }}>
            {TRUST_ICONS.map(({ key }) => (
              <button
                key={key}
                type="button"
                aria-label={key}
                aria-pressed={badge.icon === key}
                onClick={() => {
                  onChange({ icon: key });
                  setPickerOpen(false);
                }}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: badge.icon === key ? "2px solid #303030" : "1px solid #e3e3e3",
                  boxSizing: "border-box",
                }}
              >
                <TrustIcon name={key} size={18} />
              </button>
            ))}
          </div>
        </Box>
      </Popover>
      <div style={{ flex: 1 }}>
        <TextField
          label="Badge text"
          labelHidden
          value={badge.text}
          onChange={(text) => onChange({ text })}
          autoComplete="off"
        />
      </div>
      <Button
        variant="plain"
        icon={ArrowUpIcon}
        accessibilityLabel="Move up"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      />
      <Button
        variant="plain"
        icon={ArrowDownIcon}
        accessibilityLabel="Move down"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      />
      <Button variant="plain" tone="critical" icon={XIcon} accessibilityLabel="Remove badge" onClick={onRemove} />
    </InlineStack>
  );
}

export default function PaymentBadges({ cartSettings, handleChange, shop, accessToken, apiUrl }) {
  const s = getPaymentBadges(cartSettings);
  const update = (patch) => handleChange("cartSettings", patchPaymentBadges(patch));

  const [open, setOpen] = useState(false);
  // edits stay in a draft until "Save changes"
  const [draft, setDraft] = useState({ badges: [], custom: [] });
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const openModal = () => {
    setDraft({ badges: s.badges, custom: s.custom });
    setQuery("");
    setError("");
    setOpen(true);
  };

  const draftSettings = { custom: draft.custom };
  const selected = draft.badges.map((id) => resolveBadge(draftSettings, id)).filter(Boolean);

  const toggleBadge = (id) =>
    setDraft((d) => ({
      ...d,
      badges: d.badges.includes(id) ? d.badges.filter((x) => x !== id) : [...d.badges, id],
    }));

  // drop `fromId` where `toId` is
  const moveBadge = (fromId, toId) => {
    if (!fromId || fromId === toId) return;
    setDraft((d) => {
      const from = d.badges.indexOf(fromId);
      const to = d.badges.indexOf(toId);
      if (from === -1 || to === -1) return d;
      const next = d.badges.filter((x) => x !== fromId);
      next.splice(to, 0, fromId);
      return { ...d, badges: next };
    });
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setError("");
    try {
      setUploading(true);
      const data = await uploadImage(apiUrl, file, shop, accessToken);
      if (!data?.imageUrl) throw new Error("imageUrl missing in response");
      const id = `custom-${Date.now()}`;
      const name = file.name.replace(/\.[^.]+$/, "") || "Custom badge";
      setDraft((d) => ({
        custom: [...d.custom, { id, name, image: data.imageUrl }],
        badges: [...d.badges, id],
      }));
    } catch (err) {
      console.error("Badge upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const q = query.trim().toLowerCase();
  const library = [...BADGE_LIBRARY, ...draft.custom].filter((b) =>
    (b.name || "").toLowerCase().includes(q),
  );
  const shown = s.badges.map((id) => resolveBadge(s, id)).filter(Boolean);

  const showPayment = s.show !== "trust";
  const showTrust = s.show !== "payment";

  const setTrust = (list) => update({ trustBadges: list });
  const changeTrust = (id, patch) =>
    setTrust(s.trustBadges.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const moveTrust = (index, dir) => {
    const next = [...s.trustBadges];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    setTrust(next);
  };

  return (
    <div className="mainContent">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack blockAlign="center" gap="100">
                <Box>
                  <Icon source={PaymentIcon} />
                </Box>
                <Text variant="headingMd" as="h2">
                  Payment Badges
                </Text>
              </InlineStack>
              <button
                type="button"
                role="switch"
                aria-checked={s.enabled}
                aria-label="Payment Badges"
                className={`sb-switch ${s.enabled ? "is-on" : ""}`}
                onClick={() => update({ enabled: !s.enabled })}
              >
                <span className="sb-switch-knob" />
              </button>
            </InlineStack>

            <BlockStack gap="100">
              <Text variant="headingXs" tone="subdued">
                SHOW
              </Text>
              <ButtonGroup variant="segmented">
                {SHOW_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    size="slim"
                    pressed={s.show === o.value}
                    onClick={() => update({ show: o.value })}
                  >
                    {o.label}
                  </Button>
                ))}
              </ButtonGroup>
            </BlockStack>

            {showPayment && (
              <>
                <InlineStack gap="200">
                  {shown.map((b) => (
                    <BadgeIcon key={b.id} badge={b} height={36} />
                  ))}
                </InlineStack>

                <div>
                  <Button onClick={openModal}>Add payment badges</Button>
                </div>
              </>
            )}
          </BlockStack>
        </Card>

        {showTrust && (
          <Card>
            <BlockStack gap="300">
              <Text variant="headingXs" tone="subdued">
                BADGES
              </Text>
              {s.trustBadges.map((t, i) => (
                <TrustRow
                  key={t.id}
                  badge={t}
                  index={i}
                  count={s.trustBadges.length}
                  onChange={(patch) => changeTrust(t.id, patch)}
                  onMove={(dir) => moveTrust(i, dir)}
                  onRemove={() => setTrust(s.trustBadges.filter((x) => x.id !== t.id))}
                />
              ))}
              <div>
                <Button
                  icon={PlusIcon}
                  disabled={s.trustBadges.length >= MAX_TRUST_BADGES}
                  onClick={() => setTrust([...s.trustBadges, newTrustBadge()])}
                >
                  Add badge
                </Button>
              </div>
            </BlockStack>
          </Card>
        )}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingSm">Styles</Text>
            {showPayment && (
              <RangeSlider
                label="Icon size"
                value={s.size}
                min={16}
                max={56}
                output
                onChange={(val) => update({ size: val })}
              />
            )}
            <ButtonGroup variant="segmented" fullWidth>
              {ALIGN_BUTTONS.map((a) => (
                <Button
                  key={a.value}
                  icon={a.icon}
                  accessibilityLabel={a.label}
                  pressed={s.alignment === a.value}
                  onClick={() => update({ alignment: a.value })}
                />
              ))}
            </ButtonGroup>
          </BlockStack>
        </Card>

        <BackgroundInput
          title="Background"
          value={s.background || { type: "plain", color: "#ffffff" }}
          onChange={(val) => update({ background: val })}
        />
      </BlockStack>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="large"
        title="Edit payment badges"
        primaryAction={{
          content: "Save changes",
          onAction: () => {
            update({ badges: draft.badges, custom: draft.custom });
            setOpen(false);
          },
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setOpen(false) }]}
      >
        <Modal.Section>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="500">
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingXs" tone="subdued">
                  SHOWN IN YOUR CART
                </Text>
                <Text tone="subdued">{selected.length} selected</Text>
              </InlineStack>

              <div style={{ border: "1px solid #e3e3e3", borderRadius: 8 }}>
                {selected.length === 0 && (
                  <Box padding="400">
                    <Text tone="subdued">No badges selected.</Text>
                  </Box>
                )}
                {selected.map((b) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={() => setDragId(b.id)}
                    onDragOver={(e) => dragId && e.preventDefault()}
                    onDrop={() => {
                      moveBadge(dragId, b.id);
                      setDragId(null);
                    }}
                    onDragEnd={() => setDragId(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderBottom: "1px solid #f1f1f1",
                      opacity: dragId === b.id ? 0.4 : 1,
                    }}
                  >
                    <span style={{ cursor: "grab", display: "inline-flex" }}>
                      <Icon source={DragHandleIcon} tone="subdued" />
                    </span>
                    <BadgeIcon badge={b} height={28} />
                    <span style={{ flex: 1, fontWeight: 500 }}>{b.name}</span>
                    <Button
                      variant="plain"
                      tone="critical"
                      icon={XIcon}
                      accessibilityLabel={`Remove ${b.name}`}
                      onClick={() => toggleBadge(b.id)}
                    />
                  </div>
                ))}
              </div>

              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingXs" tone="subdued">
                  BADGE LIBRARY
                </Text>
                <DropZone
                  accept="image/*"
                  type="image"
                  allowMultiple={false}
                  disabled={uploading}
                  onDrop={(_, files) => handleUpload(files[0])}
                  variableHeight
                >
                  <Button loading={uploading} size="slim">
                    Upload Image
                  </Button>
                </DropZone>
              </InlineStack>
              {error && <Text tone="critical">{error}</Text>}

              <TextField
                label="Search"
                labelHidden
                placeholder="Search for a brand..."
                prefix={<Icon source={SearchIcon} />}
                value={query}
                onChange={setQuery}
                autoComplete="off"
              />

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {library.map((b) => {
                  const on = draft.badges.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBadge(b.id)}
                      aria-pressed={on}
                      title={b.name}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        padding: 3,
                        borderRadius: 8,
                        border: on ? "2px solid #303030" : "2px solid transparent",
                      }}
                    >
                      <BadgeIcon badge={b} height={36} />
                    </button>
                  );
                })}
              </div>
            </BlockStack>

            <BlockStack gap="300">
              <Text variant="headingXs" tone="subdued">
                LIVE PREVIEW
              </Text>
              <div
                style={{
                  border: "1px solid #e3e3e3",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Text variant="headingMd">Your cart (2)</Text>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid #eee",
                    paddingTop: 10,
                    fontWeight: 600,
                  }}
                >
                  <span>Total</span>
                  <span>$7.00</span>
                </div>
                <div
                  style={{
                    background: "#1a56db",
                    color: "#fff",
                    textAlign: "center",
                    padding: "12px 0",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  Checkout · $7.00
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "center",
                  }}
                >
                  {selected.map((b) => (
                    <BadgeIcon key={b.id} badge={b} height={s.size} />
                  ))}
                </div>
              </div>
              <Text tone="subdued" variant="bodySm">
                Badges appear under the primary checkout button, in the exact order set on the left.
              </Text>
            </BlockStack>
          </InlineGrid>
        </Modal.Section>
      </Modal>
    </div>
  );
}
