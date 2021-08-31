import browser from "webextension-polyfill";

browser.contextMenus.removeAll();
// "explain" to chrome extension context menu which sends a message to notify
// the content script to explain the current selection.
browser.contextMenus.create({
  id: "explain",
  title: "explain",
  contexts: ["selection"],
});

browser.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "explain" && tab?.id) {
    browser.tabs.sendMessage(tab.id, {
      type: "explain",
    });
  }
});

console.log("background.js loaded");

export {};
