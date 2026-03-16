# DEVELOPMENT_PLAN.md

## Current Focus

- **UI/UX Refinement:** Enhance user interface and experience based on feedback.
- **Performance Optimization:** Improve application speed and resource usage.
- **New Feature Integration:** Add support for real-time collaboration.

## Future Considerations

- **Cross-platform Compatibility:** Ensure seamless operation on Windows, macOS, and Linux.
- **Mobile App Development:** Explore possibilities for a companion mobile application.
- **AI Integration:** Investigate potential AI-driven features for enhanced user productivity.

## Milestones

### Q1 2024 (Completed)

- Core feature development
- Initial beta release

### Q2 2024 (In Progress)

- Bug fixing and stability improvements
- UI/UX enhancements
- Performance optimization

### Q3 2024 (Planned)

- Real-time collaboration implementation
- User feedback incorporation

### Q4 2024 (Planned)

- Cross-platform compatibility testing and release
- Security audits

## Key Decisions

- **Tech Stack:** Electron with React for desktop application.
- **Data Storage:** Local storage with optional cloud sync.
- **Collaboration Model:** Centralized real-time sync server.

## Executable Tasks

- Task: Harden base-dir path checks
  - Description: Update path safety logic to allow exact base directory but reject parents ("..") or absolute paths. Add tests.
  - Owner: AI Assistant
  - Priority: High
  - Status: Completed ✅
  - Estimate: 6-10h
  - Prerequisites: None
  - Deliverables: Updated security.ts, unit tests, README notes
  - Date: 2026-03-16

- Task: Enforce markdown file extensions on save
  - Description: After sanitising the path, ensure extension is .md or .markdown; reject others with a clear error.
  - Owner: AI Assistant
  - Priority: High
  - Status: To Do
  - Estimate: 4-6h
  - Prerequisites: None
  - Deliverables: Updated validator, tests, error messages

- Task: Resolve symlinks before path checks
  - Description: Use realpath to resolve symlinks before base-dir comparison; add tests for edge cases.
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 6h
  - Prerequisites: None
  - Deliverables: Realpath-based checks, tests

- Task: Guard save-file-dialog handler against missing window
  - Description: Add if (!win) return guard in the save-file-dialog handler.
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 2-3h
  - Prerequisites: None
  - Deliverables: Code guard + tests if applicable

- Task: Prompt for unsaved changes on window close
  - Description: Implement close listener that checks for dirty edits and prompts, cancel close if needed.
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 6-8h
  - Prerequisites: None
  - Deliverables: Close prompt logic, UX copy, test coverage

- Task: Cache-key strategy for Markdown content
  - Description: Change cache to key on content hash; verify eviction works.
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 6h
  - Prerequisites: None
  - Deliverables: New cache logic, tests

- Task: HTML → Markdown sanitisation
  - Description: Pipe pasted HTML through DOMPurify (or equivalent) before conversion.
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 4-6h
  - Prerequisites: None
  - Deliverables: Sanitised input path, tests

- Task: Async/parallelize large HTML → Markdown work
  - Description: Move heavy conversions off main thread (web worker or idle callbacks).
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 8-12h
  - Prerequisites: None
  - Deliverables: Async pipeline, benchmarks

- Task: Add unit tests for path validation
  - Description: Cover empty path, same-dir, ".." climbing, symlink-out, non-markdown ext.
  - Owner: AI Assistant
  - Priority: High
  - Status: Completed ✅
  - Estimate: 8-12h
  - Prerequisites: None
  - Deliverables: Test suite + docs
  - Date: 2026-03-16

- Task: CI script for lint + tests
  - Description: Add a simple CI step to run npm run lint && npm test on push.
  - Owner: AI Assistant
  - Priority: Medium
  - Status: To Do
  - Estimate: 4h
  - Prerequisites: None
  - Deliverables: CI config

- Task: Documentation: Security considerations
  - Description: Add a short Security Considerations section to README with best practices.
  - Owner: AI Assistant
  - Priority: Low
  - Status: To Do
  - Estimate: 2-3h
  - Prerequisites: None
  - Deliverables: README updated
