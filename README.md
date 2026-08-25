# TypeGremlin

TypeGremlin is a privacy-first Chrome extension that expands short, user-defined
shortcuts into longer plain-text snippets.

## Current status

The initial 1.0.0 release:

- expands snippets in standard text inputs and textareas;
- stores snippet data locally with `chrome.storage.local`;
- provides a settings page for adding, viewing, editing, and deleting saved snippets;
- imports and exports saved snippets as portable JSON backups;
- avoids expansion in fields identified as password fields;
- preserves Chrome's native undo behavior for tested standard fields;
- opens Settings directly from its Chrome toolbar action; and
- requests only Chrome's `storage` permission.

Version 1.0.0 has been submitted to the Chrome Web Store and is currently
pending review. It is not yet published in the store.

TypeGremlin uses strict TypeScript with a minimal compiler-only build process.
Chrome runs the generated JavaScript in `dist/`; no framework or bundler is
currently required.

Support for `contenteditable`, rich-text editors, and fields hosted inside
embedded frames is planned but is not yet implemented.

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

## Release package

Create a Chrome Web Store-ready ZIP with:

```bash
npm run package
```

The command checks and compiles the TypeScript source, stages only the runtime
files, verifies that the package and manifest versions match, confirms every
manifest-referenced file is present, and creates
`release/typegremlin-<version>.zip` with `manifest.json` at its root.

The versioned staging folder remains beside the ZIP so it can be loaded unpacked
for final testing. Release output is generated locally and ignored by Git.

## Project notes

See [BUILD_LOG.md](BUILD_LOG.md) for implementation decisions and known
tradeoffs. See [TESTING.md](TESTING.md) for the manual test matrix, current
results, and remaining test coverage. See the published
[privacy policy](https://loridunford.com/typegremlin/privacy.html) for
TypeGremlin's local data practices.
