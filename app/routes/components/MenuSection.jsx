import { Card, Text, ActionList, BlockStack } from "@shopify/polaris";

export default function MenuSection({ title, items }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text variant="headingSm">{title}</Text>
        <ActionList items={items} />
      </BlockStack>
    </Card>
  );
}