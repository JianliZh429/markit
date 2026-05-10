import { TocModule, TocItem } from "../../markit/renderer/modules/toc";

/**
 * Mock DOM elements for testing
 */
function createMockElements() {
  const tocContainer = {
    innerHTML: "",
    appendChild: jest.fn(),
  } as unknown as HTMLElement;

  const tocPanel = {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  } as unknown as HTMLElement;

  return { tocPanel, tocContainer };
}

describe("TocModule - generateToc", () => {
  test("returns empty array for markdown without headings", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const toc = module.generateToc("Just some text without headings");
    expect(toc).toEqual([]);
  });

  test("extracts single heading", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const toc = module.generateToc("# Hello World");
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe("Hello World");
    expect(toc[0].level).toBe(1);
    expect(toc[0].id).toBe("hello-world");
  });

  test("extracts multiple headings at same level", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const markdown = `
# Heading 1
# Heading 2
# Heading 3
`;
    const toc = module.generateToc(markdown);
    expect(toc).toHaveLength(3);
    expect(toc[0].text).toBe("Heading 1");
    expect(toc[1].text).toBe("Heading 2");
    expect(toc[2].text).toBe("Heading 3");
  });

  test("handles different heading levels", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const markdown = `
# H1
## H2
### H3
`;
    const toc = module.generateToc(markdown);
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe("H1");
    expect(toc[0].children).toBeDefined();
    expect(toc[0].children).toHaveLength(1);
    expect(toc[0].children![0].text).toBe("H2");
    expect(toc[0].children![0].children).toBeDefined();
    expect(toc[0].children![0].children).toHaveLength(1);
    expect(toc[0].children![0].children![0].text).toBe("H3");
  });

  test("handles nested structure correctly", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const markdown = `
# Introduction
## Background
## Motivation
# Methods
## Data Collection
## Analysis
# Results
`;
    const toc = module.generateToc(markdown);
    expect(toc).toHaveLength(3);
    
    // Introduction has 2 children
    expect(toc[0].text).toBe("Introduction");
    expect(toc[0].children).toHaveLength(2);
    expect(toc[0].children![0].text).toBe("Background");
    expect(toc[0].children![1].text).toBe("Motivation");
    
    // Methods has 2 children
    expect(toc[1].text).toBe("Methods");
    expect(toc[1].children).toHaveLength(2);
    
    // Results has no children
    expect(toc[2].text).toBe("Results");
    expect(toc[2].children).toBeUndefined();
  });

  test("slugifies heading text", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const toc = module.generateToc("# Hello World! Special @#$ Characters");
    expect(toc[0].id).toBe("hello-world-special-characters");
  });

  test("handles CJK headings", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const toc = module.generateToc("# 你好世界");
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe("你好世界");
    // CJK characters should be preserved in the ID
    expect(toc[0].id).toBeTruthy();
  });

  test("handles mixed CJK and Western headings", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const toc = module.generateToc("# Introduction 介绍");
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe("Introduction 介绍");
    expect(toc[0].id).toBeTruthy();
  });

  test("skips headings that result in empty IDs", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    // Heading with only special characters that get stripped
    const toc = module.generateToc("# @#$%^&*");
    expect(toc).toEqual([]);
  });

  test("handles all heading levels h1-h6", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const markdown = `
# H1
## H2
### H3
#### H4
##### H5
###### H6
`;
    const toc = module.generateToc(markdown);
    expect(toc).toHaveLength(1);
    expect(toc[0].level).toBe(1);
    expect(toc[0].children![0].level).toBe(2);
    expect(toc[0].children![0].children![0].level).toBe(3);
    expect(toc[0].children![0].children![0].children![0].level).toBe(4);
    expect(toc[0].children![0].children![0].children![0].children![0].level).toBe(5);
    expect(toc[0].children![0].children![0].children![0].children![0].children![0].level).toBe(6);
  });
});

describe("TocModule - slugify", () => {
  test("converts to lowercase", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    // Access private method via any cast for testing
    const slugify = (module as any).slugify.bind(module);
    expect(slugify("Hello WORLD")).toBe("hello-world");
  });

  test("replaces spaces with hyphens", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const slugify = (module as any).slugify.bind(module);
    expect(slugify("hello world test")).toBe("hello-world-test");
  });

  test("removes special characters", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const slugify = (module as any).slugify.bind(module);
    expect(slugify("hello! world@ #test")).toBe("hello-world-test");
  });

  test("removes leading and trailing hyphens", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const slugify = (module as any).slugify.bind(module);
    expect(slugify("---hello world---")).toBe("hello-world");
  });

  test("preserves Unicode letters", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const slugify = (module as any).slugify.bind(module);
    // CJK characters should be preserved
    expect(slugify("你好世界")).toBeTruthy();
    expect(slugify("你好世界").length).toBeGreaterThan(0);
  });
});

describe("TocModule - visibility", () => {
  test("show adds visible class", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    module.show();
    expect(module.visible).toBe(true);
    expect(mock.tocPanel.classList.add).toHaveBeenCalledWith("toc-visible");
    expect(mock.tocPanel.classList.remove).toHaveBeenCalledWith("toc-hidden");
  });

  test("hide adds hidden class", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    module.hide();
    expect(module.visible).toBe(false);
    expect(mock.tocPanel.classList.add).toHaveBeenCalledWith("toc-hidden");
    expect(mock.tocPanel.classList.remove).toHaveBeenCalledWith("toc-visible");
  });

  test("toggle switches visibility", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    module.toggle();
    expect(module.visible).toBe(true);

    module.toggle();
    expect(module.visible).toBe(false);
  });
});

describe("TocModule - update", () => {
  test("update generates and renders TOC", () => {
    const mock = createMockElements();
    const module = new TocModule(mock.tocPanel, mock.tocContainer, jest.fn());

    const markdown = "# Heading 1\n## Subheading";
    module.update(markdown);

    // Should have called appendChild for the rendered TOC
    expect(mock.tocContainer.appendChild).toHaveBeenCalled();
  });
});
