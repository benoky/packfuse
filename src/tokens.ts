/** Rough size estimate: about four UTF-16 code units per token. Not a model tokenizer. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
