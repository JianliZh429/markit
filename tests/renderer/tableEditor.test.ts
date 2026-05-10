import { TableEditorModule, TableOptions } from "../../markit/renderer/modules/tableEditor";

/**
 * Mock editor element for testing
 */
function createMockEditor() {
  let value = "";
  let cursorPosition = 0;

  const mock = {
    get value() {
      return value;
    },
    set value(v: string) {
      value = v;
    },
    focus: jest.fn(),
    selectionStart: 0,
    selectionEnd: 0,
    setSelectionRange: jest.fn((start: number, end: number) => {
      cursorPosition = start;
    }),
  } as unknown as HTMLTextAreaElement;

  // Mock execCommand for insertText
  const originalExecCommand = document.execCommand;
  document.execCommand = jest.fn(() => {
    // Simulate insertion
    const start = mock.selectionStart;
    const end = mock.selectionEnd;
    // In real test, this would be handled by the browser
    return true;
  });

  // Cleanup function
  const cleanup = () => {
    document.execCommand = originalExecCommand;
  };

  return { mock, cleanup, setValue: (v: string) => { value = v; } };
}

describe("TableEditorModule - insertTable", () => {
  test("inserts a 2x2 table at cursor position", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const options: TableOptions = { rows: 2, columns: 2 };
    module.insertTable(options);

    expect(mock.focus).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("insertText", false, expect.stringContaining("| Header 1 | Header 2 |"));
    
    cleanup();
  });

  test("inserts a 3x4 table", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const options: TableOptions = { rows: 3, columns: 4 };
    module.insertTable(options);

    expect(document.execCommand).toHaveBeenCalled();
    
    cleanup();
  });

  test("uses custom header text when provided", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const options: TableOptions = { 
      rows: 2, 
      columns: 2,
      headerText: "Column"
    };
    module.insertTable(options);

    expect(document.execCommand).toHaveBeenCalledWith(
      "insertText", 
      false, 
      expect.stringContaining("| Column 1 | Column 2 |")
    );
    
    cleanup();
  });

  test("generates correct markdown structure", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const options: TableOptions = { rows: 2, columns: 3 };
    module.insertTable(options);

    const callArgs = (document.execCommand as jest.Mock).mock.calls[0];
    const insertedText = callArgs[2] as string;
    
    // Should have header row, separator row, and 2 data rows
    const lines = insertedText.trim().split("\n");
    expect(lines).toHaveLength(4); // Header + separator + 2 data rows
    
    // Header line
    expect(lines[0]).toMatch(/^\| Header 1 \| Header 2 \| Header 3 \|$/);
    
    // Separator line
    expect(lines[1]).toMatch(/^\| --- \| --- \| --- \|$/);
    
    // Data rows
    expect(lines[2]).toMatch(/^\| Cell 1-1 \| Cell 1-2 \| Cell 1-3 \|$/);
    expect(lines[3]).toMatch(/^\| Cell 2-1 \| Cell 2-2 \| Cell 2-3 \|$/);
    
    cleanup();
  });
});

describe("TableEditorModule - generateMarkdownTable (private method)", () => {
  test("generates minimal 1x1 table", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    // Access private method via any cast
    const generateTable = (module as any).generateMarkdownTable.bind(module);
    const table = generateTable(1, 1, "H");
    
    const lines = table.trim().split("\n");
    expect(lines).toHaveLength(3); // Header + separator + 1 data row
    expect(lines[0]).toBe("| H 1 |");
    expect(lines[1]).toBe("| --- |");
    expect(lines[2]).toBe("| Cell 1-1 |");
    
    cleanup();
  });

  test("generates table with newlines at start and end", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const generateTable = (module as any).generateMarkdownTable.bind(module);
    const table = generateTable(2, 2, "Header");
    
    expect(table.startsWith("\n")).toBe(true);
    expect(table.endsWith("\n")).toBe(true);
    
    cleanup();
  });
});

describe("TableEditorModule - convertToTable", () => {
  test("returns false when no selection", () => {
    const { mock, cleanup } = createMockEditor();
    mock.selectionStart = 0;
    mock.selectionEnd = 0;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(false);
    
    cleanup();
  });

  test("returns false when selection is single line", () => {
    const { mock, cleanup, setValue } = createMockEditor();
    setValue("Single line of text");
    mock.selectionStart = 0;
    mock.selectionEnd = 19;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(false);
    
    cleanup();
  });

  test("converts tab-separated values", () => {
    const { mock, cleanup, setValue } = createMockEditor();
    const tabData = "Name\tAge\tCity\nAlice\t30\tNYC\nBob\t25\tLA";
    setValue(tabData);
    mock.selectionStart = 0;
    mock.selectionEnd = tabData.length;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(true);
    
    // Check that the value was replaced with markdown table
    expect(mock.value).toContain("| Name | Age | City |");
    expect(mock.value).toContain("| --- | --- | --- |");
    
    cleanup();
  });

  test("converts comma-separated values", () => {
    const { mock, cleanup, setValue } = createMockEditor();
    const csvData = "Name,Age,City\nAlice,30,NYC\nBob,25,LA";
    setValue(csvData);
    mock.selectionStart = 0;
    mock.selectionEnd = csvData.length;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(true);
    expect(mock.value).toContain("| Name | Age | City |");
    
    cleanup();
  });

  test("converts pipe-separated values", () => {
    const { mock, cleanup, setValue } = createMockEditor();
    const pipeData = "Name | Age | City\nAlice | 30 | NYC\nBob | 25 | LA";
    setValue(pipeData);
    mock.selectionStart = 0;
    mock.selectionEnd = pipeData.length;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(true);
    expect(mock.value).toContain("| Name | Age | City |");
    
    cleanup();
  });

  test("converts space-separated values", () => {
    const { mock, cleanup, setValue } = createMockEditor();
    const spaceData = "Name  Age  City\nAlice  30  NYC\nBob  25  LA";
    setValue(spaceData);
    mock.selectionStart = 0;
    mock.selectionEnd = spaceData.length;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(true);
    expect(mock.value).toContain("| Name | Age | City |");
    
    cleanup();
  });

  test("normalizes row lengths", () => {
    const { mock, cleanup, setValue } = createMockEditor();
    // Second row has fewer columns
    const unevenData = "Name\tAge\tCity\nAlice\t30";
    setValue(unevenData);
    mock.selectionStart = 0;
    mock.selectionEnd = unevenData.length;
    const module = new TableEditorModule(mock);

    const result = module.convertToTable();
    expect(result).toBe(true);
    
    // Should have normalized to 3 columns (with empty cell)
    const lines = mock.value.trim().split("\n");
    // Each line should have 3 cells (empty cell is OK)
    expect(lines[2]).toMatch(/\| [^|]* \| [^|]* \| [^|]* \|/);
    
    cleanup();
  });
});

describe("TableEditorModule - detectDelimiter (private method)", () => {
  test("detects tab delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const detectDelimiter = (module as any).detectDelimiter.bind(module);
    const lines = ["Name\tAge", "Alice\t30"];
    expect(detectDelimiter(lines)).toBe("\t");
    
    cleanup();
  });

  test("detects comma delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const detectDelimiter = (module as any).detectDelimiter.bind(module);
    const lines = ["Name,Age", "Alice,30"];
    expect(detectDelimiter(lines)).toBe(",");
    
    cleanup();
  });

  test("detects pipe delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const detectDelimiter = (module as any).detectDelimiter.bind(module);
    const lines = ["Name | Age", "Alice | 30"];
    expect(detectDelimiter(lines)).toBe("|");
    
    cleanup();
  });

  test("detects space delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const detectDelimiter = (module as any).detectDelimiter.bind(module);
    const lines = ["Name  Age", "Alice  30"];
    expect(detectDelimiter(lines)).toBe("spaces");
    
    cleanup();
  });

  test("returns null for no delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const detectDelimiter = (module as any).detectDelimiter.bind(module);
    const lines = ["No delimiter here", "Just text"];
    expect(detectDelimiter(lines)).toBe(null);
    
    cleanup();
  });

  test("validates space delimiter across all lines", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const detectDelimiter = (module as any).detectDelimiter.bind(module);
    // First line has 2 parts, second line has 3 parts - should not match
    const lines = ["Name  Age", "Alice  30  Extra"];
    expect(detectDelimiter(lines)).toBe(null);
    
    cleanup();
  });
});

describe("TableEditorModule - convertLinesToTable (private method)", () => {
  test("converts lines with tab delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const convertLinesToTable = (module as any).convertLinesToTable.bind(module);
    const lines = ["Name\tAge", "Alice\t30", "Bob\t25"];
    const table = convertLinesToTable(lines, "\t");
    
    expect(table).toContain("| Name | Age |");
    expect(table).toContain("| --- | --- |");
    expect(table).toContain("| Alice | 30 |");
    expect(table).toContain("| Bob | 25 |");
    
    cleanup();
  });

  test("handles pipe delimiter by filtering empty parts", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const convertLinesToTable = (module as any).convertLinesToTable.bind(module);
    // Pipes at start and end create empty parts
    const lines = ["| Name | Age |", "| Alice | 30 |"];
    const table = convertLinesToTable(lines, "|");
    
    expect(table).toContain("| Name | Age |");
    
    cleanup();
  });

  test("handles space delimiter", () => {
    const { mock, cleanup } = createMockEditor();
    const module = new TableEditorModule(mock);

    const convertLinesToTable = (module as any).convertLinesToTable.bind(module);
    const lines = ["Name  Age", "Alice  30"];
    const table = convertLinesToTable(lines, "spaces");
    
    expect(table).toContain("| Name | Age |");
    expect(table).toContain("| Alice | 30 |");
    
    cleanup();
  });
});
