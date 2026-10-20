import { Page, Card, TextField, Button, BlockStack } from "@shopify/polaris";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async () => ({ errors: {} });

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));
  return { errors };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <Page title="Login">
      <Card>
        <Form method="post">
          <BlockStack gap="400">
            <TextField
              label="Shop domain"
              name="shop"
              value={shop}
              onChange={setShop}
              autoComplete="on"
              helpText="example.myshopify.com"
              error={errors?.shop}
            />
            <Button submit variant="primary">Log in</Button>
          </BlockStack>
        </Form>
      </Card>
    </Page>
  );
}