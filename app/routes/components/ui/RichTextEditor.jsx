import { useRef, useEffect } from "react";
import { Text, Button, InlineStack, BlockStack } from "@shopify/polaris";

function RichTextEditor({ value, onChange }) {
    const ref = useRef(null);

    // ✅ Set initial value ONLY once
    useEffect(() => {
        if (ref.current && !ref.current.innerHTML) {
            ref.current.innerHTML = value || "";
        }
    }, []);

    const format = (command) => {
        document.execCommand(command, false, null);
        ref.current.focus();
    };

    const handleInput = () => {
        const html = ref.current.innerHTML;
        onChange(html);
    };

    return (
        <BlockStack gap="200">
            Announcement text
            <InlineStack gap="200">
                <Button onClick={() => format("bold")}>B</Button>
                <Button onClick={() => format("italic")}>I</Button>
                <Button onClick={() => format("underline")}>U</Button>
            </InlineStack>

            {/* Editor */}
            <div
                ref={ref}
                contentEditable
                onInput={handleInput}
                suppressContentEditableWarning
                style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "10px",
                    minHeight: "80px",
                    outline: "none",
                }}
            />

            <Text variant="bodySm" tone="subdued">
                Use {"{TIMER}"} to show countdown
            </Text>
        </BlockStack>
    );
}

export default RichTextEditor;