import { findCodeBlocks } from "./parse";

// Unit test for findCodeBlocks with multiple code blocks
it("finds multiple code blocks", () => {
  const input = `
# Title
\`\`\`typescript

const a = 1;

const b = 2;
\`\`\`

description 1
description 1.1

\`\`\`js
const a = 1;
\`\`\`
\`\`\`
const a = 1;
\`\`\`
description 3
  `;
  const codeBlocks = findCodeBlocks(input);
  expect(codeBlocks.length).toBe(3);
  expect(codeBlocks[0].language).toBe("typescript");
  expect(codeBlocks[0].code).toBe("const a = 1;\n\nconst b = 2;");
  expect(codeBlocks[0].description).toBe("description 1\ndescription 1.1");
  expect(codeBlocks[1].language).toBe("js");
  expect(codeBlocks[1].code).toBe("const a = 1;");
  expect(codeBlocks[1].description).toBe("");
  expect(codeBlocks[2].language).toBe("");
  expect(codeBlocks[2].code).toBe("const a = 1;");
  expect(codeBlocks[2].description).toBe("description 3");
});
