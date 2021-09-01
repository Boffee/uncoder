import { generatePrompt } from "@codexplain/common";
import browser from "webextension-polyfill";
import "./index.css";

// get current operating system
const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

/**
 * Overlay a div with the given text directly above current selection
 * The bottom edge should be at the top of the selection
 * @param text text to display
 */
function createDivAboveSelection(text: string) {
  const selectionStartRect = getSelectionStartRect();
  if (!selectionStartRect) return;

  const div = document.createElement("div");
  div.className = "codexplain-modal";
  // the bottom of the div should be at window height - top of the selection
  div.style.bottom = `${window.innerHeight - selectionStartRect.top + 3}px`;
  div.style.left = `${selectionStartRect.left}px`;
  div.innerText = text;
  document.body.appendChild(div);

  // remove the overlay on scroll, click, or escape
  const scrollHandler = () => {
    document.body.removeChild(div);
    window.removeEventListener("scroll", scrollHandler);
    window.removeEventListener("click", clickHandler);
    window.removeEventListener("keydown", keydownHandler);
  };
  const clickHandler = (event: MouseEvent) => {
    // only remove the overlay if the click is outside the overlay
    if (div.contains(event.target as Node)) return;
    document.body.removeChild(div);
    window.removeEventListener("scroll", scrollHandler);
    window.removeEventListener("click", clickHandler);
    window.removeEventListener("keydown", keydownHandler);
  };
  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      document.body.removeChild(div);
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("click", clickHandler);
      window.removeEventListener("keydown", keydownHandler);
    }
  };

  window.addEventListener("scroll", scrollHandler);
  window.addEventListener("click", clickHandler);
  window.addEventListener("keydown", keydownHandler);
}

/**
 * Explain the current selection block on github
 */
async function explain() {
  const sourceCode = getGithubSourceCode();
  if (!sourceCode) return;
  const selectionBlock = getGithubSelectionText();
  if (!selectionBlock) return;
  const explanation = await queryCodex(sourceCode, selectionBlock);
  createDivAboveSelection(explanation);
}

/**
 * Extract source code from .js-file-line-container
 * @returns source code
 */
function getGithubSourceCode() {
  // get container
  const container = document.querySelector(".js-file-line-container");
  if (!container) return;
  // get lines from .js-file-line
  const lines = Array.from(container.querySelectorAll(".js-file-line")).map(
    (row) => row.textContent?.replace(/\n+/g, "")
  );
  return lines.join("\n");
}

/**
 * Get github code text in extended selection range
 * @return text in extended selection range
 */
function getGithubSelectionText() {
  const selection = window.getSelection();
  if (!selection) return;
  const range = selection.getRangeAt(0);
  if (!range) return;

  const extendedRange = extendRange(range);
  const text = getGithubRangeText(extendedRange);
  console.log(text);
  return text;
}

/**
 * Query codex with give source code and selection block
 * @param sourceCode source code
 * @param block selection block
 * @returns codex query result
 */
async function queryCodex(sourceCode: string, block: string) {
  let input = getSourceCodeWindow(sourceCode, block);
  const prompt = generatePrompt({
    input,
    block,
    instruction: "blockBase",
  });
  // call queryCodexApi from background script
  const response = await browser.runtime.sendMessage({
    type: "queryCodexApi",
    query: { prompt, isBlock: true },
  });
  console.log(response);
  return joinMultiline(response.output.trim());
}

/**
 * Join multiline string in text into a single string
 * @param text text to join
 * @returns joined string
 */
function joinMultiline(text: string) {
  return text.split(/(?<=\w)\n(?=\w)/g).join(" ");
}

/**
 * Get the source code window around the selected block
 * @param sourceCode source code
 * @param block selected block
 * @param windowSize number of lines to include in the window
 * @param suffixSize number of lines to include after the block
 * @returns source code window
 */
function getSourceCodeWindow(
  sourceCode: string,
  block: string,
  windowSize = 200,
  suffixSize = 40
) {
  let input = sourceCode;
  const lines = sourceCode.split("\n");
  if (lines.length > windowSize) {
    // start and end of selaection in source code
    const start = sourceCode.indexOf(block);
    const end = start + block.length;
    // get start and end line number
    const startLine = sourceCode.substring(0, start).split("\n").length;
    const endLine = sourceCode.substring(0, end).split("\n").length;
    // selection line count
    const windowStartLine = Math.max(
      0,
      Math.min(endLine - windowSize + suffixSize, startLine)
    );
    const windowEndLine = windowStartLine + windowSize;
    input = lines.slice(windowStartLine, windowEndLine).join("\n");
  }
  return input;
}

/**
 * Get the bounding rect of the selection start
 * @returns rect of the selection start
 */
function getSelectionStartRect() {
  const selection = window.getSelection();
  if (!selection) return;
  const range = selection.getRangeAt(0);
  const extendedRange = extendRange(range);
  const trimmedRange = trimRange(extendedRange);
  // get range of the startContainer only
  trimmedRange.setEnd(trimmedRange.startContainer, trimmedRange.startOffset);
  return trimmedRange.getBoundingClientRect();
}

/**
 * Extend the start offset of the range to the beginning of the first word
 * that contains the selection and the end offset to the end of the last word
 * that contains the selection
 * @param range range to extend
 * @returns range with extended start offset
 */
function extendRange(range: Range) {
  const newRange = range.cloneRange();
  if (newRange.startContainer.nodeType == Node.TEXT_NODE) {
    const startContainerText = newRange.startContainer.textContent;
    if (startContainerText && newRange.startOffset) {
      const prefixSubwordIndex = findLastWordStart(
        startContainerText.substring(0, newRange.startOffset)
      );
      newRange.setStart(newRange.startContainer, prefixSubwordIndex);
    }
  }
  if (newRange.endContainer.nodeType == Node.TEXT_NODE) {
    const endContainerText = newRange.endContainer.textContent;
    if (endContainerText && newRange.endOffset) {
      const suffixSubwordIndex = findFirstWordEnd(
        endContainerText.substring(newRange.endOffset, endContainerText.length)
      );
      newRange.setEnd(
        newRange.endContainer,
        newRange.endOffset + suffixSubwordIndex
      );
    }
  }
  return newRange;
}

/**
 * Trim leading and trailing whitespace from range
 * @param range
 * @returns range with trimmed leading and trailing whitespace
 */
function trimRange(range: Range) {
  const newRange = range.cloneRange();
  const startNode = newRange.startContainer;
  const endNode = newRange.endContainer;
  const leadingWhitespace = startNode.textContent
    ?.substring(newRange.startOffset)
    ?.match(/^\s*/)?.[0];
  const trailingWhitespace = endNode.textContent
    ?.substring(0, newRange.endOffset)
    ?.match(/\s*$/)?.[0];
  if (leadingWhitespace) {
    newRange.setStart(newRange.startContainer, leadingWhitespace.length);
  }
  if (trailingWhitespace) {
    newRange.setEnd(
      newRange.endContainer,
      newRange.endOffset - trailingWhitespace.length
    );
  }
  return newRange;
}

/**
 * Walk through all text nodes in the range
 * - add content from text nodes to the array
 * - add newline on tr node
 * @param range range to walk through
 * @returns array of texts
 **/
function getGithubRangeText(range: Range) {
  if (range.startContainer == range.endContainer) {
    return range.toString();
  }

  // get start and end text
  const startText = range.startContainer.textContent?.substring(
    range.startOffset
  );
  const endText = range.endContainer.textContent?.substring(0, range.endOffset);

  const texts = [];

  // get texts between start and end container
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  walker.currentNode = range.startContainer;
  while (walker.nextNode() != range.endContainer) {
    const node = walker.currentNode;
    if (node.nodeName == "TR") {
      // add newline on tr node
      texts.push("\n");
    } else if (
      node.nodeType == Node.TEXT_NODE &&
      node.parentNode?.nodeName != "TR" &&
      node.parentNode?.nodeName != "TBODY"
    ) {
      // add content from text nodes to the array if it is not in a tr or tbody
      texts.push(node.textContent);
    }
  }

  return [startText, ...texts, endText].filter((text) => text).join("");
}

/**
 * Find the position of the first letter of the last word in text
 * @param text text to search
 * @returns position of the first letter of the last word
 */
function findLastWordStart(text: string) {
  const lastWord = text.match(/\w+$/)?.[0];
  if (!lastWord) return 0;
  return text.length - lastWord.length;
}

/**
 * Find the position of the last letter of the first word in text
 * @param text text to search
 * @returns position of the last letter of the first word
 */
function findFirstWordEnd(text: string) {
  const firstWord = text.match(/^\w+/)?.[0];
  if (!firstWord) return text.length;
  return firstWord.length;
}

// run explain on "explain" message from background script
browser.runtime.onMessage.addListener(async (request, sender) => {
  if (request.type === "explain") {
    explain();
  }
});

// run explain on on cmd+e on mac and ctrl+e on windows
document.addEventListener("keydown", (event) => {
  // ignore hold down
  if (event.repeat) return;
  // ignore if not cmd+e
  if (
    ((event.ctrlKey && !isMac) || (event.metaKey && isMac)) &&
    event.key == "e" &&
    !event.shiftKey
  ) {
    explain();
  }
});
