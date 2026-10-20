import { Modal, Text } from "@shopify/polaris";

export default function UnsavedChangesModal({
  open,
  onCancel,
  onLeave,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="You have unsaved changes"
      primaryAction={{
        content: "Leave page",
        destructive: true,
        onAction: onLeave,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onCancel,
        },
      ]}
    >
      <Modal.Section>
        <Text>
          If you leave this page, all unsaved changes will be lost.
        </Text>
      </Modal.Section>
    </Modal>
  );
}