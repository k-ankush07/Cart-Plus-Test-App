import { useEffect, useState } from "react";
import { Text } from "@shopify/polaris";

export default function HtmlEditor({
    label,
    value,
    onChange,
    language = "html",
    height = 340,
}) {
    const [Editor, setEditor] = useState(null);

    useEffect(() => {
        import("@monaco-editor/react").then((mod) => {
            setEditor(() => mod.default);
        });
    }, []);

    if (!Editor) {
        return (
            <div style={{ padding: "10px", fontSize: "13px" }}>
                Loading editor...
            </div>
        );
    }

    return (
        <div className="html-editor">
            {label && (
                <div className="html-editor__label">
                    <Text variant="bodyMd">{label}</Text>
                </div>
            )}

            <div className="html-editor__field">
                <Editor
                    height={height}
                    language={language}
                    value={value || ""}
                    onChange={(val) => onChange(val || "")}
                    theme="vs"
                    options={{
                        minimap: { enabled: true },
                        fontSize: 14,
                        lineNumbers: "on",
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: true,
                        },
                        fontFamily: 'Consolas, "Courier New", monospace',
                    }}
                />
            </div>

            <div className="html-editor__count">
                <Text variant="bodySm" tone="subdued">
                    {(value || "").length} characters
                </Text>
            </div>
        </div>
    );
}