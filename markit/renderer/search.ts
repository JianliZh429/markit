import * as fs from 'fs-extra';
import fg from 'fast-glob';
import { SearchResult, SearchMatch } from '../../types';

/**
 * Search for a keyword in `.md` files within a directory.
 * @param directory - Directory to search.
 * @param keyword - Keyword to search for.
 * @param fileExtension - File extension to search (default: 'md').
 * @returns Array of results with file paths and matches.
 */
export async function searchInFiles(
  directory: string,
  keyword: string,
  fileExtension: string = 'md'
): Promise<SearchResult[]> {
  console.log('Searching in files...', directory, keyword);
  // Define the pattern to match only files with specified extension
  const pattern = `${directory}/**/*.${fileExtension}`;

  const files = await fg(pattern);

  const results: SearchResult[] = [];
  for (const file of files) {
    try {
      // Read the content of the file
      const content = await fs.readFile(file, 'utf-8');

      // Find all matches for the keyword
      const regex = new RegExp(keyword, 'gi');
      const matches = [...content.matchAll(regex)];

      if (matches.length > 0) {
        results.push({
          file,
          matches: matches.map((match): SearchMatch => {
            const matchIndex = match.index ?? 0;
            const snippetStart = Math.max(0, matchIndex - 20);
            const snippetEnd = Math.min(
              content.length,
              matchIndex + keyword.length + 20
            );
            const snippet = content.substring(snippetStart, snippetEnd);

            // Highlight the keyword in the snippet
            const highlightedSnippet = snippet.replace(
              regex,
              `<mark>${keyword}</mark>`
            );

            return {
              line: matchIndex,
              snippet: highlightedSnippet,
              context: snippet,
            };
          }),
        });
      } else {
        console.log('Could not find any matches.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error reading file ${file}:`, err.message);
      } else {
        console.error(`Error reading file ${file}`);
      }
    }
  }

  return results;
}
