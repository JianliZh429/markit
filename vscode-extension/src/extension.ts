import * as vscode from "vscode";
import { marked } from "marked";

let previewPanel: vscode.WebviewPanel | undefined;
let previewDocument: vscode.Uri | undefined;
let documentListener: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand(
    "markit.openPreview",
    openPreview,
  );

  context.subscriptions.push(
    command,
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (
        previewPanel &&
        editor &&
        editor.document.uri.toString() === previewDocument?.toString()
      ) {
        updatePreview(editor.document);
      }
    }),
  );
}

export function deactivate(): void {
  documentListener?.dispose();
  previewPanel?.dispose();
}

function openPreview(): void {
  const editor = vscode.window.activeTextEditor;

  if (!editor || editor.document.languageId !== "markdown") {
    void vscode.window.showInformationMessage("Open a Markdown file first.");
    return;
  }

  previewDocument = editor.document.uri;

  if (previewPanel) {
    previewPanel.reveal(vscode.ViewColumn.Beside);
    updatePreview(editor.document);
    return;
  }

  previewPanel = vscode.window.createWebviewPanel(
    "markitPreview",
    `Markit: ${editor.document.fileName.split("/").pop() ?? "Preview"}`,
    vscode.ViewColumn.Beside,
    { enableScripts: false },
  );

  documentListener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.uri.toString() === previewDocument?.toString()) {
      updatePreview(event.document);
    }
  });

  previewPanel.onDidDispose(() => {
    documentListener?.dispose();
    documentListener = undefined;
    previewPanel = undefined;
    previewDocument = undefined;
  });

  updatePreview(editor.document);
}

function updatePreview(document: vscode.TextDocument): void {
  if (!previewPanel) {
    return;
  }

  previewPanel.title = `Markit: ${document.fileName.split("/").pop() ?? "Preview"}`;
  previewPanel.webview.html = createPreviewHtml(document.getText());
}

function createPreviewHtml(markdown: string): string {
  const renderer = new marked.Renderer();
  renderer.html = ({ raw }) => escapeHtml(raw);

  const renderedMarkdown = marked.parse(markdown, {
    async: false,
    gfm: true,
    renderer,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root { color-scheme: light dark; }
    body {
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-editor-font-size);
      line-height: 1.6;
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem 2.5rem 4rem;
    }
    h1, h2, h3 { line-height: 1.25; }
    a { color: var(--vscode-textLink-foreground); }
    code { font-family: var(--vscode-editor-font-family); }
    pre, code { background: var(--vscode-textCodeBlock-background); }
    pre { overflow-x: auto; padding: 1rem; }
    blockquote { border-left: 3px solid var(--vscode-textLink-foreground); margin-left: 0; padding-left: 1rem; }
    img { max-width: 100%; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid var(--vscode-textSeparator-foreground); padding: 0.4rem 0.7rem; }
  </style>
</head>
<body>${renderedMarkdown}</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}