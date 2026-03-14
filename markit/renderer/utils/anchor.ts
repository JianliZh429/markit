// markit/renderer/utils/anchor.ts
export interface AnchorInfo {
  line: number;
  offset: number;
  context: string;
}

/** Generate data-anchor selector (extendable for multi-cursor) */
export function anchorToSelector(anchor: AnchorInfo): string {
  // For simplicity, always use [data-anchor="1"]
  return '[data-anchor="1"]';
}

/** Inject data-anchor into HTML for a given anchor */
export function injectAnchor(html: string, anchor: AnchorInfo): string {
  const locator = anchor.context;
  if (!locator) return html;
  const anchorHtml = `<span data-anchor="1"></span>${locator}`;
  return html.replace(locator, anchorHtml);
}
