# TypeGremlin

TypeGremlin is an early-stage, privacy-first Chrome extension that expands
short, user-defined shortcuts into longer plain-text snippets.

## Current status

The proof of concept currently:

- expands snippets in standard text inputs and textareas;
- stores snippet data locally with `chrome.storage.local`;
- provides a settings page for adding, viewing, editing, and deleting saved snippets;
- imports and exports saved snippets as portable JSON backups;
- avoids expansion in fields identified as password fields;
- preserves Chrome's native undo behavior for tested standard fields; and
- requests only Chrome's `storage` permission.

TypeGremlin uses strict TypeScript with a minimal compiler-only build process.
Chrome runs the generated JavaScript in `dist/`; no framework or bundler is
currently required.

Support for `contenteditable` and rich-text editors is planned but is not yet
implemented.

## Local development

1. Install the development dependencies:

   ```bash
   npm install
   ```

2. Compile the TypeScript source:

   ```bash
   npm run build
   ```

3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select this project folder.
6. After changing the TypeScript source, run `npm run build`, reload
   TypeGremlin, and refresh the page used for testing.

TypeGremlin runs on all regular webpage URLs so it can expand text wherever the
user types. It does not request access to tabs, browsing history, cookies, the
clipboard, downloads, or the network.

## Project notes

See [BUILD_LOG.md](BUILD_LOG.md) for implementation decisions, test findings,
and known tradeoffs.
