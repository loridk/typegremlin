function getValidSnippetEntries(
  value: unknown,
): Array<[string, string]> | null {
  if (value === undefined) {
    return [];
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const validEntries: Array<[string, string]> = [];

  for (const [shortcut, replacement] of Object.entries(value)) {
    if (shortcut.length === 0 || typeof replacement !== "string") {
      return null;
    }

    validEntries.push([shortcut, replacement]);
  }

  return validEntries;
}

const snippetForm = document.querySelector<HTMLFormElement>("#snippet-form");
const shortcutInput = document.querySelector<HTMLInputElement>("#shortcut");
const replacementInput =
  document.querySelector<HTMLTextAreaElement>("#replacement");
const formStatus = document.querySelector<HTMLParagraphElement>("#form-status");
const snippetList = document.querySelector<HTMLDListElement>("#snippet-list");
const snippetStatus =
  document.querySelector<HTMLParagraphElement>("#snippet-status");

if (
  !snippetForm ||
  !shortcutInput ||
  !replacementInput ||
  !formStatus ||
  !snippetList ||
  !snippetStatus
) {
  throw new Error("The snippet settings interface could not be initialized.");
}

const snippetFormElement = snippetForm;
const shortcutInputElement = shortcutInput;
const replacementInputElement = replacementInput;
const formStatusElement = formStatus;
const snippetListElement = snippetList;
const snippetStatusElement = snippetStatus;

function getValidatedShortcut(): string | null {
  shortcutInputElement.setCustomValidity("");

  const shortcut = shortcutInputElement.value.trim();

  if (shortcut.length === 0) {
    shortcutInputElement.setCustomValidity("Enter a shortcut.");
    shortcutInputElement.reportValidity();
    return null;
  }

  if (/\s/.test(shortcut)) {
    shortcutInputElement.setCustomValidity("Shortcuts cannot contain spaces.");
    shortcutInputElement.reportValidity();
    return null;
  }

  return shortcut;
}

function getValidatedReplacement(): string | null {
  replacementInputElement.setCustomValidity("");

  const replacement = replacementInputElement.value;

  if (replacement.trim().length === 0) {
    replacementInputElement.setCustomValidity("Enter replacement text.");
    replacementInputElement.reportValidity();
    return null;
  }

  return replacement;
}

shortcutInputElement.addEventListener("input", () => {
  shortcutInputElement.setCustomValidity("");
});

replacementInputElement.addEventListener("input", () => {
  replacementInputElement.setCustomValidity("");
});

async function displaySnippets(): Promise<void> {
  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    if (snippetEntries === null) {
      throw new Error("Stored snippet data is invalid.");
    }

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

async function addSnippet(): Promise<void> {
  formStatusElement.textContent = "";

  const shortcut = getValidatedShortcut();

  if (shortcut === null) {
    shortcutInputElement.focus();
    return;
  }

  const replacement = getValidatedReplacement();

  if (replacement === null) {
    replacementInputElement.focus();
    return;
  }

  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    if (snippetEntries === null) {
      throw new Error("Stored snippet data is invalid.");
    }

    const normalizedShortcut = shortcut.toLowerCase();
    const shortcutAlreadyExists = snippetEntries.some(
      ([existingShortcut]) =>
        existingShortcut.toLowerCase() === normalizedShortcut,
    );

    if (shortcutAlreadyExists) {
      const duplicateMessage = "That shortcut already exists.";

      shortcutInputElement.setCustomValidity(duplicateMessage);
      shortcutInputElement.reportValidity();
      shortcutInputElement.focus();
      formStatusElement.textContent = duplicateMessage;
      return;
    }

    const updatedSnippets = Object.fromEntries(snippetEntries);

    updatedSnippets[shortcut] = replacement;

    await chrome.storage.local.set({
      snippets: updatedSnippets,
    });

    snippetFormElement.reset();
    await displaySnippets();

    formStatusElement.textContent = `Added ${shortcut}.`;
    shortcutInputElement.focus();
  } catch (error: unknown) {
    console.error("TypeGremlin could not add the snippet:", error);
    formStatusElement.textContent =
      "TypeGremlin could not add the snippet. Existing snippets were not changed.";
  }
}

snippetFormElement.addEventListener("submit", (event) => {
  event.preventDefault();
  void addSnippet();
});

void displaySnippets();
