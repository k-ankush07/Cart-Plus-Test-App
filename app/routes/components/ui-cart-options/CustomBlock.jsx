import { useEffect, useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Modal,
  RadioButton,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import {
  DeleteIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "@shopify/polaris-icons";
import {
  CUSTOM_BLOCK_LABEL,
  CUSTOM_BLOCK_MAX_LENGTH,
  getCustomBlocks,
  patchCustomBlock,
  removeCustomBlock,
} from "../utils/customBlocks";
import { LIBRARY_TEMPLATES } from "../utils/libraryTemplates";

const PLACEHOLDERS = {
  html: "Add the custom code",
  css: "Add the custom CSS",
};

export default function CustomBlock({
  blockId,
  cartSettings,
  handleChange,
  onDeleted,
}) {
  const block = getCustomBlocks(cartSettings).find((b) => b.id === blockId);
  const [Editor, setEditor] = useState(null);
  const [dark, setDark] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  // template opened with "Edit" in the library, tweaked before it is applied to the block
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingCode, setEditingCode] = useState("");

  useEffect(() => {
    import("@monaco-editor/react").then((mod) => setEditor(() => mod.default));
  }, []);

  // widens the library modal (see .library-modal-open in index.css); kept above the early return
  useEffect(() => {
    document.body.classList.toggle("library-modal-open", libraryOpen);
    return () => document.body.classList.remove("library-modal-open");
  }, [libraryOpen]);

  if (!block) return null;

  const patch = (p) =>
    handleChange("cartSettings", patchCustomBlock(blockId, p));
  const code = block.code || "";

  const handleSelectTemplate = (template, templateCode = template.code) => {
    patch({
      code: templateCode.slice(0, CUSTOM_BLOCK_MAX_LENGTH),
      label: template.title,
      type: template.type || "html",
    });
    setEditingTemplate(null);
    setLibraryOpen(false);
  };

  const filteredTemplates = LIBRARY_TEMPLATES.filter((tpl) => {
    const matchesSearch = tpl.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || tpl.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { label: "All", value: "all" },
    { label: "Social Proof", value: "social-proof" },
    { label: "Reviews", value: "reviews" },
    { label: "Trust Badges", value: "trust" },
    { label: "Sales & Offers", value: "sales" },
    { label: "Coupons", value: "coupons" },
    { label: "Features", value: "features" },
  ];

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            {CUSTOM_BLOCK_LABEL}
          </Text>

          <BlockStack gap="200">
            <Text variant="bodyMd" fontWeight="medium">
              Type
            </Text>
            <InlineStack gap="600">
              <RadioButton
                label="Liquid / Html"
                checked={block.type !== "css"}
                onChange={() => patch({ type: "html" })}
              />
              <RadioButton
                label="CSS / Animation"
                checked={block.type === "css"}
                onChange={() => patch({ type: "css" })}
              />
            </InlineStack>
          </BlockStack>

          <TextField
            label="Label"
            value={block.label || ""}
            onChange={(label) => patch({ label })}
            placeholder="Social Proof"
            autoComplete="off"
          />

          <InlineStack align="space-between" blockAlign="center">
            <Button onClick={() => setLibraryOpen(true)}>
              📚 See our Library
            </Button>
            <ButtonGroupToggle dark={dark} setDark={setDark} />
          </InlineStack>

          <div
            style={{
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid var(--p-color-border, #c9cccf)",
            }}
          >
            {Editor ? (
              <Editor
                height={380}
                language={block.type === "css" ? "css" : "html"}
                value={code}
                onChange={(val) =>
                  patch({ code: (val || "").slice(0, CUSTOM_BLOCK_MAX_LENGTH) })
                }
                theme={dark ? "vs-dark" : "vs"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  fontFamily: 'Consolas, "Courier New", monospace',
                }}
              />
            ) : (
              <Box padding="400">
                <Text tone="subdued">Loading editor...</Text>
              </Box>
            )}
            {Editor && !code && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 64,
                  lineHeight: "19px",
                  fontFamily: "Consolas, monospace",
                  fontSize: 13,
                  color: "#888",
                  pointerEvents: "none",
                }}
              >
                {PLACEHOLDERS[block.type === "css" ? "css" : "html"]}
              </div>
            )}
          </div>

          <Text variant="bodySm" tone="subdued">
            {code.length} / {CUSTOM_BLOCK_MAX_LENGTH}
          </Text>

          <Button
            fullWidth
            tone="critical"
            icon={DeleteIcon}
            onClick={() => {
              handleChange("cartSettings", removeCustomBlock(blockId));
              onDeleted?.();
            }}
          >
            Delete
          </Button>
        </BlockStack>
      </Card>

      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Select from the custom liquid library"
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="400">
            <InlineStack gap="300" wrap={false} blockAlign="center">
              <div style={{ flex: 1 }}>
                <TextField
                  label="Search templates"
                  labelHidden
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search templates..."
                  prefix={<SearchIcon />}
                  autoComplete="off"
                  clearButton
                  onClearButtonClick={() => setSearchQuery("")}
                />
              </div>
              <div style={{ minWidth: 200 }}>
                <Select
                  label="Search by"
                  labelInline
                  options={categoryOptions}
                  value={filterCategory}
                  onChange={setFilterCategory}
                />
              </div>
            </InlineStack>

            {filteredTemplates.length === 0 ? (
              <Box padding="600">
                <Text alignment="center" tone="subdued">
                  No templates found matching your search.
                </Text>
              </Box>
            ) : (
              <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
                {filteredTemplates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    onSelect={() => handleSelectTemplate(tpl)}
                    onEdit={() => {
                      setEditingTemplate(tpl);
                      setEditingCode(tpl.code);
                    }}
                  />
                ))}
              </InlineGrid>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title="Customize template"
        size="large"
        primaryAction={{
          content: "Apply to block",
          onAction: () => handleSelectTemplate(editingTemplate, editingCode),
        }}
        secondaryActions={[
          { content: "Go Back", onAction: () => setEditingTemplate(null) },
        ]}
      >
        <Modal.Section>
          <div
            style={{
              border: "1px solid var(--p-color-border, #c9cccf)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {Editor ? (
              <Editor
                height={480}
                language={editingTemplate?.type === "css" ? "css" : "html"}
                value={editingCode}
                onChange={(val) => setEditingCode(val || "")}
                theme="vs"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  fontFamily: 'Consolas, "Courier New", monospace',
                }}
              />
            ) : (
              <Box padding="400">
                <Text tone="subdued">Loading editor...</Text>
              </Box>
            )}
          </div>
        </Modal.Section>
      </Modal>
    </>
  );
}

function TemplateCard({ template, onSelect, onEdit }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e3e3e3",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <Text variant="headingSm" as="h6" fontWeight="semibold">
        {template.title}
      </Text>

      {/* preview is centred in a fixed-height grey box, like the reference library */}
      <div
        style={{
          background: "#f7f7f7",
          borderRadius: 8,
          height: 180,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            maxHeight: "100%",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
          }}
          dangerouslySetInnerHTML={{
            __html: template.preview || template.code,
          }}
        />
      </div>

      <InlineGrid columns={2} gap="200">
        <Button variant="primary" fullWidth onClick={onSelect}>
          Select
        </Button>
        <Button fullWidth onClick={onEdit}>
          Edit
        </Button>
      </InlineGrid>
    </div>
  );
}

function ButtonGroupToggle({ dark, setDark }) {
  return (
    <InlineStack gap="100">
      <Button
        size="slim"
        pressed={dark}
        icon={MoonIcon}
        accessibilityLabel="Dark editor"
        onClick={() => setDark(true)}
      />
      <Button
        size="slim"
        pressed={!dark}
        icon={SunIcon}
        accessibilityLabel="Light editor"
        onClick={() => setDark(false)}
      />
    </InlineStack>
  );
}
