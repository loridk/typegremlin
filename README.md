# TypeGremlin

TypeGremlin is an early-stage, privacy-first Chrome extension that expands
short, user-defined shortcuts into longer plain-text snippets.

## Current status

The proof of concept currently:

- expands snippets in standard text inputs and textareas;
- stores snippet data locally with `chrome.storage.local`;
- avoids expansion in fields identified as password fields;
- preserves Chrome's native undo behavior for tested standard fields; and
- requests only Chrome's `storage` permission.

Support for `contenteditable` and rich-text editors is planned but is not yet
implemented. The included snippets are development examples, not a settings
interface.

## Local development

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project folder.
4. After changing the source, reload TypeGremlin and refresh the page used for
   testing.

TypeGremlin runs on all regular webpage URLs so it can expand text wherever the
user types. It does not request access to tabs, browsing history, cookies, the
clipboard, downloads, or the network.

## Project notes

See [BUILD_LOG.md](BUILD_LOG.md) for implementation decisions, test findings,
and known tradeoffs.
