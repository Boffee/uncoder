type CodexRequestParams = {
  prompt: string;
  isBlock?: boolean;
  hostUrl?: string;
};

type CodexResponse = {
  output: string;
};

/**
 * Make fetch request to ${HOST_URL}/api/explain with given prompt
 * @param prompt prompt to explain
 * @returns response
 */
export async function queryCodexApi({
  prompt,
  isBlock,
  hostUrl = "http://localhost:3000",
}: CodexRequestParams): Promise<CodexResponse> {
  const response = await fetch(`${hostUrl}/api/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      isBlock,
    }),
  });
  return response.json();
}
