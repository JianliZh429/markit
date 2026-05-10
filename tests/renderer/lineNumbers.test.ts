import { LineNumbersModule } from "../../markit/renderer/modules/lineNumbers";

/**
 * Mock DOM elements for testing
 */
function createMockElements() {
  const gutterElement = {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
    innerHTML: "",
    scrollTop: 0,
    querySelectorAll: jest.fn(() => [] as unknown as NodeListOf<Element>),
  } as unknown as HTMLDivElement;

  const editorElement = {
    value: "",
    scrollTop: 0,
    addEventListener: jest.fn(),
    focus: jest.fn(),
    selectionStart: 0,
    selectionEnd: 0,
    setSelectionRange: jest.fn(),
  } as unknown as HTMLTextAreaElement;

  return { gutterElement, editorElement };
}

describe("LineNumbersModule - visibility", () => {
  test("show adds visible class and updates", () => {
    const mock = createMockElements();
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.show();
    expect(module.visible).toBe(true);
    expect(mock.gutterElement.classList.add).toHaveBeenCalledWith("visible");
  });

  test("hide removes visible class", () => {
    const mock = createMockElements();
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.hide();
    expect(module.visible).toBe(false);
    expect(mock.gutterElement.classList.remove).toHaveBeenCalledWith("visible");
  });

  test("toggle switches visibility", () => {
    const mock = createMockElements();
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    // Initially hidden (constructor doesn't call show)
    expect(module.visible).toBe(false);

    module.toggle();
    expect(module.visible).toBe(true);

    module.toggle();
    expect(module.visible).toBe(false);
  });
});

describe("LineNumbersModule - update", () => {
  test("generates line numbers for single line", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Single line";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.show();
    expect(mock.gutterElement.innerHTML).toBe('<div class="line-number">1</div>');
  });

  test("generates line numbers for multiple lines", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.show();
    expect(mock.gutterElement.innerHTML).toContain('<div class="line-number">1</div>');
    expect(mock.gutterElement.innerHTML).toContain('<div class="line-number">2</div>');
    expect(mock.gutterElement.innerHTML).toContain('<div class="line-number">3</div>');
  });

  test("does not update when hidden", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    // Don't call show(), keep it hidden
    module.update();
    expect(mock.gutterElement.innerHTML).toBe("");
  });

  test("syncs scroll after update", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    mock.editorElement.scrollTop = 100;
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.show();
    expect(mock.gutterElement.scrollTop).toBe(100);
  });
});

describe("LineNumbersModule - syncScroll", () => {
  test("syncs gutter scroll to editor scroll", () => {
    const mock = createMockElements();
    mock.editorElement.scrollTop = 50;
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.show();
    // Trigger scroll sync
    (mock.editorElement.addEventListener as jest.Mock).mock.calls.forEach(
      ([event, handler]: [string, Function]) => {
        if (event === "scroll") {
          handler();
        }
      }
    );

    expect(mock.gutterElement.scrollTop).toBe(50);
  });

  test("does not sync when hidden", () => {
    const mock = createMockElements();
    mock.editorElement.scrollTop = 50;
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    // Keep hidden
    (mock.editorElement.addEventListener as jest.Mock).mock.calls.forEach(
      ([event, handler]: [string, Function]) => {
        if (event === "scroll") {
          handler();
        }
      }
    );

    expect(mock.gutterElement.scrollTop).toBe(0);
  });
});

describe("LineNumbersModule - offsetToLine", () => {
  test("returns line 1 for offset 0", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    const line = module.offsetToLine(0);
    expect(line).toBe(1);
  });

  test("returns correct line for offset in middle", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    // Offset 7 is after "Line 1\n"
    const line = module.offsetToLine(7);
    expect(line).toBe(2);
  });

  test("returns correct line for last line", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    // Offset 14 is after "Line 1\nLine 2\n"
    const line = module.offsetToLine(14);
    expect(line).toBe(3);
  });
});

describe("LineNumbersModule - lineToOffset", () => {
  test("returns offset 0 for line 1", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    const offset = module.lineToOffset(1);
    expect(offset).toBe(0);
  });

  test("returns correct offset for line 2", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    const offset = module.lineToOffset(2);
    expect(offset).toBe(7); // Length of "Line 1\n"
  });

  test("returns correct offset for line 3", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    const offset = module.lineToOffset(3);
    expect(offset).toBe(14); // Length of "Line 1\nLine 2\n"
  });
});

describe("LineNumbersModule - highlightLine", () => {
  test("highlights the specified line", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2\nLine 3";
    
    const mockLineElements = [
      { classList: { add: jest.fn(), remove: jest.fn() } },
      { classList: { add: jest.fn(), remove: jest.fn() } },
      { classList: { add: jest.fn(), remove: jest.fn() } },
    ] as unknown as Element[];
    
    mock.gutterElement.querySelectorAll = jest.fn(() => mockLineElements as unknown as NodeListOf<Element>);
    
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);
    module.show();

    module.highlightLine(2);
    
    // Should have removed highlight from all first
    mockLineElements.forEach(el => {
      expect(el.classList.remove).toHaveBeenCalledWith("highlighted");
    });
    
    // Then added highlight to the target
    expect(mockLineElements[1].classList.add).toHaveBeenCalledWith("highlighted");
  });

  test("does not highlight when hidden", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2";
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.highlightLine(1);
    expect(mock.gutterElement.querySelectorAll).not.toHaveBeenCalled();
  });

  test("handles out of bounds line numbers", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1";
    
    const mockLineElements = [
      { classList: { add: jest.fn(), remove: jest.fn() } },
    ] as unknown as Element[];
    
    mock.gutterElement.querySelectorAll = jest.fn(() => mockLineElements as unknown as NodeListOf<Element>);
    
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);
    module.show();

    // Line 10 doesn't exist
    module.highlightLine(10);
    
    // Should not crash, just not highlight anything
    expect(mockLineElements[0].classList.add).not.toHaveBeenCalled();
  });
});

describe("LineNumbersModule - clearHighlights", () => {
  test("removes highlight from all lines", () => {
    const mock = createMockElements();
    mock.editorElement.value = "Line 1\nLine 2";
    
    const mockHighlightedElements = [
      { classList: { add: jest.fn(), remove: jest.fn() } },
      { classList: { add: jest.fn(), remove: jest.fn() } },
    ] as unknown as Element[];
    
    mock.gutterElement.querySelectorAll = jest.fn(() => mockHighlightedElements as unknown as NodeListOf<Element>);
    
    const module = new LineNumbersModule(mock.gutterElement, mock.editorElement);

    module.clearHighlights();
    
    mockHighlightedElements.forEach(el => {
      expect(el.classList.remove).toHaveBeenCalledWith("highlighted");
    });
  });
});
