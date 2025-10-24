const fs = require("fs-extra");
const fg = require("fast-glob");

/**
 * Search for a keyword in `.md` files within a directory.
 * @param {string} directory - Directory to search.
 * @param {string} keyword - Keyword to search for.
 * @returns {Promise<object[]>} - Array of results with file paths and matches.
 */
async function searchInFiles(directory, keyword, fileExtension = "md") {
  console.log("Searching in files...", directory, keyword);
  // Define the pattern to match only `.md` files
  const pattern = `${directory}/**/*.${fileExtension}`;

  const files = await fg(pattern);

  const results = [];
  for (const file of files) {
    try {
      // Read the content of the file
      const content = await fs.readFile(file, "utf-8");

      // Find all matches for the keyword
      const regex = new RegExp(keyword, "gi");
      const matches = [...content.matchAll(regex)];

      if (matches.length > 0) {
        results.push({
          file,
          matches: matches.map((match) => {
            const snippetStart = Math.max(0, match.index - 20);
            const snippetEnd = Math.min(
              content.length,
              match.index + keyword.length + 20,
            );
            const snippet = content.substring(snippetStart, snippetEnd);

            // Highlight the keyword in the snippet
            const highlightedSnippet = snippet.replace(
              regex,
              `<mark>${keyword}</mark>`,
            );

            return {
              index: match.index,
              snippet: highlightedSnippet,
            };
          }),
        });
      } else {
        console.log("Could not find any matches.");
      }
    } catch (err) {
      console.error(`Error reading file ${file}:`, err);
    }
  }

  return results;
}

module.exports = { searchInFiles };
