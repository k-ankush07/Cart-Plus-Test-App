import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useLocation } from "react-router";
import {
  Page,
  Card,
  Text,
  Button,
  Badge,
  Modal,
  TextField,
  DropZone,
  Select,
  Popover,
  ActionList,
  BlockStack,
  InlineStack,
  Box,
  Banner,
  Thumbnail,
} from "@shopify/polaris";
import { ChevronUpIcon } from "@shopify/polaris-icons";
import { uploadImage } from ".././services/apiRoutes";
import { requireShopData } from "./components/shop.server";
import {
  getBoard,
  createFeature,
  voteFeature,
  setStatus,
  listComments,
  addComment,
  isAppOwner,
  connectDB,
} from "./components/featureBoard.server";

/* ───────────────────────────── Server ───────────────────────────── */

async function getContext(request) {
  await connectDB();
  const d = await requireShopData(request);
  const domain = d.shop?.myshopifyDomain;
  return {
    d,
    domain,
    name: d.shop?.name || domain,
    isOwner: isAppOwner(domain),
  };
}

export const loader = async ({ request }) => {
  const c = await getContext(request);

  const featureId = new URL(request.url).searchParams.get("featureId");
  if (featureId) {
    try {
      return json(await listComments(featureId));
    } catch (e) {
      return json(
        { comments: [], error: e.message },
        { status: e.status || 500 },
      );
    }
  }

  return json({
    features: await getBoard(c.domain),
    isOwner: c.isOwner,
    apiUrl: c.d.apiUrl,
    accessToken: c.d.accessToken,
    shop: { myshopifyDomain: c.domain },
  });
};

export const action = async ({ request }) => {
  const c = await getContext(request);
  const f = await request.formData();
  const intent = f.get("intent");
  const featureId = f.get("featureId");

  try {
    if (intent === "create") {
      await createFeature({
        shop: c.domain,
        shopName: c.name,
        title: f.get("title"),
        description: f.get("description"),
        imageUrl: f.get("imageUrl"),
      });
      return json({ ok: true });
    }
    if (intent === "vote") {
      await voteFeature(c.domain, featureId);
      return json({ ok: true });
    }
    if (intent === "status") {
      await setStatus(c.domain, featureId, f.get("status")); 
      return json({ ok: true });
    }
    if (intent === "comment") {
      const result = await addComment({
        shop: c.domain,
        shopName: c.name,
        featureId,
        body: f.get("body"),
        imageUrl: f.get("imageUrl"),
      });
      return json({ ok: true, ...result });
    }
    return json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return json(
      { error: e.message || "Something went wrong" },
      { status: e.status || 500 },
    );
  }
};

/* ───────────────────────────── UI ───────────────────────────── */

const COLUMNS = [
  { key: "pending", label: "Pending", icon: "👀", tone: undefined },
  { key: "approved", label: "Approved", icon: "👍", tone: "info" },
  { key: "in_progress", label: "In Progress", icon: "🛠️", tone: "attention" },
  { key: "done", label: "Done", icon: "✅", tone: "success" },
  { key: "rejected", label: "Rejected", icon: "❌", tone: "critical" },
];
const STATUS_OPTIONS = COLUMNS.map((c) => ({ label: c.label, value: c.key }));
const COL = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));
const PREVIEW_LEN = 110;
const MAX_FILE = 5 * 1024 * 1024;
const FILE_TYPES = "image/jpeg,image/jpg,image/png,image/svg+xml";

const fullImg = {
  width: "100%",
  maxHeight: 220,
  objectFit: "contain",
  background: "var(--p-color-bg-surface-secondary)",
  borderRadius: 8,
  display: "block",
};
const thumbImg = {
  width: 120,
  height: 120,
  objectFit: "cover",
  borderRadius: 8,
  display: "block",
};

const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso)) / 1000));
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, sec] of units) {
    if (s >= sec) {
      const n = Math.floor(s / sec);
      return `${n} ${name}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
};

const checkFile = (file) => {
  if (file.size > MAX_FILE) return "File must be 5MB or smaller.";
  if (!/\.(jpe?g|png|svg)$/i.test(file.name))
    return "Only .jpeg, .jpg, .png, .svg files are allowed.";
  return "";
};

const upload = async (ctx, file) => {
  if (!file) return "";
  const res = await uploadImage(ctx.apiUrl, file, ctx.shop, ctx.accessToken);
  return res?.url || res?.imageUrl || "";
};

function FilePreview({ file, onRemove }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) return setUrl("");
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <InlineStack gap="200" blockAlign="center" wrap={false}>
      {url && <Thumbnail source={url} alt={file.name} size="small" />}
      <Box minWidth="0" maxWidth="180px">
        <Text as="p" variant="bodySm" truncate>
          {file.name}
        </Text>
      </Box>
      <Button variant="plain" tone="critical" onClick={onRemove}>
        Remove
      </Button>
    </InlineStack>
  );
}

function AttachButton({ onPick, disabled }) {
  const ref = useRef(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={FILE_TYPES}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
      />
      <Button
        variant="plain"
        disabled={disabled}
        onClick={() => ref.current?.click()}
      >
        + Add attachment
      </Button>
    </>
  );
}

function VoteBox({ item, busy, onVote }) {
  return (
    <Box
      minWidth="56px"
      borderInlineStartWidth="025"
      borderColor="border"
      background={item.hasVoted ? "bg-surface-active" : "bg-surface"}
    >
      <BlockStack inlineAlign="center" align="center" gap="100">
        <div style={{ paddingTop: 12 }}>
          <Button
            variant="tertiary"
            icon={ChevronUpIcon}
            accessibilityLabel={item.hasVoted ? "You already voted" : "Upvote"}
            disabled={item.hasVoted || busy}
            onClick={() => onVote(item.id)}
          />
        </div>
        <Text as="span" variant="headingSm">
          {item.votes}
        </Text>
      </BlockStack>
    </Box>
  );
}

function FeatureCard({ item, isOwner, busy, onVote, onStatusChange, onOpen }) {
  const [open, setOpen] = useState(false);
  const desc = item.description || "";
  const long = desc.length > PREVIEW_LEN;
  const text =
    open || !long ? desc : desc.slice(0, PREVIEW_LEN).trimEnd() + "…";

  return (
    <Card padding="0">
      <InlineStack wrap={false} align="space-between" blockAlign="stretch">
        <Box padding="300" minWidth="0">
          <BlockStack gap="200">
            <Button
              variant="monochromePlain"
              textAlign="start"
              onClick={() => onOpen(item.id)}
            >
              {item.title}
            </Button>
            {desc && (
              <Text as="p" variant="bodySm" tone="subdued">
                {text}
              </Text>
            )}
            {long && (
              <div>
                <Button variant="plain" onClick={() => setOpen(!open)}>
                  {open ? "See less" : "See more"}
                </Button>
              </div>
            )}
            <Text as="p" variant="bodySm" tone="subdued">
              {item.commentsCount} comment{item.commentsCount === 1 ? "" : "s"}
            </Text>
            {isOwner && (
              <Select
                label="Status"
                labelHidden
                options={STATUS_OPTIONS}
                value={item.status}
                disabled={busy}
                onChange={(v) => onStatusChange(item.id, v)}
              />
            )}
          </BlockStack>
        </Box>
        <VoteBox item={item} busy={busy} onVote={onVote} />
      </InlineStack>
    </Card>
  );
}

function SuggestModal({ open, onClose, ctx }) {
  const fetcher = useFetcher();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [uploading, setUploading] = useState(false);

  const close = useCallback(() => {
    setTitle("");
    setDescription("");
    setFile(null);
    setError("");
    setSent(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (sent && fetcher.state === "idle" && fetcher.data?.ok) close();
  }, [fetcher.state, fetcher.data, sent, close]);

  const onDrop = useCallback((_a, accepted, rejected) => {
    if (rejected.length)
      return setError(
        "Only .jpeg, .jpg, .png, .svg files up to 5MB are allowed.",
      );
    const f = accepted[0];
    if (!f) return;
    const err = checkFile(f);
    setError(err);
    if (!err) setFile(f);
  }, []);

  const submit = async () => {
    setError("");
    setUploading(true);
    let imageUrl = "";
    try {
      imageUrl = await upload(ctx, file);
    } catch {
      setUploading(false);
      return setError("Image upload failed. Try again or remove the file.");
    }
    setUploading(false);
    setSent(true);
    fetcher.submit(
      {
        intent: "create",
        title: title.trim(),
        description: description.trim(),
        imageUrl,
      },
      { method: "post" },
    );
  };

  const saving = uploading || fetcher.state !== "idle";
  const shownError = error || (sent && fetcher.data?.error) || "";

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create a feature request"
      primaryAction={{
        content: "Submit",
        onAction: submit,
        disabled: !(title.trim() && description.trim()) || saving,
        loading: saving,
      }}
      secondaryActions={[{ content: "Cancel", onAction: close }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {shownError && <Banner tone="critical">{shownError}</Banner>}
          <TextField
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="My awesome feature request"
            autoComplete="off"
            maxLength={120}
          />
          <TextField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Input description here"
            multiline={4}
            autoComplete="off"
          />
          {file ? (
            <FilePreview file={file} onRemove={() => setFile(null)} />
          ) : (
            <AttachButton
              onPick={(f) => {
                const err = checkFile(f);
                setError(err);
                if (!err) setFile(f);
              }}
            />
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

function DetailModal({
  item,
  isOwner,
  ctx,
  busy,
  onClose,
  onVote,
  onStatusChange,
}) {
  const loadFetcher = useFetcher(); 
  const postFetcher = useFetcher(); 
  const { pathname } = useLocation();
  const [list, setList] = useState(null); 
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const id = item?.id;

  useEffect(() => {
    setList(null);
    setText("");
    setFile(null);
    setError("");
    if (id) loadFetcher.load(`${pathname}?featureId=${id}`);
 
  }, [id]);

  useEffect(() => {
    if (loadFetcher.data?.comments)
      setList({ comments: loadFetcher.data.comments });
  }, [loadFetcher.data]);

  useEffect(() => {
    if (postFetcher.data?.comments) {
      setList({ comments: postFetcher.data.comments });
      setText("");
      setFile(null);
    }
  }, [postFetcher.data]);

  if (!item) return null;

  const comments = list?.comments || [];
  const loading = !list;
  const posting = uploading || postFetcher.state !== "idle";
  const serverError = postFetcher.data?.error || loadFetcher.data?.error;

  const post = async () => {
    setError("");
    setUploading(true);
    let imageUrl = "";
    try {
      imageUrl = await upload(ctx, file);
    } catch {
      setUploading(false);
      return setError("Image upload failed. Try again or remove the file.");
    }
    setUploading(false);
    postFetcher.submit(
      { intent: "comment", featureId: id, body: text.trim(), imageUrl },
      { method: "post" },
    );
  };

  const pickFile = (f) => {
    const err = checkFile(f);
    setError(err);
    if (!err) setFile(f);
  };

  return (
    <Modal open onClose={onClose} title={item.title}>
      <Modal.Section>
        <InlineStack wrap={false} gap="400" blockAlign="start">
          <Box
            minWidth="56px"
            borderWidth="025"
            borderColor="border"
            borderRadius="200"
            background={item.hasVoted ? "bg-surface-active" : "bg-surface"}
          >
            <BlockStack inlineAlign="center" gap="100">
              <Button
                variant="tertiary"
                icon={ChevronUpIcon}
                accessibilityLabel={
                  item.hasVoted ? "You already voted" : "Upvote"
                }
                disabled={item.hasVoted || busy}
                onClick={() => onVote(item.id)}
              />
              <Box paddingBlockEnd="200">
                <Text as="span" variant="headingSm">
                  {item.votes}
                </Text>
              </Box>
            </BlockStack>
          </Box>

          <Box minWidth="0" width="100%">
            <BlockStack gap="300">
              {isOwner ? (
                <Select
                  label="Status"
                  labelHidden
                  options={STATUS_OPTIONS}
                  value={item.status}
                  disabled={busy}
                  onChange={(v) => onStatusChange(item.id, v)}
                />
              ) : (
                <div>
                  <Badge tone={COL[item.status]?.tone}>
                    {`${COL[item.status]?.icon} ${COL[item.status]?.label}`}
                  </Badge>
                </div>
              )}
              <Text as="p" variant="bodyMd" breakWord>
                {item.description}
              </Text>
              {item.imageUrl && (
                <a href={item.imageUrl} target="_blank" rel="noreferrer">
                  <img src={item.imageUrl} alt="" style={fullImg} />
                </a>
              )}
            </BlockStack>
          </Box>
        </InlineStack>
      </Modal.Section>

      {/* Comments + form */}
      <Modal.Section>
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm">
            Comments:
          </Text>

          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            <BlockStack gap="300">
              {loading && (
                <Text as="p" tone="subdued">
                  Loading comments…
                </Text>
              )}
              {!loading && comments.length === 0 && (
                <Text as="p" tone="subdued">
                  No comments yet.
                </Text>
              )}
              {comments.map((c) => (
                <BlockStack key={c.id} gap="100">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {c.authorName}
                      </Text>
                      {c.isOwner && <Badge tone="info">Team</Badge>}
                    </InlineStack>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {timeAgo(c.createdAt)}
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodyMd" breakWord>
                    {c.body}
                  </Text>
                  {c.imageUrl && (
                    <a href={c.imageUrl} target="_blank" rel="noreferrer">
                      <img src={c.imageUrl} alt="" style={thumbImg} />
                    </a>
                  )}
                </BlockStack>
              ))}
            </BlockStack>
          </div>

          {(error || serverError) && (
            <Banner tone="critical">{error || serverError}</Banner>
          )}

          <TextField
            label="Comment"
            labelHidden
            value={text}
            onChange={setText}
            placeholder="Input your comment here"
            multiline={3}
            autoComplete="off"
            maxLength={2000}
          />

          <InlineStack
            align="space-between"
            blockAlign="center"
            gap="300"
            wrap={false}
          >
            <Box minWidth="0">
              {file ? (
                <FilePreview file={file} onRemove={() => setFile(null)} />
              ) : (
                <AttachButton onPick={pickFile} disabled={posting} />
              )}
            </Box>
            <Button
              variant="primary"
              onClick={post}
              disabled={!text.trim() || posting}
              loading={posting}
            >
              Submit
            </Button>
          </InlineStack>
        </BlockStack>
      </Modal.Section>

      <Modal.Section>
        <Text as="p" variant="bodySm" tone="subdued">
          Created by {item.shopName || "a merchant"}
        </Text>
      </Modal.Section>
    </Modal>
  );
}

export default function Featureboard() {
  const { features, isOwner, apiUrl, accessToken, shop } = useLoaderData();
  const mutate = useFetcher();
  const [sort, setSort] = useState("votes");
  const [sortOpen, setSortOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const ctx = { apiUrl, accessToken, shop };
  const busyId =
    mutate.state !== "idle" ? mutate.formData?.get("featureId") : null;
  const post = (data) => mutate.submit(data, { method: "post" });
  const onVote = (id) => post({ intent: "vote", featureId: id });
  const onStatusChange = (id, status) =>
    post({ intent: "status", featureId: id, status });

  const grouped = useMemo(() => {
    const cmp =
      sort === "votes"
        ? (a, b) => b.votes - a.votes
        : (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt);
    return COLUMNS.reduce((acc, c) => {
      acc[c.key] = features.filter((f) => f.status === c.key).sort(cmp);
      return acc;
    }, {});
  }, [features, sort]);

  const released = useMemo(
    () =>
      features
        .filter((f) => f.status === "done")
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [features],
  );
  const selected = features.find((f) => f.id === selectedId) || null;

  return (
    <Page
      title="Roadmap"
      backAction={{ content: "Back", onAction: () => window.history.back() }}
      primaryAction={{
        content: "Suggest a feature",
        onAction: () => setSuggestOpen(true),
      }}
      secondaryActions={[
        { content: "Recent updates", onAction: () => setUpdatesOpen(true) },
      ]}
      fullWidth
    >
      <BlockStack gap="400">
        {mutate.data?.error && (
          <Banner tone="critical">{mutate.data.error}</Banner>
        )}

        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingLg">
            Roadmap
          </Text>
          <Popover
            active={sortOpen}
            onClose={() => setSortOpen(false)}
            activator={
              <Button
                disclosure={sortOpen ? "up" : "down"}
                variant="tertiary"
                onClick={() => setSortOpen(!sortOpen)}
              >
                {sort === "votes" ? "Sort by Votes" : "Sort by Release date"}
              </Button>
            }
          >
            <ActionList
              items={[
                {
                  content: "Upvotes",
                  active: sort === "votes",
                  onAction: () => {
                    setSort("votes");
                    setSortOpen(false);
                  },
                },
                {
                  content: "Release date",
                  active: sort === "date",
                  onAction: () => {
                    setSort("date");
                    setSortOpen(false);
                  },
                },
              ]}
            />
          </Popover>
        </InlineStack>

        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            alignItems: "flex-start",
            paddingBottom: 8,
          }}
        >
          {COLUMNS.map((col) => (
            <div key={col.key} style={{ flex: "0 0 340px", minWidth: 0 }}>
              <Card>
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h3" variant="headingSm">
                      {col.label} {col.icon}
                    </Text>
                    <Badge tone={col.tone}>
                      {String(grouped[col.key].length)}
                    </Badge>
                  </InlineStack>
                  <div
                    style={{
                      maxHeight: "calc(100vh - 300px)",
                      overflowY: "auto",
                    }}
                  >
                    <BlockStack gap="300">
                      {grouped[col.key].map((item) => (
                        <FeatureCard
                          key={item.id}
                          item={item}
                          isOwner={isOwner}
                          busy={busyId === item.id}
                          onVote={onVote}
                          onStatusChange={onStatusChange}
                          onOpen={setSelectedId}
                        />
                      ))}
                      {grouped[col.key].length === 0 && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          No requests here yet.
                        </Text>
                      )}
                    </BlockStack>
                  </div>
                </BlockStack>
              </Card>
            </div>
          ))}
        </div>
      </BlockStack>

      <SuggestModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        ctx={ctx}
      />

      <DetailModal
        item={selected}
        isOwner={isOwner}
        ctx={ctx}
        busy={busyId === selectedId}
        onClose={() => setSelectedId(null)}
        onVote={onVote}
        onStatusChange={onStatusChange}
      />

      <Modal
        open={updatesOpen}
        onClose={() => setUpdatesOpen(false)}
        title="Recent updates"
        secondaryActions={[
          { content: "Close", onAction: () => setUpdatesOpen(false) },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            {released.length === 0 && (
              <Text as="p" tone="subdued">
                Nothing has been released yet.
              </Text>
            )}
            {released.map((r) => (
              <BlockStack key={r.id} gap="050">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  {r.title}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Released {new Date(r.updatedAt).toLocaleDateString()}
                </Text>
              </BlockStack>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
