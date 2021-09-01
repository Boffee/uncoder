import { queryCodexApi } from "@uncoder/common";
import browser from "webextension-polyfill";

browser.contextMenus.removeAll();
// "explain" to chrome extension context menu which sends a message to notify
// the content script to explain the current selection.
browser.contextMenus.create({
  id: "explain",
  title: "explain",
  contexts: ["selection"],
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain" && tab?.id) {
    browser.tabs.sendMessage(tab.id, {
      type: "explain",
    });
  }
});

// call queryCodexApi on queryCodex message
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "queryCodexApi") {
    const response = queryCodexApi(message.query);
    return response;
  }
});

console.log("background.js loaded");

export {};
