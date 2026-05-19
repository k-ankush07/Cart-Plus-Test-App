import { AppProvider } from "@shopify/shopify-app-react-router/react";
import {
  Page,
  Card,
  TextField,
  Button,
  BlockStack,
} from "@shopify/polaris";

import "@shopify/polaris/build/esm/styles.css";

import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async () => {
  return {
    errors: {},
  };
};


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
    <AppProvider embedded={false}>
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

              <Button submit variant="primary">
                Log in
              </Button>

            </BlockStack>
          </Form>
        </Card>
      </Page>
    </AppProvider>
  );
}