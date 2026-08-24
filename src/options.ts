interface SnippetBackup {
  format: "typegremlin-snippets";
  version: 1;
  exportedAt: string;
  snippets: Record<string, string>;
}

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

function createSnippetBackup(
  snippetEntries: Array<[string, string]>,
): SnippetBackup {
  return {
    format: "typegremlin-snippets",
    version: 1,
    exportedAt: new Date().toISOString(),
    snippets: Object.fromEntries(snippetEntries),
  };
}

const formHeading = document.querySelector<HTMLHeadingElement>(
  "#add-snippet-heading",
);
const snippetForm = document.querySelector<HTMLFormElement>("#snippet-form");
const shortcutInput = document.querySelector<HTMLInputElement>("#shortcut");
const replacementInput =
  document.querySelector<HTMLTextAreaElement>("#replacement");
const submitButton =
  document.querySelector<HTMLButtonElement>("#snippet-submit");
const cancelEditButton =
  document.querySelector<HTMLButtonElement>("#cancel-edit");
const formStatus = document.querySelector<HTMLParagraphElement>("#form-status");
const snippetList = document.querySelector<HTMLDListElement>("#snippet-list");
const snippetStatus =
  document.querySelector<HTMLParagraphElement>("#snippet-status");
const snippetActionStatus = document.querySelector<HTMLParagraphElement>(
  "#snippet-action-status",
);
const exportSnippetsButton =
  document.querySelector<HTMLButtonElement>("#export-snippets");
const backupStatus =
  document.querySelector<HTMLParagraphElement>("#backup-status");

if (
  !formHeading ||
  !snippetForm ||
  !shortcutInput ||
  !replacementInput ||
  !submitButton ||
  !cancelEditButton ||
  !formStatus ||
  !snippetList ||
  !snippetStatus ||
  !snippetActionStatus ||
  !exportSnippetsButton ||
  !backupStatus
) {
  throw new Error("The snippet settings interface could not be initialized.");
}

const formHeadingElement = formHeading;
const snippetFormElement = snippetForm;
const shortcutInputElement = shortcutInput;
const replacementInputElement = replacementInput;
const submitButtonElement = submitButton;
const cancelEditButtonElement = cancelEditButton;
const formStatusElement = formStatus;
const snippetListElement = snippetList;
const snippetStatusElement = snippetStatus;
const snippetActionStatusElement = snippetActionStatus;
const exportSnippetsButtonElement = exportSnippetsButton;
const backupStatusElement = backupStatus;

let editingShortcut: string | null = null;
let editReturnFocus: HTMLButtonElement | null = null;

function startEditingSnippet(
  shortcut: string,
  replacement: string,
  editButton: HTMLButtonElement,
): void {
  editingShortcut = shortcut;
  editReturnFocus = editButton;

  shortcutInputElement.setCustomValidity("");
  replacementInputElement.setCustomValidity("");

  shortcutInputElement.value = shortcut;
  replacementInputElement.value = replacement;

  formHeadingElement.textContent = "Edit snippet";
  submitButtonElement.textContent = "Save changes";
  cancelEditButtonElement.hidden = false;

  formStatusElement.textContent = `Editing ${shortcut}.`;

  shortcutInputElement.focus();
}

function resetSnippetForm(): void {
  editingShortcut = null;
  editReturnFocus = null;

  snippetFormElement.reset();

  shortcutInputElement.setCustomValidity("");
  replacementInputElement.setCustomValidity("");

  formHeadingElement.textContent = "Add a snippet";
  submitButtonElement.textContent = "Add snippet";
  cancelEditButtonElement.hidden = true;
}

cancelEditButtonElement.addEventListener("click", () => {
  const canceledShortcut = editingShortcut;
  const returnFocusElement = editReturnFocus;

  resetSnippetForm();

  formStatusElement.textContent =
    canceledShortcut === null
      ? "Editing canceled."
      : `Editing ${canceledShortcut} canceled.`;

  if (returnFocusElement?.isConnected) {
    returnFocusElement.focus();
  } else {
    shortcutInputElement.focus();
  }
});

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
    const snippetActions = document.createElement("div");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    shortcutCode.textContent = shortcut;
    replacementText.textContent = replacement;

    editButton.type = "button";
    editButton.textContent = `Edit ${shortcut}`;

    deleteButton.type = "button";
    deleteButton.textContent = `Delete ${shortcut}`;

    editButton.addEventListener("click", () => {
      startEditingSnippet(shortcut, replacement, editButton);
    });

    deleteButton.addEventListener("click", () => {
      showDeleteConfirmation(
        shortcut,
        snippetActions,
        editButton,
        deleteButton,
      );
    });

    if (editingShortcut === shortcut) {
      editReturnFocus = editButton;
    }

    shortcutTerm.append(shortcutCode);
    snippetActions.append(editButton, deleteButton);
    replacementDescription.append(replacementText, snippetActions);
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
  snippetActions: HTMLDivElement,
  editButton: HTMLButtonElement,
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
    snippetActions.replaceChildren(editButton, deleteButton);

    snippetActionStatusElement.textContent = `Deletion of ${shortcut} canceled.`;

    deleteButton.focus();
  });

  snippetActions.replaceChildren(confirmationText, confirmButton, cancelButton);

  confirmButton.focus();
}

async function deleteSnippet(shortcut: string): Promise<void> {
  submitButtonElement.disabled = true;
  cancelEditButtonElement.disabled = true;
  snippetListElement.inert = true;

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

    await chrome.storage.local.set({
      snippets: Object.fromEntries(remainingEntries),
    });

    const deletedSnippetWasBeingEdited = editingShortcut === shortcut;

    if (deletedSnippetWasBeingEdited) {
      resetSnippetForm();

      formStatusElement.textContent = `Editing ${shortcut} ended because it was deleted.`;
    }

    renderSnippetEntries(remainingEntries);

    snippetActionStatusElement.textContent = `Deleted ${shortcut}.`;
    snippetActionStatusElement.focus();
  } catch (error: unknown) {
    console.error("TypeGremlin could not delete the snippet:", error);

    await displaySnippets();

    snippetActionStatusElement.textContent =
      "TypeGremlin could not delete the snippet. Existing snippets were not changed.";
    snippetActionStatusElement.focus();
  } finally {
    submitButtonElement.disabled = false;
    cancelEditButtonElement.disabled = false;
    snippetListElement.inert = false;
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

async function saveSnippet(): Promise<void> {
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

  const originalShortcut = editingShortcut;

  submitButtonElement.disabled = true;
  cancelEditButtonElement.disabled = true;
  snippetListElement.inert = true;

  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    if (snippetEntries === null) {
      throw new Error("Stored snippet data is invalid.");
    }

    if (originalShortcut !== null) {
      const originalStillExists = snippetEntries.some(
        ([existingShortcut]) => existingShortcut === originalShortcut,
      );

      if (!originalStillExists) {
        throw new Error("The snippet being edited no longer exists.");
      }
    }

    const normalizedShortcut = shortcut.toLowerCase();

    const shortcutAlreadyExists = snippetEntries.some(
      ([existingShortcut]) =>
        existingShortcut !== originalShortcut &&
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

    let updatedEntries: Array<[string, string]>;

    if (originalShortcut === null) {
      updatedEntries = [...snippetEntries, [shortcut, replacement]];
    } else {
      updatedEntries = snippetEntries.map(
        ([existingShortcut, existingReplacement]): [string, string] =>
          existingShortcut === originalShortcut
            ? [shortcut, replacement]
            : [existingShortcut, existingReplacement],
      );
    }

    await chrome.storage.local.set({
      snippets: Object.fromEntries(updatedEntries),
    });

    resetSnippetForm();
    renderSnippetEntries(updatedEntries);

    if (originalShortcut === null) {
      formStatusElement.textContent = `Added ${shortcut}.`;
      shortcutInputElement.focus();
    } else {
      formStatusElement.textContent =
        originalShortcut === shortcut
          ? `Updated ${shortcut}.`
          : `Updated ${originalShortcut} to ${shortcut}.`;

      formStatusElement.focus();
    }
  } catch (error: unknown) {
    console.error("TypeGremlin could not save the snippet:", error);

    formStatusElement.textContent =
      "TypeGremlin could not save the snippet. Existing snippets were not changed.";

    formStatusElement.focus();
  } finally {
    submitButtonElement.disabled = false;
    cancelEditButtonElement.disabled = false;
    snippetListElement.inert = false;
  }
}

async function exportSnippets(): Promise<void> {
  backupStatusElement.textContent = "";
  exportSnippetsButtonElement.disabled = true;

  try {
    const { snippets: storedSnippets } =
      await chrome.storage.local.get("snippets");

    const snippetEntries = getValidSnippetEntries(storedSnippets);

    if (snippetEntries === null) {
      throw new Error("Stored snippet data is invalid.");
    }

    const backup = createSnippetBackup(snippetEntries);
    const backupJson = `${JSON.stringify(backup, null, 2)}\n`;
    const backupBlob = new Blob([backupJson], { type: "application/json" });
    const backupUrl = URL.createObjectURL(backupBlob);
    const downloadLink = document.createElement("a");

    try {
      downloadLink.href = backupUrl;
      downloadLink.download = `typegremlin-snippets-${backup.exportedAt.slice(
        0,
        10,
      )}.json`;

      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    } finally {
      URL.revokeObjectURL(backupUrl);
    }

    backupStatusElement.textContent = `Exported ${snippetEntries.length} ${
      snippetEntries.length === 1 ? "snippet" : "snippets"
    }.`;

    backupStatusElement.focus();
  } catch (error: unknown) {
    console.error("TypeGremlin could not export snippets:", error);

    backupStatusElement.textContent =
      "TypeGremlin could not export the snippets. Stored snippets were not changed.";

    backupStatusElement.focus();
  } finally {
    exportSnippetsButtonElement.disabled = false;
  }
}

snippetFormElement.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveSnippet();
});

exportSnippetsButtonElement.addEventListener("click", () => {
  void exportSnippets();
});

void displaySnippets();
