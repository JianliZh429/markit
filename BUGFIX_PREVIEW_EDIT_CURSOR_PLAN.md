# Preview-Edit Cursor Fix Plan

This branch will implement:
- Fix content corruption in preview input
- Synchronize cursor between preview and edit modes and center view on cursor

Work plan:
1. Add unified DocumentModel for both modes.
2. Implement input queue to serialize edits in preview.
3. Introduce CursorController with getCursor/setCursor/centerView.
4. Update mode-switch logic to apply shared cursor state and center view.
5. Add unit tests scaffolding.
