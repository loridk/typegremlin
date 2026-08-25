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

### Secure JSON Snippet Import

Added settings-page restore controls for reviewing and importing a TypeGremlin
JSON backup. Import uses a replace-only policy for the initial version: users
are warned that the current collection will be replaced, encouraged to export
it first, and shown current/imported snippet counts before any write occurs.

Selected files are limited to 12 MB before their contents are read. The native
file input's accepted file types are treated only as a picker hint; file
contents remain untrusted. Parsed JSON is assigned to TypeScript's `unknown`
type so it cannot be used without runtime checks.

An `isPlainRecord()` type predicate rejects primitives, arrays, `null`, and
objects with unexpected prototypes. The backup parser requires exactly the
four documented top-level fields, the fixed format identifier, schema version
`1`, a round-trippable ISO timestamp, and a plain snippet object. Shortcut and
replacement limits, whitespace rules, and case-insensitive uniqueness are
validated for every entry.

Rather than asserting that parsed data is safe, the parser creates a new typed
`SnippetBackup` from validated values. Snippet objects are built with
`Object.fromEntries()` instead of untrusted bracket assignment, preventing
special keys such as `__proto__` from invoking legacy prototype behavior. The
content script's independent storage validator received the same structural,
length, whitespace, uniqueness, and safe-construction protections.

Reviewing a file stores a sanitized pending backup plus a serialized snapshot
of the current collection. Confirmation reloads and validates storage and
requires that snapshot to match. If snippets changed after review, import stops,
clears stale state, refreshes the visible list, and requires another review.

All settings-page storage operations now use a shared busy-state function.
Add, Edit, Delete, Export, import review, and import confirmation temporarily
disable competing controls and make the snippet list `inert`. `finally` blocks
restore interaction on successful, failed, and early-return paths.

Successful import replaces the collection only after Chrome accepts the full
storage write, exits stale Edit state, refreshes the list, resets the file and
confirmation controls, announces the result, and updates already-open content
scripts through the existing storage listener. Cancellation and all validation
failures leave stored snippets unchanged.

Manual testing covered valid review, cancellation, confirmed replacement,
plain-text rendering of HTML-like content, multiline replacement text,
immediate expansion updates, restoration from an untouched export, invalid
schema rejection, and stale-confirmation rejection across two Settings tabs.
No new permission, network request, account, server, or dependency was added.

## August 24, 2026 — Formal Manual QA

### Cross-Feature Test Matrix

Added `TESTING.md` as a reusable manual test matrix for TypeGremlin's expansion,
sensitive-field protection, settings CRUD, backup and restore, storage
lifecycle, security, privacy, and accessibility behavior. The document uses
explicit verified, failed, pending, and intentionally unsupported statuses so
current evidence remains distinguishable from planned coverage.

Manual Chrome testing verified native undo and redo, dynamically created
fields, React-controlled inputs, ordinary text controls, and password-related
autocomplete values containing one or multiple tokens. Settings tests covered
deleting the final snippet and preserving a valid empty collection.

Backup testing covered exporting zero snippets, restoring into an empty
collection, and safely rejecting malformed JSON, zero-byte files, files larger
than 12 MB, unsupported schema versions, unexpected top-level fields,
out-of-range shortcut and replacement lengths, and case-insensitive shortcut
collisions. Existing snippets remained unchanged after rejected imports.

Security testing confirmed that a literal `__proto__` shortcut remains inert
data through import, storage, rendering, and expansion. Fresh-install and
uninstall testing confirmed that uninstalling removes local extension storage
and reinstalling initializes the development defaults without duplicate data.

Accessibility testing covered Windows Narrator announcements, keyboard focus,
200% and 400% browser zoom, and Windows Contrast Themes. Controls and content
remained readable, reachable, and usable during the tested flows.

Chrome storage-quota failure remains intentionally pending because it is not
being forced through unsafe or misleading test setup. The current version also
documents `contenteditable` and rich-text expansion as unsupported rather than
reporting them as failures.

### Gremlin Plum Settings Design

Added a dependency-free responsive stylesheet for the Settings page using the
selected Gremlin plum direction: warm neutral surfaces, deep plum primary
actions, and a restrained green accent for snippet identifiers and counts. The
design uses system fonts and introduces no remote assets, scripts, permissions,
or changes to snippet behavior.

Major Settings sections now use clear card-like grouping. Forms, buttons, file
controls, status messages, import confirmation, and saved snippets have
consistent spacing and visible focus treatment. Existing semantic headings,
labels, forms, status regions, and the snippet definition list remain intact.

Saved snippet pairs use the existing `dt` and `dd` elements as a unified visual
row on wider layouts and a stacked card at narrow widths. Testing exposed the
browser's default left margin on `dd`; fully resetting that margin corrected the
desktop gap and narrow-layout inset without changing the rendered markup.

The final type scale keeps ordinary and helper text at user-selected sizes,
while headings and controls retain a clear hierarchy. The layout was manually
checked in Edit, Delete, and import-confirmation states, at narrow viewport
widths, and at 400% browser zoom.

Forced Colors rules preserve perceivable borders and remove decorative shadows.
A `prefers-reduced-motion` rule suppresses nonessential animation and transition
timing. Windows Contrast Themes and reduced-motion preferences were manually
retested after styling, and the interface remained readable, reachable, and
usable.

### Toolbar Settings Access and Working Icon

Added a Chrome toolbar action that opens TypeGremlin Settings directly. The
Manifest V3 service worker listens for `chrome.action.onClicked` and starts
`chrome.runtime.openOptionsPage()` without introducing a popup or duplicating
settings behavior. TypeScript's `void` operator explicitly marks the returned
promise as intentionally started without waiting for it inside the synchronous
click callback.

The manifest supplies a descriptive toolbar title and continues to request only
the existing `storage` permission. Manual testing confirmed that clicking the
pinned TypeGremlin action opens Settings after rebuilding and reloading the
unpacked extension.

Added a working G-based TypeGremlin icon using the established plum, soft
lavender, and muted green palette. A repository SVG remains the editable source,
with locally generated 16, 32, 48, and 128 pixel PNG exports for Chrome's
toolbar, extension-management interface, and future store packaging. The PNG
dimensions and manifest JSON were validated before manual visual testing.

The icon is intentionally treated as replaceable branding rather than a locked
final identity. No remote asset, runtime dependency, permission, or network
request was added.

### Published Privacy Policy and Local-Processing Disclosure

Added a standalone TypeGremlin privacy policy based on the established
CyberPhrase policy structure and adapted to TypeGremlin's actual behavior. It
documents local snippet storage, transient shortcut matching, sensitive-field
heuristics, broad website access, JSON backup handling, the absence of tracking
and network requests, Chrome permissions, Limited Use compliance, policy
updates, and contact information.

The policy warns that Chrome extension storage is not an encrypted password
vault and that TypeGremlin is not a password manager. It explains that
password-field detection relies on website markup and should not replace careful
handling of authentication secrets.

Settings now prominently states that typed text is processed locally and that
snippets and typed content are not sent to a server. The disclosure links to the
published policy in a separate tab using `noopener` and `noreferrer` protections.
The README links to the same public policy URL so repository, extension, store,
and hosted disclosures can remain consistent.

The policy was published at
`https://loridunford.com/typegremlin/privacy.html` and manually verified over
HTTPS for its title, summary, and complete section structure. A matching local
HTML copy remains in the repository and extension package as the editable source
of truth and offline policy record.

### Dependency-Free Release Packaging

Added a reproducible `npm run package` workflow for creating a Chrome Web
Store-ready release without adding a packaging dependency. The command runs the
existing TypeScript check and build first, then stages an explicit allowlist of
runtime files and creates a versioned ZIP with `manifest.json` at its root.

The packaging script verifies that `package.json` and `manifest.json` use the
same Chrome-compatible version and that every file referenced by the manifest
exists in the staged package. It also checks the completed archive for its root
manifest and rejects development files such as TypeScript source, source maps,
build scripts, documentation, dependencies, and repository metadata.

Generated release folders and ZIP files live under `release/` and are ignored
by Git. The versioned staging folder remains available for unpacked testing so
the exact packaged build can be checked before submission.

Manual testing of the staged extension confirmed that the toolbar opens
Settings, the development defaults load, `;hello` expands, Settings styles
load, and the published privacy-policy link opens correctly. This describes the
package before the sample defaults were removed. The final ZIP was also
inspected to confirm its expected root structure and runtime-only contents.

### Empty First-Install Experience

Removed the development-only `;email` and `;hello` sample snippets from fresh
install initialization. A new installation now stores a valid empty snippet
collection, giving users a clean starting point without placing fake content in
their local extension data.

The service worker still checks whether the `snippets` storage key is missing
before writing anything. Reloading or updating TypeGremlin therefore preserves
every existing collection, including an intentionally empty one. No permission,
network request, account, server, or dependency was added.

Manual Chrome testing confirmed that a fresh installation starts with zero
saved snippets and no development samples. After adding a new snippet, expansion
worked correctly and the packaged extension's toolbar action, Settings styles,
and privacy-policy link continued to behave as expected.

### Chrome Web Store Icon Spacing

Adjusted only the 128px TypeGremlin icon used for Chrome Web Store presentation.
The selected G artwork and existing palette remain unchanged, but the artwork is
now centered within a 96px source area with 16px of transparent canvas padding
on each side so it does not appear crowded in store surfaces.

The smaller 16px, 32px, and 48px toolbar and extension-management icons remain
unchanged. Added `icons/typegremlin-store.svg` as the editable source for the
padded 128px export while retaining `icons/typegremlin.svg` as the source for
the compact working icons. No runtime behavior, permission, dependency, or
network access changed.

### Chrome Web Store Screenshots

Prepared three 1280 × 800 Chrome Web Store screenshots showing TypeGremlin's
current behavior: creating and managing a snippet, viewing local backup and
restore controls, and expanding a saved shortcut in a real standard web form.

The screenshots use demonstration-only `;test` and `Testing` content. They were
reviewed for exact dimensions, readable composition, current functionality, and
the absence of visible personal browser information. No unsupported feature or
performance claim appears in the images.

Store screenshots are kept under `store-assets/screenshots/` in their intended
display order. These listing assets are repository documentation and are not
included in the runtime extension ZIP.

### Chrome Web Store Promotional Tile

Added the required 440 × 280 small promotional tile using the established
Gremlin Plum palette and selected G icon. The full-bleed design uses a simple
brand-focused layout with the restrained message, “Type less. Keep it local.”
It avoids screenshots, feature-list clutter, unsupported claims, ratings, and
Chrome branding so it remains legible when displayed at smaller sizes.

The editable `store-assets/typegremlin-small-promo.svg` is retained beside the
exported PNG. Both files are store-listing assets only and remain excluded from
the runtime extension ZIP. No extension behavior, permission, dependency, or
network access changed.

### Public Source and Support URLs

Made the TypeGremlin GitHub repository public and verified its repository
description, project topics, GPL-3.0 license, TypeScript language classification,
and `main` default branch. GitHub Issues is enabled as the public support and
bug-reporting channel.

The Chrome Web Store worksheet now records the verified public source and
support URLs. The dedicated TypeGremlin website remains pending and is not
treated as complete until its landing page is published and checked over HTTPS.
