import React, { useMemo, useState } from 'react'
import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Modal,
  RadioButton,
  RangeSlider,
  Text,
  Tooltip,
} from '@shopify/polaris'
import { PlusCircleIcon, SettingsIcon, XSmallIcon } from '@shopify/polaris-icons'

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const ALL_IDS = ['A', 'B', 'C', 'D', 'E']
const MIN_VARIANTS = 2
const MAX_VARIANTS = ALL_IDS.length

// Polaris design tokens, so the colors follow your theme.
const SEGMENT_COLORS = [
  'var(--p-color-bg-fill-inverse)',
  'var(--p-color-bg-fill-info)',
  'var(--p-color-bg-fill-success)',
  'var(--p-color-bg-fill-caution)',
  'var(--p-color-bg-fill-magic)',
]
const colorOf = (id) => SEGMENT_COLORS[ALL_IDS.indexOf(id)]

const sum = (obj, ids) => ids.reduce((t, id) => t + (obj[id] || 0), 0)

/** Equal split that always totals 100 (remainder goes to the first variants). */
function evenWeights(ids) {
  const base = Math.floor(100 / ids.length)
  let rem = 100 - base * ids.length
  return Object.fromEntries(ids.map((id) => [id, base + (rem-- > 0 ? 1 : 0)]))
}

/** Scale weights so they total exactly 100. */
function normalize(weights, ids) {
  const total = sum(weights, ids)
  if (total === 0) return evenWeights(ids)
  const out = {}
  let assigned = 0
  ids.forEach((id) => {
    out[id] = Math.floor(((weights[id] || 0) / total) * 100)
    assigned += out[id]
  })
  out[ids[0]] += 100 - assigned
  return out
}

/** Set one variant's share; the others absorb the change proportionally. */
function setWeight(weights, ids, id, raw) {
  const others = ids.filter((i) => i !== id)
  if (!others.length) return { [id]: 100 }
  const value = Math.min(100, Math.max(0, Math.round(raw)))
  const rest = 100 - value
  const othersTotal = sum(weights, others)
  const out = { [id]: value }
  let assigned = 0
  others.forEach((o, idx) => {
    if (idx === others.length - 1) {
      out[o] = rest - assigned
    } else {
      const share = Math.floor(
        othersTotal > 0 ? ((weights[o] || 0) / othersTotal) * rest : rest / others.length
      )
      out[o] = share
      assigned += share
    }
  })
  return out
}

const DEFAULT_VALUE = {
  enabled: false,
  variants: ['A', 'B'],
  activeVariant: 'A',
  allocation: 'even', // 'even' | 'custom'
  weights: { A: 50, B: 50 }, // only used when allocation === 'custom'
}

/* ------------------------------------------------------------------ */
/* Settings modal                                                      */
/* ------------------------------------------------------------------ */

function SettingsModal({ value, isNew, onApply, onCancel, onStop }) {
  // Everything is edited as a draft and only committed on Save / Apply.
  const [variants, setVariants] = useState(value.variants)
  const [allocation, setAllocation] = useState(value.allocation)
  const [weights, setWeights] = useState(
    value.allocation === 'custom' ? normalize(value.weights, value.variants) : evenWeights(value.variants)
  )

  const shown = allocation === 'even' ? evenWeights(variants) : weights
  const canAdd = variants.length < MAX_VARIANTS
  const canRemove = variants.length > MIN_VARIANTS

  const chooseMode = (mode) => {
    // Start custom allocation from whatever is currently displayed.
    if (mode === 'custom' && allocation === 'even') setWeights(evenWeights(variants))
    setAllocation(mode)
  }

  const addVariant = () => {
    if (!canAdd) return
    const newId = ALL_IDS.find((id) => !variants.includes(id))
    const next = ALL_IDS.filter((id) => variants.includes(id) || id === newId)
    setWeights((w) => setWeight({ ...w, [newId]: 0 }, next, newId, 100 / next.length))
    setVariants(next)
  }

  const removeVariant = (id) => {
    if (!canRemove) return
    const next = variants.filter((v) => v !== id)
    setWeights((w) => {
      const { [id]: _removed, ...rest } = w
      return normalize(rest, next)
    })
    setVariants(next)
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="A/B test settings"
      primaryAction={{
        content: isNew ? 'Save' : 'Apply',
        onAction: () =>
          onApply({
            variants,
            allocation,
            weights: allocation === 'custom' ? normalize(weights, variants) : evenWeights(variants),
          }),
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onCancel }]}
      footer={
        isNew ? null : (
          <Button variant="plain" tone="critical" onClick={onStop}>
            Stop A/B test
          </Button>
        )
      }
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="h3" variant="headingSm">
            Traffic allocation
          </Text>

          <BlockStack gap="200">
            <RadioButton
              id="abt-even"
              name="abt-allocation"
              label="Even allocation"
              helpText="Traffic is split equally across all variants"
              checked={allocation === 'even'}
              onChange={() => chooseMode('even')}
            />
            <RadioButton
              id="abt-custom"
              name="abt-allocation"
              label="Custom allocation"
              helpText="Set a specific traffic percentage for each variant"
              checked={allocation === 'custom'}
              onChange={() => chooseMode('custom')}
            />
          </BlockStack>

          <Box
            padding="300"
            background="bg-surface-secondary"
            borderRadius="300"
            borderWidth="025"
            borderColor="border"
          >
            <BlockStack gap="300">
              {/* Segmented bar showing the split */}
              <div
                aria-hidden="true"
                style={{
                  display: 'flex',
                  height: 8,
                  borderRadius: 99,
                  overflow: 'hidden',
                  background: 'var(--p-color-bg-fill-disabled)',
                }}
              >
                {variants.map((id) => (
                  <div
                    key={id}
                    style={{ width: `${shown[id]}%`, background: colorOf(id), transition: 'width .15s' }}
                  />
                ))}
              </div>

              {variants.map((id) => (
                <InlineStack key={id} gap="300" blockAlign="center" wrap={false}>
                  <span
                    aria-hidden="true"
                    style={{ width: 10, height: 10, borderRadius: '50%', background: colorOf(id), flex: 'none' }}
                  />
                  <div style={{ width: 64, flex: 'none' }}>
                    <Text as="span" variant="bodyMd">
                      Variant {id}
                    </Text>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <RangeSlider
                      label={`Traffic for variant ${id}`}
                      labelHidden
                      min={0}
                      max={100}
                      step={1}
                      value={shown[id]}
                      disabled={allocation === 'even'}
                      onChange={(v) => setWeights((w) => setWeight(w, variants, id, Number(v)))}
                    />
                  </div>
                  <div style={{ width: 44, textAlign: 'right', flex: 'none' }}>
                    <Text as="span" variant="bodyMd" fontWeight="semibold" numeric>
                      {shown[id]}%
                    </Text>
                  </div>
                  <div style={{ width: 24, flex: 'none' }}>
                    {canRemove && (
                      <Button
                        size="micro"
                        variant="tertiary"
                        tone="critical"
                        icon={XSmallIcon}
                        accessibilityLabel={`Remove variant ${id}`}
                        onClick={() => removeVariant(id)}
                      />
                    )}
                  </div>
                </InlineStack>
              ))}

              <InlineStack>
                <Button icon={PlusCircleIcon} onClick={addVariant} disabled={!canAdd}>
                  {canAdd ? 'Add variant' : `Maximum ${MAX_VARIANTS} variants`}
                </Button>
              </InlineStack>
            </BlockStack>
          </Box>
        </BlockStack>
      </Modal.Section>
    </Modal>
  )
}

/** One variant tab. The remove (×) button only appears on hover or keyboard focus. */
function VariantTab({ id, active, canRemove, onSelect, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const showRemove = canRemove && (hovered || focused)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
      }}
    >
      <Button
        pressed={active}
        onClick={onSelect}
        accessibilityLabel={`Variant ${id}${active ? ' (selected)' : ''}`}
      >
        {id}
      </Button>
      {showRemove && (
        <div style={{ position: 'absolute', top: -10, right: -10, zIndex: 1 }}>
          <Button
            size="micro"
            variant="tertiary"
            tone="critical"
            icon={XSmallIcon}
            accessibilityLabel={`Remove variant ${id}`}
            onClick={onRemove}
          />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

/**
 * <ABTesting />   (render inside your Polaris <AppProvider>)
 *
 * Props (all optional):
 *  - defaultValue            initial state (see DEFAULT_VALUE)
 *  - onChange(state)         fires on every change to the test config
 *  - onActiveVariantChange(id)   user switched the variant being edited
 *  - onVariantAdd(newId, copiedFromId)  parent should clone settings from copiedFromId
 *  - onVariantRemove(id)     parent should discard that variant's settings
 *  - onRunTest() / onStopTest()
 */
export default function ABTesting({
  defaultValue = DEFAULT_VALUE,
  onChange,
  onActiveVariantChange,
  onVariantAdd,
  onVariantRemove,
  onRunTest,
  onStopTest,
}) {
  const [state, setState] = useState({ ...DEFAULT_VALUE, ...defaultValue })
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { enabled, variants, activeVariant } = state
  const canAdd = variants.length < MAX_VARIANTS
  const canRemove = variants.length > MIN_VARIANTS

  const update = (patch) => {
    const next = { ...state, ...patch }
    setState(next)
    onChange?.(next)
  }

  // Called by the settings modal. "Run A/B Test" opens it first; the test starts on Save.
  const commitSettings = (patch) => {
    const prev = state.variants
    const added = patch.variants.filter((v) => !prev.includes(v))
    const removed = prev.filter((v) => !patch.variants.includes(v))
    const nextActive = !enabled || !patch.variants.includes(activeVariant) ? patch.variants[0] : activeVariant

    update({ ...patch, enabled: true, activeVariant: nextActive })
    setSettingsOpen(false)

    removed.forEach((id) => onVariantRemove?.(id))
    added.forEach((id) => onVariantAdd?.(id, activeVariant)) // new variants start as a copy of the one being edited
    if (!enabled) onRunTest?.()
    if (nextActive !== activeVariant) onActiveVariantChange?.(nextActive)
  }

  const stopTest = () => {
    setSettingsOpen(false)
    update({ ...DEFAULT_VALUE })
    onStopTest?.()
  }

  const selectVariant = (id) => {
    if (id === activeVariant) return
    update({ activeVariant: id })
    onActiveVariantChange?.(id)
  }

  const addVariant = () => {
    if (!canAdd) return
    const newId = ALL_IDS.find((id) => !variants.includes(id))
    const nextVariants = ALL_IDS.filter((id) => variants.includes(id) || id === newId)
    const nextWeights =
      state.allocation === 'custom'
        ? setWeight({ ...state.weights, [newId]: 0 }, nextVariants, newId, 100 / nextVariants.length)
        : evenWeights(nextVariants)
    update({ variants: nextVariants, weights: nextWeights, activeVariant: newId })
    onVariantAdd?.(newId, activeVariant) // new variant starts as a copy of the one being edited
    onActiveVariantChange?.(newId)
  }

  const removeVariant = (id) => {
    if (!canRemove) return
    const nextVariants = variants.filter((v) => v !== id)
    const { [id]: _removed, ...rest } = state.weights
    const nextActive = activeVariant === id ? nextVariants[0] : activeVariant
    update({
      variants: nextVariants,
      weights: normalize(rest, nextVariants),
      activeVariant: nextActive,
    })
    onVariantRemove?.(id)
    if (nextActive !== activeVariant) onActiveVariantChange?.(nextActive)
  }

  const summary = useMemo(() => {
    const w = state.allocation === 'even' ? evenWeights(variants) : normalize(state.weights, variants)
    return variants.map((id) => `${id} ${w[id]}%`).join(' · ')
  }, [state.allocation, state.weights, variants])

  if (!enabled) {
    return (
      <>
        <Button onClick={() => setSettingsOpen(true)}>Run A/B Test</Button>
        {settingsOpen && (
          <SettingsModal
            isNew
            value={state}
            onCancel={() => setSettingsOpen(false)}
            onApply={commitSettings}
          />
        )}
      </>
    )
  }

  return (
    <>
      <InlineStack gap="300" blockAlign="start" wrap={false}>
        <Tooltip content={`Traffic split: ${summary}`}>
          <InlineStack gap="200" wrap={false} role="group" aria-label="Variants">
            {variants.map((id) => (
              <VariantTab
                key={id}
                id={id}
                active={id === activeVariant}
                canRemove={canRemove}
                onSelect={() => selectVariant(id)}
                onRemove={() => removeVariant(id)}
              />
            ))}
          </InlineStack>
        </Tooltip>

        <BlockStack gap="050" inlineAlign="center">
          <Button
            icon={PlusCircleIcon}
            disabled={!canAdd}
            onClick={addVariant}
            accessibilityLabel="Add variant"
          />
          <Text as="span" variant="bodyXs" tone="subdued">
            Add variant
          </Text>
        </BlockStack>

        <BlockStack gap="050" inlineAlign="center">
          <Button
            icon={SettingsIcon}
            onClick={() => setSettingsOpen(true)}
            accessibilityLabel="A/B test settings"
          />
          <Text as="span" variant="bodyXs" tone="subdued">
            Settings
          </Text>
        </BlockStack>
      </InlineStack>

      {settingsOpen && (
        <SettingsModal
          value={state}
          onCancel={() => setSettingsOpen(false)}
          onStop={stopTest}
          onApply={commitSettings}
        />
      )}
    </>
  )
}