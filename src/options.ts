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
const snippetActionStatus = document.querySelector<HTMLParagraphElement>(
  "#snippet-action-status",
);

if (
  !snippetForm ||
  !shortcutInput ||
  !replacementInput ||
  !formStatus ||
  !snippetList ||
  !snippetStatus ||
  !snippetActionStatus
) {
  throw new Error("The snippet settings interface could not be initialized.");
}

const snippetFormElement = snippetForm;
const shortcutInputElement = shortcutInput;
const replacementInputElement = replacementInput;
const formStatusElement = formStatus;
const snippetListElement = snippetList;
const snippetStatusElement = snippetStatus;
const snippetActionStatusElement = snippetActionStatus;

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

function renderSnippetEntries(snippetEntries: Array<[string, string]>): void {
  snippetListElement.replaceChildren();

  for (const [shortcut, replacement] of snippetEntries) {
    const shortcutTerm = document.createElement("dt");
    const shortcutCode = document.createElement("code");
    const replacementDescription = document.createElement("dd");
    const replacementText = document.createElement("p");
    const deleteControls = document.createElement("div");
    const deleteButton = document.createElement("button");

    shortcutCode.textContent = shortcut;
    replacementText.textContent = replacement;
    deleteButton.type = "button";
    deleteButton.textContent = `Delete ${shortcut}`;

    deleteButton.addEventListener("click", () => {
      showDeleteConfirmation(shortcut, deleteControls, deleteButton);
    });

    shortcutTerm.append(shortcutCode);
    deleteControls.append(deleteButton);
    replacementDescription.append(replacementText, deleteControls);
    snippetListElement.append(shortcutTerm, replacementDescription);
  }

  snippetStatusElement.textContent =
    snippetEntries.length === 0
      ? "No saved snippets."
      : `${snippetEntries.length} saved ${
          snippetEntries.length === 1 ? "snippet" : "snippets"
        }.`;
}

function showDeleteConfirmation(
  shortcut: string,
  deleteControls: HTMLDivElement,
  deleteButton: HTMLButtonElement,
): void {
  snippetActionStatusElement.textContent = "";

  const confirmationText = document.createElement("p");
  const confirmButton = document.createElement("button");
  const cancelButton = document.createElement("button");

  confirmationText.textContent = `Delete ${shortcut}?`;

  confirmButton.type = "button";
  confirmButton.textContent = `Confirm delete ${shortcut}`;

  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";

  confirmButton.addEventListener("click", () => {
    confirmButton.disabled = true;
    cancelButton.disabled = true;
    void deleteSnippet(shortcut);
  });

  cancelButton.addEventListener("click", () => {
    deleteControls.replaceChildren(deleteButton);
    snippetActionStatusElement.textContent = `Deletion of ${shortcut} canceled.`;
    deleteButton.focus();
  });

  deleteControls.replaceChildren(confirmationText, confirmButton, cancelButton);

  confirmButton.focus();
}

async function deleteSnippet(shortcut: string): Promise<void> {
  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    if (snippetEntries === null) {
      throw new Error("Stored snippet data is invalid.");
    }

    const snippetStillExists = snippetEntries.some(
      ([existingShortcut]) => existingShortcut === shortcut,
    );

    if (!snippetStillExists) {
      throw new Error("The snippet no longer exists.");
    }

    const remainingEntries = snippetEntries.filter(
      ([existingShortcut]) => existingShortcut !== shortcut,
    );

    const updatedSnippets = Object.fromEntries(remainingEntries);

    await chrome.storage.local.set({
      snippets: updatedSnippets,
    });

    renderSnippetEntries(remainingEntries);

    snippetActionStatusElement.textContent = `Deleted ${shortcut}.`;
    snippetActionStatusElement.focus();
  } catch (error: unknown) {
    console.error("TypeGremlin could not delete the snippet:", error);

    await displaySnippets();

    snippetActionStatusElement.textContent =
      "TypeGremlin could not delete the snippet. Existing snippets were not changed.";
    snippetActionStatusElement.focus();
  }
}

async function displaySnippets(): Promise<void> {
  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    if (snippetEntries === null) {
      throw new Error("Stored snippet data is invalid.");
    }

    renderSnippetEntries(snippetEntries);
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
