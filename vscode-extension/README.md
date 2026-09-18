# Markit for VS Code

This is the first VS Code version of Markit. It adds a live Markdown preview
that uses the active VS Code document and updates as the document changes.

## Run in VS Code

1. Run `npm install` from the repository root.
2. Run `npm run build:extension`.
3. Open this repository in VS Code.
4. Press `F5` and choose the Extension Development Host configuration, or run
   the command `Developer: Install Extension from Location...` with the
   `vscode-extension` directory after building.
5. Open a Markdown file and run `Markit: Open Preview` from the Command
   Palette. The shortcut is `Cmd+Shift+M` on macOS and `Ctrl+Shift+M` elsewhere.

## Package a VSIX

Run `npm run package:extension` from the repository root. This creates a
`.vsix` package that can be installed with `Extensions: Install from VSIX...`.