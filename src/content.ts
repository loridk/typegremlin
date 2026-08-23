type SnippetCollection = Record<string, string>;
let snippets: SnippetCollection = {};

function getSnippetCollection(value: unknown): SnippetCollection {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const validSnippets: SnippetCollection = {};

  for (const [shortcut, replacement] of Object.entries(value)) {
    if (shortcut.length === 0 || typeof replacement !== "string") {
      return {};
    }

    validSnippets[shortcut] = replacement;
  }

  return validSnippets;
}

async function loadSnippets() {
  const { snippets: storedSnippets } =
    await chrome.storage.local.get("snippets");

  snippets = getSnippetCollection(storedSnippets);
}

void loadSnippets();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.snippets) {
    snippets = getSnippetCollection(changes.snippets.newValue);
  }
});

// execCommand is deprecated, but currently preserves native undo history
// better than direct value manipulation for this use case.
// Revisit if a reliable modern replacement becomes available.
function insertTextWithUndo(text: string) {
  return document.execCommand("insertText", false, text);
}

function isSensitiveField(target: HTMLInputElement | HTMLTextAreaElement) {
  const autocompleteTokens = target.autocomplete.toLowerCase().split(/\s+/);
  const fieldIdentifiers = `${target.name} ${target.id}`.toLowerCase();

  return (
    target.type === "password" ||
    autocompleteTokens.includes("current-password") ||
    autocompleteTokens.includes("new-password") ||
    fieldIdentifiers.includes("password") ||
    fieldIdentifiers.includes("passwd")
  );
}

document.addEventListener("input", (event) => {
  const target = event.target;

  if (
    !(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    )
  ) {
    return;
  }

  if (isSensitiveField(target)) {
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
