# Markit User Manual

**Version:** 0.0.7  
**Last Updated:** March 20, 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Interface](#user-interface)
3. [Working with Files](#working-with-files)
4. [Editing Markdown](#editing-markdown)
5. [Search & Navigation](#search--navigation)
6. [Settings & Preferences](#settings--preferences)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Installation

1. Download Markit from the [releases page](https://github.com/JianliZh429/markit/releases)
2. For macOS: Drag `Markit.app` to your Applications folder
3. For Linux: Install the `.deb` package using `sudo dpkg -i markit-*.deb`

### First Launch

1. Launch Markit from your Applications folder or command line
2. Open a Markdown file via **File → Open** or drag and drop a file
3. Optionally, open a folder to access the full file explorer

---

## User Interface

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  File  Edit  View  Window  Help                              │ ← Menu Bar
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  File    │  ┌────────────────────────────────────────────┐  │
│  Explorer│  │                                            │  │
│          │  │         Editor / Preview Area              │  │
│  ────────│  │                                            │  │
│  📁 docs │  │                                            │  │
│  📁 src  │  │                                            │  │
│  📄 README.md│                                            │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│  Edit Mode ▼                              Markdown File.md  │ ← Status Bar
└─────────────────────────────────────────────────────────────┘
```

### Components

- **Menu Bar**: Access all application features
- **File Explorer**: Navigate and manage files in your project
- **Editor/Preview Area**: Write markdown or view rendered preview
- **Status Bar**: Shows current mode and open file

---

## Working with Files

### Opening Files

- **Single File**: File → Open (Cmd/Ctrl + O)
- **Folder**: File → Open Folder (Cmd/Ctrl + D)
- **Recent Files**: File → Open Recent
- **Drag & Drop**: Drop files directly onto the window

### File Operations

All file operations are available via right-click context menu in the file explorer:

| Operation | How To |
|-----------|--------|
| **New File** | Right-click folder → New File |
| **Rename** | Right-click file/folder → Rename |
| **Delete** | Right-click file/folder → Delete |
| **Save** | File → Save (Cmd/Ctrl + S) |
| **Save As** | File → Save As (Shift + Cmd/Ctrl + S) |

### File Explorer Features

- **Expand/Collapse Folder**: Single-click on folder icon (left edge)
- **Open File**: Single-click on file icon (left edge) or double-click anywhere
- **Horizontal Scroll**: Scroll to view long filenames
- **Folder Indicators**: 
  - 📁 Empty folder
  - 📂 Folder with contents (when expanded)

### Recent Files Switcher

Quickly switch between recently opened files in the current folder:

1. Press **Cmd/Ctrl + Tab** to open the recent files modal
2. Use **Tab** to navigate forward, **Shift + Tab** to navigate backward
3. Release keys to open the selected file
4. Press **Escape** to cancel

---

## Editing Markdown

### Edit vs Preview Mode

Markit offers two viewing modes:

| Mode | Description | Toggle |
|------|-------------|--------|
| **Edit Mode** | Raw markdown editor with syntax highlighting | Cmd/Ctrl + E |
| **Preview Mode** | Rendered markdown with live formatting | Cmd/Ctrl + E |

### Smart Paste

When pasting content:
- HTML is automatically converted to Markdown
- Images are preserved
- Links are maintained
- Formatting is simplified

### Supported Markdown Features

- **Headers**: `# H1`, `## H2`, `### H3`, etc.
- **Emphasis**: `*italic*`, `**bold**`, `~~strikethrough~~`
- **Lists**: `- bullet`, `1. numbered`
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Code**: `` `inline` ``, ` ```language blocks` `
- **Tables**: `| col1 | col2 |`
- **Blockquotes**: `> quote`
- **Emoji**: `:emoji:` (e.g., `:smile:`, `:rocket:`)

---

## Search & Navigation

### Local Search (Current File)

1. Press **Cmd/Ctrl + F**
2. Type your search term
3. Navigate results with **F3** (next) or **Shift + F3** (previous)

### Global Search (All Files)

1. Press **Cmd/Ctrl + Shift + F**
2. Type your search term
3. Results show matching files with context
4. Click a result to open the file

### Search Tips

- Search is case-insensitive by default
- Special characters are escaped automatically
- Results highlight matches in context

---

## Settings & Preferences

### Opening Settings

- **Menu**: File → Settings
- **Keyboard**: Cmd/Ctrl + ,

### Available Settings

#### Appearance

| Setting | Options | Description |
|---------|---------|-------------|
| **Theme** | Light, Dark, Auto | Color scheme preference |
| **Font Family** | Monospace, System UI, Georgia, Arial, Times New Roman | Editor font |
| **Font Size** | 10-24px | Text size in editor and preview |

#### Editor

| Setting | Options | Description |
|---------|---------|-------------|
| **Autosave** | Enabled/Disabled | Auto-save files periodically |
| **Autosave Interval** | 5-300 seconds | How often to auto-save |

### Theme Options

- **Light**: Clean, bright interface for well-lit environments
- **Dark**: Easy on the eyes for low-light conditions
- **Auto**: Automatically matches your system's appearance

---

## Keyboard Shortcuts

### File Operations

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New File |
| `Cmd/Ctrl + O` | Open File |
| `Cmd/Ctrl + D` | Open Folder |
| `Cmd/Ctrl + S` | Save File |
| `Shift + Cmd/Ctrl + S` | Save As |
| `Cmd/Ctrl + ,` | Open Settings |

### Editing

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + A` | Select All |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Y` | Redo |
| `Cmd/Ctrl + /` | Toggle Edit/Preview Mode |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Toggle File Explorer |
| `Cmd/Ctrl + Tab` | Switch Recent Files |
| `F3` or `Cmd/Ctrl + G` | Find Next |
| `Shift + F3` or `Cmd/Ctrl + Shift + G` | Find Previous |

### Search

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Local Search |
| `Cmd/Ctrl + Shift + F` | Global Search |

### Window

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + W` | Close Window (macOS) |
| `Cmd/Ctrl + 0` | Reset Zoom |
| `Cmd/Ctrl + +` | Zoom In |
| `Cmd/Ctrl + -` | Zoom Out |

---

## Tips & Tricks

### Productivity Tips

1. **Use Edit/Preview Toggle**: Quickly check how your markdown renders
2. **Leverage Recent Files**: Use Cmd/Ctrl + Tab for fast file switching
3. **Global Search**: Find content across your entire project
4. **Autosave**: Enable autosave to never lose your work

### File Management Tips

1. **Organize with Folders**: Keep related markdown files together
2. **Use Descriptive Names**: Long filenames are fully visible with horizontal scroll
3. **Quick Create**: Right-click any folder to create new files

### Editor Tips

1. **Smart Paste**: Paste HTML content directly for automatic conversion
2. **Code Blocks**: Use language hints for syntax highlighting (e.g., ```typescript)
3. **Emoji Support**: Type `:emoji-name:` for emoji insertion

### Performance Tips

1. **Large Files**: Markit handles large files efficiently with lazy loading
2. **Folder Navigation**: Open folders instead of individual files for full features
3. **Cache**: Recently accessed content is cached for faster access

---

## Troubleshooting

### Common Issues

**File won't open:**
- Ensure the file has a `.md` extension
- Check file permissions

**Settings not saving:**
- Check write permissions for `~/.markit/config.json`
- Restart the application

**Search not finding results:**
- Verify you're in the correct directory
- Check for special characters that may need escaping

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/JianliZh429/markit/issues)
- **Discussions**: [Community discussions](https://github.com/JianliZh429/markit/discussions)

---

## About Markit

Markit is an open-source Markdown editor built with Electron and TypeScript. It's designed for writers who want a clean, distraction-free environment with powerful organization features.

**License:** MIT License  
**Source Code:** https://github.com/JianliZh429/markit
