/**
 * Request settings that differ between OpenAI model families.
 *
 * The GPT-5 and o-series models are reasoning models: they refuse
 * `max_tokens` (it is `max_completion_tokens`, and the hidden reasoning
 * counts towards it) and accept no temperature other than the default.
 * Older chat models (gpt-4o, gpt-4.1 …) take the classic settings.
 */
export function isReasoningModel(model) {
  return /^(gpt-5|o\d)/i.test(String(model || ""));
}

/**
 * @param {string} model
 * @param {{maxTokens:number, temperature?:number, effort?:"minimal"|"low"|"medium"|"high"}} options
 */
export function completionSettings(model, { maxTokens, temperature = 0.3, effort = "low" }) {
  if (isReasoningModel(model)) {
    return {
      // room for the reasoning on top of the visible answer
      max_completion_tokens: maxTokens * 4,
      reasoning_effort: effort,
    };
  }
  return { max_tokens: maxTokens, temperature };
}
