import { AppProvider, Page, Card, Text } from '@shopify/polaris';

export default function AppIndex() {
  return (
    <AppProvider>
      <Page title="Dashboard">
        <Card>
          <Text variant="headingMd">Polaris Working </Text>
        </Card>
      </Page>
    </AppProvider>
  );
}