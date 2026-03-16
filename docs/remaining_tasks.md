# Remaining Tasks

## Task 5: Async/parallelize large HTML → Markdown work

**Priority:** Medium  
**Estimate:** 8-12h  
**Status:** In Progress

### Overview
Move heavy HTML → Markdown conversions off the main thread using a Web Worker to prevent UI blocking for large content.

### Current Implementation
- `MarkdownService.htmlToMarkdown()` uses synchronous DOM parsing
- Large HTML content can block the main thread
- Called during paste operations in both editor and preview modes

### Approach
1. Create a Web Worker for HTML → Markdown conversion
2. Keep small content sync for responsiveness
3. Offload large content (>10KB) to worker
4. Add timeout/fallback for worker communication

### Implementation Steps

1. **Create Web Worker** (`markit/renderer/workers/htmlToMarkdown.worker.ts`)
   - Receives HTML string via `postMessage`
   - Returns markdown string via `postMessage`
   - Uses same DOM processing logic as current `processNode`

2. **Update MarkdownService**
   - Add worker instance (lazy-loaded)
   - Split small vs large content handling
   - Add timeout for worker communication
   - Maintain cache for previously converted content

3. **Add tests**
   - Test small content (sync)
   - Test large content (worker)
   - Test worker error handling
   - Test timeout fallback

4. **Cleanup**
   - Remove worker on unload
   - Handle worker restart on errors

### Success Criteria
- Large HTML paste (10KB+) doesn't block UI
- Small content (<1KB) still converts synchronously (no overhead)
- Worker errors handled gracefully with fallback
- All existing tests pass

### Related Files
- `markit/renderer/services/markdownService.ts` - Main service to update
- `markit/renderer/workers/htmlToMarkdown.worker.ts` - New worker file
- `markit/renderer/modules/editor.ts` - Uses htmlToMarkdown
- `markit/renderer/modules/preview.ts` - Uses htmlToMarkdown
- `tests/renderer/markdownService.test.ts` - New/updated tests

---

## Other Remaining Tasks

### Task 3: Cache-key strategy for Markdown content
**Priority:** Medium  
**Status:** To Do

Change cache to key on content hash; verify eviction works.

### Task 4: HTML → Markdown sanitisation
**Priority:** Medium  
**Status:** To Do

Pipe pasted HTML through DOMPurify (or equivalent) before conversion.

### Task 6: CI script for lint + tests
**Priority:** Medium  
**Status:** To Do

Add a simple CI step to run `npm run lint && npm test` on push.

### Task 7: Documentation: Security considerations
**Priority:** Low  
**Status:** To Do

Add a short Security Considerations section to README with best practices.
