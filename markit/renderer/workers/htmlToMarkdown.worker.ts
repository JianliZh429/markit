/**
 * Web Worker for HTML to Markdown conversion
 * Offloads heavy DOM processing from main thread
 */

// Reuse the processing logic from markdownService
interface ProcessNodeResult {
  markdown: string;
}

// Reimplemented processNode logic for worker context
function processNode(node: Node): string {
  let markdown = "";

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      markdown += child.textContent || "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();

      switch (tag) {
        case "table":
          markdown += convertTableToMarkdown(element);
          break;
        case "h1":
          markdown += `# ${processNode(element)}\n\n`;
          break;
        case "h2":
          markdown += `## ${processNode(element)}\n\n`;
          break;
        case "h3":
          markdown += `### ${processNode(element)}\n\n`;
          break;
        case "h4":
          markdown += `#### ${processNode(element)}\n\n`;
          break;
        case "h5":
          markdown += `##### ${processNode(element)}\n\n`;
          break;
        case "h6":
          markdown += `###### ${processNode(element)}\n\n`;
          break;
        case "strong":
        case "b":
          markdown += `**${processNode(element)}**`;
          break;
        case "em":
        case "i":
          markdown += `*${processNode(element)}*`;
          break;
        case "code":
          markdown += `\`${processNode(element)}\``;
          break;
        case "pre":
          markdown += `\n\`\`\`\n${processNode(element)}\n\`\`\`\n\n`;
          break;
        case "a":
          const href = element.getAttribute("href") || "";
          markdown += `[${processNode(element)}](${href})`;
          break;
        case "img":
          const src = element.getAttribute("src") || "";
          const alt = element.getAttribute("alt") || "";
          markdown += `![${alt}](${src})`;
          break;
        case "ul":
          markdown += `\n${processNode(element)}\n`;
          break;
        case "ol":
          markdown += `\n${processNode(element)}\n`;
          break;
        case "li":
          const parentTag = element.parentElement?.tagName.toLowerCase();
          if (parentTag === "ol") {
            markdown += `1. ${processNode(element)}\n`;
          } else {
            markdown += `- ${processNode(element)}\n`;
          }
          break;
        case "blockquote":
          markdown += `> ${processNode(element).split("\n").join("\n> ")}\n\n`;
          break;
        case "p":
          markdown += `${processNode(element)}\n\n`;
          break;
        case "br":
          markdown += "\n";
          break;
        case "hr":
          markdown += "\n---\n\n";
          break;
        case "del":
        case "s":
        case "strike":
          markdown += `~~${processNode(element)}~~`;
          break;
        default:
          markdown += processNode(element);
      }
    }
  }

  return markdown;
}

function convertTableToMarkdown(tableElement: HTMLElement): string {
  const rows: string[][] = [];
  let maxColumns = 0;

  const allRows = tableElement.querySelectorAll("tr");

  allRows.forEach((tr) => {
    const cells: string[] = [];
    const cellElements = tr.querySelectorAll("th, td");

    cellElements.forEach((cell) => {
      const content = processNode(cell).trim().replace(/\n/g, " ");
      cells.push(content);
    });

    if (cells.length > maxColumns) {
      maxColumns = cells.length;
    }

    rows.push(cells);
  });

  if (rows.length === 0) {
    return "";
  }

  let markdown = "\n";

  // Add header row
  const headerRow = rows[0];
  while (headerRow.length < maxColumns) {
    headerRow.push("");
  }
  markdown += "| " + headerRow.join(" | ") + " |\n";

  // Add separator row
  markdown += "|" + " --- |".repeat(maxColumns) + "\n";

  // Add data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    while (row.length < maxColumns) {
      row.push("");
    }
    markdown += "| " + row.join(" | ") + " |\n";
  }

  markdown += "\n";
  return markdown;
}

// Worker message handler
self.onmessage = function (e: MessageEvent) {
  const { html, id } = e.data;

  try {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const markdown = processNode(temp);

    self.postMessage({ markdown, id });
  } catch (error) {
    self.postMessage({ error: (error as Error).message, id });
  }
};

self.onerror = function (error) {
  console.error("HTML to Markdown worker error:", error);
};
