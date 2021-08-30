import { queryCodexWithTemplate } from "@codexplain/common";
import "./index.css";

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
  div.style.bottom = `${window.innerHeight - selectionStartRect.top}px`;
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
  const clickHandler = () => {
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
  const sourceCode = getSourceCode();
  if (!sourceCode) return;
  // get text from extended selection range
  const range = window.getSelection()?.getRangeAt(0);
  if (!range) return;
  const extendedRange = extendRange(range);
  const block = extendedRange.toString();
  // query codex
  const explanation = await queryCodex(sourceCode, block);
  createDivAboveSelection(explanation);
}

/**
 * Extract source code from .js-file-line-container
 * @returns source code
 */
function getSourceCode() {
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
 * Query codex with give source code and selection block
 * @param sourceCode source code
 * @param block selection block
 * @returns codex query result
 */
async function queryCodex(sourceCode: string, block: string) {
  let input = sourceCode;
  const lines = sourceCode.split("\n");
  if (lines.length > 200) {
    // start and end of selaection in source code
    const start = sourceCode.indexOf(block);
    const end = start + block.length;
    // get start and end line number
    const startLine = sourceCode.substring(0, start).split("\n").length;
    const endLine = sourceCode.substring(0, end).split("\n").length;
    // selection line count
    const windowStartLine = Math.max(
      0,
      Math.min(endLine - 200 + 40, startLine)
    );
    const windowEndLine = windowStartLine + 200;
    input = lines.slice(windowStartLine, windowEndLine).join("\n");
  }
  const explanation = await queryCodexWithTemplate({
    input,
    apiKey: "API_KEY",
    block,
    instruction: "blockBase",
  });
  console.log(explanation);
  return explanation.trim();
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
    // get the char index of the beginning of the first word that contains
    // the selection
    const startContainerText = newRange.startContainer.textContent;
    if (startContainerText && newRange.startOffset) {
      const prefixSpaceIndex = startContainerText
        .substring(0, newRange.startOffset)
        .lastIndexOf(" ");
      if (prefixSpaceIndex == -1) {
        newRange.setStart(newRange.startContainer, 0);
      } else {
        newRange.setStart(newRange.startContainer, prefixSpaceIndex + 1);
      }
    }
  }
  if (newRange.endContainer.nodeType == Node.TEXT_NODE) {
    // get the char index of the end of the last word that contains the selection
    const endContainerText = newRange.endContainer.textContent;
    if (endContainerText && newRange.endOffset) {
      const suffixSpaceIndex = endContainerText
        .substring(newRange.endOffset, endContainerText.length)
        .indexOf(" ");
      if (suffixSpaceIndex == -1) {
        newRange.setEnd(newRange.endContainer, endContainerText.length);
      } else {
        newRange.setEnd(
          newRange.endContainer,
          newRange.endOffset + suffixSpaceIndex
        );
      }
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

// run explain on "explain" message from background script
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === "explain") {
    explain();
  }
});
