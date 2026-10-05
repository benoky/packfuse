import { encodingForModel } from "js-tiktoken";

const enc = encodingForModel("gpt-4");

export function estimateTokens(text: string): number {
  return enc.encode(text).length;
}
