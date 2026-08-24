function getValidSnippetEntries(value: unknown): Array<[string, string]> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }

  const validEntries: Array<[string, string]> = [];

  for (const [shortcut, replacement] of Object.entries(value)) {
    if (shortcut.length === 0 || typeof replacement !== "string") {
      return [];
    }

    validEntries.push([shortcut, replacement]);
  }

  return validEntries;
}

const snippetList = document.querySelector<HTMLDListElement>("#snippet-list");
const snippetStatus =
  document.querySelector<HTMLParagraphElement>("#snippet-status");

if (!snippetList || !snippetStatus) {
  throw new Error("The snippet settings interface could not be initialized.");
}

const snippetListElement = snippetList;
const snippetStatusElement = snippetStatus;

async function displaySnippets(): Promise<void> {
  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    snippetListElement.replaceChildren();

    for (const [shortcut, replacement] of snippetEntries) {
      const shortcutTerm = document.createElement("dt");
      const shortcutCode = document.createElement("code");
      const replacementDescription = document.createElement("dd");

      shortcutCode.textContent = shortcut;
      replacementDescription.textContent = replacement;

      shortcutTerm.append(shortcutCode);
      snippetListElement.append(shortcutTerm, replacementDescription);
    }

    snippetStatusElement.textContent =
      snippetEntries.length === 0
        ? "No saved snippets."
        : `${snippetEntries.length} saved ${
            snippetEntries.length === 1 ? "snippet" : "snippets"
          }.`;
  } catch (error: unknown) {
    console.error("TypeGremlin could not load snippets:", error);
    snippetStatusElement.textContent =
      "TypeGremlin could not load the saved snippets.";
  }
}

void displaySnippets();
