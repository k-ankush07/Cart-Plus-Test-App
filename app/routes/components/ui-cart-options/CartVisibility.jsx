import { useEffect, useMemo, useState } from "react";
import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Icon,
  InlineGrid,
  InlineStack,
  Modal,
  RadioButton,
  Select,
  Spinner,
  Tag,
  Text,
  TextField,
} from "@shopify/polaris";
import { CalendarIcon, ClockIcon, GlobeIcon, CalendarTimeIcon } from "@shopify/polaris-icons";

import {
  MARKET_MODES,
  getVisibility,
  patchVisibility,
  timezoneOptions,
} from "../utils/cartVisibility";
import { useAuthenticatedFetch } from "../utils/useAuthenticatedFetch";
import "../../../index.css";

const SectionTitle = ({ icon, children }) => (
  <InlineStack gap="200" blockAlign="center">
    <span style={{ display: "inline-flex", width: 20, height: 20 }}>
      <Icon source={icon} />
    </span>
    <Text variant="headingSm" as="h3">
      {children}
    </Text>
  </InlineStack>
);

export default function CartVisibility({ cartSettings, handleChange }) {
  const s = getVisibility(cartSettings);
  const update = (patch) => handleChange("cartSettings", patchVisibility(patch));

  const zones = useMemo(() => timezoneOptions(), []);
  const authenticatedFetch = useAuthenticatedFetch();

  // the store's Shopify Markets
  const [marketList, setMarketList] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [marketsError, setMarketsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authenticatedFetch("/shopify/markets");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
        if (!cancelled) setMarketList(data.markets || []);
      } catch (err) {
        console.error("Failed to load markets:", err);
        if (!cancelled) setMarketsError("Couldn't load your markets. Please try again.");
      } finally {
        if (!cancelled) setMarketsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState([]);

  const needsMarkets = s.marketMode !== "all";
  const actionLabel = s.marketMode === "except" ? "Exclude markets" : "Add markets";
  const labelOf = (id) => marketList.find((m) => m.id === id)?.name || "Unknown market";

  const openPicker = () => {
    setDraft(s.markets);
    setPickerOpen(true);
  };
  const toggleDraft = (id) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  const scheduling = s.publishMode === "schedule";

  return (
    <div className="mainContent">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <SectionTitle icon={GlobeIcon}>Cart markets</SectionTitle>

            <InlineGrid columns={2} gap="200">
              {MARKET_MODES.map((m) => (
                <RadioButton
                  key={m.value}
                  label={m.label}
                  checked={s.marketMode === m.value}
                  onChange={() => update({ marketMode: m.value })}
                />
              ))}
            </InlineGrid>

            {needsMarkets && (
              <BlockStack gap="200">
                <Button fullWidth onClick={openPicker}>
                  {actionLabel}
                </Button>
                {s.markets.length > 0 && (
                  <InlineStack gap="200">
                    {s.markets.map((id) => (
                      <Tag
                        key={id}
                        onRemove={() => update({ markets: s.markets.filter((x) => x !== id) })}
                      >
                        {labelOf(id)}
                      </Tag>
                    ))}
                  </InlineStack>
                )}
                {s.markets.length === 0 && (
                  <Text tone="subdued" variant="bodySm">
                    Select at least one market. Until then, this cart shows in all markets.
                  </Text>
                )}
              </BlockStack>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <SectionTitle icon={CalendarTimeIcon}>Publish cart</SectionTitle>

            <InlineStack gap="400">
              <RadioButton
                label="Immediately"
                checked={!scheduling}
                onChange={() => update({ publishMode: "immediately" })}
              />
              <RadioButton
                label="Schedule"
                checked={scheduling}
                onChange={() => update({ publishMode: "schedule" })}
              />
            </InlineStack>

            {scheduling && (
              <BlockStack gap="300">
                <Select
                  label="Timezone"
                  options={zones}
                  value={s.timezone}
                  onChange={(val) => update({ timezone: val })}
                />

                <InlineGrid columns={2} gap="300">
                  <TextField
                    label="Start date"
                    type="date"
                    value={s.startDate}
                    prefix={<Icon source={CalendarIcon} />}
                    onChange={(val) => update({ startDate: val })}
                    autoComplete="off"
                  />
                  <TextField
                    label="Start time"
                    type="time"
                    value={s.startTime}
                    prefix={<Icon source={ClockIcon} />}
                    onChange={(val) => update({ startTime: val })}
                    autoComplete="off"
                  />
                </InlineGrid>

                <Checkbox
                  label="Schedule end date"
                  checked={s.endEnabled}
                  onChange={(val) => update({ endEnabled: val })}
                />

                {s.endEnabled && (
                  <InlineGrid columns={2} gap="300">
                    <TextField
                      label="End date"
                      type="date"
                      value={s.endDate}
                      min={s.startDate || undefined}
                      prefix={<Icon source={CalendarIcon} />}
                      onChange={(val) => update({ endDate: val })}
                      autoComplete="off"
                    />
                    <TextField
                      label="End time"
                      type="time"
                      value={s.endTime}
                      prefix={<Icon source={ClockIcon} />}
                      onChange={(val) => update({ endTime: val })}
                      autoComplete="off"
                    />
                  </InlineGrid>
                )}

                {!s.startDate && (
                  <Banner tone="warning">
                    Pick a start date, or the schedule is ignored and the cart shows right away.
                  </Banner>
                )}
              </BlockStack>
            )}
          </BlockStack>
        </Card>
      </BlockStack>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={actionLabel === "Exclude markets" ? "Exclude markets" : "Add markets"}
        primaryAction={{
          content: "Done",
          disabled: draft.length === 0,
          onAction: () => {
            update({ markets: draft });
            setPickerOpen(false);
          },
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setPickerOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            {marketsLoading && (
              <InlineStack align="center">
                <Spinner size="small" />
              </InlineStack>
            )}
            {marketsError && <Text tone="critical">{marketsError}</Text>}
            {!marketsLoading && !marketsError && marketList.length === 0 && (
              <Text tone="subdued">No markets found in this store.</Text>
            )}
            {marketList.map((m) => (
              <Checkbox
                key={m.id}
                label={m.status && m.status !== "ACTIVE" ? `${m.name} (${m.status.toLowerCase()})` : m.name}
                checked={draft.includes(m.id)}
                onChange={() => toggleDraft(m.id)}
              />
            ))}
            <Text tone="caution" variant="bodySm">
              Keep at least one market ticked — to show this cart everywhere, choose All markets instead.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </div>
  );
}
