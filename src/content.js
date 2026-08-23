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

    target.setRangeText(REPLACEMENT, shortcutStart, cursorPosition, "end");
  }
});
