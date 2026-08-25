chrome.runtime.onInstalled.addListener(async () => {
  const { snippets } = await chrome.storage.local.get("snippets");

  if (snippets === undefined) {
    await chrome.storage.local.set({
      snippets: {},
    });
  }
});

chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage();
});
