let snippets = {};

async function loadSnippets() {
  const result = await chrome.storage.local.get("snippets");

  snippets = result.snippets ?? {
    ";email": "test@example.com",
    ";hello": "Hello there!",
  };
}

loadSnippets();

// execCommand is deprecated, but currently preserves native undo history
// better than direct value manipulation for this use case.
// Revisit if a reliable modern replacement becomes available.
function insertTextWithUndo(text) {
  return document.execCommand("insertText", false, text);
}

document.addEventListener("input", (event) => {
  const target = event.target;
  const isSensitiveField =
    target.type === "password" ||
    target.autocomplete === "current-password" ||
    target.autocomplete === "new-password" ||
    target.name?.toLowerCase().includes("password") ||
    target.id?.toLowerCase().includes("password") ||
    target.id?.toLowerCase().includes("passwd");

  if (isSensitiveField) {
    return;
  }

  const cursorPosition = target.selectionStart;

  if (cursorPosition === null) {
    return;
  }

  const textBeforeCursor = target.value.slice(0, cursorPosition);

  for (const [shortcut, replacement] of Object.entries(snippets)) {
    if (textBeforeCursor.endsWith(shortcut)) {
      const shortcutStart = cursorPosition - shortcut.length;

      target.setSelectionRange(shortcutStart, cursorPosition);
      insertTextWithUndo(replacement);

      break;
    }
  }
});
