const SHORTCUT = ";email";
const REPLACEMENT = "test@example.com";

document.addEventListener("input", (event) => {
  const target = event.target;
  const isSensitiveField =
    target.type === "password" ||
    target.autocomplete === "current-password" ||
    target.autocomplete === "new-password" ||
    target.name?.toLowerCase().includes("password") ||
    target.id?.toLowerCase().includes("password") ||
    target.id?.toLowerCase().includes("passwd");

  // execCommand is deprecated, but currently preserves native undo history
  // better than direct value manipulation for this use case.
  // Revisit if a reliable modern replacement becomes available.
  function insertTextWithUndo(text) {
    return document.execCommand("insertText", false, text);
  }

  if (isSensitiveField) {
    return;
  }

  if (
    !(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    )
  ) {
    return;
  }

  const cursorPosition = target.selectionStart;

  if (cursorPosition === null) {
    return;
  }

  const textBeforeCursor = target.value.slice(0, cursorPosition);

  if (textBeforeCursor.endsWith(SHORTCUT)) {
    console.log("😈 TypeGremlin spotted:", SHORTCUT);
    const shortcutStart = cursorPosition - SHORTCUT.length;

    target.setSelectionRange(shortcutStart, cursorPosition);

    insertTextWithUndo(REPLACEMENT);
  }
});
