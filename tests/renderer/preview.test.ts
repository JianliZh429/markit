/**
 * Tests for PreviewModule
 */

import { PreviewModule } from "../../markit/renderer/modules/preview";
import { MarkdownService } from "../../markit/renderer/services/markdownService";
import { stateManager } from "../../markit/renderer/state";

// Mock dependencies
jest.mock("../../markit/renderer/services/markdownService");
jest.mock("../../markit/renderer/utils/performance", () => ({
  debounce: jest.fn((fn) => fn),
}));

describe("PreviewModule", () => {
  let previewModule: PreviewModule;
  let mockElement: any;
  let mockMarkdownService: any;
  let mockGetSelection: jest.Mock;
  let mockCreateRange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocks
    mockGetSelection = jest.fn();
    mockCreateRange = jest.fn();

    // Spy on global methods
    jest.spyOn(window, 'getSelection').mockImplementation(mockGetSelection);
    jest.spyOn(document, 'createRange').mockImplementation(mockCreateRange);

    // Create mock DOM element
    mockElement = {
      style: { display: 'none' },
      contentEditable: 'false',
      innerHTML: '',
      innerText: '',
      scrollTop: 0,
      clientHeight: 100,
      focus: jest.fn(),
      addEventListener: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({ top: 0, height: 0 })),
    };

    // Create mock markdown service
    mockMarkdownService = {
      parse: jest.fn(() => '<p>parsed html</p>'),
      htmlToMarkdown: jest.fn(() => 'converted markdown'),
      clearCache: jest.fn(),
      setBaseUrl: jest.fn(),
    };

    // Mock stateManager methods
    jest.spyOn(stateManager, 'get').mockImplementation((key: string) => {
      const defaults: any = {
        isEditMode: false,
        isModeSwitching: false,
        previewScrollTop: 0,
        previewCursorOffset: 0,
      };
      return defaults[key];
    });

    jest.spyOn(stateManager, 'getState').mockReturnValue({
      previewScrollTop: 0,
      previewCursorOffset: 0,
      isModeSwitching: false,
    } as any);

    jest.spyOn(stateManager, 'set').mockImplementation(() => {});
    jest.spyOn(stateManager, 'setState');

    previewModule = new PreviewModule(mockElement, mockMarkdownService);
  });

  describe("constructor", () => {
    it("should initialize with provided element and service", () => {
      expect(previewModule).toBeDefined();
      expect(mockElement.addEventListener).toHaveBeenCalledTimes(4);
    });

    it("should set up event listeners", () => {
      expect(mockElement.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith("paste", expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith("input", expect.any(Function));
    });
  });

  describe("setMarkdownContent", () => {
    it("should parse markdown and set HTML content", () => {
      const markdown = "# Test";
      previewModule.setMarkdownContent(markdown);

      expect(mockMarkdownService.parse).toHaveBeenCalledWith(markdown);
      expect(mockElement.innerHTML).toBe('<p>parsed html</p>');
    });

    it("should store markdown content", () => {
      const markdown = "test content";
      previewModule.setMarkdownContent(markdown);

      expect(previewModule.getMarkdownContent()).toBe(markdown);
    });
  });

  describe("getMarkdownContent", () => {
    it("should return stored markdown content", () => {
      const markdown = "stored content";
      previewModule.setMarkdownContent(markdown);

      expect(previewModule.getMarkdownContent()).toBe(markdown);
    });

    it("should return innerText when no stored content", () => {
      mockElement.innerText = "fallback text";

      expect(previewModule.getMarkdownContent()).toBe("fallback text");
    });
  });

  describe("getHtmlContent", () => {
    it("should return innerHTML", () => {
      mockElement.innerHTML = "<p>test</p>";

      expect(previewModule.getHtmlContent()).toBe("<p>test</p>");
    });
  });

  describe("show", () => {
    it("should show preview element", () => {
      previewModule.show();

      expect(mockElement.style.display).toBe("block");
      expect(mockElement.contentEditable).toBe("false");
    });

    it("should make editable when specified", () => {
      previewModule.show(true);

      expect(mockElement.contentEditable).toBe("true");
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it("should restore scroll position", () => {
      (stateManager.getState as jest.Mock).mockRestore();
      jest.spyOn(stateManager, 'getState').mockReturnValue({
        previewScrollTop: 100,
        previewCursorOffset: 0,
        isModeSwitching: false,
      } as any);

      previewModule.show();

      expect(mockElement.scrollTop).toBe(100);
    });
  });

  describe("hide", () => {
    it("should hide preview element", () => {
      previewModule.hide();

      expect(mockElement.style.display).toBe("none");
      expect(mockElement.contentEditable).toBe("false");
    });

    it("should save scroll position", () => {
      mockElement.scrollTop = 200;

      previewModule.hide();

      expect(stateManager.set).toHaveBeenCalledWith("previewScrollTop", 200);
    });
  });

  describe("selectAll", () => {
    it("should select all content", () => {
      // Mock window.getSelection
      const mockSelection = {
        rangeCount: 1,
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      };
      mockGetSelection.mockReturnValue(mockSelection);

      // Mock document.createRange
      const mockRange = { selectNodeContents: jest.fn() };
      mockCreateRange.mockReturnValue(mockRange);

      previewModule.selectAll();

      expect(mockElement.focus).toHaveBeenCalled();
      expect(mockCreateRange).toHaveBeenCalled();
      expect(mockRange.selectNodeContents).toHaveBeenCalledWith(mockElement);
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
    });
  });

  describe("focus", () => {
    it("should focus the element", () => {
      previewModule.focus();

      expect(mockElement.focus).toHaveBeenCalled();
    });
  });
});
