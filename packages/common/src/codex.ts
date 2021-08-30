import OpenAI from "openai-api";

export const TEMPLATE = `
\`\`\`{{LANGUAGE}}
{{INPUT}}
\`\`\`

{{INSTRUCTION}}

\`\`\`{{LANGUAGE}}
`;

export const BLOCK_TEMPLATE = `
\`\`\`{{LANGUAGE}}
{{INPUT}}
\`\`\`

{{INSTRUCTION}}

\`\`\`{{LANGUAGE}}
...
{{BLOCK}}
...
\`\`\`
`;

export const instructions = {
  base: "Breakdown of how the code block above works:",
  test: "Now let's walk through the code to see what's going on:",
  blockBase: "Let's look at this block of code and see what it's doing:",
};

export type InstructionNames = keyof typeof instructions;

export type ExampleTransform = { source: string; target: string };

export type QueryCodexParams = {
  prompt: string;
  apiKey: string;
  stop?: string[];
};

export async function queryCodex({
  prompt,
  apiKey,
  stop = ["##"],
}: QueryCodexParams) {
  const openai = new OpenAI(apiKey);
  const gptResponse = await openai.complete({
    engine: "davinci-codex",
    prompt: prompt,
    maxTokens: 300,
    temperature: 0,
    topP: 1,
    presencePenalty: 0,
    frequencyPenalty: 0,
    bestOf: 1,
    n: 1,
    stream: false,
    stop,
  });

  return gptResponse;
}

export type GeneratedPromptParams = {
  input: string;
  instruction?: InstructionNames;
  language?: string;
  block?: string;
};

// Fill in the template with the given data
export function generatePrompt({
  input,
  instruction = "base",
  language = "",
  block = "",
}: GeneratedPromptParams): string {
  const instructionText = instructions[instruction];
  const template = block ? BLOCK_TEMPLATE : TEMPLATE;
  const prompt = template
    .replace("{{INPUT}}", input)
    .replace("{{INSTRUCTION}}", instructionText)
    .replace("{{LANGUAGE}}", language)
    .replace("{{BLOCK}}", block);
  return prompt;
}

export type QueryCodexWithTemplateParams = {
  input: string;
  instruction?: InstructionNames;
  language?: string;
  block?: string;
  apiKey: string;
};
// Query OpenAI with template and give prompt
export async function queryCodexWithTemplate({
  input,
  instruction,
  language,
  block,
  apiKey,
}: QueryCodexWithTemplateParams): Promise<string> {
  const prompt = generatePrompt({ input, instruction, language, block });
  const stop = block ? ["##", "```"] : ["##"];
  const response = await queryCodex({ prompt, apiKey, stop: stop });
  return response.data.choices[0].text;
}
