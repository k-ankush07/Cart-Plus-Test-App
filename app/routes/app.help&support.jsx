import {
    Page, Card, Text, InlineStack, BlockStack,
    Box, Button, DataTable, Layout, Tooltip, Icon
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "react-router";

export default function HelpSupport() {
    const navigate = useNavigate();

    return (
        <Page
            backAction={{ onAction: () => navigate("/app") }}
            title="Help & Support"
        >
        </Page>
    )
}
