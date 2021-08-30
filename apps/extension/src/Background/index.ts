chrome.contextMenus.removeAll();
// "explain" to chrome extension context menu which sends a message to notify
// the content script to explain the current selection.
chrome.contextMenus.create({
  id: "explain",
  title: "explain",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "explain" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "explain",
    });
  }
});

console.log("background.js loaded");

export {};
