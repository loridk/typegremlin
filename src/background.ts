const DEFAULT_SNIPPETS = {
  ";email": "test@example.com",
  ";hello": "Hello there!",
};

chrome.runtime.onInstalled.addListener(async () => {
  const { snippets } = await chrome.storage.local.get("snippets");

  if (snippets === undefined) {
    await chrome.storage.local.set({
      snippets: DEFAULT_SNIPPETS,
    });
  }
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
