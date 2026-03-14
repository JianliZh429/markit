export function insertAnchorAtCaret(content: string, caretOffset: number): string {
  return content.slice(0, caretOffset) + "{{ANCHOR}}" + content.slice(caretOffset);
}

export function stripAnchorAndGetOffset(text: string): { text: string, offset: number } {
  const idx = text.indexOf("{{ANCHOR}}");
  if (idx === -1) return { text, offset: 0 };
  const newText = text.replace("{{ANCHOR}}", "");
  return { text: newText, offset: idx };
}
