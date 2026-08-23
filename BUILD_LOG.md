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
