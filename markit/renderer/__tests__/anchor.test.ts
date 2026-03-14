import { injectAnchor, AnchorInfo } from "../utils/anchor";

// Mock EditorModule dependencies for isolated tests
import { EditorModule } from "../modules/editor";

describe('Anchor injection and retrieval', () => {
  it('should inject anchor span at the expected location', () => {
    const html = "<h3>Sample Title</h3>";
    const anchor: AnchorInfo = { line: 0, offset: 10, context: "Title" };
    const result = injectAnchor(html, anchor);
    expect(result).toContain('<span data-anchor="1"></span>Title');
  });

  it('should handle missing context gracefully', () => {
    const html = "<p>Just some text</p>";
    const anchor: AnchorInfo = { line: 0, offset: 4, context: "missing" };
    const result = injectAnchor(html, anchor);
    // When context not found, original html should be returned
    expect(result).toBe(html);
  });
});

// Mocked HTMLTextAreaElement for EditorModule tests
function createMockTextArea(value: string, selectionStart: number) {
  return {
    value,
    selectionStart,
    focus: jest.fn(),
    setSelectionRange: jest.fn(),
  } as unknown as HTMLTextAreaElement;
}

describe('EditorModule anchor extraction and restore', () => {
  it('should extract and restore anchor correctly', () => {
    const text = "## Heading line\nContent line\n";
    const el = createMockTextArea(text, 2);
    // @ts-ignore for markdownService stub
    const editor = new EditorModule(el, {});

    // Test getAnchorInfo
    const anchor = editor.getAnchorInfo();
    expect(typeof anchor.line).toBe("number");
    expect(anchor.context.length).toBeGreaterThan(0);

    // Test restoreAnchor
    editor.restoreAnchor(anchor);
    expect(el.setSelectionRange).toBeCalled();
    expect(el.focus).toBeCalled();
  });
});
