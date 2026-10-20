import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  Text,
} from "@shopify/polaris";

export const ssr = false;

export async function loader({ request }) {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);
  return null;
}

export async function action({ request }) {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);

  const formData = await request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName") || "";
  const email = formData.get("email");
  const phone = formData.get("phone") || "";
  const message = formData.get("message") || "";

  if (!firstName || !email) {
    return { success: false, message: "Please fill all required fields." };
  }

  try {
    const backendUrl = `${process.env.PUBLIC_REACT_APP_API_URL}/api/contact`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.API_SECRET_KEY || "",
      },
      body: JSON.stringify({ firstName, lastName, email, phone, address: message }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, message: data.message || "Something went wrong" };
    }

    return { success: true };
  } catch (error) {
    console.error("[support] contact forward error:", error);
    return { success: false, message: "Server error, please try again later." };
  }
}

export default function Support() {
  const fetcher = useFetcher();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [showBanner, setShowBanner] = useState(false);

  const isSubmitting = fetcher.state === "submitting";
  const result = fetcher.data;

  const isValid = firstName && email;

  const handleSubmit = () => {
    if (!isValid) return;
    fetcher.submit(
      { firstName, lastName, email, phone, message },
      { method: "post" }
    );
  };

  useEffect(() => {
    if (!result) return;

    setShowBanner(true);

    if (result.success) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
    }

    const timer = setTimeout(() => setShowBanner(false), 4000);
    return () => clearTimeout(timer);
  }, [result]);

  return (
    <Page title="Support">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="p" variant="bodyMd">
                Have a question or need help? Fill out the form below and our
                team will get back to you as soon as possible.
              </Text>

              {showBanner && result?.success && (
                <Banner tone="success">
                  Your message has been sent successfully. Our team will
                  reach out to you shortly.
                </Banner>
              )}

              {showBanner && result && !result.success && (
                <Banner tone="critical">
                  {result.message || "Something went wrong. Please try again."}
                </Banner>
              )}

              <FormLayout>
                <FormLayout.Group>
                  <TextField
                    label="First name"
                    value={firstName}
                    onChange={setFirstName}
                    autoComplete="given-name"
                    requiredIndicator
                  />
                  <TextField
                    label="Last name"
                    value={lastName}
                    onChange={setLastName}
                    autoComplete="family-name"
                  />
                </FormLayout.Group>

                <FormLayout.Group>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    requiredIndicator
                  />
                  <TextField
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    autoComplete="tel"
                  />
                </FormLayout.Group>

                <TextField
                  label="Message"
                  value={message}
                  onChange={setMessage}
                  multiline={4}
                  autoComplete="off"
                />

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!isValid || isSubmitting}
                >
                  Send message
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}