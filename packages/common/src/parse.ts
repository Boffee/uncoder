export type CodeBlock = {
  language: string;
  code: string;
  description: string;
};

const codeBlockRegex =
  /```(?<language>\w*)\n+(?<code>.*?)\n+```\n+(?<description>.*?)\s*(?=```|$)/gs;

/**
 * Parse markdown code blocks into an array of CodeBlock objects.
 * @param input The markdown string to parse.
 * @returns An array of CodeBlock objects.
 **/
export const findCodeBlocks = (input: string): CodeBlock[] => {
  const codeBlocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(input))) {
    // @ts-ignore
    const { language, code, description } = match.groups;
    codeBlocks.push({ language, code, description });
  }

  return codeBlocks;
};
