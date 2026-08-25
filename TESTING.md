# TypeGremlin Testing

This document records TypeGremlin's repeatable functional, accessibility,
security, privacy, and compatibility tests.

## Status legend

- ✅ Verified
- ❌ Failed
- ⏳ Not tested
- 🚫 Intentionally unsupported

## Test environment

Complete this section for each formal test pass.

- **Date:**
- **Commit:**
- **Chrome version:**
- **Windows version:**
- **Installation:** Unpacked development extension

Before testing source changes:

```bash
npm run check
npm run build
```

Reload TypeGremlin at `chrome://extensions`, then refresh each test page unless
the test specifically verifies behavior without a refresh.

## Core expansion

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Standard text input | Type a saved shortcut in an `<input type="text">`. | Only the shortcut is replaced. |
| ✅ | Textarea | Type a saved shortcut in a `<textarea>`. | Only the shortcut is replaced. |
| ✅ | Existing surrounding text | Type a shortcut between existing text. | Text before and after the shortcut is preserved. |
| ✅ | Cursor placement | Expand a shortcut in the middle of a value. | The cursor lands at the end of the replacement. |
| ✅ | Multiple shortcuts | Expand `;email` and `;hello`. | Each shortcut inserts its own replacement. |
| ✅ | Multiline replacement | Expand a replacement containing a line break in a textarea. | Every line is inserted as plain text. |
| ✅ | Undo | Expand a shortcut and immediately press Ctrl+Z. | The original shortcut is restored. |
| ✅ | Redo | Undo an expansion and press Ctrl+Y. | The expansion is restored predictably. |
| ✅ | Dynamically created input | Add an input to the page after load and type a shortcut. | Event delegation detects and expands it. |
| ✅ | React-controlled input | Type a shortcut in a React-controlled field. | Expansion persists without framework state reverting it. |
| 🚫 | `contenteditable` | Type a shortcut in a `contenteditable` region. | No expansion occurs in the current version. |
| 🚫 | Rich-text editor | Type in a Gmail-style rich-text editor. | No expansion is currently promised. |

## Extension access

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Toolbar action | Click TypeGremlin's Chrome toolbar button. | TypeGremlin Settings opens. |
| ✅ | Branded icon | Reload the unpacked extension and inspect Chrome's toolbar and extension card. | The TypeGremlin icon is visible and recognizable. |
| ✅ | Store icon spacing | Inspect the 128px icon at full size. | The selected G artwork is centered within transparent padding and remains crisp and recognizable. |

## Release packaging

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Reproducible package command | Run `npm run package`. | Type checking and compilation pass before a versioned release folder and ZIP are created. |
| ✅ | Runtime-file allowlist | Inspect the staged folder and ZIP. | Only the manifest, privacy policy, compiled scripts, icons, options HTML, and options CSS are included. |
| ✅ | Manifest at ZIP root | Inspect the archive structure. | `manifest.json` is at the archive root rather than inside an extra parent folder. |
| ✅ | Version agreement | Compare `package.json`, `manifest.json`, and the release filename. | All three use the same Chrome-compatible version. |
| ✅ | Development-file exclusion | Inspect the archive contents. | TypeScript source, source maps, build scripts, documentation, dependencies, and repository metadata are excluded. |
| ✅ | Packaged-extension smoke test | Load the versioned staging folder unpacked and test the primary flow. | The toolbar opens Settings, a fresh install starts empty, a newly added shortcut expands, styles load, and the privacy link opens. |

## Sensitive-field protection

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Native password input | Type a shortcut in `<input type="password">`. | Nothing expands. |
| ✅ | Yahoo-style disguised password | Use a text input identified by `autocomplete="current-password"`, a password-related name, or a `passwd` ID. | Nothing expands. |
| ✅ | New-password autocomplete | Type in a field with `autocomplete="new-password"`. | Nothing expands. |
| ✅ | Multi-token autocomplete | Test a password autocomplete value containing multiple tokens. | Password tokens are detected and nothing expands. |
| ✅ | Ordinary text control | Type in a normal control without sensitive identifiers. | Expansion is not blocked by the sensitive-field heuristic. |

## Settings: create, read, update, and delete

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Load saved snippets | Open Extension options. | The validated collection and correct count appear. |
| ✅ | Add | Submit a valid shortcut and replacement. | The snippet is stored, listed, announced, and immediately usable. |
| ✅ | Required values | Submit empty or whitespace-only values. | Native/custom validation prevents saving. |
| ✅ | Shortcut whitespace | Submit a shortcut containing whitespace. | Saving is blocked with a field-specific message. |
| ✅ | Length limits | Use the form's shortcut and replacement limits. | The browser prevents values beyond the declared limits. |
| ✅ | Duplicate shortcut | Submit a case-insensitive duplicate such as `;EMAIL`. | Saving is blocked and storage is unchanged. |
| ✅ | Enter Edit mode | Select a snippet's Edit button. | Values populate the form and focus moves to Shortcut. |
| ✅ | Cancel Edit mode | Select Cancel editing. | Add mode returns, storage is unchanged, and focus returns predictably. |
| ✅ | Edit replacement | Change only replacement text and save. | The entry updates in place and open pages receive the change. |
| ✅ | Rename shortcut | Change the shortcut and save. | The old key is removed and the new key expands. |
| ✅ | Delete cancellation | Select Delete and then Cancel. | Storage is unchanged and focus returns to Delete. |
| ✅ | Confirm deletion | Confirm deletion for one snippet. | Only that entry is removed and the result is announced. |
| ✅ | Delete while editing | Begin editing a snippet, then delete it. | Edit mode ends safely and the snippet is removed. |
| ✅ | Delete final snippet | Delete the only remaining entry. | A valid empty collection remains and defaults do not reappear. |

## Backup export

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Export | Select Export snippets. | A dated JSON file downloads without a new Chrome permission. |
| ✅ | Backup schema | Inspect the downloaded file. | Format, version, ISO timestamp, and snippets are present. |
| ✅ | Backup privacy | Inspect all exported fields. | No device, browser-history, analytics, or unrelated data appears. |
| ✅ | JSON validity | Open the backup as JSON. | The document parses and preserves snippet text. |
| ✅ | Empty export | Export an empty collection. | A valid backup with an empty snippets object downloads. |

## Backup import

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Review valid backup | Choose a valid version 1 backup and select Review backup. | Counts appear, confirmation is shown, and storage is unchanged. |
| ✅ | Cancel import | Cancel after review. | Pending state and file selection clear; storage is unchanged. |
| ✅ | Confirm replacement | Confirm a reviewed backup. | The imported collection replaces the previous collection. |
| ✅ | Restore original backup | Import an untouched export after a replacement test. | The original collection is restored. |
| ✅ | HTML-like replacement | Import text containing HTML-like markup. | It renders and expands as plain text rather than markup. |
| ✅ | Multiline replacement | Import and expand a multiline replacement. | Line breaks are preserved. |
| ✅ | Invalid schema | Review JSON with an incorrect format/schema. | Confirmation stays hidden and storage is unchanged. |
| ✅ | Stale confirmation | Review in one Settings tab, change storage in another, then confirm. | Import is refused and the visible list refreshes. |
| ✅ | Malformed JSON syntax | Review a file that cannot be parsed as JSON. | A safe error appears and storage is unchanged. |
| ✅ | Empty file | Review a zero-byte file. | It is rejected before reading. |
| ✅ | Oversized file | Review a file larger than 12 MB. | It is rejected before reading. |
| ✅ | Wrong schema version | Review a backup with a different version. | It is rejected without attempting migration. |
| ✅ | Unexpected top-level field | Add an extra field to an otherwise valid backup. | Strict schema validation rejects it. |
| ✅ | Oversized shortcut/replacement | Import values beyond application limits. | Validation rejects the complete backup. |
| ✅ | Case-insensitive imported collision | Import keys differing only by case. | Validation rejects the complete backup. |
| ⏳ | Storage quota failure | Attempt an import that Chrome cannot store. | Chrome rejects the write and existing snippets remain unchanged. |

## Storage lifecycle and concurrency

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Fresh installation | Remove the extension, load it unpacked, and inspect Settings. | A valid empty collection initializes without sample snippets. |
| ✅ | Preserve existing storage | Reload or update the extension with saved snippets. | Existing snippets are not overwritten by initialization. |
| ✅ | Open-page update | Add, edit, delete, or import while a test page is open. | The content script receives the new collection without a refresh. |
| ✅ | Same-page operation lock | Start a storage operation and attempt a competing Settings action. | Busy controls prevent overlapping actions. |
| ✅ | Cross-tab stale import | Change storage after reviewing an import elsewhere. | Snapshot comparison blocks stale replacement. |

## Security and privacy review

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Manifest permissions | Inspect `manifest.json`. | `storage` remains the only named permission. |
| ✅ | Network behavior | Inspect source and extension behavior. | No snippet data is transmitted to a server. |
| ✅ | Safe DOM rendering | Store HTML-like shortcut or replacement content. | Values enter the DOM through `textContent`. |
| ✅ | Untrusted JSON boundary | Review import code. | Parsed JSON remains `unknown` until runtime validation succeeds. |
| ✅ | Plain-object validation | Review malformed object shapes. | Arrays, `null`, primitives, and unexpected prototypes are rejected. |
| ✅ | Prototype-safe construction | Inspect storage/import reconstruction. | Validated entries use `Object.fromEntries()` instead of bracket assignment. |
| ✅ | Strict import metadata | Review parser rules. | Format, version, timestamp, and exact keys are required. |
| ✅ | `__proto__` shortcut | Import or store a shortcut with this literal name. | It remains inert data and does not alter object prototypes. |
| ✅ | Extension uninstall | Uninstall TypeGremlin. | Local extension storage is removed as documented. |

## Accessibility

| Status | Test | Action | Expected result |
|---|---|---|---|
| ✅ | Heading structure | Inspect the Settings page headings. | Sections follow a meaningful hierarchy. |
| ✅ | Labels and instructions | Inspect form controls. | Every control has an associated label and visible guidance. |
| ✅ | Native controls | Navigate Settings. | Inputs, textareas, file inputs, and buttons use native elements. |
| ✅ | Keyboard-only CRUD | Add, edit, cancel, and delete without a pointer. | Every action is reachable and operable. |
| ✅ | Keyboard-only import/export | Review, cancel, confirm, and export without a pointer. | Every action is reachable and focus remains predictable. |
| ✅ | Focus after dynamic actions | Complete or cancel each action. | Focus moves to the initiating control, next field, or status as documented. |
| ✅ | Live status structure | Inspect the DOM. | Status regions exist before messages are updated. |
| ✅ | Screen-reader announcements | Test with NVDA or another Windows screen reader. | Loading, validation, success, cancellation, and failure messages are announced clearly. |
| ✅ | Zoom and text scaling | Test at 200% and 400% zoom. | Content remains usable without horizontal scrolling at supported widths. |
| ✅ | High contrast | Test Windows High Contrast/Forced Colors. | Controls and focus remain perceivable. |
| ✅ | Reduced motion | Test reduced-motion preferences after styling. | Nonessential animation is removed or reduced. |

## Known limitations

- TypeGremlin currently supports standard inputs and textareas, not
  `contenteditable` or rich-text editors.
- The current extension targets Chrome Manifest V3; other Chromium browsers
  and Firefox have not been formally tested.
- `document.execCommand("insertText")` is deprecated but remains isolated because
  it preserves expected native undo behavior in current Chrome testing.
- Import replaces the complete collection. Merge behavior is not implemented.
- The Settings page is intentionally unstyled while behavior, security, and
  accessibility are established.
