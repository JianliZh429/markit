import { WordCountModule } from "../../markit/renderer/modules/wordCount";

/**
 * Mock DOM elements for testing
 */
function createMockElements() {
  return {
    wordCountContainer: {
      classList: { add: jest.fn(), remove: jest.fn() },
    } as unknown as HTMLElement,
    wordsElement: {
      textContent: "",
    } as unknown as HTMLElement,
    charactersElement: {
      textContent: "",
    } as unknown as HTMLElement,
    readingTimeElement: {
      textContent: "",
    } as unknown as HTMLElement,
    readingTimeRow: {
      style: { display: "" },
    } as unknown as HTMLElement,
    toggleButton: {
      addEventListener: jest.fn(),
    } as unknown as HTMLElement,
  };
}

describe("WordCountModule - calculateStats", () => {
  test("counts empty text", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const stats = module.calculateStats("");
    expect(stats.words).toBe(0);
    expect(stats.characters).toBe(0);
    expect(stats.charactersWithoutSpaces).toBe(0);
    expect(stats.sentences).toBe(0);
    expect(stats.paragraphs).toBe(0);
    expect(stats.readingTime).toBe(1); // Minimum 1 minute
  });

  test("counts Western words", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const stats = module.calculateStats("Hello world this is a test");
    expect(stats.words).toBe(6);
    expect(stats.characters).toBe(26);
    expect(stats.charactersWithoutSpaces).toBe(21);
  });

  test("counts CJK characters", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    // Chinese: 你好世界 (4 characters)
    const stats = module.calculateStats("你好世界");
    expect(stats.words).toBe(4);
  });

  test("counts mixed CJK and Western", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const stats = module.calculateStats("Hello 世界 world 你好");
    // Western: "Hello", "world" = 2 words
    // CJK: "世界", "你好" = 4 characters
    // Total: 6
    expect(stats.words).toBe(6);
  });

  test("counts sentences with Western punctuation", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const stats = module.calculateStats("Hello. World! How are you?");
    expect(stats.sentences).toBe(3);
  });

  test("counts sentences with CJK punctuation", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const stats = module.calculateStats("你好。世界！如何？");
    expect(stats.sentences).toBe(3);
  });

  test("counts paragraphs", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const stats = module.calculateStats("Para 1\n\nPara 2\n\nPara 3");
    expect(stats.paragraphs).toBe(3);
  });

  test("calculates reading time", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    // 200 words = ~1 minute
    const twoHundredWords = Array(200).fill("word").join(" ");
    const stats = module.calculateStats(twoHundredWords);
    expect(stats.readingTime).toBe(1);

    // 400 words = ~2 minutes
    const fourHundredWords = Array(400).fill("word").join(" ");
    const stats2 = module.calculateStats(fourHundredWords);
    expect(stats2.readingTime).toBe(2);
  });
});

describe("WordCountModule - update", () => {
  test("updates DOM elements with stats", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    module.update("Hello world");

    expect(mock.wordsElement.textContent).toBe("2 words");
    expect(mock.charactersElement.textContent).toBe("11 chars");
  });

  test("shows reading time for content >= 50 words", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    const fiftyWords = Array(50).fill("word").join(" ");
    module.update(fiftyWords);

    expect(mock.readingTimeRow.style.display).toBe("flex");
    expect(mock.readingTimeElement.textContent).toContain("min read");
  });

  test("hides reading time for content < 50 words", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    module.update("Short text");

    expect(mock.readingTimeRow.style.display).toBe("none");
  });
});

describe("WordCountModule - visibility toggle", () => {
  test("toggles visibility", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    expect(module.visible).toBe(true);

    module.toggle();
    expect(module.visible).toBe(false);
    expect(mock.wordCountContainer.classList.add).toHaveBeenCalledWith("hidden");

    module.toggle();
    expect(module.visible).toBe(true);
    expect(mock.wordCountContainer.classList.remove).toHaveBeenCalledWith("hidden");
  });

  test("show and hide methods work", () => {
    const mock = createMockElements();
    const module = new WordCountModule(
      mock.wordCountContainer,
      mock.wordsElement,
      mock.charactersElement,
      mock.readingTimeElement,
      mock.readingTimeRow,
      mock.toggleButton
    );

    module.hide();
    expect(module.visible).toBe(false);
    expect(mock.wordCountContainer.classList.add).toHaveBeenCalledWith("hidden");

    module.show();
    expect(module.visible).toBe(true);
    expect(mock.wordCountContainer.classList.remove).toHaveBeenCalledWith("hidden");
  });
});
