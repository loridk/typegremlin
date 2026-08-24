# TypeGremlin Build Log

## August 23, 2026 — Project Conception

### The Idea

TypeGremlin is an open-source browser extension for expanding short, user-defined text shortcuts into longer snippets.

For example:

```text
;email
```

could expand to:

```text
lori@example.com
```

The goal is to make frequently typed information—email addresses, URLs, signatures, common responses, and other reusable text—quick and easy to insert without repeatedly typing or copying and pasting it.

### Initial Priorities

TypeGremlin is being designed around a few principles from the beginning:

- **Privacy-first:** Snippets should stay on the user's device.
- **Local-first:** The core extension should not require an account, server, or internet connection.
- **Secure:** TypeGremlin should never expand snippets inside password fields and should request the minimum browser permissions necessary.
- **Accessible:** Keyboard and screen reader accessibility will be considered throughout development rather than added as a final audit.
- **Open source:** The project will be publicly available for people to inspect, modify, learn from, and contribute to.
- **Simple:** The first version should do one thing well before additional features are introduced.

### Initial Technical Decisions

- Build TypeGremlin as a Chrome extension using **Manifest V3**.
- Begin with **vanilla JavaScript** rather than introducing React or another framework before there is a clear reason to do so.
- Store snippets locally using browser extension storage.
- Do not collect analytics or maintain a history of what the user types.
- Do not transmit snippet contents to a server.
- Never perform text expansion inside password fields.
- Treat snippets as plain text initially rather than allowing arbitrary HTML.
- Request the minimum browser permissions possible.
- Keep accessibility and security requirements part of each implementation decision.
- Keep the project private during initial development, with the intention of releasing it as open source.
- Use the **GPL-3.0 license** when the project is released.

### Initial MVP

The first milestone is intentionally small:

> Type `;email` into a standard text field and have TypeGremlin replace it with a hard-coded email address.

The first implementation only needs to prove that TypeGremlin can:

1. Run as a Chrome extension.
2. Detect a defined shortcut in a normal text-entry control.
3. Replace the shortcut with its associated text.
4. Preserve expected typing and cursor behavior.

Once that works reliably, snippet storage and a user interface for creating and managing shortcuts can be added.

### Planned Early Testing

After the basic proof of concept works, expansion behavior will need to be tested progressively against:

- Standard text inputs
- Textareas
- `contenteditable` elements
- Multiline snippets
- Cursor positions in the middle of existing text
- Dynamically created form controls
- React-controlled inputs and other JavaScript-heavy interfaces
- Undo/redo behavior
- Gmail-style rich-text editors
- Password and other sensitive input types
- Shortcut collisions and accidental expansions

### Build Log Philosophy

This log will record more than completed features.

Unexpected browser behavior, failed approaches, accessibility findings, security decisions, architectural changes, and technical tradeoffs will also be documented.

Those decisions are an important part of TypeGremlin's development story—and will eventually form the basis of a project case study and blog post.

### First Working Text Expansion

Implemented the first functional TypeGremlin expansion.

The initial hard-coded shortcut:

`;email` → `test@example.com`

TypeGremlin now:

- Detects a shortcut immediately before the cursor.
- Replaces only the shortcut rather than rewriting the entire field.
- Preserves text before and after the shortcut.
- Places the cursor at the end of the inserted replacement.
- Supports inserting a shortcut in the middle of existing text.
- Continues to skip fields identified as sensitive.

The implementation uses the browser's native `setRangeText()` method to replace the exact shortcut range.

Testing confirmed basic expansion works correctly in standard text inputs and textareas.

### Undo Behavior Finding

Testing revealed that TypeGremlin's initial `setRangeText()` implementation does not integrate correctly with Chrome's native undo history.

After expanding:

`;email` → `test@example.com`

pressing Ctrl+Z does not reliably restore the original shortcut.

This matters because predictable undo behavior is part of normal keyboard interaction and is especially important for an extension that modifies user-entered text.

The initial replacement approach will need to be revised or supplemented so TypeGremlin's expansions participate in native browser edit history.

### Preserving Native Undo Behavior

Initial text expansion used `setRangeText()`, which correctly replaced the shortcut and preserved the cursor position. Testing revealed, however, that the resulting change did not behave correctly with Chrome's native undo history.

After expanding:

`;email` → `test@example.com`

pressing Ctrl+Z did not reliably restore the original `;email` shortcut.

A second approach using `document.execCommand("insertText")` was tested. Although `execCommand()` is deprecated, this approach correctly participates in Chrome's native editing history: pressing Ctrl+Z after an expansion restores the original shortcut.

The deprecated API has been isolated in an `insertTextWithUndo()` helper rather than used throughout the expansion logic. This makes the dependency explicit and gives TypeGremlin a single place to replace the implementation if a reliable modern alternative becomes available.

For now, preserving expected keyboard and undo behavior was prioritized over avoiding the deprecated API entirely.

### Multiple Shortcut Support

Refactored the initial single hard-coded shortcut into a collection of snippets.

TypeGremlin can now recognize and expand multiple shortcuts, including:

- `;email` → `test@example.com`
- `;hello` → `Hello there!`

The expansion logic now iterates through the available snippets and stops after finding a matching shortcut.

This separates the expansion engine from any individual shortcut and prepares TypeGremlin for user-defined snippets stored outside the content script.

### Local Snippet Storage

Added Chrome's `storage` permission and updated TypeGremlin to load snippets using `chrome.storage.local`.

On installation, the background service worker initializes storage with two development snippets when no snippet collection exists:

- `;email` → `test@example.com`
- `;hello` → `Hello there!`

This separates snippet data from the expansion engine and prepares the extension for user-created snippets.

The `storage` permission was added specifically because persistent snippet storage requires it. No additional Chrome permissions were added.

TypeGremlin continues to follow a minimum-permissions approach: browser capabilities will only be requested when a feature has a specific need for them.

Snippet data remains local and is not transmitted to a server.

### Storage Initialization and Content-Script Guardrails

Added a Manifest V3 background service worker to initialize the development
snippet collection without making the content script responsible for extension
lifecycle state.

Initialization is safe to run after either an install or an update because it
only writes defaults when the `snippets` key is missing. Existing user data is
left unchanged.

The content script now ignores `input` events unless their target is a standard
HTML input or textarea. This prevents errors on pages that dispatch input events
from unsupported controls such as `contenteditable` elements. Rich-text support
remains planned work rather than being partially or silently implemented.

Sensitive-field detection now treats `autocomplete` as a token list and checks
both the field name and ID for common `password` and `passwd` identifiers. This
keeps the real-world Yahoo-style password-field guard conservative even when a
site incorrectly exposes the control as `type="text"`.

The content script also listens for changes to local snippet storage so future
settings changes can take effect in already-open pages without requiring a page
refresh.

### TypeScript Migration

Migrated the background service worker and content script from JavaScript to
strict TypeScript. TypeScript was introduced both as a learning goal and to make
TypeGremlin's storage, Chrome API, and DOM boundaries more explicit and safer as
the extension grows.

The build remains intentionally small. TypeGremlin uses the TypeScript compiler
and Chrome type definitions without adding a framework or bundler. Authored
TypeScript remains in `src/`, while Chrome loads the generated JavaScript from
`dist/`.

Strict checking immediately identified values whose contracts had previously
been implicit, including the text passed to the undo helper, supported form
control types, and the structure of snippets loaded from Chrome storage.

Because TypeScript types do not exist at runtime, stored snippet data is now
validated before use. The content script accepts only a non-array object with
non-empty shortcut names and string replacements. Invalid stored data safely
falls back to an empty snippet collection rather than being trusted through a
type assertion.

The migration was verified with the TypeScript checker and compiler. Manual
Chrome testing confirmed that standard input and textarea expansion, native
undo behavior, and sensitive password-field blocking continue to work after
Chrome was updated to load the compiled files.

### Accessible Snippet Settings View

Added TypeGremlin's first settings page as a read-only view of the snippets
stored on the current device. Chrome opens the page in its own tab through the
manifest's `options_page` field. No additional Chrome permission was required.

The initial interface uses semantic HTML without styling. A heading hierarchy
provides a clear page structure, and a description list represents each
shortcut and replacement as a related pair. An always-present `role="status"`
message communicates loading, empty, success, and failure states.

The settings script validates data read from Chrome storage before displaying
it. Shortcut and replacement values are inserted with `textContent`, so stored
HTML-like content remains plain text rather than being interpreted as markup or
script.

The page was manually verified in Chrome with the two development snippets. It
reported two saved snippets and displayed both shortcut/replacement pairs. The
interface is intentionally read-only at this stage; adding, editing, and
deleting snippets remain separate future milestones.

### Accessible Snippet Creation

Added a semantic form to the settings page for creating locally stored
snippets. The form uses associated labels, visible instructions, native
`required` and `maxlength` constraints, a native submit button, and an
always-present status region.

Shortcuts are limited to 50 characters, trimmed at their outer edges, and
rejected if they are empty or contain whitespace. Replacements are limited to
5,000 characters and rejected if they contain only whitespace. Valid
replacement text is preserved exactly, including intentional surrounding
spaces and line breaks.

Duplicate shortcuts are detected case-insensitively so visually similar rules
such as `;email` and `;EMAIL` cannot coexist. Before saving, TypeGremlin reloads
and validates the current storage value. Malformed stored data is treated as an
error and is not silently overwritten.

After a successful save, the form resets, the saved-snippet list and count are
updated, a success message is announced, and keyboard focus returns to the
shortcut field. Failed saves preserve the user's entered values. Existing
content scripts receive the storage change, allowing a newly created shortcut
to work on an already-open page without another refresh.

Manual testing covered valid creation, immediate expansion, case-insensitive
duplicate rejection, whitespace validation, status messages, focus behavior,
and keyboard-only submission. The feature required no additional Chrome
permission or dependency.

### Accessible Snippet Deletion

Added individual deletion controls to the saved-snippet list. Each button names
the shortcut it affects, making the action clear visually and to screen-reader
users.

Deletion uses a two-step inline confirmation rather than immediately removing
data or opening a custom modal. Selecting a delete button reveals clearly named
Confirm and Cancel controls beside the affected snippet and moves keyboard
focus to the confirmation action. Canceling restores the original button and
returns focus to it.

Before confirming a deletion, TypeGremlin reloads and validates the latest
stored collection. It refuses to modify malformed data, verifies that the exact
shortcut still exists, and removes only that entry. Deleting the final snippet
would store a valid empty collection rather than causing development defaults
to reappear.

After a successful deletion, the list and saved count update, a dedicated
status region announces the deleted shortcut, and focus moves to that status so
it is not lost when the original button leaves the page. Existing content
scripts receive the storage update immediately.

Manual keyboard and Chrome testing covered opening and canceling confirmation,
successful deletion, focus movement, count updates, removal from expansion on
an already-open page, and continued operation of unaffected snippets. No new
permission or dependency was added.

### Accessible Snippet Editing

Extended the existing snippet form to support editing both shortcuts and
replacement text. Each saved entry now has a clearly named Edit button. Entering
Edit mode fills the form with the current values, updates the form heading and
submit-button text, reveals a native Cancel button, and moves focus to the
shortcut field.

The form tracks its mode with a `string | null` TypeScript union. A string
identifies the original shortcut being edited, while `null` represents Add
mode. The save operation captures that value before its first asynchronous
storage call so the intended operation remains stable while it awaits Chrome.

Snippet collections continue to use `[string, string]` tuples. Explicit tuple
return types keep edited entries as fixed shortcut/replacement pairs when
mapping the collection, rather than allowing TypeScript to infer less precise
string arrays.

Before updating, TypeGremlin reloads and validates storage, confirms that the
original entry still exists, and rejects case-insensitive collisions with every
other shortcut. Renaming replaces the original key in its existing position
rather than leaving a duplicate entry behind. Failed updates preserve both the
stored collection and the user's form values.

Canceling restores Add mode and returns focus to the Edit button that opened
the form when that button still exists. Deleting the snippet currently being
edited exits Edit mode safely. Rendering refreshes the stored focus reference
when list buttons are recreated.

During asynchronous saves and deletions, the snippet list is temporarily
`inert` and relevant form actions are disabled. This prevents competing storage
operations from reading the same older collection and overwriting one another.
A `finally` block restores interaction after success, failure, or an early
duplicate return.

Manual Chrome and keyboard testing covered entering and canceling Edit mode,
replacement updates, shortcut renaming, duplicate rejection, immediate changes
on an already-open page, deletion during editing, focus movement, and recovery
to Add mode. No new permission or dependency was required.

### Portable JSON Snippet Export

Added a settings-page control for downloading a portable backup of the snippets
stored on the current device. Export reloads and validates the latest storage
value before creating a file and refuses to export malformed data.

The backup uses a documented, versioned JSON shape containing a fixed
`typegremlin-snippets` format identifier, schema version `1`, an ISO 8601 export
timestamp, and the plain-text shortcut/replacement collection. It does not
include browser history, device identifiers, analytics, or unrelated extension
data.

TypeScript represents the backup with a `SnippetBackup` interface. Literal
types require the exact format identifier and schema version during development,
while the snippet collection remains a `Record<string, string>`. These
compile-time guarantees describe TypeGremlin's own output; future imports will
still require runtime validation because external JSON is untrusted.

The extension serializes the typed object with readable, indented JSON and
creates an in-memory `Blob`. A temporary object URL and local anchor with the
native `download` attribute trigger the browser download. Nested `try` and
`finally` blocks revoke the object URL and restore the Export button even if an
operation fails.

The exported filename includes the UTC calendar date, and an accessible status
region reports the number of snippets exported and receives focus after success
or failure. The downloaded file was manually verified for its filename,
metadata, snippet contents, valid JSON structure, and absence of unrelated
information.

Export uses normal browser download behavior and requires no `downloads`
permission, network request, account, server, or additional dependency.
