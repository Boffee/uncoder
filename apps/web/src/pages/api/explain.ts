// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { queryCodex } from "@uncoder/common";
import Cors from "cors";
import type { NextApiRequest, NextApiResponse } from "next";

type ApiError = {
  message: string;
};

type Data =
  | {
      output: string;
    }
  | ApiError;

const cors = Cors({
  methods: ["GET", "HEAD"],
  origin: [
    "chrome-extension://bgcpepicmcjpbpoajolfochngcogipkl",
    "http://localhost:3000",
  ],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  // print request origin
  console.log(req.headers.origin);
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await runMiddleware(req, res, cors);
  try {
    const response = await queryCodex({
      prompt: req.body.prompt,
      apiKey: process.env.OPENAI_API_KEY!,
      stop: req.body.isBlock ? ["##", "```"] : ["##"],
    });
    const output = response.data.choices[0].text;
    res.status(200).json({ output });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
