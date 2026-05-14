export const AVAILABLE_SUPER_MODELS = [
  { id: "llama-3.3-70b-versatile",        label: "Llama 3.3 70B",      provider: "groq" },
  { id: "openai/gpt-oss-120b",            label: "GPT-OSS 120B",       provider: "groq" },
  { id: "deepseek-r1-distill-llama-70b",  label: "Deepseek R1 70B",    provider: "groq" },
  { id: "qwen-qwq-32b",                   label: "Qwen QwQ 32B",       provider: "groq" },
  { id: "gemma2-9b-it",                   label: "Gemma 2 9B",         provider: "groq" },
  { id: "mistral-small-latest",           label: "Mistral Small",      provider: "mistral" },
  { id: "mistral-large-latest",           label: "Mistral Large",      provider: "mistral" },
  { id: "codestral-latest",               label: "Codestral",          provider: "mistral" },
  { id: "Qwen/Qwen2.5-72B-Instruct",      label: "Qwen 2.5 72B HF",    provider: "qwen" },
];

// Default super AIs — all Groq, no Mistral dependency
export const DEFAULT_SUPER_MODELS = {
  synthesizer: "openai/gpt-oss-120b",
  checker:     "deepseek-r1-distill-llama-70b",
  safety:      "llama-3.3-70b-versatile",
};

async function callModel(modelId, prompt, maxTokens = 2048) {
  const worker = AVAILABLE_SUPER_MODELS.find(w => w.id === modelId);

  // Fallback to groq if model not found
  const provider = worker?.provider || "groq";

  if (provider === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  if (provider === "mistral") {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.MISTRAL_API_KEY,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  if (provider === "qwen") {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.QWEN_API_KEY,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
        }),
      }
    );
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  }

  return null;
}

export async function synthesize(originalQuery, workerResponses, modelId = DEFAULT_SUPER_MODELS.synthesizer) {
  const combined = workerResponses
    .map((w, i) => `[Response ${i + 1} from ${w.model}]:\n${w.response}`)
    .join("\n\n---\n\n");

  const prompt = `You are a synthesis AI. Read all responses carefully. Extract the best, most accurate, most insightful parts from each. Remove redundancy and contradictions. Combine into one single, well-formatted, coherent response. Do NOT add your own opinions. Only synthesize what is given.

Original question: "${originalQuery}"

Responses:
${combined}

Produce the final synthesized response now:`;

  const result = await callModel(modelId, prompt);
  return result || workerResponses[0]?.response || "Synthesis failed.";
}

export async function hallucCheck(originalQuery, synthesizedResponse, workerResponses, modelId = DEFAULT_SUPER_MODELS.checker) {
  const workerSummary = workerResponses
    .map(w => `[${w.model}]: ${w.response}`)
    .join("\n\n");

  const prompt = `You are a hallucination detection AI. Your ONLY job is to find factual errors, made-up information, or logical inconsistencies.

Original question: "${originalQuery}"

Synthesized response:
${synthesizedResponse}

Worker responses for reference:
${workerSummary}

Respond ONLY in this exact JSON format, nothing else:
{"clean": true or false, "issues": ["list of issues or empty array"], "workerToRedo": "model name or null"}`;

  const text = await callModel(modelId, prompt, 512);
  if (!text) return { clean: true, issues: [], workerToRedo: null };

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { clean: true, issues: [], workerToRedo: null };
  }
}

export async function safetyCheck(response, modelId = DEFAULT_SUPER_MODELS.safety) {
  const prompt = `You are a safety review AI. Review the response below. Make light edits ONLY to remove harmful, dangerous, or inappropriate content.

STRICT RULES:
- Do NOT change facts
- Do NOT change structure or conclusions
- Do NOT rewrite things that are fine
- ONLY remove or soften genuinely harmful content
- If nothing needs changing, return the response exactly as-is

Response:
${response}

Return the final safe response, nothing else:`;

  const result = await callModel(modelId, prompt);
  return result || response;
}
